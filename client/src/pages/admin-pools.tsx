import { useState } from "react";
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
import { ArrowLeft, Plus, Settings, Database, Trash2, Edit, Eye, EyeOff, PlayCircle, PauseCircle } from "lucide-react";
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
  lastUpdated: string;
  createdAt: string;
  platform: Platform;
  chain: Chain;
  categories?: Category[];
}

interface CreatePoolForm {
  platformId: string;
  chainId: string;
  tokenPair: string;
  poolAddress: string;
  defiLlamaId: string;
  showUsdInFlow: boolean;
  isVisible: boolean;
  isActive: boolean;
  categories: string[];
}

export default function AdminPools() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPool, setEditingPool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "deactivated">("active");
  const [formData, setFormData] = useState<CreatePoolForm>({
    platformId: "",
    chainId: "",
    tokenPair: "",
    poolAddress: "",
    defiLlamaId: "",
    showUsdInFlow: false,
    isVisible: true,
    isActive: true,
    categories: []
  });

  // Fetch pools
  const { data: pools = [], isLoading, refetch } = useQuery<Pool[]>({
    queryKey: ["/api/admin/pools/all"],
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

  const createPoolMutation = useMutation({
    mutationFn: async (data: CreatePoolForm) => {
      const poolData = {
        platformId: data.platformId,
        chainId: data.chainId,
        tokenPair: data.tokenPair,

        poolAddress: data.poolAddress || null,
        defiLlamaId: data.defiLlamaId || null,
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
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      setShowCreateForm(false);
      setFormData({
        platformId: "",
        chainId: "",
        tokenPair: "",

        poolAddress: "",
        defiLlamaId: "",
        showUsdInFlow: false,
        isVisible: true,
        isActive: true,
        categories: []
      });
      toast({
        title: "Success",
        description: "Pool created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pool",
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
      const response = await fetch(`/api/admin/pools/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete pool");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({
        title: "Success",
        description: "Pool deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pool",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platformId || !formData.chainId || !formData.tokenPair) {
      toast({
        title: "Validation Error",
        description: "Platform, Chain, and Token Pair are required",
        variant: "destructive",
      });
      return;
    }

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
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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

                    <div>
                      <Label htmlFor="tokenPair" className="text-sm font-medium">Token Pair *</Label>
                      <Input
                        id="tokenPair"
                        value={formData.tokenPair}
                        onChange={(e) => setFormData(prev => ({ ...prev, tokenPair: e.target.value }))}
                        placeholder="e.g., STEAKUSDC, stETH"
                        data-testid="input-token-pair"
                        required
                      />
                    </div>


                  </div>

                  {/* Financial Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Financial Data</h3>
                    


                    <div>
                      <Label htmlFor="poolAddress" className="text-sm font-medium">Pool Address</Label>
                      <Input
                        id="poolAddress"
                        value={formData.poolAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, poolAddress: e.target.value }))}
                        placeholder="0x..."
                        data-testid="input-pool-address"
                      />
                    </div>

                    <div>
                      <Label htmlFor="defiLlamaId" className="text-sm font-medium">DeFiLlama ID</Label>
                      <Input
                        id="defiLlamaId"
                        value={formData.defiLlamaId}
                        onChange={(e) => setFormData(prev => ({ ...prev, defiLlamaId: e.target.value }))}
                        placeholder="Pool ID from DeFiLlama"
                        data-testid="input-defillama-id"
                      />
                    </div>


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
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "deactivated")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Active Pools ({activePools.length})
                  </TabsTrigger>
                  <TabsTrigger value="deactivated" className="flex items-center gap-2">
                    <PauseCircle className="w-4 h-4" />
                    Deactivated Pools ({deactivatedPools.length})
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
                                onClick={() => deletePoolMutation.mutate(pool.id)}
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
                                onClick={() => deletePoolMutation.mutate(pool.id)}
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
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}