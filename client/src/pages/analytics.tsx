import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Shield, Users, DollarSign, BarChart3, PieChart as PieChartIcon, Calendar } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { YieldOpportunity, AppStats } from "@/types";

interface AnalyticsData {
  pools: YieldOpportunity[];
  stats: AppStats;
}

interface ChartDataPoint {
  name: string;
  value: number;
  apy: number;
  tvl: number;
  label?: string;
}

export default function Analytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch analytics data
  const { data: pools = [], isLoading: poolsLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools'],
    queryFn: async () => {
      const response = await fetch('/api/pools?onlyVisible=true');
      if (!response.ok) throw new Error('Failed to fetch pools');
      return response.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AppStats>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const isLoading = poolsLoading || statsLoading;

  // Process data for charts
  const processedData = pools.reduce((acc, pool) => {
    const apy = parseFloat(pool.apy || '0');
    const tvl = parseFloat(pool.tvl || '0');
    
    // Platform performance data
    const platform = pool.platform.displayName;
    if (!acc.platformData[platform]) {
      acc.platformData[platform] = { count: 0, totalTvl: 0, totalApy: 0 };
    }
    acc.platformData[platform].count += 1;
    acc.platformData[platform].totalTvl += tvl;
    acc.platformData[platform].totalApy += apy;

    // Chain performance data  
    const chain = pool.chain.displayName;
    if (!acc.chainData[chain]) {
      acc.chainData[chain] = { count: 0, totalTvl: 0, totalApy: 0 };
    }
    acc.chainData[chain].count += 1;
    acc.chainData[chain].totalTvl += tvl;
    acc.chainData[chain].totalApy += apy;

    // Risk distribution
    const risk = pool.riskLevel;
    if (!acc.riskData[risk]) {
      acc.riskData[risk] = { count: 0, totalTvl: 0 };
    }
    acc.riskData[risk].count += 1;
    acc.riskData[risk].totalTvl += tvl;

    return acc;
  }, {
    platformData: {} as Record<string, {count: number, totalTvl: number, totalApy: number}>,
    chainData: {} as Record<string, {count: number, totalTvl: number, totalApy: number}>,
    riskData: {} as Record<string, {count: number, totalTvl: number}>
  });

  // Chart data transformations
  const platformChartData: ChartDataPoint[] = Object.entries(processedData.platformData).map(([name, data]) => ({
    name,
    value: data.totalTvl,
    apy: data.totalApy / data.count,
    tvl: data.totalTvl,
    label: `${data.count} pools`
  })).sort((a, b) => b.tvl - a.tvl);

  const chainChartData: ChartDataPoint[] = Object.entries(processedData.chainData).map(([name, data]) => ({
    name,
    value: data.totalTvl,
    apy: data.totalApy / data.count,
    tvl: data.totalTvl,
    label: `${data.count} pools`
  })).sort((a, b) => b.tvl - a.tvl);

  const riskChartData: ChartDataPoint[] = Object.entries(processedData.riskData).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.count,
    apy: 0, // Risk chart doesn't use APY
    tvl: data.totalTvl,
    label: `$${(data.totalTvl / 1e9).toFixed(1)}B TVL`
  }));

  const apyDistributionData = pools.map(pool => ({
    name: `${pool.platform.displayName} ${pool.tokenPair}`,
    apy: parseFloat(pool.apy || '0'),
    tvl: parseFloat(pool.tvl || '0'),
    risk: pool.riskLevel
  })).sort((a, b) => b.apy - a.apy).slice(0, 10);

  const formatTvl = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onAdminClick={() => {}} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-analytics-title">
              Market Analytics
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analysis of DeFi yield opportunities across platforms and chains
            </p>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-foreground" data-testid="stat-total-pools">
                      {stats?.totalPools || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Pools</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-foreground" data-testid="stat-total-tvl">
                      {formatNumber(stats?.totalTvl || 0, { currency: '$', maxDecimals: 1 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Total TVL</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-foreground" data-testid="stat-avg-apy">
                      {stats?.avgApy ? `${stats.avgApy.toFixed(2)}%` : '0%'}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg APY</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {Math.max(...pools.map(p => parseFloat(p.apy || '0'))).toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Highest APY</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          <Tabs defaultValue="platforms" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              <TabsTrigger value="chains">Chains</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>

            {/* Platform Analytics */}
            <TabsContent value="platforms" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      Platform TVL Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={formatTvl} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: any, name: string) => [formatTvl(Number(value)), 'TVL']}
                            labelFormatter={(label) => `Platform: ${label}`}
                          />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Platform Average APY
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Avg APY']}
                            labelFormatter={(label) => `Platform: ${label}`}
                          />
                          <Bar dataKey="apy" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Chain Analytics */}
            <TabsContent value="chains" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Chain TVL Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chainChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chainChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: any) => [formatTvl(Number(value)), 'TVL']} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-600" />
                      Chain Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chainChartData.map((chain, index) => (
                        <div key={chain.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <div className="font-semibold text-foreground">{chain.name}</div>
                              <div className="text-sm text-muted-foreground">{chain.label}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground">{formatTvl(chain.tvl)}</div>
                            <div className="text-sm text-muted-foreground">{chain.apy.toFixed(2)}% APY</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Analytics */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Top Performing Pools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={apyDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis tickFormatter={(value) => `${value}%`} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: any, name: string) => {
                              if (name === 'apy') return [`${Number(value).toFixed(2)}%`, 'APY'];
                              if (name === 'tvl') return [formatTvl(Number(value)), 'TVL'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `Pool: ${label}`}
                          />
                          <Bar dataKey="apy" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                      APY vs TVL Correlation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={apyDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={formatTvl} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: any, name: string) => {
                              if (name === 'apy') return [`${Number(value).toFixed(2)}%`, 'APY'];
                              if (name === 'tvl') return [formatTvl(Number(value)), 'TVL'];
                              return [value, name];
                            }}
                          />
                          <Area yAxisId="left" type="monotone" dataKey="apy" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                          <Line yAxisId="right" type="monotone" dataKey="tvl" stroke="#3b82f6" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Risk Analytics */}
            <TabsContent value="risk" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-orange-600" />
                      Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {riskChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getRiskColor(entry.name.toLowerCase())} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px',
                              color: 'var(--foreground)',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                            formatter={(value: any) => [`${value} pools`, 'Count']} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      Risk vs TVL Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {riskChartData.map((risk) => (
                        <div key={risk.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant="outline" 
                              className="border-2"
                              style={{ 
                                borderColor: getRiskColor(risk.name.toLowerCase()),
                                color: getRiskColor(risk.name.toLowerCase())
                              }}
                            >
                              {risk.name}
                            </Badge>
                            <div>
                              <div className="font-semibold text-foreground">{risk.value} pools</div>
                              <div className="text-sm text-muted-foreground">{risk.label}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground">{formatTvl(risk.tvl)}</div>
                            <div className="text-sm text-muted-foreground">
                              {((risk.tvl / parseFloat(stats?.totalTvl?.replace(/,/g, '') || '0')) * 100).toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}