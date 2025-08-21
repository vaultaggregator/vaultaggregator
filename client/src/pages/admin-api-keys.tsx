import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Copy, Key, Plus, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  tier: string;
  requestsPerHour: number;
  usageCount: number;
  lastUsed?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminApiKeys() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ name: "", tier: "free" });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["/api/admin/api-keys"],
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string; tier: string }) => {
      return await apiRequest("/api/admin/api-keys", "POST", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setIsCreating(false);
      setNewKeyForm({ name: "", tier: "free" });
      setVisibleKeys(prev => new Set([...prev, data.apiKey.id]));
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to create API key:", error);
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/api-keys/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete API key:", error);
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "API key copied to clipboard.",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-api-keys-title">
              API Key Management
            </h1>
            <p className="text-muted-foreground mt-1" data-testid="text-api-keys-subtitle">
              Generate and manage API keys for external access
            </p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)} 
            className="flex items-center gap-2"
            data-testid="button-create-api-key"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </Button>
        </div>

        {/* Create API Key Form */}
        {isCreating && (
          <Card data-testid="card-create-api-key">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Create New API Key
              </CardTitle>
              <CardDescription>
                Generate a new API key for accessing Vault Aggregator data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    placeholder="My API Key"
                    value={newKeyForm.name}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                    data-testid="input-api-key-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-tier">Tier</Label>
                  <Select 
                    value={newKeyForm.tier} 
                    onValueChange={(value) => setNewKeyForm(prev => ({ ...prev, tier: value }))}
                  >
                    <SelectTrigger data-testid="select-api-key-tier">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free (1,000 requests/hour)</SelectItem>
                      <SelectItem value="pro">Pro (10,000 requests/hour)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => createApiKeyMutation.mutate(newKeyForm)}
                  disabled={!newKeyForm.name || createApiKeyMutation.isPending}
                  data-testid="button-submit-api-key"
                >
                  {createApiKeyMutation.isPending ? "Creating..." : "Create Key"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreating(false)}
                  data-testid="button-cancel-api-key"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        <div className="space-y-4">
          {apiKeys?.apiKeys?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No API keys created yet</p>
                <Button 
                  onClick={() => setIsCreating(true)} 
                  className="mt-4"
                  data-testid="button-create-first-api-key"
                >
                  Create Your First API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys?.apiKeys?.map((apiKey: ApiKey) => (
              <Card key={apiKey.id} data-testid={`card-api-key-${apiKey.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        {apiKey.name}
                        <Badge 
                          variant={apiKey.tier === "pro" ? "default" : "secondary"}
                          className={apiKey.tier === "pro" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" : ""}
                        >
                          {apiKey.tier.toUpperCase()}
                        </Badge>
                        {!apiKey.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apiKey.requestsPerHour.toLocaleString()} req/hour
                        </span>
                        <span>Usage: {apiKey.usageCount.toLocaleString()}</span>
                        {apiKey.lastUsed && (
                          <span>Last used: {formatDate(apiKey.lastUsed)}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                      disabled={deleteApiKeyMutation.isPending}
                      data-testid={`button-delete-api-key-${apiKey.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">API Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 p-2 bg-muted rounded font-mono text-sm">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : apiKey.key}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          data-testid={`button-toggle-visibility-${apiKey.id}`}
                        >
                          {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                          data-testid={`button-copy-api-key-${apiKey.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {formatDate(apiKey.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Usage Information */}
        <Card>
          <CardHeader>
            <CardTitle>API Usage Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Rate Limits</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Free tier: 1,000 requests per hour</li>
                  <li>• Pro tier: 10,000 requests per hour</li>
                  <li>• Rate limits reset every hour</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Authentication</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Include API key in Authorization header</li>
                  <li>• Format: Bearer YOUR_API_KEY</li>
                  <li>• All API endpoints require authentication</li>
                </ul>
              </div>
            </div>
            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Available Endpoints</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div>• GET /api/v1/pools - List yield pools</div>
                <div>• GET /api/v1/chains - List blockchain networks</div>
                <div>• GET /api/v1/platforms - List DeFi platforms</div>
                <div>• GET /api/v1/stats - Platform statistics</div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}