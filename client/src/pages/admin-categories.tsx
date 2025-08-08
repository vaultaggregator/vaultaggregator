import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import AdminHeader from "@/components/admin-header";
import { ArrowLeft, Plus, Edit2, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  color: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  poolCount: number;
  subcategories?: Category[];
}

export default function AdminCategories() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "#3B82F6",
    parentId: "",
  });

  const { data: categories = [], isLoading, refetch } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowCreateDialog(false);
      setFormData({ name: "", displayName: "", description: "", color: "#3B82F6", parentId: "" });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update category",
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
      if (!response.ok) throw new Error("Failed to get upload URL");
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

  const updateCategoryIconMutation = useMutation({
    mutationFn: async ({ categoryId, iconUrl }: { categoryId: string; iconUrl: string }) => {
      const response = await fetch(`/api/category-icons`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ categoryId, iconUrl }),
      });
      if (!response.ok) throw new Error("Failed to update category icon");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category icon updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category icon",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.displayName) {
      toast({
        title: "Error",
        description: "Name and display name are required",
        variant: "destructive",
      });
      return;
    }
    createCategoryMutation.mutate(formData);
  };

  const handleIconUploadComplete = (categoryId: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        updateCategoryIconMutation.mutate({ categoryId, iconUrl: uploadURL });
      }
    }
  };

  const toggleCategoryStatus = (categoryId: string, isActive: boolean) => {
    updateCategoryMutation.mutate({ id: categoryId, data: { isActive } });
  };

  const getCategoryInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-2">
                Manage coin categories and upload category icons
              </p>
            </div>
            {showCreateDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Create New Category</h2>
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <Input
                      placeholder="Category Name (e.g., bitcoin)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-category-name"
                    />
                    <Input
                      placeholder="Display Name (e.g., Bitcoin)"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      data-testid="input-category-display-name"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      data-testid="textarea-category-description"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Parent Category (optional)
                      </label>
                      <Select 
                        value={formData.parentId} 
                        onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? "" : value })}
                      >
                        <SelectTrigger data-testid="select-parent-category">
                          <SelectValue placeholder="Select parent category (leave empty for main category)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No parent (main category)</SelectItem>
                          {categories.filter(cat => !cat.parentId && cat.isActive).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                        data-testid="input-category-color"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-submit-category">
                        Create
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-category">
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading categories...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.iconUrl ? (
                          <img 
                            src={category.iconUrl} 
                            alt={category.displayName}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        ) : (
                          getCategoryInitials(category.displayName)
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {category.parentId && <span className="text-xs text-gray-400">└─</span>}
                          {category.displayName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{category.name}</p>
                        <p className="text-xs text-gray-400">
                          {category.poolCount} pools
                          {category.parentId && (
                            <span className="ml-2 text-blue-600">
                              (Subcategory)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Slug: {category.slug}</p>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        Created: {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCategoryStatus(category.id, !category.isActive)}
                        data-testid={`button-toggle-${category.id}`}
                      >
                        {category.isActive ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                        {category.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880}
                        onGetUploadParameters={uploadMutation.mutateAsync}
                        onComplete={handleIconUploadComplete(category.id)}
                        buttonClassName="text-sm"
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Icon
                      </ObjectUploader>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${category.displayName}"?`)) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}