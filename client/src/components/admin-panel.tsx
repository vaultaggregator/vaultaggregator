import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, Edit, Eye, EyeOff, Trash2, Search, Database, Link, Coins, Network, RotateCcw, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { YieldOpportunity, AppStats } from "@/types";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery<AppStats>({
    queryKey: ['/api/stats'],
  });

  // Fetch all pools for admin (including hidden ones)
  const { data: pools = [], isLoading: poolsLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools', { onlyVisible: false, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({
        onlyVisible: 'false',
        limit: '100',
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/pools?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }
      return response.json();
    },
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to sync data');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync Completed",
        description: "DeFi Llama data has been successfully synced.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync data",
        variant: "destructive",
      });
    },
  });

  // Toggle pool visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ poolId, isVisible }: { poolId: string; isVisible: boolean }) => {
      const response = await fetch(`/api/pools/${poolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      });
      if (!response.ok) {
        throw new Error('Failed to update pool visibility');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Pool Updated",
        description: "Pool visibility has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update pool",
        variant: "destructive",
      });
    },
  });

  // Delete pool mutation
  const deletePoolMutation = useMutation({
    mutationFn: async (poolId: string) => {
      const response = await fetch(`/api/pools/${poolId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete pool');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Pool Deleted",
        description: "Pool has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete pool",
        variant: "destructive",
      });
    },
  });

  const formatTvl = (tvl: string): string => {
    const num = parseFloat(tvl);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const handleToggleVisibility = (poolId: string, currentVisibility: boolean) => {
    toggleVisibilityMutation.mutate({ poolId, isVisible: !currentVisibility });
  };

  const handleDeletePool = (poolId: string) => {
    if (confirm('Are you sure you want to delete this pool? This action cannot be undone.')) {
      deletePoolMutation.mutate(poolId);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'pools', label: 'Yield Pools', icon: Database },
    { id: 'platforms', label: 'Platforms', icon: Link },
    { id: 'tokens', label: 'Tokens', icon: Coins },
    { id: 'chains', label: 'Chains', icon: Network },
    { id: 'sync', label: 'Data Sync', icon: RotateCcw },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Admin Header */}
          <div className="bg-primary-600 text-white p-6 w-64 flex-shrink-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">Admin Panel</DialogTitle>
                </DialogHeader>
                <p className="text-primary-100 text-sm">Manage yield opportunities and platform settings</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:text-gray-200 hover:bg-primary-700"
                data-testid="button-close-admin"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Admin Sidebar */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-200 hover:bg-primary-700'
                    }`}
                    data-testid={`tab-${tab.id}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Admin Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'dashboard' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Dashboard Overview</h3>
                  <Button
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    data-testid="button-manual-sync"
                  >
                    <RotateCcw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    {syncMutation.isPending ? 'Syncing...' : 'Manual Sync'}
                  </Button>
                </div>

                {/* Admin Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {statsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-8 w-16 mb-2" />
                          <Skeleton className="h-4 w-20" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-gray-900" data-testid="admin-stat-total">
                            {stats?.totalPools || 0}
                          </div>
                          <div className="text-sm text-gray-500">Total Pools</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-success-600" data-testid="admin-stat-active">
                            {stats?.activePools || 0}
                          </div>
                          <div className="text-sm text-gray-500">Active</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-yellow-600" data-testid="admin-stat-hidden">
                            {stats?.hiddenPools || 0}
                          </div>
                          <div className="text-sm text-gray-500">Hidden</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold text-gray-900" data-testid="admin-stat-avg-apy">
                            {stats?.avgApy ? `${stats.avgApy.toFixed(2)}%` : '0%'}
                          </div>
                          <div className="text-sm text-gray-500">Avg APY</div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'pools' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Yield Pool Management</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search pools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 pl-10"
                        data-testid="input-admin-search"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    </div>
                    <Button data-testid="button-add-pool">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Pool
                    </Button>
                  </div>
                </div>

                {/* Admin Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token/Pair</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">APY</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TVL</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chain</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {poolsLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <tr key={i}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Skeleton className="w-8 h-8 rounded-lg mr-3" />
                                    <Skeleton className="h-4 w-20" />
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-4 w-16" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-4 w-12" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-4 w-16" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-6 w-16 rounded-md" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-6 w-12 rounded-md" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-2">
                                    <Skeleton className="w-6 h-6" />
                                    <Skeleton className="w-6 h-6" />
                                    <Skeleton className="w-6 h-6" />
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : pools.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                No pools found. {searchTerm && "Try adjusting your search terms."}
                              </td>
                            </tr>
                          ) : (
                            pools.map((pool) => (
                              <tr key={pool.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div 
                                      className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-white text-xs font-bold"
                                      style={{
                                        background: `linear-gradient(135deg, ${pool.chain.color}80, ${pool.chain.color})`
                                      }}
                                    >
                                      {pool.platform.displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-gray-900" data-testid={`admin-platform-${pool.id}`}>
                                      {pool.platform.displayName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`admin-token-${pool.id}`}>
                                  {pool.tokenPair}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-medium" data-testid={`admin-apy-${pool.id}`}>
                                  {parseFloat(pool.apy).toFixed(2)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`admin-tvl-${pool.id}`}>
                                  {formatTvl(pool.tvl)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant="secondary"
                                    style={{ backgroundColor: `${pool.chain.color}20`, color: pool.chain.color }}
                                    data-testid={`admin-chain-${pool.id}`}
                                  >
                                    {pool.chain.displayName}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    variant={pool.isVisible ? "default" : "secondary"}
                                    className={pool.isVisible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                    data-testid={`admin-status-${pool.id}`}
                                  >
                                    {pool.isVisible ? "Visible" : "Hidden"}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleVisibility(pool.id, pool.isVisible)}
                                    data-testid={`button-toggle-${pool.id}`}
                                  >
                                    {pool.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-edit-${pool.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePool(pool.id)}
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-${pool.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Other tabs would be implemented similarly */}
            {activeTab !== 'dashboard' && activeTab !== 'pools' && (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h3>
                <p className="text-gray-600">This section is coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
