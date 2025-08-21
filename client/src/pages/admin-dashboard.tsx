import { useState, useEffect } from "react";
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
import { Search, Eye, EyeOff, Edit3, Check, X, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Settings, Percent } from "lucide-react";
import { TokenDisplay } from "@/components/TokenDisplay";
import { UnderlyingTokensEditor } from "@/components/underlying-tokens-editor";
import { RiskBadge } from "@/components/risk-badge";
import AdminHeader from "@/components/admin-header";
import Footer from "@/components/footer";
import { PoolDataLoading, SyncAnimation, FloatingActionLoading } from "@/components/loading-animations";
import { YieldSyncLoader } from "@/components/crypto-loader";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PoolDataModal from "@/components/pool-data-modal";

import { generatePlatformVisitUrl } from "@/utils/platformUrls";
import { formatCurrency, formatNumber } from "@/lib/format";

type SortField = 'platform' | 'chain' | 'apy' | 'tvl' | 'risk' | 'visible';
type SortDirection = 'asc' | 'desc' | null;
import type { PoolWithRelations, Platform, Chain, Category } from "@shared/schema";

// CategorySelector component
function CategorySelector({ 
  poolId, 
  categories, 
  onCategoryChange 
}: { 
  poolId: string; 
  categories: Category[]; 
  onCategoryChange: (poolId: string, categoryIds: string[]) => void;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch current pool categories
  const { data: poolCategories = [] } = useQuery<Category[]>({
    queryKey: [`/api/pools/${poolId}/categories`],
    staleTime: 30000,
  });

  // Update selected categories when data loads
  useEffect(() => {
    setSelectedCategories(poolCategories.map(cat => cat.id));
  }, [poolCategories]);

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelection);
    onCategoryChange(poolId, newSelection);
  };

  const selectedCategoryNames = categories
    .filter(cat => selectedCategories.includes(cat.id))
    .map(cat => cat.displayName)
    .join(", ");

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        data-testid={`button-categories-${poolId}`}
      >
        {selectedCategoryNames || "No categories"}
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {categories.map(category => (
            <label
              key={category.id}
              className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
                className="mr-2"
              />
              <span className="text-sm">{category.displayName}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [visibilityFilters, setVisibilityFilters] = useState<string[]>([]); // visibility filters as checkboxes
  // Removed dataSourceFilters since we only have DeFi Llama now
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedPoolForModal, setSelectedPoolForModal] = useState<any>(null);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);

  const { user, logout, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch admin pools (includes hidden ones) with pagination
  const { data: poolsResponse, isLoading: poolsLoading, error } = useQuery<{
    pools: PoolWithRelations[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      showing: number;
    };
  }>({
    queryKey: ["/api/admin/pools", { 
      search, 
      platformIds: selectedPlatforms.join(','),
      chainIds: selectedChains.join(','),
      visibilities: visibilityFilters.join(','),

      limit: pageSize,
      offset: currentPage * pageSize
    }],
    staleTime: 5000,
    retry: 1,
  });

  const pools = poolsResponse?.pools || [];
  const pagination = poolsResponse?.pagination;

  // Calculate total APY after pools are defined
  const totalAPY = pools.reduce((sum, pool) => sum + parseFloat(pool.apy || '0'), 0);

  console.log("Admin pools query:", { 
    pools: pools?.length, 
    error, 
    isLoading: poolsLoading, 
    visibleCount: pools.filter(p => p.isVisible).length, 
    hiddenCount: pools.filter(p => !p.isVisible).length,
    total: pagination?.total,
    showing: pagination?.showing
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ["/api/chains"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });



  // No longer need data sources query since we only have DeFi Llama

  // Remove debug console log

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [search, selectedPlatforms, selectedChains, visibilityFilters]);

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
    onSuccess: (data, variables) => {
      console.log("Toggle success:", data, variables);

      // Update the specific pool in the cache immediately
      queryClient.setQueryData<{pools: PoolWithRelations[], pagination: any}>(
        ["/api/admin/pools", { 
          search, 
          platformIds: selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : undefined,
          chainIds: selectedChains.length > 0 ? selectedChains.join(',') : undefined 
        }],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pools: oldData.pools.map(pool => 
              pool.id === variables.poolId 
                ? { ...pool, isVisible: variables.isVisible }
                : pool
            )
          };
        }
      );

      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

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

  // Pool categories mutation
  const updatePoolCategoriesMutation = useMutation({
    mutationFn: async ({ poolId, categoryIds }: { poolId: string; categoryIds: string[] }) => {
      const response = await fetch(`/api/admin/pools/${poolId}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ categoryIds }),
      });
      if (!response.ok) throw new Error("Failed to update pool categories");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({
        title: "Success",
        description: "Pool categories updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pool categories",
        variant: "destructive",
      });
    },
  });

  const updatePoolCategories = (poolId: string, categoryIds: string[]) => {
    updatePoolCategoriesMutation.mutate({ poolId, categoryIds });
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
        aValue = a.platform?.displayName?.toLowerCase() || '';
        bValue = b.platform?.displayName?.toLowerCase() || '';
        break;
      case 'chain':
        aValue = a.chain?.displayName?.toLowerCase() || '';
        bValue = b.chain?.displayName?.toLowerCase() || '';
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
      // Removed datasource case since we only use DeFi Llama
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const visiblePools = sortedPools.filter(pool => pool.isVisible);
  const hiddenPools = sortedPools.filter(pool => !pool.isVisible);

  // Handler to open pool data modal
  const handleOpenPoolModal = (pool: any) => {
    setSelectedPoolForModal(pool);
    setIsPoolModalOpen(true);
  };

  const handleClosePoolModal = () => {
    setIsPoolModalOpen(false);
    setSelectedPoolForModal(null);
  };



  // Redirect if not authenticated
  if (!userLoading && !user) {
    navigate("/admin/login");
    return null;
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <PoolDataLoading message="Loading admin dashboard..." />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Database Total
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pagination?.total || pools.length}
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
                      Showing
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pagination?.showing || pools.length}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
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
                      Total APY
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {totalAPY.toFixed(2)}%
                    </p>
                  </div>
                  <Percent className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search pools..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="input-search"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedChains.length > 0 ? selectedChains.join(',') : 'all'} onValueChange={(value) => setSelectedChains(value === 'all' ? [] : value.split(','))}>
                    <SelectTrigger className="w-40" data-testid="select-chain">
                      <SelectValue placeholder="All Chains" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chains</SelectItem>
                      {chains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id}>
                          {chain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : 'all'} onValueChange={(value) => setSelectedPlatforms(value === 'all' ? [] : value.split(','))}>
                    <SelectTrigger className="w-40" data-testid="select-platform">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={visibilityFilters.length > 0 ? visibilityFilters.join(',') : 'all'} onValueChange={(value) => setVisibilityFilters(value === 'all' ? [] : value.split(','))}>
                    <SelectTrigger className="w-40" data-testid="select-visibility">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Visible</SelectItem>
                      <SelectItem value="false">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Pool Management</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                  <Button size="sm">
                    Add Pool
                  </Button>
                </div>
              </div>
              {poolsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <SyncAnimation />
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64 text-red-500">
                  Error loading pools: {error.message}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <button className="flex items-center" onClick={() => handleSort('platform')}>
                              Platform {getSortIcon('platform')}
                            </button>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <button className="flex items-center" onClick={() => handleSort('chain')}>
                              Chain {getSortIcon('chain')}
                            </button>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Pool Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Token Pair
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <button className="flex items-center ml-auto" onClick={() => handleSort('apy')}>
                              APY {getSortIcon('apy')}
                            </button>
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <button className="flex items-center ml-auto" onClick={() => handleSort('tvl')}>
                              TVL {getSortIcon('tvl')}
                            </button>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <button className="flex items-center" onClick={() => handleSort('risk')}>
                              Risk {getSortIcon('risk')}
                            </button>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Categories
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <button className="flex items-center" onClick={() => handleSort('visible')}>
                              Visible {getSortIcon('visible')}
                            </button>
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedPools.map((pool) => (
                          <tr key={pool.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              <EditableField
                                value={pool.platform?.displayName || ""}
                                onSave={(newValue) => updatePlatformName(pool.platformId, newValue)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {pool.chain?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              <button onClick={() => handleOpenPoolModal(pool)} className="hover:underline">
                                {pool.name}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <EditableField
                                value={pool.tokenPair || ""}
                                onSave={(newValue) => updateTokenPair(pool.id, newValue)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                              {formatNumber(parseFloat(pool.apy || '0'))}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                              <TokenDisplay amount={formatCurrency(parseFloat(pool.tvl || '0'))} />
                            </td>
                            <td className="px-6 py-4 whitespace-normal text-sm">
                              <RiskBadge level={pool.riskLevel} />
                            </td>
                            <td className="px-6 py-4 whitespace-normal text-sm">
                              <CategorySelector 
                                poolId={pool.id} 
                                categories={categories} 
                                onCategoryChange={updatePoolCategories}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Switch
                                checked={pool.isVisible}
                                onCheckedChange={(checked) => toggleVisibilityMutation.mutate({ poolId: pool.id, isVisible: checked })}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <Button size="sm" variant="ghost" onClick={() => handleOpenPoolModal(pool)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* Add other action buttons here if needed */}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.total > pageSize && (
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {pagination.showing} of {pagination.total} pools
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                          disabled={currentPage === 0}
                          variant="outline"
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!pagination.hasMore}
                          variant="outline"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}