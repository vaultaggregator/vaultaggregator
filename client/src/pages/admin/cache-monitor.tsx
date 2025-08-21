import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin-header';
import { AlertCircle, DollarSign, TrendingDown, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CacheMonitor() {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCacheStats = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/cache-stats');
      const data = await response.json();
      setCacheStats(data);
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearCache = async () => {
    setClearing(true);
    try {
      const response = await fetch('/api/admin/cache-clear', { method: 'POST' });
      const result = await response.json();
      alert(`Cleared ${result.clearedEntries} expired cache entries`);
      await fetchCacheStats();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <p className="text-center">Loading cache statistics...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Alchemy API Cache Monitor</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of API call optimization and cost savings
          </p>
        </div>

        {cacheStats?.success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {cacheStats.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Cached Tokens</p>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {cacheStats?.cacheStats?.totalCachedTokens || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Token metadata stored
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">API Calls Saved</p>
              <TrendingDown className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {cacheStats?.cacheStats?.estimatedApiCallsSaved?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Per 24 hours
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Cost Savings</p>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {cacheStats?.cacheStats?.estimatedCostSavings || '$0.00'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Daily savings estimate
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Cache Duration</p>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {cacheStats?.cacheStats?.cacheDurationHours || 0}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Before refresh
            </p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Cached Token Details</h2>
            <div className="flex gap-2">
              <Button
                onClick={fetchCacheStats}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={clearCache}
                disabled={clearing}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Expired
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Token</th>
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Age</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cacheStats?.cacheStats?.entries?.map((entry: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-mono text-sm">{entry.token}</td>
                    <td className="p-2">{entry.name}</td>
                    <td className="p-2">
                      {entry.ageMinutes < 60
                        ? `${entry.ageMinutes} mins`
                        : `${Math.round(entry.ageMinutes / 60)} hours`}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          entry.isExpired
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        }`}
                      >
                        {entry.isExpired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!cacheStats?.cacheStats?.entries || cacheStats.cacheStats.entries.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No cached tokens yet. Cache will populate as tokens are accessed.
              </p>
            )}
          </div>
        </Card>

        <div className="mt-6 text-sm text-muted-foreground">
          <h3 className="font-semibold mb-2">How Cache Optimization Works:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Token metadata (name, symbol, decimals) is cached for 24 hours</li>
            <li>Transfer events are cached for 5 minutes to reduce repeated fetches</li>
            <li>ETH balances are cached for 1 minute for frequently accessed addresses</li>
            <li>Block numbers are cached for 10 seconds to reduce health check overhead</li>
            <li>Each cached token saves approximately 100 API calls per day</li>
          </ul>
        </div>
      </div>
    </div>
  );
}