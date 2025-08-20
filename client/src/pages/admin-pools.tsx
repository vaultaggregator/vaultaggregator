import { useState } from "react";
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Settings, Database, Trash2, Edit, Eye, EyeOff, PlayCircle, PauseCircle, RotateCcw, Trash } from "lucide-react";
import AdminHeader from "@/components/admin-header";

interface Platform {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

interface Chain {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  displayName: string;
  parentId?: string;
  isActive: boolean;
}

interface TokenInfo {
  id: string;
  address: string;
  symbol: string;
  name: string;
}

interface Pool {
  id: string;
  platformId: string;
  chainId: string;
  tokenPair: string;
  apy?: string;
  tvl?: string;
  riskLevel: string;
  poolAddress?: string;
  defiLlamaId?: string;
  project?: string;
  tokenInfoId?: string;
  showUsdInFlow: boolean;
  isVisible: boolean;
  isActive: boolean;
  deletedAt?: string;
  deletedBy?: string;
  permanentDeleteAt?: string;
  lastUpdated: string;
  createdAt: string;
  platform: Platform;
  chain: Chain;
  categories?: Category[];
}

interface CreatePoolForm {
  platformId: string;
  chainId: string;
  poolAddress: string;
  showUsdInFlow: boolean;
  isVisible: boolean;
  isActive: boolean;
  categories: string[];
}

export default function AdminPools() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPool, setEditingPool] = useState<string | null>(null);
  const [editingPoolCategories, setEditingPoolCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "deactivated" | "trash">("active");
  const [formData, setFormData] = useState<CreatePoolForm>({
    platformId: "",
    chainId: "",
    poolAddress: "",
    showUsdInFlow: false,
    isVisible: true,
    isActive: true,
    categories: []
  });

  const [contractInfo, setContractInfo] = useState<{
    tokenPair?: string;
    symbol?: string;
    name?: string;
    isLoading: boolean;
    error?: string;
  }>({
    isLoading: false
  });

  // Fetch pools
  const { data: pools = [], isLoading, refetch } = useQuery<Pool[]>({
    queryKey: ["/api/admin/pools/all"],
  });

  // Fetch trashed pools
  const { data: trashedPools = [], isLoading: isLoadingTrash, refetch: refetchTrash } = useQuery<Pool[]>({
    queryKey: ["/api/admin/trash"],
  });

  // Fetch platforms
  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/admin/platforms"],
  });

  // Fetch chains
  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ["/api/admin/chains"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });

  // Fetch token info
  const { data: tokenInfos = [] } = useQuery<TokenInfo[]>({
    queryKey: ["/api/admin/token-info"],
  });

  // Fetch existing categories for editing pool
  const { data: existingPoolCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/pools", editingPool, "categories"],
    enabled: !!editingPool,
  });

  // Update editing pool categories when data loads
  React.useEffect(() => {
    if (editingPool && existingPoolCategories) {
      setEditingPoolCategories(existingPoolCategories.map(cat => cat.id));
    } else {
      setEditingPoolCategories([]);
    }
  }, [editingPool, existingPoolCategories]);

  // Automatic contract lookup function
  const lookupContract = async (address: string, platformId: string, chainId?: string) => {
    if (!address || !platformId) return;
    
    setContractInfo({ isLoading: true });
    try {
      const response = await fetch(`/api/admin/pools/lookup-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address, platformId, chainId }),
      });
      
      if (response.ok) {
        const contractData = await response.json();
        setContractInfo({ 
          tokenPair: contractData.tokenPair || contractData.symbol,
          symbol: contractData.symbol,
          name: contractData.name,
          isLoading: false 
        });
      } else {
        setContractInfo({ 
          isLoading: false, 
          error: "Contract not found or invalid address" 
        });
      }
    } catch (error) {
      setContractInfo({ 
        isLoading: false, 
        error: "Failed to lookup contract information" 
      });
    }
  };

  const createPoolMutation = useMutation({
    mutationFn: async (data: CreatePoolForm) => {
      const poolData = {
        platformId: data.platformId,
        chainId: data.chainId,
        tokenPair: contractInfo.tokenPair || contractInfo.symbol || 'Unknown',
        poolAddress: data.poolAddress || null,
        showUsdInFlow: data.showUsdInFlow,
        isVisible: data.isVisible,
        isActive: data.isActive,
        categories: data.categories
      };
      
      const response = await fetch("/api/admin/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(poolData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        
        // Handle duplicate pool error specifically
        if (response.status === 409 && errorData.error === "DUPLICATE_POOL") {
          throw new Error(errorData.message || "This pool already exists");
        }
        
        throw new Error(errorData.message || "Failed to create pool");
      }
      return response.json();
    },
    onSuccess: async (newPool) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      setShowCreateForm(false);
      setFormData({
        platformId: "",
        chainId: "",
        poolAddress: "",
        showUsdInFlow: false,
        isVisible: true,
        isActive: true,
        categories: []
      });
      setContractInfo({ isLoading: false });
      
      // Immediately trigger data collection for the new pool
      try {
        const scrapeResponse = await fetch(`/api/scrape/pool/${newPool.id}`, {
          method: "POST",
          credentials: "include",
        });
        
        if (scrapeResponse.ok) {
          toast({
            title: "Pool Created & Data Collection Started",
            description: "Pool created successfully. Collecting APY, TVL, holder data, and contract information...",
          });
          
          // Refresh data after scraping (wait longer for holder data)
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
          }, 5000); // Wait 5 seconds for all data collection
        } else {
          toast({
            title: "Pool Created",
            description: "Pool created successfully. Data collection will start on next scheduled run.",
          });
        }
      } catch (error) {
        toast({
          title: "Pool Created",
          description: "Pool created successfully. Data collection will start automatically.",
        });
      }
    },
    onError: (error: any) => {
      // Show specific error message for duplicates
      const errorMessage = error.message || "Failed to create pool";
      const isConflict = errorMessage.includes("already exists");
      
      toast({
        title: isConflict ? "Pool Already Exists" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updatePoolMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Pool> }) => {
      const response = await fetch(`/api/admin/pools/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update pool");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      setEditingPool(null);
      toast({
        title: "Success",
        description: "Pool updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pool",
        variant: "destructive",
      });
    },
  });

  const deletePoolMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting pool with ID:", id);
      const response = await fetch(`/api/admin/pools/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      console.log("Delete response status:", response.status);
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Delete error response:", errorData);
        throw new Error(`Failed to delete pool: ${response.status} ${errorData}`);
      }
      return response.json();
    },
    onSuccess: () => {
      console.log("Pool deleted successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({
        title: "Success",
        description: "Pool moved to trash successfully",
      });
    },
    onError: (error: any) => {
      console.error("Delete pool error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete pool",
        variant: "destructive",
      });
    },
  });

  const restorePoolMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/trash/${id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to restore pool");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trash"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({
        title: "Success",
        description: "Pool restored successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore pool",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/trash/${id}/permanent`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to permanently delete pool");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trash"] });
      toast({
        title: "Success",
        description: "Pool permanently deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to permanently delete pool",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platformId || !formData.chainId || !formData.poolAddress) {
      toast({
        title: "Validation Error",
        description: "Platform, Chain, and Pool Address are required.",
        variant: "destructive",
      });
      return;
    }

    if (!contractInfo.tokenPair) {
      toast({
        title: "Contract Detection Required",
        description: "Please wait for contract information to be detected, or check that the pool address is valid.",
        variant: "destructive",
      });
      return;
    }

    // Submit the form data - the mutation will handle adding contract info
    createPoolMutation.mutate(formData);
  };

  const handleQuickToggle = (poolId: string, field: 'isVisible' | 'isActive' | 'showUsdInFlow', value: boolean) => {
    updatePoolMutation.mutate({
      id: poolId,
      data: { [field]: value }
    });
  };

  const formatValue = (value: string | undefined) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatApy = (value: string | undefined) => {
    if (!value) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100';
      case 'medium': return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100';
      case 'high': return 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100';
    }
  };

  // Filter pools by active status
  const activePools = pools.filter(pool => pool.isActive);
  const deactivatedPools = pools.filter(pool => !pool.isActive);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin-dashboard">
              <Button variant="outline" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Database className="w-8 h-8 mr-3 text-blue-600" />
                Pool Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create, edit, and manage yield pools
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-create-pool"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Pool
          </Button>
        </div>

        {/* Edit Pool Form */}
        {editingPool && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Pool</CardTitle>
              <CardDescription>
                Update pool information and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const pool = pools.find(p => p.id === editingPool);
                if (!pool) return null;
                
                return (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      tokenPair: pool.tokenPair, // Keep existing tokenPair, don't allow editing
                      platformId: formData.get('platformId') as string,
                      chainId: formData.get('chainId') as string,
                      poolAddress: formData.get('poolAddress') as string || null,
                      showUsdInFlow: formData.get('showUsdInFlow') === 'on',
                      isVisible: formData.get('isVisible') === 'on',
                      isActive: formData.get('isActive') === 'on',
                      categories: editingPoolCategories,
                    };
                    updatePoolMutation.mutate({ id: editingPool, data });
                  }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                        
                        <div>
                          <Label htmlFor="edit-platform" className="text-sm font-medium">Platform *</Label>
                          <Select name="platformId" defaultValue={pool.platformId} required>
                            <SelectTrigger data-testid="edit-select-platform">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {platforms.filter(p => p.isActive).map((platform) => (
                                <SelectItem key={platform.id} value={platform.id}>
                                  {platform.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="edit-chain" className="text-sm font-medium">Network *</Label>
                          <Select name="chainId" defaultValue={pool.chainId} required>
                            <SelectTrigger data-testid="edit-select-chain">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {chains.filter(c => c.isActive).map((chain) => (
                                <SelectItem key={chain.id} value={chain.id}>
                                  {chain.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Token Pair (Auto-detected)</Label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-md">
                            <p className="text-sm font-medium">{pool.tokenPair}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              This value is automatically detected from the contract
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Financial Data */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Pool Details</h3>
                        
                        <div>
                          <Label htmlFor="edit-poolAddress" className="text-sm font-medium">Pool Address</Label>
                          <Input
                            name="poolAddress"
                            defaultValue={pool.poolAddress || ''}
                            placeholder="0x..."
                            data-testid="edit-input-pool-address"
                          />
                        </div>

                        {/* DeFiLlama ID field removed - automatic lookup handles this */}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="text-lg font-semibold">Categories & Subcategories</h3>
                      
                      <div className="space-y-4">
                        {/* Main Categories */}
                        <div>
                          <Label className="text-sm font-medium">Main Categories</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {categories.filter(cat => !cat.parentId && cat.isActive).map((category) => (
                              <div key={category.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`edit-category-${category.id}`}
                                  checked={editingPoolCategories.includes(category.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingPoolCategories(prev => [...prev, category.id]);
                                    } else {
                                      setEditingPoolCategories(prev => prev.filter(id => id !== category.id));
                                    }
                                  }}
                                  className="rounded"
                                  data-testid={`edit-checkbox-category-${category.name}`}
                                />
                                <Label htmlFor={`edit-category-${category.id}`} className="text-sm">
                                  {category.displayName}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Subcategories */}
                        {editingPoolCategories.some(catId => categories.filter(cat => cat.parentId === catId && cat.isActive).length > 0) && (
                          <div>
                            <Label className="text-sm font-medium">Subcategories</Label>
                            <div className="space-y-3 mt-2">
                              {editingPoolCategories.map(selectedCategoryId => {
                                const subcategories = categories.filter(cat => cat.parentId === selectedCategoryId && cat.isActive);
                                const parentCategory = categories.find(cat => cat.id === selectedCategoryId);
                                
                                if (subcategories.length === 0) return null;
                                
                                return (
                                  <div key={selectedCategoryId} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                      {parentCategory?.displayName} Subcategories
                                    </Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {subcategories.map((subcategory) => (
                                        <div key={subcategory.id} className="flex items-center space-x-2">
                                          <input
                                            type="checkbox"
                                            id={`edit-subcategory-${subcategory.id}`}
                                            checked={editingPoolCategories.includes(subcategory.id)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setEditingPoolCategories(prev => [...prev, subcategory.id]);
                                              } else {
                                                setEditingPoolCategories(prev => prev.filter(id => id !== subcategory.id));
                                              }
                                            }}
                                            className="rounded"
                                            data-testid={`edit-checkbox-subcategory-${subcategory.name}`}
                                          />
                                          <Label htmlFor={`edit-subcategory-${subcategory.id}`} className="text-sm">
                                            {subcategory.displayName}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Selected Categories Summary */}
                        {editingPoolCategories.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Selected Categories ({editingPoolCategories.length})</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editingPoolCategories.map(categoryId => {
                                const category = categories.find(cat => cat.id === categoryId);
                                if (!category) return null;
                                
                                return (
                                  <Badge 
                                    key={categoryId} 
                                    variant="secondary" 
                                    className="flex items-center gap-1"
                                  >
                                    {category.displayName}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPoolCategories(prev => prev.filter(id => id !== categoryId));
                                      }}
                                      className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                                      data-testid={`edit-remove-category-${category.name}`}
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="text-lg font-semibold">Settings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="showUsdInFlow"
                            defaultChecked={pool.showUsdInFlow}
                            className="hidden"
                          />
                          <Switch
                            defaultChecked={pool.showUsdInFlow}
                            onCheckedChange={(checked) => {
                              const checkbox = document.querySelector('input[name="showUsdInFlow"]') as HTMLInputElement;
                              if (checkbox) checkbox.checked = checked;
                            }}
                            data-testid="edit-switch-show-usd"
                          />
                          <Label htmlFor="edit-showUsdInFlow" className="text-sm">Show USD in Flow</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="isVisible"
                            defaultChecked={pool.isVisible}
                            className="hidden"
                          />
                          <Switch
                            defaultChecked={pool.isVisible}
                            onCheckedChange={(checked) => {
                              const checkbox = document.querySelector('input[name="isVisible"]') as HTMLInputElement;
                              if (checkbox) checkbox.checked = checked;
                            }}
                            data-testid="edit-switch-visible"
                          />
                          <Label htmlFor="edit-isVisible" className="text-sm">Visible to Users</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="isActive"
                            defaultChecked={pool.isActive}
                            className="hidden"
                          />
                          <Switch
                            defaultChecked={pool.isActive}
                            onCheckedChange={(checked) => {
                              const checkbox = document.querySelector('input[name="isActive"]') as HTMLInputElement;
                              if (checkbox) checkbox.checked = checked;
                            }}
                            data-testid="edit-switch-active"
                          />
                          <Label htmlFor="edit-isActive" className="text-sm">Active</Label>
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 pt-6 border-t">
                      <Button 
                        type="submit" 
                        disabled={updatePoolMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-update-pool"
                      >
                        {updatePoolMutation.isPending ? "Updating..." : "Update Pool"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditingPool(null)}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Create Pool Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Pool</CardTitle>
              <CardDescription>
                Add a new yield opportunity pool to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <div>
                      <Label htmlFor="platform" className="text-sm font-medium">Platform *</Label>
                      <Select 
                        value={formData.platformId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, platformId: value }))}
                        required
                      >
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.filter(p => p.isActive).map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              {platform.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="chain" className="text-sm font-medium">Network *</Label>
                      <Select 
                        value={formData.chainId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, chainId: value }))}
                        required
                      >
                        <SelectTrigger data-testid="select-chain">
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {chains.filter(c => c.isActive).map((chain) => (
                            <SelectItem key={chain.id} value={chain.id}>
                              {chain.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Auto-populated Token Pair */}
                    {contractInfo.tokenPair && (
                      <div>
                        <Label className="text-sm font-medium">Auto-Detected Token Pair</Label>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            {contractInfo.tokenPair}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                            {contractInfo.name ? `Full Name: ${contractInfo.name}` : ''}
                          </p>
                        </div>
                      </div>
                    )}


                  </div>

                  {/* Financial Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Financial Data</h3>
                    


                    <div>
                      <Label htmlFor="poolAddress" className="text-sm font-medium">Pool Address *</Label>
                      <Input
                        id="poolAddress"
                        value={formData.poolAddress}
                        onChange={(e) => {
                          const address = e.target.value;
                          setFormData(prev => ({ ...prev, poolAddress: address }));
                          
                          // Auto-lookup contract when address is entered and platform is selected
                          if (address.length === 42 && address.startsWith('0x') && formData.platformId) {
                            console.log(`Attempting contract lookup for: ${address} on platform: ${formData.platformId}`);
                            lookupContract(address, formData.platformId, formData.chainId);
                          } else if (address.length < 42) {
                            setContractInfo({ isLoading: false });
                          }
                        }}
                        placeholder="0x... (will auto-lookup contract info)"
                        data-testid="input-pool-address"
                        required
                      />
                      {contractInfo.isLoading && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          🔍 Looking up contract information...
                        </p>
                      )}
                      {contractInfo.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          ⚠️ {contractInfo.error}
                        </p>
                      )}
                    </div>

                    {/* DeFiLlama ID field removed - automatic lookup handles this */}


                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Categories & Subcategories</h3>
                  
                  <div className="space-y-4">
                    {/* Main Categories */}
                    <div>
                      <Label className="text-sm font-medium">Main Categories</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {categories.filter(cat => !cat.parentId && cat.isActive).map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`category-${category.id}`}
                              checked={formData.categories.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    categories: [...prev.categories, category.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    categories: prev.categories.filter(id => id !== category.id)
                                  }));
                                }
                              }}
                              className="rounded"
                              data-testid={`checkbox-category-${category.name}`}
                            />
                            <Label htmlFor={`category-${category.id}`} className="text-sm">
                              {category.displayName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subcategories */}
                    {formData.categories.some(catId => categories.filter(cat => cat.parentId === catId && cat.isActive).length > 0) && (
                      <div>
                        <Label className="text-sm font-medium">Subcategories</Label>
                        <div className="space-y-3 mt-2">
                          {formData.categories.map(selectedCategoryId => {
                            const subcategories = categories.filter(cat => cat.parentId === selectedCategoryId && cat.isActive);
                            const parentCategory = categories.find(cat => cat.id === selectedCategoryId);
                            
                            if (subcategories.length === 0) return null;
                            
                            return (
                              <div key={selectedCategoryId} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                  {parentCategory?.displayName} Subcategories
                                </Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {subcategories.map((subcategory) => (
                                    <div key={subcategory.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`subcategory-${subcategory.id}`}
                                        checked={formData.categories.includes(subcategory.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setFormData(prev => ({
                                              ...prev,
                                              categories: [...prev.categories, subcategory.id]
                                            }));
                                          } else {
                                            setFormData(prev => ({
                                              ...prev,
                                              categories: prev.categories.filter(id => id !== subcategory.id)
                                            }));
                                          }
                                        }}
                                        className="rounded"
                                        data-testid={`checkbox-subcategory-${subcategory.name}`}
                                      />
                                      <Label htmlFor={`subcategory-${subcategory.id}`} className="text-sm">
                                        {subcategory.displayName}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Categories Summary */}
                    {formData.categories.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Selected Categories ({formData.categories.length})</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.categories.map(categoryId => {
                            const category = categories.find(cat => cat.id === categoryId);
                            if (!category) return null;
                            
                            return (
                              <Badge 
                                key={categoryId} 
                                variant="secondary" 
                                className="flex items-center gap-1"
                              >
                                {category.displayName}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      categories: prev.categories.filter(id => id !== categoryId)
                                    }));
                                  }}
                                  className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5"
                                  data-testid={`remove-category-${category.name}`}
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold">Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showUsdInFlow"
                        checked={formData.showUsdInFlow}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showUsdInFlow: checked }))}
                        data-testid="switch-show-usd"
                      />
                      <Label htmlFor="showUsdInFlow" className="text-sm">Show USD in Flow</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isVisible"
                        checked={formData.isVisible}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVisible: checked }))}
                        data-testid="switch-visible"
                      />
                      <Label htmlFor="isVisible" className="text-sm">Visible to Users</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-active"
                      />
                      <Label htmlFor="isActive" className="text-sm">Active</Label>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={createPoolMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-submit-pool"
                  >
                    {createPoolMutation.isPending ? "Creating..." : "Create Pool"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                    data-testid="button-cancel-pool"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pools List with Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Pool Management ({pools.length} total)
              </span>
            </CardTitle>
            <CardDescription>
              Manage existing pools and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Loading pools...</span>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "deactivated" | "trash")} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Active Pools ({activePools.length})
                  </TabsTrigger>
                  <TabsTrigger value="deactivated" className="flex items-center gap-2">
                    <PauseCircle className="w-4 h-4" />
                    Deactivated Pools ({deactivatedPools.length})
                  </TabsTrigger>
                  <TabsTrigger value="trash" className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Trash Bin ({trashedPools.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="mt-6">
                  {activePools.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No active pools found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activePools.map((pool) => (
                        <div key={pool.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                {/* Platform logo */}
                                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {pool.platform.logoUrl ? (
                                    <img 
                                      src={pool.platform.logoUrl} 
                                      alt={pool.platform.displayName}
                                      className="w-full h-full object-cover rounded-full"
                                      data-testid={`admin-logo-platform-${pool.platform.name.toLowerCase()}`}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                      {pool.platform.displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-lg">{pool.tokenPair}</h3>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  ACTIVE
                                </Badge>
                                <Badge className={getRiskColor(pool.riskLevel)}>
                                  {pool.riskLevel.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {pool.platform.displayName} • {pool.chain.displayName}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">APY:</span>
                                  <span className="ml-2 font-medium">{formatApy(pool.apy)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">TVL:</span>
                                  <span className="ml-2 font-medium">{formatValue(pool.tvl)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Pool Address:</span>
                                  <span className="ml-2 font-mono text-xs">{pool.poolAddress || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Updated:</span>
                                  <span className="ml-2">{new Date(pool.lastUpdated).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Visible:</span>
                                  <Switch 
                                    checked={pool.isVisible}
                                    onCheckedChange={(checked) => handleQuickToggle(pool.id, 'isVisible', checked)}
                                    disabled={updatePoolMutation.isPending}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">USD Flow:</span>
                                  <Switch 
                                    checked={pool.showUsdInFlow}
                                    onCheckedChange={(checked) => handleQuickToggle(pool.id, 'showUsdInFlow', checked)}
                                    disabled={updatePoolMutation.isPending}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickToggle(pool.id, 'isActive', false)}
                                disabled={updatePoolMutation.isPending}
                                className="text-orange-600 hover:text-orange-700"
                                data-testid={`button-deactivate-${pool.tokenPair}`}
                              >
                                <PauseCircle className="w-4 h-4" />
                                Deactivate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPool(pool.id)}
                                data-testid={`button-edit-${pool.tokenPair}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log("Delete button clicked for active pool:", pool.id, pool.tokenPair);
                                  if (window.confirm(`Are you sure you want to move "${pool.tokenPair}" to trash?`)) {
                                    deletePoolMutation.mutate(pool.id);
                                  }
                                }}
                                disabled={deletePoolMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-${pool.tokenPair}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="deactivated" className="mt-6">
                  {deactivatedPools.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No deactivated pools found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deactivatedPools.map((pool) => (
                        <div key={pool.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 opacity-75">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                {/* Platform logo */}
                                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 opacity-60">
                                  {pool.platform.logoUrl ? (
                                    <img 
                                      src={pool.platform.logoUrl} 
                                      alt={pool.platform.displayName}
                                      className="w-full h-full object-cover rounded-full"
                                      data-testid={`admin-logo-platform-${pool.platform.name.toLowerCase()}`}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                      {pool.platform.displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-lg text-gray-600 dark:text-gray-400">{pool.tokenPair}</h3>
                                <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  DEACTIVATED
                                </Badge>
                                <Badge className={getRiskColor(pool.riskLevel)}>
                                  {pool.riskLevel.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {pool.platform.displayName} • {pool.chain.displayName}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">APY:</span>
                                  <span className="ml-2 font-medium">{formatApy(pool.apy)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">TVL:</span>
                                  <span className="ml-2 font-medium">{formatValue(pool.tvl)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Pool Address:</span>
                                  <span className="ml-2 font-mono text-xs">{pool.poolAddress || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Updated:</span>
                                  <span className="ml-2">{new Date(pool.lastUpdated).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Visible:</span>
                                  <Switch 
                                    checked={pool.isVisible}
                                    onCheckedChange={(checked) => handleQuickToggle(pool.id, 'isVisible', checked)}
                                    disabled={updatePoolMutation.isPending}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">USD Flow:</span>
                                  <Switch 
                                    checked={pool.showUsdInFlow}
                                    onCheckedChange={(checked) => handleQuickToggle(pool.id, 'showUsdInFlow', checked)}
                                    disabled={updatePoolMutation.isPending}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickToggle(pool.id, 'isActive', true)}
                                disabled={updatePoolMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                                data-testid={`button-reactivate-${pool.tokenPair}`}
                              >
                                <PlayCircle className="w-4 h-4" />
                                Reactivate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPool(pool.id)}
                                data-testid={`button-edit-${pool.tokenPair}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log("Delete button clicked for deactivated pool:", pool.id, pool.tokenPair);
                                  if (window.confirm(`Are you sure you want to move "${pool.tokenPair}" to trash?`)) {
                                    deletePoolMutation.mutate(pool.id);
                                  }
                                }}
                                disabled={deletePoolMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-${pool.tokenPair}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="trash" className="mt-6">
                  {isLoadingTrash ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Loading trashed pools...</span>
                    </div>
                  ) : trashedPools.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No pools in trash</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trashedPools.map((pool) => (
                        <div key={pool.id} className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/10 opacity-75">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                {/* Platform logo */}
                                <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 opacity-50">
                                  {pool.platform.logoUrl ? (
                                    <img 
                                      src={pool.platform.logoUrl} 
                                      alt={pool.platform.displayName}
                                      className="w-full h-full object-cover rounded-full"
                                      data-testid={`admin-logo-platform-${pool.platform.name.toLowerCase()}`}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                                      {pool.platform.displayName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">{pool.tokenPair}</h3>
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  DELETED
                                </Badge>
                                <Badge className={getRiskColor(pool.riskLevel)}>
                                  {pool.riskLevel.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {pool.platform.displayName} • {pool.chain.displayName}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">APY:</span>
                                  <span className="ml-2 font-medium">{formatApy(pool.apy)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">TVL:</span>
                                  <span className="ml-2 font-medium">{formatValue(pool.tvl)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Deleted:</span>
                                  <span className="ml-2">{pool.deletedAt ? new Date(pool.deletedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Auto-delete:</span>
                                  <span className="ml-2">{pool.permanentDeleteAt ? new Date(pool.permanentDeleteAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                              </div>

                              <div className="mt-3 text-sm">
                                <span className="text-gray-500">Deleted by:</span>
                                <span className="ml-2">{pool.deletedBy || 'Unknown'}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => restorePoolMutation.mutate(pool.id)}
                                disabled={restorePoolMutation.isPending}
                                className="text-green-600 hover:text-green-700"
                                data-testid={`button-restore-${pool.tokenPair}`}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Restore
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('This will permanently delete the pool. This action cannot be undone. Continue?')) {
                                    permanentDeleteMutation.mutate(pool.id);
                                  }
                                }}
                                disabled={permanentDeleteMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-permanent-delete-${pool.tokenPair}`}
                              >
                                <Trash className="w-4 h-4 mr-1" />
                                Delete Forever
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}