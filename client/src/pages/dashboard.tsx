import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Shield, Activity, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const { data: pools } = useQuery({
    queryKey: ['/api/pools'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

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
                  <Tooltip formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Average APY']} />
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
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Ethereum</p>
                  <p className="text-sm text-gray-800 dark:text-gray-300">127 pools</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">$1.2B</p>
                  <Badge variant="secondary" className="text-xs">+8.3%</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Polygon</p>
                  <p className="text-sm text-gray-800 dark:text-gray-300">89 pools</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">$520M</p>
                  <Badge variant="secondary" className="text-xs">+12.1%</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Arbitrum</p>
                  <p className="text-sm text-gray-800 dark:text-gray-300">64 pools</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">$380M</p>
                  <Badge variant="secondary" className="text-xs">+6.7%</Badge>
                </div>
              </div>
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
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Aave V3</p>
                  <p className="text-sm text-gray-800 dark:text-gray-300">32 pools</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">12.4%</p>
                  <Badge variant="default" className="text-xs bg-green-600">High Yield</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Compound V3</p>
                  <p className="text-sm text-gray-800 dark:text-gray-300">28 pools</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">9.8%</p>
                  <Badge variant="secondary" className="text-xs">Stable</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Uniswap V3</p>
                  <p className="text-sm text-gray-800 dark:text-gray-300">45 pools</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">8.2%</p>
                  <Badge variant="outline" className="text-xs">LP Rewards</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}