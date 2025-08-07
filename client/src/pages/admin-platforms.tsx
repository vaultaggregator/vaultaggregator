import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ArrowLeft, Plus, Edit2, Trash2, Upload } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface Platform {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPlatforms() {
  const { toast } = useToast();
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  const { data: platforms = [], isLoading, refetch } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
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
  };

  const cancelEditing = () => {
    setEditingPlatform(null);
    setEditName("");
    setEditDisplayName("");
    setEditWebsite("");
  };

  const savePlatform = () => {
    if (!editingPlatform) return;
    
    updatePlatformMutation.mutate({
      id: editingPlatform,
      data: {
        name: editName,
        displayName: editDisplayName,
        website: editWebsite || undefined,
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

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
          <p className="text-gray-600 mt-2">
            Manage platform information and upload platform logos
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading platforms...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => (
              <Card key={platform.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm shadow-md">
                        {platform.logoUrl ? (
                          <img 
                            src={platform.logoUrl} 
                            alt={platform.displayName}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          getPlatformInitials(platform.displayName)
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.displayName}</CardTitle>
                        <p className="text-sm text-gray-500">{platform.name}</p>
                      </div>
                    </div>
                    <Badge variant={platform.isActive ? "default" : "secondary"}>
                      {platform.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingPlatform === platform.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Platform Name"
                        data-testid={`input-edit-name-${platform.id}`}
                      />
                      <Input
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        placeholder="Display Name"
                        data-testid={`input-edit-display-name-${platform.id}`}
                      />
                      <Input
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        placeholder="Website URL (optional)"
                        data-testid={`input-edit-website-${platform.id}`}
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={savePlatform}
                          data-testid={`button-save-${platform.id}`}
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEditing}
                          data-testid={`button-cancel-${platform.id}`}
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
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}