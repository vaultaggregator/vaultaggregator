import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  ExternalLink, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calendar, 
  Shield, 
  Globe, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Waves, 
  Clock, 
  Target, 
  TrendingDown, 
  Copy, 
  CheckCircle,
  Users,

  Edit3,
  Plus,
  Trash2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Area, BarChart, Bar } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import Footer from '@/components/footer';

function formatTvl(tvl: number | null | undefined): string {
  if (!tvl || tvl === 0) return 'N/A';
  
  if (tvl >= 1000000000) {
    return `$${(tvl / 1000000000).toFixed(2)}B`;
  } else if (tvl >= 1000000) {
    return `$${(tvl / 1000000).toFixed(2)}M`;
  } else if (tvl >= 1000) {
    return `$${(tvl / 1000).toFixed(2)}K`;
  } else {
    return `$${tvl.toFixed(2)}`;
  }
}

function SimilarPoolsCard({ poolId, chain, platform }: { poolId: string; chain: string; platform: string }) {
  const { data: pools = [] } = useQuery({
    queryKey: ['/api/pools']
  });

  // Find similar pools (same chain or platform, excluding current pool)
  const similarPools = pools
    .filter((pool: any) => 
      pool.id !== poolId && 
      (pool.chain.id === chain || pool.platform.id === platform)
    )
    .slice(0, 3);

  if (similarPools.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar Pools</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {similarPools.map((pool: any) => (
            <Link
              key={pool.id}
              href={`/pool/${pool.id}`}
              className="block hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{pool.tokenPair}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pool.platform.displayName} on {pool.chain.displayName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{pool.apy}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">APY</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    TVL: {pool.tvl ? formatTvl(pool.tvl) : 'N/A'}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Risk: {pool.riskLevel}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DefiLlamaResponse {
  pool: YieldOpportunity;
  defiLlamaData: any[];
  additionalInfo: {
    hasHistoricalData: boolean;
    matchCount: number;
  };
}

// Chart Component
function PoolChart({ poolId }: { poolId: string }) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: [`/api/pools/${poolId}/chart`]
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Historical Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading historical data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData?.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Historical Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {chartData?.message || 'No historical data available for this pool.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Historical APY Data
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tracking {chartData.data.length} data points from {chartData.timespan}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#666"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#666"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                formatter={(value: any) => [`${value}%`, 'APY']}
              />
              <Area 
                type="monotone" 
                dataKey="apy" 
                stroke="#2563eb" 
                fill="#2563eb" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface YieldOpportunity {
  id: string;
  pool: string;
  chain: {
    id: string;
    name: string;
    displayName: string;
  };
  project: string;
  symbol: string;
  tokenPair: string;
  apy: number | null;
  apy7d: number | null;
  apy30d: number | null;
  tvlUsd: number | null;
  apyBase: number | null;
  apyReward: number | null;
  count: number | null;
  outlookScore: number | null;
  stablecoin: boolean | null;
  ilRisk: string | null;
  exposure: string | null;
  predictions: string | null;
  platform: {
    id: string;
    name: string;
    displayName: string;
  };
  tvl: number | null;
  riskLevel: string | null;
  lastUpdated: string;
  showUsdInFlow?: boolean;
}

interface Params {
  id?: string;
  poolId?: string;
}

function CopyableText({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
        {text}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="h-8 w-8 p-0"
        data-testid={`button-copy-${label.toLowerCase().replace(' ', '-')}`}
      >
        {copied ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export default function PoolDetail() {
  const params = useParams<Params>();
  const id = params.id || params.poolId;
  const { toast } = useToast();

  // Pool data query
  const { data: pool, isLoading: poolLoading, error: poolError } = useQuery<YieldOpportunity>({
    queryKey: [`/api/pools/${id}`],
    enabled: !!id
  });

  // DeFi Llama data query
  const { data: defiLlamaData, isLoading: defiLlamaLoading } = useQuery<DefiLlamaResponse>({
    queryKey: [`/api/pools/${id}/defillama`],
    enabled: !!id
  });

  // Cross-pool analysis data
  const { data: crossAnalysis, isLoading: crossAnalysisLoading } = useQuery({
    queryKey: [`/api/pools/${id}/cross-analysis`],
    enabled: !!id
  });



  // Token transfers query
  const { data: tokenTransfers, isLoading: tokenTransfersLoading } = useQuery({
    queryKey: [`/api/pools/${id}/token-transfers`],
    enabled: !!id
  });

  // Token info query
  const { data: tokenInfo, isLoading: tokenInfoLoading } = useQuery({
    queryKey: [`/api/pools/${id}/token-info`],
    enabled: !!id
  });

  if (poolLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">Loading pool details...</span>
        </div>
      </div>
    );
  }

  if (poolError || !pool) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Pool Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The pool you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getApyColor = (apy: number | null): string => {
    if (!apy || apy === 0) return 'text-gray-500';
    if (apy >= 20) return 'text-green-600';
    if (apy >= 10) return 'text-blue-600';
    if (apy >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getApy = () => {
    return pool.apy ?? pool.apyBase ?? null;
  };

  const getRiskColor = (risk: string | null): string => {
    if (!risk) return 'text-gray-500';
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-orange-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const platformUrl = (() => {
    if (!pool.platform || !pool.platform.name) return '#';
    
    const { name: platformName } = pool.platform;
    
    console.log('Generating URL with template:', 'https://app.morpho.org/{chainName}/vault/{underlyingToken}', 'for pool:', pool.id);
    
    switch (platformName) {
      case 'morpho-blue':
        const chainName = pool.chain.name === 'Ethereum' ? 'ethereum' : pool.chain.name.toLowerCase();
        const underlyingToken = tokenInfo?.tokenInfo?.contractAddress || '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';
        const url = `https://app.morpho.org/${chainName}/vault/${underlyingToken}`;
        console.log('Generated URL:', url);
        return url;
      case 'lido':
        return 'https://stake.lido.fi/';
      default:
        return '#';
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-pool-title">
              {pool.tokenPair}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
              {pool.platform.displayName} on {pool.chain.displayName}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-visit-platform"
            >
              <a href={platformUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Platform
              </a>
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200 flex items-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" />
                <span className="hidden sm:inline">Current APY</span>
                <span className="sm:hidden">APY</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${getApyColor(getApy())}`} data-testid="text-apy">
                {getApy() ? `${getApy()}%` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200 flex items-center">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" />
                <span className="hidden sm:inline">Total Value Locked</span>
                <span className="sm:hidden">TVL</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600" data-testid="text-tvl">
                {pool.tvl ? formatTvl(pool.tvl) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200 flex items-center">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
                <span className="hidden sm:inline">Operating Days</span>
                <span className="sm:hidden">Days</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600" data-testid="text-operating-days">
                {pool.count || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200 flex items-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-600" />
                <span className="hidden sm:inline">Token Holders</span>
                <span className="sm:hidden">Holders</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600" data-testid="text-holders">
                {tokenInfo?.tokenInfo?.holdersCount?.toLocaleString() || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200 flex items-center">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
                <span className="hidden sm:inline">Network</span>
                <span className="sm:hidden">Network</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-500" data-testid="text-network">
                {pool.chain.displayName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-200 flex items-center">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-red-500" />
                <span className="hidden sm:inline">Risk Level</span>
                <span className="sm:hidden">Risk</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-500" data-testid="text-risk-level">
                {pool.riskLevel ? (pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)) : 'Unknown'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Multi-Period Flow Analysis Section */}
        {tokenTransfers && tokenTransfers.flowAnalysis && (
          <div className="space-y-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Waves className="w-5 h-5 mr-2 text-blue-600" />
                  Token Flow Analysis - {tokenTransfers.tokenSymbol || 'TOKEN'}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Comprehensive flow metrics and intelligent insights
                </p>
                {/* Data Quality Warning */}
                {tokenTransfers.dataQuality?.warning && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                          High-Volume Token Data Limitation
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          {tokenTransfers.dataQuality.warning}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Coverage: {tokenTransfers.dataQuality.timespan}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          💡 This token has extremely high transaction volume. Data source: {tokenTransfers.dataQuality?.source || 'etherscan'}
                          {tokenTransfers.dataQuality?.source === 'etherscan' && (
                            <span className="block mt-1">
                              🚀 Add ALCHEMY_API_KEY for better historical coverage (300+ req/sec vs 5 req/sec)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {tokenTransfersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing flows...</span>
                  </div>
                ) : tokenTransfers.flowAnalysis.periods ? (
                  <div className="space-y-6">
                    {/* Period Selector Tabs */}
                    <Tabs defaultValue="24h" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="24h">24 Hours</TabsTrigger>
                        <TabsTrigger value="7d">7 Days</TabsTrigger>
                        <TabsTrigger value="30d">30 Days</TabsTrigger>
                        <TabsTrigger value="all">All Time</TabsTrigger>
                      </TabsList>
                      
                      {Object.entries(tokenTransfers.flowAnalysis.periods).map(([period, metrics]: [string, any]) => (
                        <TabsContent key={period} value={period} className="space-y-4">
                          {/* Flow Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center">
                                <ArrowDown className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">Inflow</span>
                              </div>
                              <p className="text-lg font-bold text-green-900 dark:text-green-100 mt-1">
                                {(metrics.inflow || 0) >= 1000000 
                                  ? `${((metrics.inflow || 0) / 1000000).toFixed(2)}M`
                                  : (metrics.inflow || 0) >= 1000 
                                  ? `${((metrics.inflow || 0) / 1000).toFixed(2)}K`
                                  : (metrics.inflow || 0).toFixed(2)
                                } {tokenTransfers.tokenSymbol}
                              </p>
                              {pool.showUsdInFlow && tokenInfo?.tokenInfo?.priceUsd && (
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                  ${((metrics.inflow || 0) * parseFloat(tokenInfo.tokenInfo.priceUsd)).toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })} USD
                                </p>
                              )}
                            </div>
                            
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-center">
                                <ArrowUp className="w-4 h-4 text-red-600 mr-2" />
                                <span className="text-sm font-medium text-red-800 dark:text-red-300">Outflow</span>
                              </div>
                              <p className="text-lg font-bold text-red-900 dark:text-red-100 mt-1">
                                {(metrics.outflow || 0) >= 1000000 
                                  ? `${((metrics.outflow || 0) / 1000000).toFixed(2)}M`
                                  : (metrics.outflow || 0) >= 1000 
                                  ? `${((metrics.outflow || 0) / 1000).toFixed(2)}K`
                                  : (metrics.outflow || 0).toFixed(2)
                                } {tokenTransfers.tokenSymbol}
                              </p>
                              {pool.showUsdInFlow && tokenInfo?.tokenInfo?.priceUsd && (
                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                  ${((metrics.outflow || 0) * parseFloat(tokenInfo.tokenInfo.priceUsd)).toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })} USD
                                </p>
                              )}
                            </div>
                            
                            <div className={`p-4 rounded-lg border ${
                              (metrics.netFlow || 0) > 0 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : (metrics.netFlow || 0) < 0
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                            }`}>
                              <div className="flex items-center">
                                <Waves className="w-4 h-4 text-blue-600 mr-2" />
                                <span className={`text-sm font-medium ${
                                  (metrics.netFlow || 0) > 0 
                                    ? 'text-blue-800 dark:text-blue-300'
                                    : (metrics.netFlow || 0) < 0
                                    ? 'text-orange-800 dark:text-orange-300'
                                    : 'text-gray-800 dark:text-gray-300'
                                }`}>Net Flow</span>
                              </div>
                              <p className={`text-lg font-bold mt-1 ${
                                (metrics.netFlow || 0) > 0 
                                  ? 'text-blue-900 dark:text-blue-100'
                                  : (metrics.netFlow || 0) < 0
                                  ? 'text-orange-900 dark:text-orange-100'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {Math.abs(metrics.netFlow || 0) >= 1000000 
                                  ? `${(metrics.netFlow || 0) >= 0 ? '+' : '-'}${(Math.abs(metrics.netFlow || 0) / 1000000).toFixed(2)}M`
                                  : Math.abs(metrics.netFlow || 0) >= 1000 
                                  ? `${(metrics.netFlow || 0) >= 0 ? '+' : '-'}${(Math.abs(metrics.netFlow || 0) / 1000).toFixed(2)}K`
                                  : `${(metrics.netFlow || 0) >= 0 ? '+' : ''}${(metrics.netFlow || 0).toFixed(2)}`
                                } {tokenTransfers.tokenSymbol}
                              </p>
                              {pool.showUsdInFlow && tokenInfo?.tokenInfo?.priceUsd && (
                                <p className={`text-sm mt-1 ${
                                  (metrics.netFlow || 0) > 0 
                                    ? 'text-blue-700 dark:text-blue-400'
                                    : (metrics.netFlow || 0) < 0
                                    ? 'text-orange-700 dark:text-orange-400'
                                    : 'text-gray-700 dark:text-gray-400'
                                }`}>
                                  ${(metrics.netFlow || 0) >= 0 ? '+' : ''}${((metrics.netFlow || 0) * parseFloat(tokenInfo.tokenInfo.priceUsd)).toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })} USD
                                </p>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Waves className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No flow analysis available for this token.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}



        {/* Historical Chart */}
        <div className="mb-8">
          <PoolChart poolId={id!} />
        </div>

        {/* Cross-Pool Analysis Section */}
        {crossAnalysis && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-600" />
                Cross-Pool Analytics
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How this pool compares across the DeFi ecosystem
              </p>
            </CardHeader>
            <CardContent>
              {crossAnalysisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing cross-pool data...</span>
                </div>
              ) : crossAnalysis.insights ? (
                <div className="space-y-6">
                  {/* Key Insights */}
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {crossAnalysis.insights}
                    </div>
                  </div>
                  
                  {/* Risk Score */}
                  {crossAnalysis.riskScore && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Risk Assessment</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                          {crossAnalysis.riskScore.toFixed(1)}/10
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                          Based on volatility and market position
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      📊 Cross-Pool Analysis • Updated {new Date(crossAnalysis.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Cross-pool analysis is being generated. Check back soon.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Similar Pools */}
        <div className="mb-8">
          <SimilarPoolsCard 
            poolId={pool.id} 
            chain={pool.chain.id} 
            platform={pool.platform.id} 
          />
        </div>

        {/* Token Contract Information */}
        {tokenInfo && tokenInfo.tokenInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-gray-600" />
                Token Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Contract Address</h4>
                    <CopyableText text={tokenInfo.tokenInfo.contractAddress} label="Contract Address" />
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Token Name</h4>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {tokenInfo.tokenInfo.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Symbol</h4>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {tokenInfo.tokenInfo.symbol || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Supply</h4>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {tokenInfo.tokenInfo.totalSupply ? 
                        parseFloat(tokenInfo.tokenInfo.totalSupply).toLocaleString() : 
                        'N/A'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Decimals</h4>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {tokenInfo.tokenInfo.decimals || 'N/A'}
                    </p>
                  </div>
                  
                  {tokenInfo.tokenInfo.priceUsd && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Price (USD)</h4>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        ${parseFloat(tokenInfo.tokenInfo.priceUsd).toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}