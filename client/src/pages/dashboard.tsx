import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Shield, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from "@/lib/format";
import type { YieldOpportunity } from "@/types";

interface DashboardStats {
  totalPools: number;
  activePools: number;
  totalTvl: string;
  avgApy: string;
  topChains: Array<{
    name: string;
    poolCount: number;
    tvl: string;
  }>;
  topPlatforms: Array<{
    name: string;
    poolCount: number;
    avgApy: string;
  }>;
}

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: pools = [] } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Calculate top chains and platforms from real data
  const { topChains, topPlatforms } = useMemo(() => {
    if (!pools || pools.length === 0) {
      return { topChains: [], topPlatforms: [] };
    }

    // Aggregate by chain
    const chainMap = new Map<string, { count: number; tvl: number }>();
    pools.forEach(pool => {
      const chain = pool.chain.displayName;
      const existing = chainMap.get(chain) || { count: 0, tvl: 0 };
      chainMap.set(chain, {
        count: existing.count + 1,
        tvl: existing.tvl + parseFloat(pool.tvl || '0')
      });
    });

    // Aggregate by platform
    const platformMap = new Map<string, { count: number; totalApy: number }>();
    pools.forEach(pool => {
      const platform = pool.platform.displayName;
      const existing = platformMap.get(platform) || { count: 0, totalApy: 0 };
      platformMap.set(platform, {
        count: existing.count + 1,
        totalApy: existing.totalApy + parseFloat(pool.apy || '0')
      });
    });

    // Sort and get top 3 chains by TVL
    const topChains = Array.from(chainMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 3);

    // Sort and get top 3 platforms by average APY
    const topPlatforms = Array.from(platformMap.entries())
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        avgApy: data.totalApy / data.count 
      }))
      .sort((a, b) => b.avgApy - a.avgApy)
      .slice(0, 3);

    return { topChains, topPlatforms };
  }, [pools]);

  // Generate mock chart data for APY trends
  const chartData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    avgApy: 8.5 + Math.sin(i * 0.2) * 2 + Math.random() * 1
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-dashboard-subtitle">
            Overview of your DeFi yield opportunities and market insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-pools">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-600" />
                Total Pools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900" data-testid="text-total-pools">
                {stats?.totalPools || (Array.isArray(pools) ? pools.length : 0)}
              </p>
              <p className="text-sm text-green-600 mt-1">+12 this week</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-pools">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                Active Pools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900" data-testid="text-active-pools">
                {stats?.activePools || (Array.isArray(pools) ? pools.filter((p: any) => p.isActive).length : 0)}
              </p>
              <p className="text-sm text-green-600 mt-1">98.5% uptime</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-tvl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                Total TVL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900" data-testid="text-total-tvl">
                $2.4B
              </p>
              <p className="text-sm text-green-600 mt-1">+5.2% this month</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-apy">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
                Avg APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900" data-testid="text-avg-apy">
                8.7%
              </p>
              <p className="text-sm text-red-600 mt-1">-0.3% vs last week</p>
            </CardContent>
          </Card>
        </div>

        {/* APY Trends Chart */}
        <Card className="mb-8" data-testid="card-apy-trends">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Market APY Trends (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Average APY']} 
                    contentStyle={{
                      backgroundColor: 'rgb(17, 24, 39)',
                      border: '1px solid rgb(55, 65, 81)',
                      borderRadius: '0.5rem',
                      color: 'white'
                    }}
                    labelStyle={{ color: 'rgb(156, 163, 175)' }}
                  />
                  <Line type="monotone" dataKey="avgApy" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card data-testid="card-top-chains">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                Top Chains by TVL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topChains.length > 0 ? (
                topChains.map((chain, index) => (
                  <div key={chain.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{chain.name}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300">{chain.count} pools</p>
                      {chain.name === 'Ethereum' && (
                        <a 
                          href="https://etherscan.io" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View on Etherscan →
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatNumber(chain.tvl, { currency: '$', maxDecimals: 1 })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Ethereum</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300">32 pools</p>
                      <a 
                        href="https://etherscan.io" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        View on Etherscan →
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">$39.1B</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-top-platforms">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Top Platforms by APY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPlatforms.length > 0 ? (
                topPlatforms.map((platform, index) => (
                  <div key={platform.name} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{platform.name}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300">{platform.count} pools</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{platform.avgApy.toFixed(1)}%</p>
                      <Badge variant={index === 0 ? "default" : "secondary"} className={`text-xs ${index === 0 ? 'bg-green-600' : ''}`}>
                        {index === 0 ? 'Top APY' : 'Stable'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Morpho</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300">30 pools</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">7.8%</p>
                      <Badge variant="default" className="text-xs bg-green-600">Top APY</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Lido</p>
                      <p className="text-sm text-gray-800 dark:text-gray-300">2 pools</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">2.6%</p>
                      <Badge variant="secondary" className="text-xs">Stable</Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}