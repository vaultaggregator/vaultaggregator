import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Save, X, Eye, EyeOff, Plus, Search, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PoolDataLoading } from "@/components/loading-animations";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AddressLink, NetworkLink } from "@/components/entity-links";
import AdminHeader from "@/components/admin-header";

interface Token {
  id: string;
  chainId: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Network {
  id: string;
  chainId: string;
  name: string;
  displayName: string;
  color: string;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface TokenInfo {
  id: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string | null;
  totalSupply: string | null;
  holdersCount: number | null;
  price: string | null;
  priceChange24h: string | null;
  marketCap: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const createTokenSchema = z.object({
  chainId: z.string().min(1, "Network is required"),
  address: z.string().min(1, "Contract address is required"),
  name: z.string().optional(),
  symbol: z.string().optional(),
  decimals: z.number().min(0).max(30).optional(),
});

export default function AdminTokensPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: any}>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const createForm = useForm<z.infer<typeof createTokenSchema>>({
    resolver: zodResolver(createTokenSchema),
    defaultValues: {
      chainId: "",
      address: "",
    },
  });

  // Fetch user for authentication
  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch tokens
  const { data: tokens = [], isLoading: tokensLoading, error: tokensError } = useQuery<Token[]>({
    queryKey: ["/api/admin/tokens"],
    staleTime: 30000,
  });

  // Fetch networks for filtering
  const { data: networks = [] } = useQuery<Network[]>({
    queryKey: ["/api/admin/networks"],
    staleTime: 60000,
  });

  // Fetch token info
  const { data: tokenInfos = [] } = useQuery<TokenInfo[]>({
    queryKey: ["/api/admin/token-info"],
    staleTime: 30000,
  });

  // Create token mutation
  const createTokenMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTokenSchema>) => {
      const response = await apiRequest("POST", "/api/admin/tokens", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tokens"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Token created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create token",
        variant: "destructive",
      });
    },
  });

  // Update token mutation
  const updateTokenMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Token> }) => {
      return await apiRequest(`/api/admin/tokens/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tokens"] });
      toast({
        title: "Success",
        description: "Token updated successfully",
      });
      setEditingToken(null);
      setEditValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update token",
        variant: "destructive",
      });
    },
  });

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = !search || 
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase());

    const matchesNetwork = !selectedNetwork || token.chainId === selectedNetwork;

    return matchesSearch && matchesNetwork;
  });

  // Group tokens by network
  const tokensByNetwork = networks.reduce((acc, network) => {
    acc[network.id] = filteredTokens.filter(token => token.chainId === network.id);
    return acc;
  }, {} as {[key: string]: Token[]});

  // Helper to get token info
  const getTokenInfo = (address: string) => {
    return tokenInfos.find(info => info.address.toLowerCase() === address.toLowerCase());
  };

  // Helper to get network
  const getNetwork = (chainId: string) => {
    return networks.find(net => net.id === chainId);
  };

  const handleSave = (tokenId: string) => {
    const updates = editValues[tokenId];
    if (!updates) return;

    updateTokenMutation.mutate({ id: tokenId, updates });
  };

  const handleCancel = (tokenId: string) => {
    setEditingToken(null);
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[tokenId];
      return newValues;
    });
  };

  const handleEdit = (token: Token) => {
    setEditingToken(token.id);
    setEditValues(prev => ({
      ...prev,
      [token.id]: {
        name: token.name,
        symbol: token.symbol,
        logoUrl: token.logoUrl || "",
        isActive: token.isActive,
      }
    }));
  };

  // Redirect if not authenticated
  if (!userLoading && !user) {
    navigate("/admin/login");
    return null;
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <PoolDataLoading message="Loading admin tokens..." />
      </div>
    );
  }

  if (tokensError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Tokens</h2>
          <p className="text-gray-600 dark:text-gray-400">Failed to load token data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Token Management
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage token metadata and information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Tokens
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tokens.length}
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
                    Active Tokens
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {tokens.filter(t => t.isActive).length}
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
                    Networks
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {networks.filter(n => n.isActive).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    With Info
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {tokenInfos.length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-create-token">
                    <Plus className="w-4 h-4" />
                    Create Token
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Token</DialogTitle>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit((data) => createTokenMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="chainId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Network</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {networks.filter(n => n.isActive).map((network) => (
                                  <SelectItem key={network.id} value={network.id}>
                                    {network.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Address</FormLabel>
                            <FormControl>
                              <Input placeholder="0x..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Token Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="symbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symbol (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="TKN" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="decimals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decimals (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="30" 
                                placeholder="18" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createTokenMutation.isPending}>
                          {createTokenMutation.isPending ? "Creating..." : "Create Token"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tokens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              {/* Network Filter */}
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="select-network"
              >
                <option value="">All Networks</option>
                {networks.filter(n => n.isActive).map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.displayName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tokens by Network */}
        {tokensLoading ? (
          <div className="flex justify-center py-8">
            <PoolDataLoading message="Loading tokens..." />
          </div>
        ) : (
          <div className="space-y-8">
            {networks.filter(n => n.isActive && (!selectedNetwork || selectedNetwork === n.id)).map((network) => {
              const networkTokens = tokensByNetwork[network.id] || [];

              if (networkTokens.length === 0 && selectedNetwork) return null;

              return (
                <Card key={network.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <NetworkLink network={network} />
                      <span className="text-sm text-gray-500">
                        ({networkTokens.length} tokens)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {networkTokens.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No tokens found for this network
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                                Token
                              </th>
                              <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                                Address
                              </th>
                              <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                                Decimals
                              </th>
                              <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">
                                Info
                              </th>
                              <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                                Status
                              </th>
                              <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {networkTokens.map((token) => {
                              const isEditing = editingToken === token.id;
                              const tokenInfo = getTokenInfo(token.address);

                              return (
                                <tr key={token.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-3 px-2">
                                    <div className="flex items-center gap-3">
                                      {token.logoUrl && (
                                        <img 
                                          src={token.logoUrl} 
                                          alt={token.symbol}
                                          className="w-8 h-8 rounded-full"
                                        />
                                      )}
                                      <div>
                                        {isEditing ? (
                                          <div className="space-y-1">
                                            <Input
                                              value={editValues[token.id]?.name || ""}
                                              onChange={(e) => setEditValues(prev => ({
                                                ...prev,
                                                [token.id]: { ...prev[token.id], name: e.target.value }
                                              }))}
                                              placeholder="Token name"
                                              className="h-8 text-sm"
                                              data-testid={`input-name-${token.id}`}
                                            />
                                            <Input
                                              value={editValues[token.id]?.symbol || ""}
                                              onChange={(e) => setEditValues(prev => ({
                                                ...prev,
                                                [token.id]: { ...prev[token.id], symbol: e.target.value }
                                              }))}
                                              placeholder="Symbol"
                                              className="h-8 text-sm"
                                              data-testid={`input-symbol-${token.id}`}
                                            />
                                          </div>
                                        ) : (
                                          <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                              {token.name}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                              {token.symbol}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2">
                                    <AddressLink address={token.address} />
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {token.decimals}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2">
                                    {tokenInfo ? (
                                      <div className="text-sm">
                                        {tokenInfo.holdersCount && (
                                          <div className="text-gray-600 dark:text-gray-400">
                                            {tokenInfo.holdersCount.toLocaleString()} holders
                                          </div>
                                        )}
                                        {tokenInfo.price && (
                                          <div className="text-gray-600 dark:text-gray-400">
                                            ${parseFloat(tokenInfo.price).toFixed(4)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400">No info</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    {isEditing ? (
                                      <select
                                        value={editValues[token.id]?.isActive ? "active" : "inactive"}
                                        onChange={(e) => setEditValues(prev => ({
                                          ...prev,
                                          [token.id]: { ...prev[token.id], isActive: e.target.value === "active" }
                                        }))}
                                        className="text-sm border rounded px-2 py-1"
                                        data-testid={`select-status-${token.id}`}
                                      >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                      </select>
                                    ) : (
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        token.isActive 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      }`}>
                                        {token.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="flex justify-center space-x-2">
                                      {isEditing ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSave(token.id)}
                                            disabled={updateTokenMutation.isPending}
                                            data-testid={`button-save-${token.id}`}
                                          >
                                            <Save className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleCancel(token.id)}
                                            data-testid={`button-cancel-${token.id}`}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleEdit(token)}
                                          data-testid={`button-edit-${token.id}`}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}