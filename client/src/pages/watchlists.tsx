import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Plus, Star, TrendingUp, TrendingDown, Eye, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  watchlistPools: Array<{
    id: string;
    poolId: string;
    addedAt: string;
    pool: {
      id: string;
      tokenPair: string;
      apy: string;
      tvl: string;
      platform: { name: string };
      chain: { name: string };
    };
  }>;
}

export default function Watchlists() {
  const [userId] = useState('demo-user-123');
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false);
  const [isAddingPool, setIsAddingPool] = useState<string | null>(null);
  const [newWatchlist, setNewWatchlist] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [poolToAdd, setPoolToAdd] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: watchlists, isLoading: watchlistsLoading } = useQuery({
    queryKey: ['/api/users', userId, 'watchlists'],
    queryFn: () => apiRequest(`/api/users/${userId}/watchlists`)
  });

  const createWatchlistMutation = useMutation({
    mutationFn: (watchlistData: any) => apiRequest(`/api/users/${userId}/watchlists`, {
      method: 'POST',
      body: JSON.stringify(watchlistData),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'watchlists'] });
      setIsCreatingWatchlist(false);
      setNewWatchlist({ name: '', description: '', isPublic: false });
      toast({
        title: "Watchlist Created",
        description: "Your new watchlist has been created successfully."
      });
    }
  });

  const deleteWatchlistMutation = useMutation({
    mutationFn: (watchlistId: string) => apiRequest(`/api/watchlists/${watchlistId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'watchlists'] });
      toast({
        title: "Watchlist Deleted",
        description: "Watchlist has been removed successfully."
      });
    }
  });

  const addPoolToWatchlistMutation = useMutation({
    mutationFn: ({ watchlistId, poolId }: { watchlistId: string; poolId: string }) =>
      apiRequest(`/api/watchlists/${watchlistId}/pools`, {
        method: 'POST',
        body: JSON.stringify({ poolId }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'watchlists'] });
      setIsAddingPool(null);
      setPoolToAdd('');
      toast({
        title: "Pool Added",
        description: "Pool has been added to your watchlist."
      });
    }
  });

  const removePoolFromWatchlistMutation = useMutation({
    mutationFn: ({ watchlistId, poolId }: { watchlistId: string; poolId: string }) =>
      apiRequest(`/api/watchlists/${watchlistId}/pools/${poolId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'watchlists'] });
      toast({
        title: "Pool Removed",
        description: "Pool has been removed from your watchlist."
      });
    }
  });

  const formatCurrency = (value: string) => {
    const num = parseFloat(value || '0');
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(0)}`;
  };

  const formatApy = (apy: string) => {
    const value = parseFloat(apy || '0');
    return value > 0 ? `${value.toFixed(2)}%` : 'N/A';
  };

  const getApyColor = (apy: string) => {
    const value = parseFloat(apy || '0');
    if (value >= 20) return 'text-green-600';
    if (value >= 10) return 'text-blue-600';
    if (value >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Custom Watchlists</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize and monitor your favorite yield opportunities
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreatingWatchlist(true)}
          data-testid="button-create-watchlist"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Watchlist
        </Button>
      </div>

      {/* Create Watchlist Form */}
      {isCreatingWatchlist && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Watchlist</CardTitle>
            <CardDescription>
              Organize pools by strategy, risk level, or any custom criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="watchlistName">Watchlist Name *</Label>
              <Input
                id="watchlistName"
                data-testid="input-watchlist-name"
                value={newWatchlist.name}
                onChange={(e) => setNewWatchlist({ ...newWatchlist, name: e.target.value })}
                placeholder="e.g., High Yield Stables, Conservative Portfolio"
              />
            </div>

            <div>
              <Label htmlFor="watchlistDescription">Description</Label>
              <Textarea
                id="watchlistDescription"
                data-testid="textarea-watchlist-description"
                value={newWatchlist.description}
                onChange={(e) => setNewWatchlist({ ...newWatchlist, description: e.target.value })}
                placeholder="Describe the purpose or criteria for this watchlist"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                data-testid="checkbox-watchlist-public"
                checked={newWatchlist.isPublic}
                onChange={(e) => setNewWatchlist({ ...newWatchlist, isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublic">Make this watchlist public</Label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => createWatchlistMutation.mutate(newWatchlist)}
                data-testid="button-save-watchlist"
                disabled={createWatchlistMutation.isPending || !newWatchlist.name}
              >
                {createWatchlistMutation.isPending ? 'Creating...' : 'Create Watchlist'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreatingWatchlist(false)}
                data-testid="button-cancel-watchlist"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Watchlists Display */}
      {watchlistsLoading ? (
        <div className="text-center py-8">Loading watchlists...</div>
      ) : watchlists?.length > 0 ? (
        <div className="space-y-6">
          {watchlists.map((watchlist: Watchlist) => (
            <Card key={watchlist.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {watchlist.name}
                      {watchlist.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </CardTitle>
                    {watchlist.description && (
                      <CardDescription className="mt-1">
                        {watchlist.description}
                      </CardDescription>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      {watchlist.watchlistPools.length} pools • Created {new Date(watchlist.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingPool(watchlist.id)}
                      data-testid={`button-add-pool-${watchlist.id}`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Pool
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWatchlistMutation.mutate(watchlist.id)}
                      data-testid={`button-delete-watchlist-${watchlist.id}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Add Pool Form */}
              {isAddingPool === watchlist.id && (
                <div className="px-6 pb-4">
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <h4 className="font-medium mb-3">Add Pool to Watchlist</h4>
                    <div className="flex gap-2">
                      <Input
                        value={poolToAdd}
                        onChange={(e) => setPoolToAdd(e.target.value)}
                        placeholder="Enter pool ID to add"
                        data-testid={`input-add-pool-${watchlist.id}`}
                      />
                      <Button
                        onClick={() => addPoolToWatchlistMutation.mutate({
                          watchlistId: watchlist.id,
                          poolId: poolToAdd
                        })}
                        disabled={!poolToAdd.trim() || addPoolToWatchlistMutation.isPending}
                        data-testid={`button-confirm-add-pool-${watchlist.id}`}
                      >
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingPool(null)}
                        data-testid={`button-cancel-add-pool-${watchlist.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <CardContent>
                {watchlist.watchlistPools.length > 0 ? (
                  <div className="space-y-3">
                    {watchlist.watchlistPools.map((watchlistPool) => (
                      <div
                        key={watchlistPool.id}
                        className="border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{watchlistPool.pool.tokenPair}</h4>
                            <Badge variant="outline">{watchlistPool.pool.platform.name}</Badge>
                            <Badge variant="secondary">{watchlistPool.pool.chain.name}</Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span className={getApyColor(watchlistPool.pool.apy)}>
                                {formatApy(watchlistPool.pool.apy)} APY
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>TVL: {formatCurrency(watchlistPool.pool.tvl)}</span>
                            </div>
                            <div className="text-xs">
                              Added: {new Date(watchlistPool.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePoolFromWatchlistMutation.mutate({
                            watchlistId: watchlist.id,
                            poolId: watchlistPool.poolId
                          })}
                          data-testid={`button-remove-pool-${watchlistPool.id}`}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No pools in this watchlist yet.</p>
                    <p className="text-sm">Click "Add Pool" to start building your collection.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Watchlists Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first watchlist to organize and track your favorite pools
            </p>
            <Button
              onClick={() => setIsCreatingWatchlist(true)}
              data-testid="button-create-first-watchlist"
            >
              Create Your First Watchlist
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Watchlist Statistics */}
      {watchlists && watchlists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Watchlist Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {watchlists.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Watchlists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {watchlists.reduce((total: number, w: Watchlist) => total + w.watchlistPools.length, 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Pools Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {watchlists.filter((w: Watchlist) => w.isPublic).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Public Watchlists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(watchlists.reduce((total: number, w: Watchlist) => total + w.watchlistPools.length, 0) / watchlists.length) || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Avg Pools per List</div>
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