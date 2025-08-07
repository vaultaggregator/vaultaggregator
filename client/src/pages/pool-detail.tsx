import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, TrendingUp, Shield, DollarSign, BarChart3, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import type { YieldOpportunity } from "@/types";

interface ChartData {
  date: string;
  apy: number;
  tvl: number;
}

interface ChartResponse {
  hasData: boolean;
  data?: ChartData[];
  mockData?: ChartData[];
  message?: string;
  poolInfo?: any;
  summary?: {
    dataPoints: number;
    averageApy: number;
    minApy: number;
    maxApy: number;
  };
}

interface DefiLlamaResponse {
  pool: YieldOpportunity;
  defiLlamaData: any[];
  additionalInfo: {
    hasHistoricalData: boolean;
    matchCount: number;
  };
}

export default function PoolDetail() {
  const { poolId } = useParams<{ poolId: string }>();
  
  const { data: pool, isLoading, error } = useQuery<YieldOpportunity>({
    queryKey: ['/api/pools', poolId],
    enabled: !!poolId,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartResponse>({
    queryKey: ['/api/pools', poolId, 'chart'],
    enabled: !!poolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: defiLlamaData, isLoading: defiLlamaLoading } = useQuery<DefiLlamaResponse>({
    queryKey: ['/api/pools', poolId, 'defillama'],
    enabled: !!poolId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const formatTvl = (tvl: string): string => {
    const num = parseFloat(tvl);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatApy = (apy: string): string => {
    const num = parseFloat(apy);
    return `${num.toFixed(2)}%`;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-white rounded-xl p-8">
              <div className="h-12 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pool Not Found</h2>
              <p className="text-gray-600">The requested pool could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-to-pools">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
        </div>

        {/* Pool Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {/* Platform Logo */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shadow-lg"
                  data-testid={`logo-${pool.platform.name}`}
                >
                  {pool.platform.logoUrl ? (
                    <img 
                      src={pool.platform.logoUrl} 
                      alt={pool.platform.displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{
                        background: `linear-gradient(135deg, ${pool.chain.color}80, ${pool.chain.color})`
                      }}
                    >
                      {getPlatformInitials(pool.platform.displayName)}
                    </div>
                  )}
                </div>

                {/* Pool Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-pool-title">
                    {pool.tokenPair}
                  </h1>
                  <p className="text-xl text-gray-600 mb-3" data-testid="text-platform-name">
                    {pool.platform.displayName}
                  </p>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant="outline"
                      className="text-sm px-3 py-1"
                      style={{ 
                        backgroundColor: `${pool.chain.color}20`, 
                        color: pool.chain.color,
                        borderColor: `${pool.chain.color}40`
                      }}
                      data-testid="badge-network"
                    >
                      {pool.chain.displayName}
                    </Badge>
                    <Badge 
                      className={`text-sm px-3 py-1 ${getRiskColor(pool.riskLevel)}`}
                      data-testid="badge-risk"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)} Risk
                    </Badge>
                  </div>
                </div>
              </div>

              {/* External Link Button */}
              <Button 
                variant="outline" 
                size="lg" 
                className="hover:bg-blue-50"
                data-testid="button-external-link"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Visit Platform
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                Current APY (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600" data-testid="text-apy-current">
                {formatApy(pool.apy)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                30-Day Average APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500" data-testid="text-apy-30d">
                {pool.rawData?.apyMean30d ? formatApy(pool.rawData.apyMean30d.toString()) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                Total Value Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600" data-testid="text-tvl">
                {formatTvl(pool.tvl)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                Operating Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-700" data-testid="text-operating-days">
                {pool.rawData?.count ? `${pool.rawData.count}` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">days</p>
            </CardContent>
          </Card>
        </div>

        {/* APY Historical Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              APY Performance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading chart data...</span>
              </div>
            ) : chartData && (chartData.hasData || chartData.mockData) ? (
              <div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.data || chartData.mockData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                      />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                        formatter={(value: any, name: string) => [
                          name === 'apy' ? `${Number(value).toFixed(2)}%` : formatTvl(value.toString()),
                          name === 'apy' ? 'APY' : 'TVL'
                        ]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      {/* Max APY Reference Line */}
                      <ReferenceLine 
                        y={chartData.summary?.maxApy || Math.max(...(chartData.data || chartData.mockData || []).map((d: any) => d.apy))} 
                        stroke="#f59e0b" 
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label={{ 
                          value: `Max: ${(chartData.summary?.maxApy || Math.max(...(chartData.data || chartData.mockData || []).map((d: any) => d.apy))).toFixed(2)}%`, 
                          position: "topRight",
                          style: { 
                            fill: '#f59e0b', 
                            fontWeight: 'bold', 
                            fontSize: '12px'
                          }
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="apy" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                        name="APY"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {chartData.summary && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Average APY</p>
                      <p className="text-lg font-semibold text-blue-600">{chartData.summary.averageApy.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Min APY</p>
                      <p className="text-lg font-semibold text-red-600">{chartData.summary.minApy.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Max APY</p>
                      <p className="text-lg font-semibold text-green-600">{chartData.summary.maxApy.toFixed(2)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Data Points</p>
                      <p className="text-lg font-semibold text-gray-700">{chartData.summary.dataPoints}</p>
                    </div>
                  </div>
                )}
                {!chartData.hasData && chartData.mockData && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      📊 This chart shows simulated data for demonstration purposes. Real historical data from DeFi Llama is not available for this pool.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Historical Data Available</p>
                <p className="text-sm text-center max-w-md">
                  Historical performance data is not available for this pool. This may be because it's a new pool or not tracked in our data sources.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DeFi Llama Additional Information */}
        {defiLlamaData && defiLlamaData.defiLlamaData && defiLlamaData.defiLlamaData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Related Pools from DeFi Llama
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defiLlamaData.defiLlamaData.slice(0, 3).map((llamaPool: any, index: number) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{llamaPool.symbol}</h4>
                        <p className="text-sm text-gray-600">{llamaPool.project} on {llamaPool.chain}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{llamaPool.apy?.toFixed(2)}%</p>
                        <p className="text-sm text-gray-500">APY</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-gray-600">
                        TVL: {llamaPool.tvlUsd ? formatTvl(llamaPool.tvlUsd.toString()) : 'N/A'}
                      </span>
                      {llamaPool.apyBase && (
                        <span className="text-gray-600">
                          Base: {llamaPool.apyBase.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {defiLlamaData.additionalInfo.matchCount > 3 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    +{defiLlamaData.additionalInfo.matchCount - 3} more similar pools found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pool Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pool Information */}
          <Card>
            <CardHeader>
              <CardTitle>Pool Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Token Pair</h4>
                <p className="text-gray-700" data-testid="text-token-pair">{pool.tokenPair}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Platform</h4>
                <p className="text-gray-700" data-testid="text-platform">{pool.platform.displayName}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Blockchain Network</h4>
                <p className="text-gray-700" data-testid="text-network">{pool.chain.displayName}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
                <Badge className={`${getRiskColor(pool.riskLevel)}`}>
                  {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)} Risk
                </Badge>
              </div>
              {defiLlamaData?.defiLlamaData?.[0] && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">DeFi Llama Match</h4>
                    <div className="text-sm space-y-1">
                      {defiLlamaData.defiLlamaData[0].apyBase && (
                        <p className="text-gray-600">Base APY: <span className="font-medium">{defiLlamaData.defiLlamaData[0].apyBase.toFixed(2)}%</span></p>
                      )}
                      {defiLlamaData.defiLlamaData[0].apyReward && (
                        <p className="text-gray-600">Reward APY: <span className="font-medium">{defiLlamaData.defiLlamaData[0].apyReward.toFixed(2)}%</span></p>
                      )}
                      {defiLlamaData.defiLlamaData[0].underlyingTokens && (
                        <p className="text-gray-600">Underlying Tokens: <span className="font-medium">{defiLlamaData.defiLlamaData[0].underlyingTokens.join(', ')}</span></p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              {pool.notes && pool.notes.length > 0 ? (
                <div className="space-y-4">
                  {pool.notes.map((note, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-gray-700" data-testid={`text-note-${index}`}>
                        💡 {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-500 italic">No additional notes available for this pool.</p>
                  {defiLlamaLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading additional data...</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}