import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ObjectUploader } from "@/components/ObjectUploader";
import { getPlatformIcon } from "@/components/platform-icons";
import AdminHeader from "@/components/admin-header";
import { ArrowLeft, Plus, Edit2, Trash2, Upload, Building } from "lucide-react";
import type { UploadResult } from "@uppy/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createPlatformSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  slug: z.string().min(1, "Slug is required"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  visitUrlTemplate: z.string().optional(),
  showUnderlyingTokens: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

interface Platform {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  visitUrlTemplate?: string;
  showUnderlyingTokens?: boolean;
  isActive: boolean;
  createdAt: string;
  hasVisiblePools?: boolean;
}

export default function AdminPlatforms() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editUrlTemplate, setEditUrlTemplate] = useState("");
  const [editShowUnderlyingTokens, setEditShowUnderlyingTokens] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const createForm = useForm<z.infer<typeof createPlatformSchema>>({
    resolver: zodResolver(createPlatformSchema),
    defaultValues: {
      name: "",
      displayName: "",
      slug: "",
      website: "",
      visitUrlTemplate: "",
      showUnderlyingTokens: false,
      isActive: true,
    },
  });

  const { data: platforms = [], isLoading, refetch } = useQuery<Platform[]>({
    queryKey: ["/api/admin/platforms"],
  });

  const createPlatformMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPlatformSchema>) => {
      return apiRequest("/api/admin/platforms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Platform created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create platform",
        variant: "destructive",
      });
    },
  });

  const deletePlatformMutation = useMutation({
    mutationFn: async (platformId: string) => {
      return apiRequest(`/api/admin/platforms/${platformId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Success",
        description: "Platform deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete platform",
        variant: "destructive",
      });
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Platform> }) => {
      const response = await fetch(`/api/admin/platforms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update platform");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      setEditingPlatform(null);
      toast({
        title: "Success",
        description: "Platform updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update platform",
        variant: "destructive",
      });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/objects/upload", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }
      const data = await response.json();
      return { method: "PUT" as const, url: data.uploadURL };
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
    },
  });

  const updatePlatformLogoMutation = useMutation({
    mutationFn: async ({ platformId, logoUrl }: { platformId: string; logoUrl: string }) => {
      const response = await fetch(`/api/platform-logos`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ platformId, logoUrl }),
      });
      if (!response.ok) throw new Error("Failed to update platform logo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms"] });
      toast({
        title: "Success",
        description: "Platform logo updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform logo",
        variant: "destructive",
      });
    },
  });

  const startEditing = (platform: Platform) => {
    setEditingPlatform(platform.id);
    setEditName(platform.name);
    setEditDisplayName(platform.displayName);
    setEditWebsite(platform.website || "");
    setEditUrlTemplate(platform.visitUrlTemplate || "");
    setEditShowUnderlyingTokens(platform.showUnderlyingTokens || false);
  };

  const cancelEditing = () => {
    setEditingPlatform(null);
    setEditName("");
    setEditDisplayName("");
    setEditWebsite("");
    setEditUrlTemplate("");
    setEditShowUnderlyingTokens(false);
  };

  const savePlatform = () => {
    if (!editingPlatform) return;
    
    updatePlatformMutation.mutate({
      id: editingPlatform,
      data: {
        name: editName,
        displayName: editDisplayName,
        website: editWebsite || undefined,
        visitUrlTemplate: editUrlTemplate || undefined,
        showUnderlyingTokens: editShowUnderlyingTokens,
      },
    });
  };

  const handleLogoUploadComplete = (platformId: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        updatePlatformLogoMutation.mutate({ platformId, logoUrl: uploadURL });
      }
    }
  };

  const getPlatformInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const onCreateSubmit = (data: z.infer<typeof createPlatformSchema>) => {
    createPlatformMutation.mutate(data);
  };

  const handleDelete = (platformId: string, platformName: string) => {
    if (window.confirm(`Are you sure you want to delete "${platformName}"? This action cannot be undone.`)) {
      deletePlatformMutation.mutate(platformId);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  // Platform Card Component
  const PlatformCard = ({ platform }: { platform: Platform }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md">
              {platform.logoUrl ? (
                <img 
                  src={platform.logoUrl} 
                  alt={platform.displayName}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                (() => {
                  const PlatformIcon = getPlatformIcon(platform.name);
                  return <PlatformIcon size={48} className="flex-shrink-0" />;
                })()
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{platform.displayName}</CardTitle>
              <p className="text-sm text-gray-500">{platform.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant={platform.isActive ? "default" : "secondary"} 
              className={platform.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
              data-testid={`badge-status-${platform.id}`}
            >
              {platform.isActive ? "Active" : "Inactive"}
            </Badge>
            {platform.hasVisiblePools && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Has Pools
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {editingPlatform === platform.id ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Platform name"
                  data-testid={`input-edit-name-${platform.id}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Display name"
                  data-testid={`input-edit-display-name-${platform.id}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <Input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="https://example.com"
                  data-testid={`input-edit-website-${platform.id}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Template</label>
                <Input
                  value={editUrlTemplate}
                  onChange={(e) => setEditUrlTemplate(e.target.value)}
                  placeholder="https://example.com/pool/{POOL_ID}"
                  data-testid={`input-edit-url-template-${platform.id}`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`show-underlying-${platform.id}`}
                checked={editShowUnderlyingTokens}
                onCheckedChange={(checked) => setEditShowUnderlyingTokens(checked as boolean)}
                data-testid={`checkbox-show-underlying-${platform.id}`}
              />
              <label htmlFor={`show-underlying-${platform.id}`} className="text-sm">Show underlying tokens</label>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => savePlatform()}
                data-testid={`button-save-${platform.id}`}
              >
                Save Changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingPlatform(null)}
                data-testid={`button-cancel-edit-${platform.id}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Slug: {platform.slug}</p>
              {platform.website && (
                <p className="text-sm text-gray-600">
                  Website: 
                  <a 
                    href={platform.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    {platform.website}
                  </a>
                </p>
              )}
              {platform.visitUrlTemplate && (
                <p className="text-sm text-gray-600">
                  URL Template: 
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded ml-1">
                    {platform.visitUrlTemplate}
                  </code>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Show Underlying Tokens: 
                <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                  platform.showUnderlyingTokens 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {platform.showUnderlyingTokens ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(platform.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEditing(platform)}
                data-testid={`button-edit-${platform.id}`}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880}
                onGetUploadParameters={uploadMutation.mutateAsync}
                onComplete={handleLogoUploadComplete(platform.id)}
                buttonClassName="text-sm"
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload Logo
              </ObjectUploader>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(platform.id, platform.displayName)}
                data-testid={`button-delete-${platform.id}`}
                disabled={platform.hasVisiblePools}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
              <p className="text-gray-600 mt-2">
                Manage platform information and upload platform logos
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-platform">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Platform
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Platform</DialogTitle>
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
                              placeholder="morpho"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!createForm.getValues('slug')) {
                                  createForm.setValue('slug', generateSlug(e.target.value));
                                }
                              }}
                              data-testid="input-create-name"
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
                            <Input placeholder="Morpho" {...field} data-testid="input-create-display-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input placeholder="morpho" {...field} data-testid="input-create-slug" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://morpho.org" {...field} data-testid="input-create-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="visitUrlTemplate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visit URL Template (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://app.morpho.org/vault?address={POOL_ADDRESS}" {...field} data-testid="input-create-visit-template" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="showUnderlyingTokens"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Show Underlying Tokens</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Display underlying token details on pool pages
                            </div>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-create-show-underlying"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex space-x-2">
                      <Button 
                        type="submit" 
                        disabled={createPlatformMutation.isPending}
                        data-testid="button-submit-create-platform"
                      >
                        {createPlatformMutation.isPending ? "Creating..." : "Create Platform"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                        data-testid="button-cancel-create-platform"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Search platforms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-platforms"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading platforms...</p>
          </div>
        ) : (() => {
          const filteredPlatforms = platforms.filter((platform) => {
            const query = searchQuery.toLowerCase();
            return (
              platform.name.toLowerCase().includes(query) ||
              platform.displayName.toLowerCase().includes(query) ||
              (platform.website && platform.website.toLowerCase().includes(query))
            );
          });

          if (filteredPlatforms.length === 0 && searchQuery) {
            return (
              <div className="text-center py-8">
                <p className="text-gray-500">No platforms found matching "{searchQuery}"</p>
                <Button 
                  variant="ghost" 
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                  data-testid="button-clear-search"
                >
                  Clear search
                </Button>
              </div>
            );
          }

          // Group platforms by visibility
          const platformsWithVisible = filteredPlatforms.filter(p => p.hasVisiblePools);
          const platformsWithoutVisible = filteredPlatforms.filter(p => !p.hasVisiblePools);

          return (
            <div className="space-y-6">
              {searchQuery && (
                <p className="text-sm text-gray-600" data-testid="text-search-results">
                  Showing {filteredPlatforms.length} platform{filteredPlatforms.length === 1 ? '' : 's'} 
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              )}
              
              {!searchQuery && (
                <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p>
                    <strong>Platform Ordering:</strong> Platforms with visible pools are shown first, 
                    followed by platforms without visible pools. This helps you identify which platforms 
                    are actively being used in your visible pool collection.
                  </p>
                </div>
              )}

              {/* Show all platforms in one grid when searching */}
              {searchQuery ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPlatforms.map((platform) => (
                    <PlatformCard key={platform.id} platform={platform} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Platforms with visible pools */}
                  {platformsWithVisible.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Platforms with Visible Pools ({platformsWithVisible.length})
                      </h3>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {platformsWithVisible.map((platform) => (
                          <PlatformCard key={platform.id} platform={platform} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platforms without visible pools */}
                  {platformsWithoutVisible.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Other Platforms ({platformsWithoutVisible.length})
                      </h3>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {platformsWithoutVisible.map((platform) => (
                          <PlatformCard key={platform.id} platform={platform} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );

        })()}
      </div>
    </div>
  );
} 
