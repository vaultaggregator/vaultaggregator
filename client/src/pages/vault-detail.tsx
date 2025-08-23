import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { AnimatedPercentage, AnimatedCurrency } from '@/components/animated-value';
import { formatTimeAgo, cn } from '@/lib/utils';
import { formatTvl, formatNumber } from '@/lib/format';
import { ExternalLink, Copy, ArrowLeft } from 'lucide-react';
import type { YieldOpportunity } from '@/types';
import { VaultActivitySection } from '@/components/vault-activity-section';
import { TopHoldersSection } from '@/components/top-holders-section';

export default function VaultDetail() {
  const params = useParams<{ 
    network?: string;
    protocol?: string;
    tokenPair?: string;
  }>();
  const [, setLocation] = useLocation();
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Build API endpoint
  const apiEndpoint = params.network && params.protocol && params.tokenPair
    ? `/api/pools/find/${params.network}/${params.protocol}/${params.tokenPair}`
    : null;

  // Fetch pool data
  const { data: pool, isLoading, error } = useQuery<YieldOpportunity>({
    queryKey: [apiEndpoint],
    enabled: !!apiEndpoint,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch historical data for charts
  const { data: historicalData = [] } = useQuery<any[]>({
    queryKey: ['/api/pools', pool?.id, 'historical-data', 30],
    queryFn: async () => {
      const response = await fetch(`/api/pools/${pool?.id}/historical-data?days=30`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return response.json();
    },
    enabled: !!pool?.id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Set document title
  useEffect(() => {
    if (pool) {
      document.title = `${pool.tokenPair} - ${pool.platform?.displayName} | Vault Aggregator`;
    }
  }, [pool]);

  const handleCopyAddress = () => {
    if (pool?.poolAddress) {
      navigator.clipboard.writeText(pool.poolAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !pool) {
    return (
      <AppShell>
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Vault Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                The requested vault could not be found.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocation('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Discover
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  // Prepare chart data
  const apyChartData = historicalData.map(d => ({
    date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.apy
  }));

  const tvlChartData = historicalData.map(d => ({
    date: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: d.tvl
  }));

  return (
    <AppShell>
      <div className="p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {pool.tokenPair}
            </h1>
            <Badge variant="secondary" className="text-xs">
              {pool.platform?.displayName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {pool.chain?.displayName}
            </Badge>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Net APY</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                <AnimatedPercentage value={parseFloat(pool.apy)} precision={2} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">TVL</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedCurrency value={parseFloat(pool.tvl)} compact={true} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Updated</div>
              <div className="text-sm text-gray-900 dark:text-white">
                {pool.updatedAt ? formatTimeAgo(new Date(pool.updatedAt).getTime()) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* APY Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">APY History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={apyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeWidth={1} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#9CA3AF"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10B981" 
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* TVL Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">TVL History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={tvlChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeWidth={1} />
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
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => formatTvl(value)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Metadata and Yield Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {/* Vault Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Vault Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Contract Address</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-900 dark:text-white">
                          {pool.poolAddress ? `${pool.poolAddress.slice(0, 6)}...${pool.poolAddress.slice(-4)}` : 'N/A'}
                        </span>
                        {pool.poolAddress && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleCopyAddress}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Risk Level</span>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-xs capitalize",
                          pool.riskLevel === 'low' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                          pool.riskLevel === 'medium' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
                          pool.riskLevel === 'high' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        )}
                      >
                        {pool.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Holders</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {pool.holdersCount ? formatNumber(pool.holdersCount) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Operating Days</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {pool.operatingDays || 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Yield Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Yield Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Base APR</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {pool.apy ? `${parseFloat(pool.apy).toFixed(2)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Reward APR</span>
                      <span className="text-sm text-gray-900 dark:text-white">0.00%</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Total APY</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {pool.apy ? `${parseFloat(pool.apy).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics Link */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://analytics.vaults.fyi/vaults/${pool.chain?.name}/${pool.poolAddress}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" disabled>
                      Deposit
                    </Button>
                    <Button variant="outline" className="w-full" disabled>
                      Withdraw
                    </Button>
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                      Connect wallet to interact with vault
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <VaultActivitySection poolId={pool.id} />
          </TabsContent>

          <TabsContent value="holders">
            <TopHoldersSection poolId={pool.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}