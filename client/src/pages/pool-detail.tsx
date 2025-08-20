import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
// Additional Information section removed - v2
import { parseYieldUrl, generatePageTitle, generateMetaDescription, generateBreadcrumbs } from "@/lib/seo-urls";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Calendar, TrendingUp, TrendingDown, Minus, Shield, DollarSign, BarChart3, Activity, Clock, Users, Layers, Globe, Zap, Brain, Target, Waves, AlertCircle } from "lucide-react";
import { PoolDataLoading, MetricLoading } from "@/components/loading-animations";
import { CryptoLoader } from "@/components/crypto-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TokenDisplay } from "@/components/TokenDisplay";
import { RiskBadge } from "@/components/risk-badge";
import { generatePlatformVisitUrl } from "@/utils/platformUrls";

import { MetricTooltip, DeFiTooltip } from "@/components/metric-tooltip";
import { TokenInfo } from "@/components/token-info";
import { PoolChart } from "@/components/PoolChart";

import { formatTimeAgo } from "@/lib/utils";
import { useRealtimeApy } from "@/hooks/useRealtimeApy";
import { WebSocketStatus } from "@/components/websocket-status";
import { AnimatedPercentage, AnimatedCurrency, AnimatedNumber } from "@/components/animated-value";
import { formatTvl, formatHolders, formatCurrency, formatNumber } from "@/lib/format";



import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { YieldOpportunity } from "@/types";





// Related Pools Component
function RelatedPools({ currentPoolId, platform, chainId }: { 
  currentPoolId: string; 
  platform: string; 
  chainId: string; 
}) {
  const { data: relatedPools = [], isLoading } = useQuery<YieldOpportunity[]>({
    queryKey: [`/api/pools?platform=${encodeURIComponent(platform)}&chainId=${chainId}&limit=6`],
  });

  const filteredPools = relatedPools.filter(pool => pool.id !== currentPoolId).slice(0, 3);

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Related Pools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredPools.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
          Related Pools
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredPools.map((pool) => (
            <Link key={pool.id} href={`/pool/${pool.id}`}>
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{pool.tokenPair}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pool.platform.displayName} on {pool.chain.displayName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{parseFloat(pool.apy).toFixed(2)}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">APY</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    TVL: {pool.tvl ? formatTvl(parseFloat(pool.tvl)) : 'N/A'}
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



// DeFi Llama integration removed - using Morpho API instead

// Morpho APY Data Type
interface MorphoApyData {
  poolId: string;
  vaultAddress: string;
  chainId: number;
  apy: {
    current: string;
    daily: string;
    weekly: string;
    monthly: string;
    quarterly: string;
    allTime: string;
  };
  historicalData: {
    last7Days: Array<{x: number, y: number}>;
    last30Days: Array<{x: number, y: number}>;
    last90Days: Array<{x: number, y: number}>;
    allTime: Array<{x: number, y: number}>;
  };
}

// Morpho Metrics Data Type
interface MorphoMetricsData {
  poolId: string;
  vaultAddress: string;
  chainId: number;
  metrics: {
    tvl: number;
    tvlFormatted: string;
    holders: number;
    operatingDays: number;
    totalAssets: number;
    createdAt: string;
  };
}

export default function PoolDetail() {
  // Log to console to confirm new code is running
  console.log('Pool Detail Page Loaded - Version 2.0 (Additional Information Removed)');
  
  const params = useParams<{ 
    poolId?: string;
    network?: string;
    protocol?: string;
    tokenPair?: string;
    slug?: string;
  }>();
  
  // Handle both new SEO URLs and legacy URLs
  const poolId = params.poolId;
  const urlInfo = parseYieldUrl(params);
  
  // Determine if we're using new URL format or legacy
  const isNewUrlFormat = !poolId && params.network && params.protocol && params.tokenPair;
  const apiEndpoint = isNewUrlFormat 
    ? `/api/pools/find/${params.network}/${params.protocol}/${params.tokenPair}`
    : `/api/pools/${poolId}`;
  
  console.log("🎯 Pool Detail URL Info:", { 
    isNewUrlFormat, 
    apiEndpoint,
    params: { poolId, network: params.network, protocol: params.protocol, tokenPair: params.tokenPair }
  });
  
  // Enable real-time APY updates via WebSocket
  const { isConnected, lastUpdate } = useRealtimeApy();
  
  const { data: pool, isLoading, error } = useQuery<YieldOpportunity>({
    queryKey: [apiEndpoint],
    enabled: !!(poolId || isNewUrlFormat),
    staleTime: 0, // No caching - always fresh
    gcTime: 0, // Remove from cache immediately (renamed from cacheTime in v5)
  });

  // Fetch real historical APY averages (100% authentic data)
  const { data: historicalAverages, isLoading: averagesLoading } = useQuery<{
    sevenDay: number;
    thirtyDay: number;
    ninetyDay: number;
    allTime: number;
  }>({
    queryKey: ['/api/pools', pool?.id, 'historical-averages'],
    enabled: !!pool?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Remove Morpho API dependency - using database values only

  // Scroll to top when page loads or pool changes (mobile navigation fix)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pool?.id]);

  // Update document title and meta tags when pool data loads
  useEffect(() => {
    if (pool) {
      document.title = generatePageTitle(pool);
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', generateMetaDescription(pool));
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = generateMetaDescription(pool);
        document.head.appendChild(meta);
      }
    }
  }, [pool]);

  // Chart functionality removed per user request

  // Token info with optimized loading
  const { data: tokenInfo, isLoading: tokenInfoLoading } = useQuery({
    queryKey: ['/api/pools', poolId, 'token-info'],
    enabled: !!poolId,
    staleTime: 15 * 60 * 1000, // 15 minutes for speed
    retry: 1, // Reduced retries for speed
    refetchOnWindowFocus: false, // Don't refetch on focus
  });







  const formatTvl = (tvl: string): string => {
    if (!tvl || tvl === '') return 'N/A';
    const num = parseFloat(tvl);
    if (isNaN(num)) return 'N/A';
    return formatCurrency(num);
  };

  const formatApy = (apy: string): string => {
    if (!apy || apy === '') return 'N/A';
    const num = parseFloat(apy);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const formatHolders = (holders: number): string => {
    if (isNaN(holders)) return "N/A";
    return formatNumber(holders);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800';
      case 'high': return 'bg-red-100 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-950 dark:text-gray-100 dark:border-gray-800';
    }
  };

  const getPlatformInitials = (name: string): string => {
    if (!name || typeof name !== 'string') return 'UN';
    return name
      .split(' ')
      .map(word => word && word[0] ? word[0] : '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'UN';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onAdminClick={() => {}} />
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <CryptoLoader message="Loading pool details and market data..." />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onAdminClick={() => {}} />
        <div className="py-8">
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onAdminClick={() => {}} />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="py-8">
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
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                {/* Platform Logo */}
                <div 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0"
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
                      className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl"
                      style={{
                        background: `linear-gradient(135deg, ${pool.chain.color}80, ${pool.chain.color})`
                      }}
                    >
                      {getPlatformInitials(pool.platform.displayName)}
                    </div>
                  )}
                </div>

                {/* Pool Info */}
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="text-pool-title">
                    {pool.tokenPair}
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-3" data-testid="text-platform-name">
                    {pool.platform.displayName}
                  </p>
                  
                  {/* Large Live APY and TVL Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    {/* Large Live APY Display */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">Live APY</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 dark:text-green-400">LIVE</span>
                        </div>
                      </div>
                      <div className="text-center sm:text-left">
                        <AnimatedPercentage 
                          value={parseFloat(pool.apy || '0')} 
                          className="text-4xl sm:text-5xl font-black text-green-600 dark:text-green-400" 
                          data-testid="text-large-apy"
                        />
                      </div>
                    </div>

                    {/* Large TVL Display */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Value Locked</span>
                      </div>
                      <div className="text-center sm:text-left">
                        <AnimatedCurrency 
                          value={parseFloat(pool.tvl || '0')} 
                          compact={true}
                          className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400" 
                          data-testid="text-large-tvl"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    <Badge 
                      variant="outline"
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                      style={{ 
                        backgroundColor: `${pool.chain.color}20`, 
                        color: pool.chain.color,
                        borderColor: `${pool.chain.color}40`
                      }}
                      data-testid="badge-network"
                    >
                      {pool.chain.displayName}
                    </Badge>
                    <MetricTooltip metric="risk-level" variant="icon" side="bottom">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        <RiskBadge 
                          vault={pool}
                          risk={pool.riskLevel || 'medium'}
                          variant="compact"
                          showScore={true}
                          showLabel={true}
                          useDynamic={true}
                          data-testid="badge-risk"
                        />
                      </div>
                    </MetricTooltip>
                  </div>
                  {/* Last Synced Info */}
                  <div className="flex items-center justify-center sm:justify-start mt-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span>Data synced {formatTimeAgo(pool.lastUpdated)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center sm:items-end justify-center sm:justify-end mt-4 sm:mt-0 gap-2">
                {(() => {
                  const linkData = generatePlatformVisitUrl(pool);
                  return linkData ? (
                    <Button 
                      variant="outline" 
                      size="default" 
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm sm:text-base px-4 sm:px-6"
                      data-testid="button-external-link"
                      onClick={() => window.open(linkData.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Visit Platform
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      data-testid="button-external-link"
                      disabled
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Visit Platform
                    </Button>
                  );
                })()}
                
                {/* Etherscan Link */}
                {pool.pool_address && (
                  <Button 
                    variant="outline" 
                    size="default"
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/20 text-sm sm:text-base px-4 sm:px-6"
                    data-testid="button-etherscan-link"
                    onClick={() => window.open(`https://etherscan.io/token/${pool.pool_address}`, '_blank', 'noopener,noreferrer')}
                  >
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    View on Etherscan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* 7-Day Average APY Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                  <span>7-Day APY</span>
                </div>
                <MetricTooltip metric="7d-apy" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-emerald-500 hover:text-emerald-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1" data-testid="text-apy-7d">
                {averagesLoading ? 'Loading...' : (historicalAverages?.sevenDay ? (
                  <AnimatedPercentage 
                    value={historicalAverages.sevenDay} 
                    precision={2}
                  />
                ) : 'N/A')}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70 font-medium">Weekly Average (Real Data)</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  <span>30-Day APY</span>
                </div>
                <MetricTooltip metric="30d-apy" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1" data-testid="text-apy-30d">
                {averagesLoading ? 'Loading...' : (historicalAverages?.thirtyDay ? (
                  <AnimatedPercentage 
                    value={historicalAverages.thirtyDay} 
                    precision={2}
                  />
                ) : 'N/A')}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-300/70 font-medium">Monthly Average (Real Data)</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-600" />
                  <span>90-Day APY</span>
                </div>
                <MetricTooltip metric="90d-apy" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-purple-500 hover:text-purple-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1" data-testid="text-apy-90d">
                {averagesLoading ? 'Loading...' : (historicalAverages?.ninetyDay ? (
                  <AnimatedPercentage 
                    value={historicalAverages.ninetyDay} 
                    precision={2}
                  />
                ) : 'N/A')}
              </p>
              <p className="text-xs text-purple-600/70 dark:text-purple-300/70 font-medium">Quarterly Average (Real Data)</p>
            </CardContent>
          </Card>

          {/* All-Time APY Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                  <span>All-Time APY</span>
                </div>
                <MetricTooltip metric="all-time-apy" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-indigo-500 hover:text-indigo-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1" data-testid="text-apy-all-time">
                {averagesLoading ? 'Loading...' : (historicalAverages?.allTime ? (
                  <AnimatedPercentage 
                    value={historicalAverages.allTime} 
                    precision={2}
                  />
                ) : 'N/A')}
              </p>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70 font-medium">All-Time Average (Real Data)</p>
            </CardContent>
          </Card>

        </div>

        {/* Interactive Chart - CoinGecko Style */}
        <div className="mb-8">
          <PoolChart
            poolId={pool.id}
            currentApy={parseFloat(pool.apy) || 0}
            currentTvl={parseFloat(pool.tvl) || 0}
            tokenPair={pool.tokenPair}
            className="w-full"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-cyan-600" />
                  <span>Total Value Locked</span>
                </div>
                <MetricTooltip metric="tvl" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-cyan-500 hover:text-cyan-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-1" data-testid="text-tvl">
                {pool.tvl ? (
                  <AnimatedCurrency 
                    value={parseFloat(pool.tvl)} 
                    compact={true}
                  />
                ) : 'N/A'}
              </p>
              <p className="text-xs text-cyan-600/70 dark:text-cyan-300/70 font-medium">Assets Under Management</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-amber-600" />
                  <span>Operating Since</span>
                </div>
                <MetricTooltip metric="operating-days" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-amber-500 hover:text-amber-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1" data-testid="text-operating-days">
                {pool.operatingDays || pool.rawData?.count || 'N/A'}
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-300/70 font-medium">Days Active</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-violet-700 dark:text-violet-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-violet-600" />
                  <span>Vault Holders</span>
                </div>
                <MetricTooltip metric="holders" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-violet-500 hover:text-violet-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1" data-testid="text-holders-count">
                {pool.holdersCount ? (
                  <AnimatedNumber 
                    value={pool.holdersCount} 
                    formatter={(val) => formatHolders(val)}
                    precision={0}
                  />
                ) : 'N/A'}
              </p>
              <p className="text-xs text-violet-600/70 dark:text-violet-300/70 font-medium">Active Participants</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-orange-600" />
                  <span>Protocol</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1" data-testid="text-protocol">
                {pool.platform.displayName}
              </p>
              <p className="text-xs text-orange-600/70 dark:text-orange-300/70 font-medium">DeFi Platform</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-sky-200 dark:border-sky-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-sky-700 dark:text-sky-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-sky-600" />
                  <span>Network</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 mb-1" data-testid="text-network">
                {pool.chain.displayName}
              </p>
              <p className="text-xs text-sky-600/70 dark:text-sky-300/70 font-medium">Blockchain Network</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-200 dark:border-rose-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-rose-600" />
                  <span>Risk Assessment</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-1">
                <RiskBadge 
                  risk={pool.riskLevel || 'medium'}
                  variant="full"
                  showScore={true}
                  showLabel={true}
                  data-testid="text-risk-level"
                />
              </div>
              <p className="text-xs text-rose-600/70 dark:text-rose-300/70 font-medium">Security Rating</p>
            </CardContent>
          </Card>
        </div>










        



        {/* Related Pools from Website */}
        <RelatedPools currentPoolId={pool.id} platform={pool.platform.displayName} chainId={pool.chain.id} />






        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}