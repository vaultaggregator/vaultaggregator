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
import { Search, LogOut, Eye, EyeOff, Edit3, Check, X, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Settings, Merge, Trash2, Sparkles } from "lucide-react";
import { TokenDisplay } from "@/components/TokenDisplay";
import { PoolDataLoading, SyncAnimation, FloatingActionLoading } from "@/components/loading-animations";
import { YieldSyncLoader } from "@/components/crypto-loader";
import { PoolScanner, GlowingButton } from "@/components/enhanced-loading";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PoolDataModal from "@/components/pool-data-modal";
import PoolConsolidationModal from "@/components/pool-consolidation-modal";
import { generatePlatformVisitUrl } from "@/utils/platformUrls";

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
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [selectedPoolsForConsolidation, setSelectedPoolsForConsolidation] = useState<string[]>([]);
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
  const [showConsolidatedPools, setShowConsolidatedPools] = useState(false);
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

  // Fetch consolidated pools
  const { data: consolidatedPools = [], isLoading: consolidatedPoolsLoading } = useQuery<PoolWithRelations[]>({
    queryKey: ["/api/admin/pools/consolidated"],
    enabled: showConsolidatedPools,
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

  // Pool consolidation handlers
  const handlePoolSelectionToggle = (poolId: string) => {
    setSelectedPoolsForConsolidation(prev => 
      prev.includes(poolId) 
        ? prev.filter(id => id !== poolId)
        : [...prev, poolId]
    );
  };

  const handleOpenConsolidationModal = () => {
    if (selectedPoolsForConsolidation.length < 2) {
      toast({
        title: "Error",
        description: "Please select at least 2 pools to consolidate",
        variant: "destructive",
      });
      return;
    }
    setIsConsolidationModalOpen(true);
  };

  const handleCloseConsolidationModal = () => {
    setIsConsolidationModalOpen(false);
    setSelectedPoolsForConsolidation([]);
  };

  const selectedPoolsData = pools.filter(pool => selectedPoolsForConsolidation.includes(pool.id));

  // Consolidate pools mutation
  const consolidatePoolsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/pools/consolidate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create consolidated pool");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Consolidated pool created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      setIsConsolidationModalOpen(false);
      setSelectedPoolsForConsolidation([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create consolidated pool",
        variant: "destructive",
      });
    },
  });

  // Reset consolidated pools mutation
  const resetConsolidatedPoolsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/pools/consolidated", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reset consolidated pools");
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Reset ${data.deletedCount} consolidated pools successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset consolidated pools",
        variant: "destructive",
      });
    },
  });

  // Delete individual consolidated pool mutation
  const deleteConsolidatedPoolMutation = useMutation({
    mutationFn: async (poolId: string) => {
      const response = await fetch(`/api/admin/pools/consolidated/${poolId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete consolidated pool");
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: "Consolidated pool deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/consolidated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete consolidated pool",
        variant: "destructive",
      });
    },
  });

  const handleResetConsolidatedPools = () => {
    if (confirm("Are you sure you want to delete all consolidated pools? This action cannot be undone.")) {
      resetConsolidatedPoolsMutation.mutate();
    }
  };

  const handleDeleteConsolidatedPool = (poolId: string, tokenPair: string) => {
    if (confirm(`Are you sure you want to delete the consolidated pool "${tokenPair}"? This action cannot be undone.`)) {
      deleteConsolidatedPoolMutation.mutate(poolId);
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

  // Manual scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/scan-pools", { 
        method: "POST", 
        credentials: "include" 
      });
      if (!response.ok) throw new Error("Failed to scan pools");
      return await response.json();
    },
    onSuccess: (data: any) => {
      setIsScanning(false);
      setScanResults(data);
      toast({
        title: "Scan Complete",
        description: `Found ${data.newPools} new pools, ${data.missingPools} missing pools, ${data.duplicatesRemoved} duplicates removed`,
      });
    },
    onError: (error: any) => {
      setIsScanning(false);
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan for pools",
        variant: "destructive",
      });
    },
  });

  const handleScanPools = () => {
    setIsScanning(true);
    setScanResults(null);
    scanMutation.mutate();
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
                onClick={() => navigate("/admin-categories")} 
                variant="outline" 
                size="sm"
                data-testid="button-categories"
              >
                Categories
              </Button>
              <Button 
                onClick={() => navigate("/admin-api-keys")} 
                variant="outline" 
                size="sm"
                data-testid="button-api-keys"
              >
                API Keys
              </Button>
              <GlowingButton 
                onClick={handleScanPools}
                disabled={isScanning}
                variant="primary"
                isActive={isScanning}
                className="h-8 px-4 text-sm"
              >
                {isScanning ? "Scanning..." : "Scan Pools"}
              </GlowingButton>

              <Button 
                onClick={() => {
                  toast({
                    title: "Token Normalization",
                    description: "All token addresses are now using intelligent display formatting with one-click normalization available on each pool",
                  });
                }}
                variant="outline" 
                size="sm"
                data-testid="button-normalize-tokens"
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <Sparkles className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                Smart Tokens
              </Button>

              {selectedPoolsForConsolidation.length > 0 && (
                <Button 
                  onClick={handleOpenConsolidationModal}
                  variant="default" 
                  size="sm"
                  data-testid="button-consolidate-pools"
                >
                  <Merge className="h-4 w-4 mr-2" />
                  Consolidate ({selectedPoolsForConsolidation.length})
                </Button>
              )}

              <Button 
                onClick={() => setShowConsolidatedPools(!showConsolidatedPools)}
                variant="outline" 
                size="sm"
                data-testid="button-view-consolidated"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showConsolidatedPools ? "Hide Consolidated" : "View Consolidated"}
              </Button>

              <Button 
                onClick={handleResetConsolidatedPools}
                disabled={resetConsolidatedPoolsMutation.isPending}
                variant="destructive" 
                size="sm"
                data-testid="button-reset-consolidated"
                className={resetConsolidatedPoolsMutation.isPending ? "animate-pulse" : ""}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {resetConsolidatedPoolsMutation.isPending ? "Resetting..." : "Reset All"}
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

        {/* Enhanced Scan Animation */}
        <PoolScanner 
          isActive={isScanning}
          poolsFound={scanResults?.newPools || 0}
          totalScanned={scanResults?.totalScanned || 0}
          currentProtocol="DeFi Llama API"
          className="mb-6"
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Search */}
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
              
              {/* Filter Groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Platforms */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Platforms</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {platforms.map((platform) => (
                      <label key={platform.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPlatforms.includes(platform.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlatforms([...selectedPlatforms, platform.id]);
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          data-testid={`checkbox-platform-${platform.id}`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{platform.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Chains */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Chains</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {chains.map((chain) => (
                      <label key={chain.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChains.includes(chain.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChains([...selectedChains, chain.id]);
                            } else {
                              setSelectedChains(selectedChains.filter(id => id !== chain.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          data-testid={`checkbox-chain-${chain.id}`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{chain.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* No data sources filter needed since we only use DeFi Llama */}

                {/* Visibility */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Visibility</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibilityFilters.includes('visible')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibilityFilters([...visibilityFilters, 'visible']);
                          } else {
                            setVisibilityFilters(visibilityFilters.filter(vis => vis !== 'visible'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        data-testid="checkbox-visibility-visible"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Visible Pools</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibilityFilters.includes('hidden')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibilityFilters([...visibilityFilters, 'hidden']);
                          } else {
                            setVisibilityFilters(visibilityFilters.filter(vis => vis !== 'hidden'));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        data-testid="checkbox-visibility-hidden"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Hidden Pools</span>
                    </label>
                  </div>
                </div>
                
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consolidated Pools Section */}
        {showConsolidatedPools && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Merge className="h-5 w-5" />
                Consolidated Pools Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consolidatedPoolsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              ) : consolidatedPools.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No consolidated pools found
                </div>
              ) : (
                <div className="space-y-4">
                  {consolidatedPools.map((pool) => (
                    <div key={pool.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-lg">{pool.tokenPair}</h3>
                            <Badge variant="outline" className="text-xs">
                              {pool.platform.displayName}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {pool.chain.displayName}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">APY:</span> {pool.apy}%
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">TVL:</span> ${parseFloat(pool.tvl || "0").toLocaleString()}
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Risk:</span> {pool.riskLevel}
                            </div>
                          </div>
                          {(pool.rawData as any)?.underlyingTokens && Array.isArray((pool.rawData as any).underlyingTokens) && (pool.rawData as any).underlyingTokens.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-600 dark:text-gray-400 text-sm">Underlying Tokens:</span>
                              <div className="mt-1">
                                <TokenDisplay 
                                  addresses={(pool.rawData as any).underlyingTokens}
                                  maxDisplay={2}
                                  showNormalizeButton={true}
                                  size="sm"
                                />
                              </div>
                            </div>
                          )}
                          {(pool as any).notes && (pool as any).notes.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-600 dark:text-gray-400 text-sm">Notes:</span>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {(pool as any).notes.map((note: any) => (
                                  <div key={note.id} className="mb-1">
                                    {note.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => navigate(`/pool/${pool.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteConsolidatedPool(pool.id, pool.tokenPair)}
                            disabled={deleteConsolidatedPoolMutation.isPending}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                <TooltipProvider>
                  <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white w-12">
                        Select
                      </th>
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

                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Categories
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Actions
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
                        <td className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedPoolsForConsolidation.includes(pool.id)}
                            onChange={() => handlePoolSelectionToggle(pool.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            data-testid={`checkbox-select-${pool.id}`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <EditableField
                              value={pool.tokenPair}
                              onSave={(newValue) => updateTokenPair(pool.id, newValue)}
                              className="font-medium text-gray-900 dark:text-white"
                              data-testid={`edit-token-pair-${pool.id}`}
                            />

                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <EditableField
                            value={pool.platform?.displayName || 'Unknown Platform'}
                            onSave={(newValue) => updatePlatformName(pool.platformId, newValue)}
                            className="text-sm text-gray-600 dark:text-gray-400"
                            data-testid={`edit-platform-name-${pool.id}`}
                          />
                        </td>
                        <td className="py-3 px-2">
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: `${pool.chain?.color || '#000'}20`, color: pool.chain?.color || '#000' }}
                          >
                            {pool.chain?.displayName || 'Unknown Chain'}
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

                        <td className="py-3 px-2">
                          <CategorySelector
                            poolId={pool.id}
                            categories={categories}
                            onCategoryChange={updatePoolCategories}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenPoolModal(pool)}
                                    className="h-8 w-8 p-0"
                                    data-testid={`button-pool-settings-${pool.id}`}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Configure pool data display</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {(() => {
                              const linkData = generatePlatformVisitUrl(pool);
                              return linkData && (
                                <a
                                  href={linkData.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  data-testid={`link-external-${pool.id}`}
                                  title={linkData.label}
                                  onClick={(e) => {
                                    console.log('Visit Platform clicked:', linkData);
                                    // Let the browser handle the navigation
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              );
                            })()}
                          </div>
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
                </TooltipProvider>
              </div>
            )}
            
            {pagination && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-500">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, pagination.total)} of {pagination.total} pools
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {Math.ceil(pagination.total / pageSize)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasMore}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                  <div className="ml-4">
                    <select 
                      value={pageSize} 
                      onChange={(e) => setPageSize(parseInt(e.target.value))}
                      className="px-2 py-1 border rounded text-sm"
                      data-testid="select-page-size"
                    >
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pool Data Configuration Modal */}
      <PoolDataModal
        isOpen={isPoolModalOpen}
        onClose={handleClosePoolModal}
        poolId={selectedPoolForModal?.id || ''}
        poolData={selectedPoolForModal}
      />

      {/* Pool Consolidation Modal */}
      <PoolConsolidationModal
        isOpen={isConsolidationModalOpen}
        onClose={handleCloseConsolidationModal}
        pools={selectedPoolsData}
      />

      {/* Floating Action Loaders */}
      <FloatingActionLoading 
        message="Consolidating pools..."
        className={consolidatePoolsMutation.isPending ? "block" : "hidden"}
      />
      
      <FloatingActionLoading 
        message="Resetting consolidated pools..."
        className={resetConsolidatedPoolsMutation.isPending ? "block" : "hidden"}
      />
    </div>
  );
}