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
import { Search, LogOut, Eye, EyeOff } from "lucide-react";
import type { PoolWithRelations, Platform, Chain } from "@shared/schema";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<string>("");
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch admin pools (includes hidden ones)
  const { data: pools = [], isLoading: poolsLoading } = useQuery<PoolWithRelations[]>({
    queryKey: ["/api/admin/pools", { search, platformId: selectedPlatform, chainId: selectedChain }],
    staleTime: 30000,
  });

  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ["/api/chains"],
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Pool visibility updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pool visibility",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const visiblePools = pools.filter(pool => pool.isVisible);
  const hiddenPools = pools.filter(pool => !pool.isVisible);

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
                  <SelectItem value="">All Platforms</SelectItem>
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
                  <SelectItem value="">All Chains</SelectItem>
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
              Toggle pool visibility to control what users see on the main site
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
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Platform
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Chain
                      </th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        APY
                      </th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        TVL
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Risk
                      </th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                        Visible
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pools.map((pool) => (
                      <tr 
                        key={pool.id} 
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        data-testid={`row-pool-${pool.id}`}
                      >
                        <td className="py-3 px-2">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {pool.tokenPair}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {pool.platform.displayName}
                          </span>
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
                          <Switch
                            checked={pool.isVisible}
                            onCheckedChange={(checked) => 
                              toggleVisibilityMutation.mutate({ 
                                poolId: pool.id, 
                                isVisible: checked 
                              })
                            }
                            disabled={toggleVisibilityMutation.isPending}
                            data-testid={`switch-visibility-${pool.id}`}
                          />
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