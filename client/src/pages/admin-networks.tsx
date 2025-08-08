import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Image } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { getChainIcon } from "@/components/chain-icons";
import type { Chain } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

export default function AdminNetworks() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Fetch chains
  const { data: chains = [], isLoading: chainsLoading } = useQuery<Chain[]>({
    queryKey: ["/api/chains"],
  });

  const updateChainMutation = useMutation({
    mutationFn: async ({ chainId, isActive }: { chainId: string; isActive: boolean }) => {
      return await apiRequest(`/api/admin/chains/${chainId}`, "PUT", { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chains"] });
      toast({
        title: "Success",
        description: "Network updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update network",
        variant: "destructive",
      });
    },
  });

  const uploadIconMutation = useMutation({
    mutationFn: async ({ chainId, iconUrl }: { chainId: string; iconUrl: string }) => {
      return await apiRequest(`/api/admin/chains/${chainId}/icon`, "PUT", { iconUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chains"] });
      toast({
        title: "Success",
        description: "Network icon uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload network icon",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async (chainId: string) => {
    const response: any = await apiRequest(`/api/admin/chains/${chainId}/icon/upload`, "POST");
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (chainId: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      uploadIconMutation.mutate({
        chainId,
        iconUrl: (uploadedFile as any).uploadURL as string,
      });
    }
  };

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
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin-dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Network Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage network settings and upload icons
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Networks Management */}
        <Card>
          <CardHeader>
            <CardTitle>Networks</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure network visibility and upload custom icons
            </p>
          </CardHeader>
          <CardContent>
            {chainsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chains.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No networks found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chains.map((chain) => (
                  <Card key={chain.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
{chain.iconUrl ? (
                          <img 
                            src={chain.iconUrl} 
                            alt={chain.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          (() => {
                            const ChainIcon = getChainIcon(chain.name);
                            return <ChainIcon size={32} className="flex-shrink-0" />;
                          })()
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {chain.displayName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {chain.name}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={chain.isActive}
                        onCheckedChange={(checked) => {
                          updateChainMutation.mutate({ 
                            chainId: chain.id, 
                            isActive: checked 
                          });
                        }}
                        disabled={updateChainMutation.isPending}
                        data-testid={`switch-active-${chain.id}`}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: chain.color }}
                        ></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {chain.color}
                        </span>
                      </div>
                      
                      <Badge 
                        variant={chain.isActive ? "default" : "secondary"}
                        className="w-fit"
                      >
                        {chain.isActive ? "Active" : "Inactive"}
                      </Badge>

                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB for icons
                        onGetUploadParameters={() => handleGetUploadParameters(chain.id)}
                        onComplete={handleUploadComplete(chain.id)}
                        buttonClassName="w-full mt-3"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {chain.iconUrl ? (
                            <>
                              <Image className="h-4 w-4" />
                              <span>Update Icon</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>Upload Icon</span>
                            </>
                          )}
                        </div>
                      </ObjectUploader>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}