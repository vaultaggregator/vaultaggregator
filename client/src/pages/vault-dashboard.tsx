import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnimatedCurrency, AnimatedPercentage, AnimatedNumber } from '@/components/animated-value';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { YieldOpportunity } from '@/types';

export default function VaultDashboard() {
  // Set document title
  useEffect(() => {
    document.title = 'Dashboard - Vault Aggregator';
  }, []);

  // Fetch pools data
  const { data: pools = [], isLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools', { onlyVisible: true }],
    queryFn: async () => {
      const response = await fetch('/api/pools?onlyVisible=true');
      if (!response.ok) throw new Error('Failed to fetch pools');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Calculate stats
  const totalTVL = pools.reduce((sum, pool) => {
    const tvl = parseFloat(pool.tvl || '0');
    return sum + (isNaN(tvl) ? 0 : tvl);
  }, 0);

  const averageAPY = pools.reduce((sum, pool, _, arr) => {
    const apy = parseFloat(pool.apy || '0');
    return sum + (isNaN(apy) ? 0 : apy) / arr.length;
  }, 0);

  const totalVaults = pools.length;

  // Prepare data for charts
  const protocolAllocation = Object.entries(
    pools.reduce((acc, pool) => {
      const protocol = pool.platform?.displayName || 'Unknown';
      const tvl = parseFloat(pool.tvl || '0');
      acc[protocol] = (acc[protocol] || 0) + tvl;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Mock performance data (in production, this would come from historical data)
  const performanceData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: totalTVL * (0.9 + Math.random() * 0.2),
      apy: averageAPY * (0.9 + Math.random() * 0.2)
    };
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <AppShell>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of DeFi yield aggregator metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total TVL
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  <AnimatedCurrency value={totalTVL} compact={true} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Net APY
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {isLoading ? (
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  <AnimatedPercentage value={averageAPY} precision={2} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Vaults
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                  <AnimatedNumber value={totalVaults} precision={0} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Updated At
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    tickFormatter={(value) => formatNumber(value, { currency: '$', maxDecimals: 0 })}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tvl" 
                    stroke="#3B82F6" 
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Protocol Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Allocation by Protocol</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={protocolAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {protocolAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}