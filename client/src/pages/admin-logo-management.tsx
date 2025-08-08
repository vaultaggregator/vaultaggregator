import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, RefreshCw, ExternalLink, Globe } from "lucide-react";
import AdminHeader from "@/components/admin-header";

interface ConfiguredPlatform {
  platforms: string[];
  total: number;
  message: string;
}

interface LogoUpdateResult {
  message: string;
  success: number;
  failed: number;
  total: number;
}

export default function AdminLogoManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for configured platforms
  const { data: configuredPlatforms, isLoading: configLoading } = useQuery<ConfiguredPlatform>({
    queryKey: ["/api/admin/logos/configured-platforms"],
  });

  // Query for all platforms to show which ones have logos configured
  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ["/api/admin/platforms"],
  });

  // Bulk update mutation
  const updateAllMutation = useMutation<LogoUpdateResult>({
    mutationFn: async () => {
      const response = await apiRequest("/api/admin/logos/update-all", { method: "POST" });
      return response as LogoUpdateResult;
    },
    onSuccess: (data: LogoUpdateResult) => {
      toast({
        title: "Logo Update Complete",
        description: data.message,
        variant: data.failed > 0 ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Individual platform update mutation
  const updatePlatformMutation = useMutation<any, Error, string>({
    mutationFn: async (platformName: string) => {
      const response = await apiRequest(`/api/admin/logos/update/${platformName}`, { method: "POST" });
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: "Logo Updated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platforms"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPlatforms = configuredPlatforms?.platforms.filter(platform =>
    platform.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const isUpdating = updateAllMutation.isPending || updatePlatformMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Platform Logo Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update platform logos from official sources including CryptoLogos, GitHub repositories, and protocol brand assets.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configured Platforms</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {configLoading ? "..." : configuredPlatforms?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platforms with official logo sources
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Platforms</CardTitle>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformsLoading ? "..." : Array.isArray(platforms) ? platforms.length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All platforms in database
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {configLoading || platformsLoading ? "..." : 
                    Math.round(((configuredPlatforms?.total || 0) / (Array.isArray(platforms) ? platforms.length : 1)) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Platforms with official logos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Update Actions</CardTitle>
                <CardDescription>
                  Update all platform logos from their official sources in one operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => updateAllMutation.mutate()}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-update-all-logos"
                  >
                    {updateAllMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating Logos...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Update All Platform Logos
                      </>
                    )}
                  </Button>
                </div>

                {updateAllMutation.isPending && (
                  <div className="mt-4">
                    <Progress value={undefined} className="w-full" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Downloading logos from official sources...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform List */}
          <Card>
            <CardHeader>
              <CardTitle>Configured Platforms</CardTitle>
              <CardDescription>
                Platforms with official logo sources available for updates
              </CardDescription>
              
              <div className="flex items-center space-x-2 pt-4">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search platforms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-platforms"
                />
              </div>
            </CardHeader>
            <CardContent>
              {configLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading configured platforms...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlatforms.map((platformName) => (
                    <Card key={platformName} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {platformName}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              Official Source
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePlatformMutation.mutate(platformName)}
                            disabled={isUpdating}
                            data-testid={`button-update-${platformName}`}
                          >
                            {updatePlatformMutation.isPending && updatePlatformMutation.variables === platformName ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!configLoading && filteredPlatforms.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 
                    `No platforms found matching "${searchTerm}"` :
                    "No configured platforms found"
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logo Sources Info */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Logo Sources</CardTitle>
                <CardDescription>
                  Official sources used for fetching authentic platform logos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">CryptoLogos.cc</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        High-quality SVG and PNG logos for major protocols
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">GitHub Repositories</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Official brand assets from protocol repositories
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Aave Brand Kit</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Official Aave DAO brand assets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Lido Static Assets</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lido Finance official logo repository
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}