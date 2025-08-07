import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Search, Tag } from "lucide-react";

interface Pool {
  id: string;
  platformName: string;
  chainName: string;
  symbol: string;
  apy: number;
  tvlUsd: number;
  tokenPair: string;
  isVisible: boolean;
}

interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface PoolWithCategories extends Pool {
  categories: Category[];
}

export default function AdminPoolCategories() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  // Fetch pools with their assigned categories
  const { data: pools = [], isLoading: poolsLoading } = useQuery<PoolWithCategories[]>({
    queryKey: ["/api/admin/pools-with-categories"],
    queryFn: async () => {
      const poolsResponse = await fetch("/api/admin/pools", { credentials: "include" });
      if (!poolsResponse.ok) throw new Error("Failed to fetch pools");
      const pools = await poolsResponse.json();
      
      // For each pool, fetch its categories
      const poolsWithCategories = await Promise.all(
        pools.map(async (pool: Pool) => {
          try {
            const categoriesResponse = await fetch(`/api/pools/${pool.id}/categories`);
            const categories = categoriesResponse.ok ? await categoriesResponse.json() : [];
            return { ...pool, categories };
          } catch {
            return { ...pool, categories: [] };
          }
        })
      );
      
      return poolsWithCategories;
    }
  });

  // Fetch all available categories
  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
  });

  // Add pool to category mutation
  const addPoolToCategoryMutation = useMutation({
    mutationFn: async ({ poolId, categoryId }: { poolId: string; categoryId: string }) => {
      const response = await fetch(`/api/admin/pools/${poolId}/categories/${categoryId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to assign category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools-with-categories"] });
      toast({
        title: "Success",
        description: "Category assigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign category",
        variant: "destructive",
      });
    },
  });

  // Remove pool from category mutation
  const removePoolFromCategoryMutation = useMutation({
    mutationFn: async ({ poolId, categoryId }: { poolId: string; categoryId: string }) => {
      const response = await fetch(`/api/admin/pools/${poolId}/categories/${categoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to remove category assignment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools-with-categories"] });
      toast({
        title: "Success",
        description: "Category assignment removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove category assignment",
        variant: "destructive",
      });
    },
  });

  const handleCategoryToggle = (poolId: string, categoryId: string, isAssigned: boolean) => {
    if (isAssigned) {
      removePoolFromCategoryMutation.mutate({ poolId, categoryId });
    } else {
      addPoolToCategoryMutation.mutate({ poolId, categoryId });
    }
  };

  const filteredPools = pools.filter(pool => {
    const matchesSearch = searchTerm === "" || 
      pool.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.platformName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.chainName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getCategoryInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (poolsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pools and categories...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pool Categories</h1>
              <p className="text-gray-600 mt-2">
                Assign categories to pools for better organization
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search pools by symbol, platform, or chain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Pool Cards */}
        <div className="grid gap-6">
          {filteredPools.map((pool) => (
            <Card key={pool.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {pool.symbol}
                    </CardTitle>
                    <CardDescription>
                      {pool.platformName} • {pool.chainName}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {pool.apy.toFixed(2)}% APY
                    </div>
                    <div className="text-sm text-gray-500">
                      ${(pool.tvlUsd / 1000000).toFixed(1)}M TVL
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Categories */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Categories:</h4>
                    <div className="flex flex-wrap gap-2">
                      {pool.categories.length > 0 ? (
                        pool.categories.map((category) => (
                          <Badge 
                            key={category.id} 
                            variant="default"
                            style={{ backgroundColor: category.color }}
                            className="text-white"
                          >
                            {category.iconUrl ? (
                              <img src={category.iconUrl} alt="" className="w-3 h-3 mr-1" />
                            ) : (
                              <span className="text-xs mr-1">{getCategoryInitials(category.displayName)}</span>
                            )}
                            {category.displayName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500 italic">No categories assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Category Assignment */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Assign Categories:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {allCategories
                        .filter(category => category.isActive)
                        .map((category) => {
                          const isAssigned = pool.categories.some(c => c.id === category.id);
                          return (
                            <div key={category.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={`${pool.id}-${category.id}`}
                                checked={isAssigned}
                                onCheckedChange={() => handleCategoryToggle(pool.id, category.id, isAssigned)}
                                data-testid={`checkbox-category-${category.slug}`}
                              />
                              <label 
                                htmlFor={`${pool.id}-${category.id}`}
                                className="flex items-center space-x-2 cursor-pointer"
                              >
                                <div 
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-medium"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {category.iconUrl ? (
                                    <img src={category.iconUrl} alt="" className="w-3 h-3" />
                                  ) : (
                                    getCategoryInitials(category.displayName)
                                  )}
                                </div>
                                <span className="text-sm">{category.displayName}</span>
                              </label>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPools.length === 0 && (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pools found</h3>
            <p className="text-gray-500">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}