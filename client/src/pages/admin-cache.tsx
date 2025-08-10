import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RefreshCw, Search, Database, Clock, HardDrive, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin-header";

interface CacheStats {
  totalEntries: number;
  totalMemoryUsage: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  cleanups: number;
}

interface CacheEntry {
  key: string;
  source: string;
  size: number;
  hits: number;
  timestamp: number;
  lastAccessed: number;
  ttl: number;
  timeToExpire: number;
  expired: boolean;
}

interface CacheSource {
  source: string;
  count: number;
  totalSize: number;
  totalHits: number;
  averageAge: number;
  entries: CacheEntry[];
}

export default function AdminCache() {
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/cache/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/admin/cache/sources"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/admin/cache/entries", selectedSource, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSource !== "all") params.append("source", selectedSource);
      if (searchTerm) params.append("search", searchTerm);
      params.append("limit", "50");
      
      const response = await fetch(`/api/admin/cache/entries?${params}`);
      if (!response.ok) throw new Error("Failed to fetch cache entries");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const clearCacheMutation = useMutation({
    mutationFn: async (source?: string) => {
      const url = source ? `/api/admin/cache/clear/${source}` : "/api/admin/cache/clear";
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to clear cache");
      return response.json();
    },
    onSuccess: (data, source) => {
      toast({
        title: "Cache Cleared",
        description: source 
          ? `Cleared ${data.clearedCount} entries from ${source}`
          : "All cache entries cleared successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cache"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/admin/cache/entry/${encodeURIComponent(key)}`, { 
        method: "DELETE" 
      });
      if (!response.ok) throw new Error("Failed to delete cache entry");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry Deleted",
        description: "Cache entry deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cache"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete cache entry",
        variant: "destructive",
      });
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
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  const getStatusColor = (entry: CacheEntry) => {
    if (entry.expired) return "destructive";
    if (entry.timeToExpire < 60000) return "warning"; // Less than 1 minute
    return "default";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Cache Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage the intelligent caching system that improves application performance
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="entries">Cache Entries</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(stats?.totalMemoryUsage || 0)} memory used
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.hitRate ? `${stats.hitRate.toFixed(1)}%` : "0%"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalHits || 0} hits, {stats?.totalMisses || 0} misses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Operations</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.sets || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Sets: {stats?.sets || 0}, Deletes: {stats?.deletes || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatBytes(stats?.totalMemoryUsage || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cleanups: {stats?.cleanups || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage the cache system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries()}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Data
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cache Entries</CardTitle>
                <CardDescription>
                  Browse and manage individual cache entries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search cache keys..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {sources?.map((source: CacheSource) => (
                        <SelectItem key={source.source} value={source.source}>
                          {source.source} ({source.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {entriesLoading ? (
                    <div className="text-center py-8">Loading cache entries...</div>
                  ) : entriesData?.entries?.length > 0 ? (
                    entriesData.entries.map((entry: CacheEntry) => (
                      <div
                        key={entry.key}
                        className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-800"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate">
                              {entry.key}
                            </code>
                            <Badge variant={getStatusColor(entry) as any}>
                              {entry.source}
                            </Badge>
                            {entry.expired && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-4 w-4" />
                              {formatBytes(entry.size)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              {entry.hits} hits
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {entry.expired ? "Expired" : formatDuration(entry.timeToExpire)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEntryMutation.mutate(entry.key)}
                          disabled={deleteEntryMutation.isPending}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No cache entries found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sourcesLoading ? (
                <div className="text-center py-8">Loading data sources...</div>
              ) : sources?.map((source: CacheSource) => (
                <Card key={source.source}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{source.source}</CardTitle>
                      <Badge variant="outline">{source.count} entries</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Size:</span>
                        <span className="font-medium">{formatBytes(source.totalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Hits:</span>
                        <span className="font-medium">{source.totalHits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Avg Age:</span>
                        <span className="font-medium">{formatDuration(source.averageAge)}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearCacheMutation.mutate(source.source)}
                      disabled={clearCacheMutation.isPending}
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear {source.source} Cache
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}