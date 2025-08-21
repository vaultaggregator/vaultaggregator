import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, RefreshCw, Save, Clock, Database, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";
import Footer from "@/components/footer";

interface CacheSetting {
  id: string;
  serviceName: string;
  displayName: string;
  description: string;
  cacheDurationMs: number;
  cacheType: string;
  isEnabled: boolean;
  category: string;
  maxEntries: number | null;
  hitCount: number;
  missCount: number;
  lastClearAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CacheStats {
  totalCaches: number;
  activeCaches: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: number;
}

export default function CacheSettings() {
  const [editingCache, setEditingCache] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Partial<CacheSetting>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cache settings
  const { data: cacheSettings, isLoading: settingsLoading } = useQuery<CacheSetting[]>({
    queryKey: ['/api/admin/cache-settings'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch cache statistics
  const { data: stats } = useQuery<CacheStats>({
    queryKey: ['/api/admin/cache-stats'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update cache setting
  const updateCacheMutation = useMutation({
    mutationFn: async (setting: Partial<CacheSetting> & { id: string }) => {
      const response = await fetch(`/api/admin/cache-settings/${setting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      });
      if (!response.ok) {
        throw new Error('Failed to update cache setting');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cache setting updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cache-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cache-stats'] });
      setEditingCache(null);
      setEditedSettings({});
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update cache setting", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Clear cache
  const clearCacheMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await fetch(`/api/admin/cache-settings/${serviceId}/clear`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cache cleared successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cache-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/cache-stats'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to clear cache", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'api': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'metadata': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'holders': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'pricing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleEdit = (cache: CacheSetting) => {
    setEditingCache(cache.id);
    setEditedSettings({
      cacheDurationMs: cache.cacheDurationMs,
      isEnabled: cache.isEnabled,
      maxEntries: cache.maxEntries,
    });
  };

  const handleSave = () => {
    if (!editingCache) return;
    updateCacheMutation.mutate({ 
      id: editingCache, 
      ...editedSettings 
    });
  };

  const handleCancel = () => {
    setEditingCache(null);
    setEditedSettings({});
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8 space-y-6" data-testid="cache-settings-loading">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8 space-y-6" data-testid="cache-settings-page">
        {/* Statistics Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card data-testid="stat-total-caches">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Caches</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCaches || 0}</div>
            </CardContent>
          </Card>
        
        <Card data-testid="stat-active-caches">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Caches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeCaches || 0}</div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-hit-ratio">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.hitRatio ? `${(stats.hitRatio * 100).toFixed(1)}%` : '0%'}
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="stat-total-hits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hits</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHits || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage cache durations and settings for API optimization
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cacheSettings?.map((cache) => (
              <div key={cache.id} className="border rounded-lg p-4" data-testid={`cache-setting-${cache.serviceName}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{cache.displayName}</h3>
                      <Badge 
                        variant="outline" 
                        className={getCategoryColor(cache.category)}
                        data-testid={`badge-category-${cache.category}`}
                      >
                        {cache.category}
                      </Badge>
                      <Badge 
                        variant={cache.isEnabled ? "default" : "secondary"}
                        data-testid={`badge-status-${cache.isEnabled ? 'enabled' : 'disabled'}`}
                      >
                        {cache.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cache.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {editingCache === cache.id ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={updateCacheMutation.isPending}
                          data-testid={`button-save-${cache.serviceName}`}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCancel}
                          data-testid={`button-cancel-${cache.serviceName}`}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEdit(cache)}
                          data-testid={`button-edit-${cache.serviceName}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => clearCacheMutation.mutate(cache.id)}
                          disabled={clearCacheMutation.isPending}
                          data-testid={`button-clear-${cache.serviceName}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <Separator className="my-3" />
                
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Cache Duration</Label>
                    {editingCache === cache.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={Math.round((editedSettings.cacheDurationMs || cache.cacheDurationMs) / 60000)}
                          onChange={(e) => setEditedSettings(prev => ({ 
                            ...prev, 
                            cacheDurationMs: parseInt(e.target.value) * 60000 
                          }))}
                          placeholder="Minutes"
                          className="w-20"
                          data-testid={`input-duration-${cache.serviceName}`}
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    ) : (
                      <div className="text-sm font-medium mt-1" data-testid={`text-duration-${cache.serviceName}`}>
                        {formatDuration(cache.cacheDurationMs)}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    {editingCache === cache.id ? (
                      <div className="flex items-center mt-1">
                        <Switch
                          checked={editedSettings.isEnabled ?? cache.isEnabled}
                          onCheckedChange={(checked) => setEditedSettings(prev => ({ 
                            ...prev, 
                            isEnabled: checked 
                          }))}
                          data-testid={`switch-enabled-${cache.serviceName}`}
                        />
                      </div>
                    ) : (
                      <div className="text-sm font-medium mt-1">
                        {cache.isEnabled ? 'Active' : 'Inactive'}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Hit Rate</Label>
                    <div className="text-sm font-medium mt-1" data-testid={`text-hit-rate-${cache.serviceName}`}>
                      {cache.hitCount + cache.missCount > 0
                        ? `${((cache.hitCount / (cache.hitCount + cache.missCount)) * 100).toFixed(1)}%`
                        : '0%'}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Hits / Misses</Label>
                    <div className="text-sm font-medium mt-1" data-testid={`text-hits-misses-${cache.serviceName}`}>
                      {cache.hitCount} / {cache.missCount}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {(!cacheSettings || cacheSettings.length === 0) && (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-cache-settings">
                No cache settings found. Cache settings will be automatically created as services initialize.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  );
}