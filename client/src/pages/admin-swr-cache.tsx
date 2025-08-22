import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Trash2, Settings, BarChart3, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SwrCachedPage } from '@shared/schema';

export default function AdminSwrCache() {
  const { toast } = useToast();
  const [invalidateKey, setInvalidateKey] = useState('');
  const [invalidatePattern, setInvalidatePattern] = useState('');

  // Fetch cached pages
  const { data: pages = [], isLoading: pagesLoading, refetch: refetchPages } = useQuery({
    queryKey: ['/api/admin/swr-cache/pages'],
  });

  // Fetch cache statistics
  const { data: stats = [], isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/swr-cache/stats'],
  });

  // Toggle page enabled status
  const togglePageMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      return apiRequest(`/api/admin/swr-cache/pages/${id}`, 'PATCH', { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/swr-cache/pages'] });
      toast({
        title: 'Cache page updated',
        description: 'Cache page status has been updated successfully.',
      });
    },
  });

  // Update cache duration
  const updateDurationMutation = useMutation({
    mutationFn: async ({ id, cacheDurationMs }: { id: string; cacheDurationMs: number }) => {
      return apiRequest(`/api/admin/swr-cache/pages/${id}`, 'PATCH', { cacheDurationMs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/swr-cache/pages'] });
      toast({
        title: 'Cache duration updated',
        description: 'Cache duration has been updated successfully.',
      });
    },
  });

  // Invalidate cache
  const invalidateCacheMutation = useMutation({
    mutationFn: async ({ cacheKey, pattern }: { cacheKey?: string; pattern?: string }) => {
      return apiRequest('/api/admin/swr-cache/invalidate', 'POST', { cacheKey, pattern });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Cache invalidated',
        description: data?.message || 'Cache has been invalidated successfully.',
      });
      setInvalidateKey('');
      setInvalidatePattern('');
      refetchStats();
    },
  });

  // Clear snapshots
  const clearSnapshotsMutation = useMutation({
    mutationFn: async (pageId?: string) => {
      const url = pageId 
        ? `/api/admin/swr-cache/snapshots/${pageId}`
        : '/api/admin/swr-cache/snapshots';
      return apiRequest(url, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Snapshots cleared',
        description: 'Cache snapshots have been cleared successfully.',
      });
      refetchStats();
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const getCacheHitRate = (page: any) => {
    const total = page.cacheHitCount + page.cacheMissCount;
    if (total === 0) return 0;
    return ((page.cacheHitCount / total) * 100).toFixed(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SWR Cache Management</h1>
          <p className="text-muted-foreground">
            Manage stale-while-revalidate caching for optimal performance
          </p>
        </div>
        <Button
          onClick={() => {
            refetchPages();
            refetchStats();
          }}
          variant="outline"
          data-testid="button-refresh-cache"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">
            <Settings className="h-4 w-4 mr-2" />
            Cache Pages
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Database className="h-4 w-4 mr-2" />
            Cache Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cached Pages Configuration</CardTitle>
              <CardDescription>
                Configure which pages use SWR caching and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Name</TableHead>
                      <TableHead>Route Pattern</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cache Duration</TableHead>
                      <TableHead>Hit Rate</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pages as SwrCachedPage[]).map((page) => (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">
                          {page.displayName}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{page.routePattern}</code>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={page.isEnabled}
                            onCheckedChange={(checked) =>
                              togglePageMutation.mutate({
                                id: page.id,
                                isEnabled: checked,
                              })
                            }
                            data-testid={`switch-enable-${page.pageName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={page.cacheDurationMs / 1000}
                            onChange={(e) => {
                              const seconds = parseInt(e.target.value);
                              if (!isNaN(seconds) && seconds > 0) {
                                updateDurationMutation.mutate({
                                  id: page.id,
                                  cacheDurationMs: seconds * 1000,
                                });
                              }
                            }}
                            className="w-20 inline-block mr-2"
                            data-testid={`input-duration-${page.pageName}`}
                          />
                          <span className="text-sm text-muted-foreground">sec</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCacheHitRate(page)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              page.priority === 1
                                ? 'default'
                                : page.priority === 2
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {page.priority === 1
                              ? 'High'
                              : page.priority === 2
                              ? 'Medium'
                              : 'Low'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => clearSnapshotsMutation.mutate(page.id)}
                            data-testid={`button-clear-${page.pageName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statsLoading ? (
              <div className="col-span-3 flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              (stats as any[]).map((page: any) => (
                <Card key={page.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{page.displayName}</CardTitle>
                    <CardDescription>{page.routePattern}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Snapshots:</span>
                      <span className="font-medium">{page.snapshotCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Size:</span>
                      <span className="font-medium">{formatBytes(page.totalSize)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Access:</span>
                      <span className="font-medium">
                        {Math.round(page.avgAccessCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hit Rate:</span>
                      <Badge variant="outline">{getCacheHitRate(page)}%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Cached:</span>
                      <span className="font-medium">
                        {page.lastCachedAt
                          ? new Date(page.lastCachedAt).toLocaleTimeString()
                          : 'Never'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Cache Invalidation</CardTitle>
              <CardDescription>
                Manually invalidate specific cache keys or patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cache-key">Invalidate by Cache Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="cache-key"
                    placeholder="e.g., api_pools_123"
                    value={invalidateKey}
                    onChange={(e) => setInvalidateKey(e.target.value)}
                    data-testid="input-cache-key"
                  />
                  <Button
                    onClick={() =>
                      invalidateKey &&
                      invalidateCacheMutation.mutate({ cacheKey: invalidateKey })
                    }
                    disabled={!invalidateKey}
                    data-testid="button-invalidate-key"
                  >
                    Invalidate Key
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-pattern">Invalidate by Pattern</Label>
                <div className="flex gap-2">
                  <Input
                    id="cache-pattern"
                    placeholder="e.g., api_pools"
                    value={invalidatePattern}
                    onChange={(e) => setInvalidatePattern(e.target.value)}
                    data-testid="input-cache-pattern"
                  />
                  <Button
                    onClick={() =>
                      invalidatePattern &&
                      invalidateCacheMutation.mutate({ pattern: invalidatePattern })
                    }
                    disabled={!invalidatePattern}
                    data-testid="button-invalidate-pattern"
                  >
                    Invalidate Pattern
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => clearSnapshotsMutation.mutate(undefined)}
                  data-testid="button-clear-all-snapshots"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Snapshots
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will remove all cached snapshots from the database
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cache Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>SWR (Stale-While-Revalidate)</strong> serves cached content immediately
                while fetching fresh data in the background.
              </p>
              <p>
                <strong>Cache Hit Rate:</strong> Percentage of requests served from cache vs.
                fresh fetches.
              </p>
              <p>
                <strong>Priority:</strong> High priority pages are cached more aggressively with
                longer TTLs.
              </p>
              <p>
                <strong>Disk Persistence:</strong> Cache is persisted to disk for faster cold
                starts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}