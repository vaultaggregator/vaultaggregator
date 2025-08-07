import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Search, LogOut, Eye, EyeOff, Edit3, Check, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = 'platform' | 'chain' | 'apy' | 'tvl' | 'risk' | 'visible';
type SortDirection = 'asc' | 'desc' | null;
import type { PoolWithRelations, Platform, Chain } from "@shared/schema";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { user, logout, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch admin pools (includes hidden ones)
  const { data: pools = [], isLoading: poolsLoading, error } = useQuery<PoolWithRelations[]>({
    queryKey: ["/api/admin/pools", { 
      search, 
      platformId: selectedPlatform === "all" ? "" : selectedPlatform, 
      chainId: selectedChain === "all" ? "" : selectedChain 
    }],
    staleTime: 5000, // Reduced stale time to see updates faster
    retry: 1,
  });
  
  console.log("Admin pools query:", { pools: pools?.length, error, isLoading: poolsLoading, visibleCount: pools.filter(p => p.isVisible).length, hiddenCount: pools.filter(p => !p.isVisible).length });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ["/api/chains"],
  });

  // Inline EditableField component
  function EditableField({ value, onSave, className = "", ...props }: {
    value: string;
    onSave: (newValue: string) => void;
    className?: string;
    [key: string]: any;
  }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
      if (editValue.trim() !== value) {
        onSave(editValue.trim());
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(value);
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
            {...props}
          />
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 group">
        <span className={className}>{value}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ poolId, isVisible }: { poolId: string; isVisible: boolean }) => {
      const response = await fetch(`/api/admin/pools/${poolId}/visibility`, {
        method: "PUT",
        body: JSON.stringify({ isVisible }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update visibility");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Toggle success:", data);
      // Force refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ["/api/admin/pools"] });
      toast({
        title: "Success",
        description: `Pool visibility ${data.isVisible ? 'enabled' : 'disabled'}`,
      });
    },
    onError: (error: any) => {
      console.error("Toggle error:", error);
      toast({
        title: "Error", 
        description: error.message || "Failed to update pool visibility",
        variant: "destructive",
      });
    },
  });

  const updateTokenPairMutation = useMutation({
    mutationFn: async ({ poolId, tokenPair }: { poolId: string; tokenPair: string }) => {
      const response = await fetch(`/api/admin/pools/${poolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tokenPair }),
      });
      if (!response.ok) throw new Error("Failed to update token pair");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({
        title: "Success",
        description: "Token pair updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update token pair",
        variant: "destructive",
      });
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: async ({ platformId, displayName }: { platformId: string; displayName: string }) => {
      const response = await fetch(`/api/admin/platforms/${platformId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName }),
      });
      if (!response.ok) throw new Error("Failed to update platform name");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Success",
        description: "Platform name updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform name",
        variant: "destructive",
      });
    },
  });

  const updateTokenPair = (poolId: string, tokenPair: string) => {
    updateTokenPairMutation.mutate({ poolId, tokenPair });
  };

  const updatePlatformName = (platformId: string, displayName: string) => {
    updatePlatformMutation.mutate({ platformId, displayName });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Sorting handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  // Sort pools
  const sortedPools = [...pools].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'platform':
        aValue = a.platform.displayName.toLowerCase();
        bValue = b.platform.displayName.toLowerCase();
        break;
      case 'chain':
        aValue = a.chain.displayName.toLowerCase();
        bValue = b.chain.displayName.toLowerCase();
        break;
      case 'apy':
        aValue = parseFloat(a.apy || '0');
        bValue = parseFloat(b.apy || '0');
        break;
      case 'tvl':
        aValue = parseFloat(a.tvl || '0');
        bValue = parseFloat(b.tvl || '0');
        break;
      case 'risk':
        const riskOrder = { low: 1, medium: 2, high: 3 };
        aValue = riskOrder[a.riskLevel as keyof typeof riskOrder] || 2;
        bValue = riskOrder[b.riskLevel as keyof typeof riskOrder] || 2;
        break;
      case 'visible':
        aValue = a.isVisible ? 1 : 0;
        bValue = b.isVisible ? 1 : 0;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const visiblePools = sortedPools.filter(pool => pool.isVisible);
  const hiddenPools = sortedPools.filter(pool => !pool.isVisible);

  // Redirect if not authenticated
  if (!userLoading && !user) {
    navigate("/admin/login");
    return null;
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {(user as any)?.username}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => navigate("/admin-networks")} 
                variant="outline" 
                size="sm"
                data-testid="button-networks"
              >
                Networks
              </Button>
              <Button 
                onClick={() => navigate("/admin-platforms")} 
                variant="outline" 
                size="sm"
                data-testid="button-platforms"
              >
                Platforms
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Pools
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pools.length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Visible Pools
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {visiblePools.length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hidden Pools
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {hiddenPools.length}
                  </p>
                </div>
                <EyeOff className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search pools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger data-testid="select-platform">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger data-testid="select-chain">
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  {chains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pools Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pool Management</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Toggle switches to control which pools are visible to guest visitors on the main site. 
              Hidden pools will not appear on the homepage.
            </p>
          </CardHeader>
          <CardContent>
            {poolsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pools.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No pools found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Pool
                      </th>
                      <th 
                        className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('platform')}
                        data-testid="sort-platform"
                      >
                        <div className="flex items-center gap-2">
                          Platform
                          {getSortIcon('platform')}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('chain')}
                        data-testid="sort-chain"
                      >
                        <div className="flex items-center gap-2">
                          Chain
                          {getSortIcon('chain')}
                        </div>
                      </th>
                      <th 
                        className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('apy')}
                        data-testid="sort-apy"
                      >
                        <div className="flex items-center justify-end gap-2">
                          APY
                          {getSortIcon('apy')}
                        </div>
                      </th>
                      <th 
                        className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('tvl')}
                        data-testid="sort-tvl"
                      >
                        <div className="flex items-center justify-end gap-2">
                          TVL
                          {getSortIcon('tvl')}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('risk')}
                        data-testid="sort-risk"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Risk
                          {getSortIcon('risk')}
                        </div>
                      </th>
                      <th 
                        className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleSort('visible')}
                        data-testid="sort-visible"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Visible
                          {getSortIcon('visible')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPools.map((pool) => (
                      <tr 
                        key={pool.id} 
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        data-testid={`row-pool-${pool.id}`}
                      >
                        <td className="py-3 px-2">
                          <EditableField
                            value={pool.tokenPair}
                            onSave={(newValue) => updateTokenPair(pool.id, newValue)}
                            className="font-medium text-gray-900 dark:text-white"
                            data-testid={`edit-token-pair-${pool.id}`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <EditableField
                            value={pool.platform.displayName}
                            onSave={(newValue) => updatePlatformName(pool.platformId, newValue)}
                            className="text-sm text-gray-600 dark:text-gray-400"
                            data-testid={`edit-platform-name-${pool.id}`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: `${pool.chain.color}20`, color: pool.chain.color }}
                          >
                            {pool.chain.displayName}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="font-mono text-sm">
                            {parseFloat(pool.apy || '0').toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="font-mono text-sm">
                            ${parseFloat(pool.tvl || '0').toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge 
                            variant={
                              pool.riskLevel === 'low' ? 'secondary' :
                              pool.riskLevel === 'medium' ? 'default' : 'destructive'
                            }
                          >
                            {pool.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              checked={pool.isVisible}
                              onCheckedChange={(checked) => {
                                console.log("Toggle clicked:", { poolId: pool.id, currentVisible: pool.isVisible, newVisible: checked });
                                toggleVisibilityMutation.mutate({ 
                                  poolId: pool.id, 
                                  isVisible: checked 
                                });
                              }}
                              disabled={toggleVisibilityMutation.isPending}
                              data-testid={`switch-visibility-${pool.id}`}
                            />
                            <span className="text-xs text-gray-500">
                              {pool.isVisible ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}