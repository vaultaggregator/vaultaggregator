import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, BarChart3, PieChart, Activity, Calendar, Target } from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [metric, setMetric] = useState("apy");

  // Generate mock analytics data
  const tvlData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tvl: 2000000000 + Math.sin(i * 0.1) * 200000000 + Math.random() * 100000000,
    pools: 150 + Math.floor(Math.sin(i * 0.15) * 20) + Math.floor(Math.random() * 10)
  }));

  const apyDistribution = [
    { range: '0-5%', count: 45, color: '#ef4444' },
    { range: '5-10%', count: 78, color: '#f97316' },
    { range: '10-15%', count: 52, color: '#eab308' },
    { range: '15-20%', count: 23, color: '#22c55e' },
    { range: '20%+', count: 12, color: '#3b82f6' }
  ];

  const chainBreakdown = [
    { name: 'Ethereum', value: 45, color: '#627EEA' },
    { name: 'Polygon', value: 25, color: '#8247E5' },
    { name: 'Arbitrum', value: 15, color: '#28A0F0' },
    { name: 'Optimism', value: 10, color: '#FF0420' },
    { name: 'Others', value: 5, color: '#6B7280' }
  ];

  const volumeData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    volume: 50000000 + Math.random() * 100000000,
    transactions: 1200 + Math.floor(Math.random() * 800)
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-analytics-title">
            Analytics
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-analytics-subtitle">
            Deep insights into DeFi yield market trends and performance metrics
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-timerange">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-32" data-testid="select-metric">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apy">APY</SelectItem>
              <SelectItem value="tvl">TVL</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" data-testid="button-export">
            Export Data
          </Button>
        </div>

        {/* Key Analytics Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-volume">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-green-600" />
                Total Volume (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">$89.2M</p>
              <p className="text-sm text-green-600 mt-1">+15.3% vs yesterday</p>
            </CardContent>
          </Card>

          <Card data-testid="card-unique-users">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="w-4 h-4 mr-2 text-blue-600" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">12.4K</p>
              <p className="text-sm text-blue-600 mt-1">+8.7% vs last week</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-yield">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                Market Avg Yield
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">9.3%</p>
              <p className="text-sm text-red-600 mt-1">-1.2% vs last month</p>
            </CardContent>
          </Card>

          <Card data-testid="card-risk-score">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
                Avg Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">6.8/10</p>
              <Badge variant="secondary" className="text-xs mt-1">Medium Risk</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* TVL Over Time */}
          <Card data-testid="card-tvl-chart">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Total Value Locked Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tvlData}>
                    <defs>
                      <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${(value / 1e9).toFixed(1)}B`} />
                    <Tooltip formatter={(value: any) => [`$${(Number(value) / 1e9).toFixed(2)}B`, 'TVL']} />
                    <Area 
                      type="monotone" 
                      dataKey="tvl" 
                      stroke="#3b82f6" 
                      fillOpacity={1}
                      fill="url(#tvlGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* APY Distribution */}
          <Card data-testid="card-apy-distribution">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-green-600" />
                APY Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={apyDistribution} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="range" type="category" width={60} />
                    <Tooltip formatter={(value: any) => [`${value} pools`, 'Count']} />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chain Distribution */}
          <Card data-testid="card-chain-distribution">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-purple-600" />
                Distribution by Chain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie data={chainBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {chainBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {chainBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded mr-2" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Volume */}
          <Card data-testid="card-weekly-volume">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                Weekly Trading Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `$${(value / 1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(value: any) => [`$${(Number(value) / 1e6).toFixed(1)}M`, 'Volume']} />
                    <Bar dataKey="volume" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
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