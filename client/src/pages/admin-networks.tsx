import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Upload, Image, Plus, Trash2, Network } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import AdminHeader from "@/components/admin-header";
import Footer from "@/components/footer";
import { getChainIcon } from "@/components/chain-icons";
import type { Chain } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createChainSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").default("#3B82F6"),
  isActive: z.boolean().default(true),
});

export default function AdminNetworks() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const createForm = useForm<z.infer<typeof createChainSchema>>({
    resolver: zodResolver(createChainSchema),
    defaultValues: {
      name: "",
      displayName: "",
      color: "#3B82F6",
      isActive: true,
    },
  });

  // Fetch ALL chains for admin (including inactive ones)
  const { data: chains = [], isLoading: chainsLoading } = useQuery<Chain[]>({
    queryKey: ["/api/admin/chains"],
  });

  const createChainMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createChainSchema>) => {
      const response = await apiRequest("POST", "/api/admin/chains", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chains"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Network created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create network",
        variant: "destructive",
      });
    },
  });

  const updateChainMutation = useMutation({
    mutationFn: async ({ chainId, isActive }: { chainId: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/chains/${chainId}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chains"] }); // Also invalidate public chains
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

  const deleteChainMutation = useMutation({
    mutationFn: async (chainId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/chains/${chainId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chains"] });
      toast({
        title: "Success",
        description: "Network deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete network",
        variant: "destructive",
      });
    },
  });

  const uploadIconMutation = useMutation({
    mutationFn: async ({ chainId, iconUrl }: { chainId: string; iconUrl: string }) => {
      const response = await apiRequest("PUT", `/api/admin/chains/${chainId}/icon`, { iconUrl });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chains"] }); // Also invalidate public chains
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
    const response = await apiRequest("POST", `/api/admin/chains/${chainId}/icon/upload`);
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
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

  const onCreateSubmit = (data: z.infer<typeof createChainSchema>) => {
    createChainMutation.mutate(data);
  };

  const handleDelete = (chainId: string, chainName: string) => {
    if (window.confirm(`Are you sure you want to delete "${chainName}"? This action cannot be undone.`)) {
      deleteChainMutation.mutate(chainId);
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
    <>
      <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Networks Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Networks</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Configure network visibility and upload custom icons
                </p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-network">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Network
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Network</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Internal Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ethereum"
                                {...field}
                                data-testid="input-create-network-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Ethereum" {...field} data-testid="input-create-network-display-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={createForm.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Color</FormLabel>
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input 
                                  type="color" 
                                  {...field} 
                                  className="w-20 h-10 p-1 border rounded"
                                  data-testid="input-create-network-color"
                                />
                                <Input 
                                  placeholder="#3B82F6" 
                                  {...field}
                                  className="flex-1"
                                  data-testid="input-create-network-color-text"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex space-x-2">
                        <Button 
                          type="submit" 
                          disabled={createChainMutation.isPending}
                          data-testid="button-submit-create-network"
                        >
                          {createChainMutation.isPending ? "Creating..." : "Create Network"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCreateDialog(false)}
                          data-testid="button-cancel-create-network"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {chainsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : chains.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                No networks found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chains
                  .sort((a, b) => {
                    // Sort active chains first, then by display name
                    if (a.isActive && !b.isActive) return -1;
                    if (!a.isActive && b.isActive) return 1;
                    return a.displayName.localeCompare(b.displayName);
                  })
                  .map((chain) => (
                  <Card key={chain.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
{chain.logoUrl ? (
                          <img 
                            src={chain.logoUrl} 
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
                          <p className="text-sm text-gray-500 dark:text-gray-300">
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
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {chain.color}
                        </span>
                      </div>
                      
                      <Badge 
                        variant={chain.isActive ? "default" : "secondary"}
                        className="w-fit"
                      >
                        {chain.isActive ? "Active" : "Inactive"}
                      </Badge>

                      <div className="space-y-2">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB for icons
                          onGetUploadParameters={() => handleGetUploadParameters(chain.id)}
                          onComplete={handleUploadComplete(chain.id)}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {chain.logoUrl ? (
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
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDelete(chain.id, chain.displayName)}
                          data-testid={`button-delete-network-${chain.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Network
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </>
  );
}