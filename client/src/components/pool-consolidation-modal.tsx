import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Merge, ArrowRight } from "lucide-react";
import type { PoolWithRelations } from "@shared/schema";

interface PoolConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pools: PoolWithRelations[];
}

interface ConsolidatedPoolData {
  tokenPair: string;
  apy: string;
  tvl: string;
  riskLevel: string;
  poolAddress: string;
  underlyingTokens: string[];
  poolMeta: string;
  project: string;
  platformId: string;
  chainId: string;
}

export default function PoolConsolidationModal({ isOpen, onClose, pools }: PoolConsolidationModalProps) {
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>({});
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedPoolData>({
    tokenPair: "",
    apy: "",
    tvl: "",
    riskLevel: "",
    poolAddress: "",
    underlyingTokens: [],
    poolMeta: "",
    project: "",
    platformId: "",
    chainId: "",
  });
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize with first pool's data
  useEffect(() => {
    if (pools.length > 0) {
      const firstPool = pools[0];
      const rawData = firstPool.rawData as any;
      
      setConsolidatedData({
        tokenPair: firstPool.tokenPair,
        apy: firstPool.apy || "0",
        tvl: firstPool.tvl || "0",
        riskLevel: firstPool.riskLevel,
        poolAddress: firstPool.poolAddress || "",
        underlyingTokens: rawData?.underlyingTokens || [],
        poolMeta: rawData?.poolMeta || "",
        project: firstPool.project || "",
        platformId: firstPool.platformId,
        chainId: firstPool.chainId,
      });

      // Set default selections to first pool
      setSelectedFields({
        tokenPair: firstPool.id,
        apy: firstPool.id,
        tvl: firstPool.id,
        riskLevel: firstPool.id,
        poolAddress: firstPool.id,
        underlyingTokens: firstPool.id,
        poolMeta: firstPool.id,
        project: firstPool.id,
        platform: firstPool.id,
        chain: firstPool.id,
      });
    }
  }, [pools]);

  const createConsolidatedPoolMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/pools/consolidate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create consolidated pool");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Consolidated pool created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pools"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create consolidated pool",
        variant: "destructive",
      });
    },
  });

  const handleFieldSelection = (field: string, poolId: string) => {
    setSelectedFields(prev => ({ ...prev, [field]: poolId }));
    
    const selectedPool = pools.find(p => p.id === poolId);
    if (!selectedPool) return;

    const rawData = selectedPool.rawData as any;
    
    setConsolidatedData(prev => {
      const updated = { ...prev };
      
      switch (field) {
        case 'tokenPair':
          updated.tokenPair = selectedPool.tokenPair;
          break;
        case 'apy':
          updated.apy = selectedPool.apy || "0";
          break;
        case 'tvl':
          updated.tvl = selectedPool.tvl || "0";
          break;
        case 'riskLevel':
          updated.riskLevel = selectedPool.riskLevel;
          break;
        case 'poolAddress':
          updated.poolAddress = selectedPool.poolAddress || "";
          break;
        case 'underlyingTokens':
          // Ensure we always get an array and properly handle the data
          const tokens = rawData?.underlyingTokens;
          updated.underlyingTokens = Array.isArray(tokens) ? tokens : [];
          console.log(`Selected underlying tokens for ${selectedPool.tokenPair}:`, updated.underlyingTokens);
          break;
        case 'poolMeta':
          updated.poolMeta = rawData?.poolMeta || "";
          break;
        case 'project':
          updated.project = selectedPool.project || "";
          break;
        case 'platform':
          updated.platformId = selectedPool.platformId;
          break;
        case 'chain':
          updated.chainId = selectedPool.chainId;
          break;
      }
      
      console.log(`Field ${field} updated. New consolidated data:`, updated);
      return updated;
    });
  };

  const handleCreate = () => {
    // Get the raw data from the poolMeta selection for base data
    const baseRawData = pools.find(p => p.id === selectedFields.poolMeta)?.rawData || {};
    
    // Create consolidated raw data with explicitly selected values taking precedence
    const consolidatedRawData = {
      // Start with base raw data
      ...baseRawData,
      // Override with specifically selected values
      apy: parseFloat(consolidatedData.apy),
      tvlUsd: parseFloat(consolidatedData.tvl),
      poolMeta: consolidatedData.poolMeta,
      underlyingTokens: consolidatedData.underlyingTokens, // This must come after spread to ensure it takes precedence
      project: consolidatedData.project,
      symbol: consolidatedData.tokenPair,
    };

    const payload = {
      platformId: consolidatedData.platformId,
      chainId: consolidatedData.chainId,
      tokenPair: consolidatedData.tokenPair,
      apy: consolidatedData.apy,
      tvl: consolidatedData.tvl,
      riskLevel: consolidatedData.riskLevel,
      poolAddress: consolidatedData.poolAddress,
      project: consolidatedData.project,
      rawData: consolidatedRawData,
      notes: notes.trim() || undefined,
      sourcePoolIds: pools.map(p => p.id), // Track which pools were consolidated
    };

    console.log("Creating consolidated pool with payload:", payload);
    console.log("Selected fields:", selectedFields);
    console.log("Consolidated data:", consolidatedData);
    console.log("Final underlying tokens in payload:", consolidatedRawData.underlyingTokens);
    createConsolidatedPoolMutation.mutate(payload);
  };

  const getFieldValue = (pool: PoolWithRelations, field: string) => {
    const rawData = pool.rawData as any;
    
    switch (field) {
      case 'tokenPair':
        return pool.tokenPair;
      case 'apy':
        return pool.apy || "0";
      case 'tvl':
        return pool.tvl || "0";
      case 'riskLevel':
        return pool.riskLevel;
      case 'poolAddress':
        return pool.poolAddress || "N/A";
      case 'underlyingTokens':
        const tokens = rawData?.underlyingTokens || [];
        if (Array.isArray(tokens) && tokens.length > 0) {
          return tokens.slice(0, 3).join(', ') + (tokens.length > 3 ? ` (+${tokens.length - 3} more)` : '');
        }
        return 'None';
      case 'poolMeta':
        return rawData?.poolMeta || "N/A";
      case 'project':
        return pool.project || "N/A";
      case 'platform':
        return pool.platform.displayName;
      case 'chain':
        return pool.chain.displayName;
      default:
        return "N/A";
    }
  };

  const fields = [
    { key: 'tokenPair', label: 'Token Pair' },
    { key: 'apy', label: 'APY (%)' },
    { key: 'tvl', label: 'TVL ($)' },
    { key: 'riskLevel', label: 'Risk Level' },
    { key: 'poolAddress', label: 'Pool Address' },
    { key: 'underlyingTokens', label: 'Underlying Tokens' },
    { key: 'poolMeta', label: 'Pool Meta' },
    { key: 'project', label: 'Project' },
    { key: 'platform', label: 'Platform' },
    { key: 'chain', label: 'Chain' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Consolidate Pools ({pools.length} pools)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Field Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Data Sources</h3>
            <div className="text-sm text-muted-foreground">
              Choose which pool to take each field from. The consolidated pool will combine the selected data.
            </div>
            
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label className="text-sm font-medium">{field.label}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pools.map((pool) => (
                    <Card 
                      key={`${field.key}-${pool.id}`}
                      className={`cursor-pointer transition-all ${
                        selectedFields[field.key] === pool.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => handleFieldSelection(field.key, pool.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Checkbox 
                            checked={selectedFields[field.key] === pool.id}
                            onChange={() => {}}
                          />
                          <Badge variant="outline" className="text-xs">
                            {pool.platform.displayName}
                          </Badge>
                        </div>
                        <div className="text-sm font-mono break-all">
                          {getFieldValue(pool, field.key)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Consolidated Pool Preview
            </h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Token Pair:</strong> {consolidatedData.tokenPair}</div>
                  <div><strong>APY:</strong> {consolidatedData.apy}%</div>
                  <div><strong>TVL:</strong> ${parseFloat(consolidatedData.tvl).toLocaleString()}</div>
                  <div><strong>Risk Level:</strong> {consolidatedData.riskLevel}</div>
                  <div className="col-span-1 md:col-span-2">
                    <strong>Underlying Tokens:</strong> 
                    {Array.isArray(consolidatedData.underlyingTokens) && consolidatedData.underlyingTokens.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {consolidatedData.underlyingTokens.map((token: string, index: number) => {
                          // Handle Ethereum addresses - convert to friendly names where possible
                          const displayToken = token === "0x0000000000000000000000000000000000000000" ? "ETH" : 
                                             token.startsWith("0x") ? `${token.slice(0, 6)}...${token.slice(-4)}` : 
                                             token;
                          return (
                            <Badge key={index} variant="outline" className="text-xs">
                              {displayToken}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground"> None</span>
                    )}
                  </div>
                  <div><strong>Pool Meta:</strong> {consolidatedData.poolMeta || "N/A"}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this consolidated pool..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createConsolidatedPoolMutation.isPending}
            >
              {createConsolidatedPoolMutation.isPending ? "Creating..." : "Create Consolidated Pool"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}