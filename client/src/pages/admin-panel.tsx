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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Settings, DollarSign, Eye, EyeOff } from "lucide-react";
import AdminHeader from "@/components/admin-header";

interface Pool {
  id: string;
  tokenPair: string;
  showUsdInFlow: boolean;
  isVisible: boolean;
  platform: {
    displayName: string;
  };
  chain: {
    displayName: string;
  };
}

export default function AdminPanel() {
  const { toast } = useToast();
  
  const { data: pools, isLoading } = useQuery<Pool[]>({
    queryKey: ["/api/admin/pools"]
  });

  const updatePoolMutation = useMutation({
    mutationFn: async ({ poolId, updates }: { poolId: string; updates: Partial<Pool> }) => {
      await apiRequest("PATCH", `/api/admin/pools/${poolId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      toast({
        title: "Success",
        description: "Pool settings updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pool settings",
        variant: "destructive",
      });
    },
  });

  const handleUsdDisplayToggle = (poolId: string, showUsdInFlow: boolean) => {
    updatePoolMutation.mutate({
      poolId,
      updates: { showUsdInFlow }
    });
  };

  const handleVisibilityToggle = (poolId: string, isVisible: boolean) => {
    updatePoolMutation.mutate({
      poolId,
      updates: { isVisible }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Settings className="w-8 h-8 mr-3 text-blue-600" />
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage pool settings and visibility
            </p>
          </div>
        </div>
      </div>

      {/* Pool Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            Pool USD Display Settings
          </CardTitle>
          <CardDescription>
            Control which pools show USD amounts in token flow analysis. 
            Recommended: Enable for non-stablecoin pools, disable for stablecoins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pools && pools.length > 0 ? (
            <div className="space-y-4">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50"
                  data-testid={`pool-settings-${pool.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {pool.tokenPair}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {pool.platform.displayName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {pool.chain.displayName}
                      </Badge>
                      <Badge 
                        variant={pool.isVisible ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {pool.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pool.showUsdInFlow 
                        ? "USD amounts are displayed in token flow analysis" 
                        : "USD amounts are hidden in token flow analysis"}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* USD Display Toggle */}
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor={`usd-display-${pool.id}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Show USD
                      </label>
                      <Switch
                        id={`usd-display-${pool.id}`}
                        checked={pool.showUsdInFlow}
                        onCheckedChange={(checked) => handleUsdDisplayToggle(pool.id, checked)}
                        disabled={updatePoolMutation.isPending}
                        data-testid={`switch-usd-${pool.id}`}
                      />
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-2">
                      <label 
                        htmlFor={`visibility-${pool.id}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Visible
                      </label>
                      <Switch
                        id={`visibility-${pool.id}`}
                        checked={pool.isVisible}
                        onCheckedChange={(checked) => handleVisibilityToggle(pool.id, checked)}
                        disabled={updatePoolMutation.isPending}
                        data-testid={`switch-visibility-${pool.id}`}
                      />
                      {pool.isVisible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No pools found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Policy */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Current USD Display Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Recommended Settings:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Non-stablecoin pools (ETH, BTC, etc.):</strong> Enable USD display for meaningful conversion</li>
              <li>• <strong>Stablecoin pools (USDC, USDT, etc.):</strong> Disable USD display to avoid redundancy</li>
              <li>• <strong>Liquid staking tokens (stETH, rETH, etc.):</strong> Enable USD display for portfolio tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}