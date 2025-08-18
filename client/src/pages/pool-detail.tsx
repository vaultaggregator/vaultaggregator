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
import { generatePlatformVisitUrl } from "@/utils/platformUrls";

import { MetricTooltip, DeFiTooltip } from "@/components/metric-tooltip";
import { TokenInfo } from "@/components/token-info";
import { formatTimeAgo } from "@/lib/utils";


import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ComposedChart, Bar } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { YieldOpportunity } from "@/types";

// Utility function to format TVL values
function formatTvl(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "N/A";
  
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

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
  };
  historicalData: {
    last7Days: Array<{x: number, y: number}>;
    last30Days: Array<{x: number, y: number}>;
    last90Days: Array<{x: number, y: number}>;
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
    slug?: string;
  }>();
  
  // Handle both new SEO URLs and legacy URLs
  const poolId = params.poolId;
  const urlInfo = parseYieldUrl(params);
  
  const { data: pool, isLoading, error } = useQuery<YieldOpportunity>({
    queryKey: ['/api/pools', poolId],
    enabled: !!poolId,
  });

  // Fetch Morpho APY data for historical metrics (7d, 30d, 90d)
  const { data: morphoApyData, isLoading: morphoApyLoading } = useQuery<MorphoApyData>({
    queryKey: ['/api/pools', poolId, 'morpho/apy'],
    enabled: !!poolId && !!pool && pool.platform.name === 'Morpho',
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Fetch Morpho current metrics for TVL, holders, operating days
  const { data: morphoMetrics, isLoading: morphoMetricsLoading } = useQuery<MorphoMetricsData>({
    queryKey: ['/api/pools', poolId, 'morpho/metrics'],
    enabled: !!poolId && !!pool && pool.platform.name === 'Morpho',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Scroll to top when page loads or pool ID changes (mobile navigation fix)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [poolId]);

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

  // Chart data and DeFi Llama queries removed - historical data now via Morpho API

  const { data: tokenInfo } = useQuery({
    queryKey: ['/api/pools', poolId, 'token-info'],
    enabled: !!poolId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });







  const formatTvl = (tvl: string): string => {
    if (!tvl || tvl === '') return 'N/A';
    const num = parseFloat(tvl);
    if (isNaN(num)) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatApy = (apy: string): string => {
    if (!apy || apy === '') return 'N/A';
    const num = parseFloat(apy);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const formatHolders = (holders: number): string => {
    if (isNaN(holders)) return "N/A";
    return holders.toLocaleString();
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700';
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-200 dark:border-gray-600';
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
                      <Badge 
                        className={`text-xs sm:text-sm px-2 sm:px-3 py-1 ${getRiskColor(pool.riskLevel)}`}
                        data-testid="badge-risk"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {pool.riskLevel ? (pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)) : 'Unknown'} Risk
                      </Badge>
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
              <div className="flex justify-center sm:justify-end mt-4 sm:mt-0">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  <span>Current APY</span>
                </div>
                <MetricTooltip metric="24h-apy" variant="icon" side="bottom">
                  <AlertCircle className="w-4 h-4 text-green-500 hover:text-green-600 cursor-help" />
                </MetricTooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1" data-testid="text-apy-current">
                {morphoApyData?.apy?.current ? `${(morphoApyData.apy.current * 100).toFixed(2)}%` : formatApy(pool.apy)}
              </p>
              <p className="text-xs text-green-600/70 dark:text-green-300/70 font-medium">24h Average</p>
            </CardContent>
          </Card>

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
                {morphoApyData?.apy?.weekly ? `${(morphoApyData.apy.weekly * 100).toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70 font-medium">Weekly Average</p>
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
                {morphoApyData?.apy?.monthly ? `${(morphoApyData.apy.monthly * 100).toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-300/70 font-medium">Monthly Average</p>
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
                {morphoApyData?.apy?.quarterly ? `${(morphoApyData.apy.quarterly * 100).toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-xs text-purple-600/70 dark:text-purple-300/70 font-medium">Quarterly Average</p>
            </CardContent>
          </Card>

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
                {morphoMetrics?.metrics?.tvlFormatted || formatTvl(pool.tvl)}
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
                {morphoMetrics?.metrics?.operatingDays ?? (() => {
                  if (pool.rawData?.createdAt) {
                    const createdDate = new Date(pool.rawData.createdAt);
                    const now = new Date();
                    const days = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                    return days;
                  }
                  return 'N/A';
                })()}
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
                {morphoMetrics?.metrics?.holders ?? (tokenInfo?.holdersCount || 'N/A')}
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
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-1" data-testid="text-risk-level">
                {pool.riskLevel ? (pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)) : 'Unknown'} Risk
              </p>
              <p className="text-xs text-rose-600/70 dark:text-rose-300/70 font-medium">Security Rating</p>
            </CardContent>
          </Card>
        </div>










        {/* All-Time APY Performance Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              All-Time APY Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {morphoApyData?.historicalData ? (
              <div>
                {/* All-Time Chart */}
                {morphoApyData.historicalData.allTime && morphoApyData.historicalData.allTime.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={morphoApyData.historicalData.allTime.map(point => ({
                        date: new Date(point.x * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: point.x * 1000 < Date.now() - 365 * 24 * 60 * 60 * 1000 ? 'numeric' : undefined
                        }),
                        apy: (point.y * 100).toFixed(2)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                          label={{ value: 'APY (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => [`${value}%`, 'APY']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="apy" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', r: 2 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-lg font-medium mb-1">No Historical Data Available</p>
                    <p className="text-sm text-center max-w-md">
                      All-time APY performance data is not available for this vault.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-lg font-medium mb-1">Loading Historical Data...</p>
                <p className="text-sm text-center max-w-md">
                  Fetching historical performance data from Morpho API...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Pools from Website */}
        <RelatedPools currentPoolId={pool.id} platform={pool.platform.displayName} chainId={pool.chain.id} />






      </div>
      </div>
      <Footer />
    </div>
  );
}