import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";

interface PoolDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId: string;
  poolData: any;
}

interface DisplayMapping {
  field: string;
  displayLocation: string;
  isVisible: boolean;
  label: string;
}

const DISPLAY_LOCATIONS = [
  { value: 'card-main', label: 'Main Card Display' },
  { value: 'card-secondary', label: 'Secondary Card Info' },
  { value: 'detail-primary', label: 'Detail Page Primary' },
  { value: 'detail-secondary', label: 'Detail Page Secondary' },
  { value: 'admin-only', label: 'Admin Only' },
  { value: 'hidden', label: 'Hidden' }
];

export default function PoolDataModal({ isOpen, onClose, poolId, poolData }: PoolDataModalProps) {
  const [displayMappings, setDisplayMappings] = useState<DisplayMapping[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (poolData && isOpen) {
      initializeDisplayMappings();
    }
  }, [poolData, isOpen]);

  const initializeDisplayMappings = () => {
    const mappings: DisplayMapping[] = [];
    
    // Core pool fields
    const coreFields = {
      'tokenPair': { label: 'Token Pair', defaultLocation: 'card-main' },
      'apy': { label: 'Current APY', defaultLocation: 'card-main' },
      'tvl': { label: 'TVL', defaultLocation: 'card-main' },
      'riskLevel': { label: 'Risk Level', defaultLocation: 'card-main' },
      'platform.displayName': { label: 'Platform Name', defaultLocation: 'card-main' },
      'chain.displayName': { label: 'Chain Name', defaultLocation: 'card-main' },
      'project': { label: 'Data Source', defaultLocation: 'admin-only' },
      'isVisible': { label: 'Visibility Status', defaultLocation: 'admin-only' },
      'isActive': { label: 'Active Status', defaultLocation: 'admin-only' },
      'lastUpdated': { label: 'Last Updated', defaultLocation: 'admin-only' },
      'createdAt': { label: 'Created At', defaultLocation: 'admin-only' },
      'rawData.underlyingTokens': { label: 'Underlying Tokens', defaultLocation: 'detail-secondary' }
    };

    // Add core fields
    Object.entries(coreFields).forEach(([field, config]) => {
      mappings.push({
        field,
        displayLocation: config.defaultLocation,
        isVisible: config.defaultLocation !== 'hidden',
        label: config.label
      });
    });

    // Add rawData fields if they exist
    if (poolData.rawData) {
      Object.keys(poolData.rawData).forEach(key => {
        const label = formatFieldLabel(key);
        const defaultLocation = getDefaultLocationForRawField(key);
        
        mappings.push({
          field: `rawData.${key}`,
          displayLocation: defaultLocation,
          isVisible: defaultLocation !== 'hidden',
          label: `${label} (Raw Data)`
        });
      });
    }

    setDisplayMappings(mappings);
  };

  const formatFieldLabel = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/apy/gi, 'APY')
      .replace(/tvl/gi, 'TVL')
      .replace(/usd/gi, 'USD');
  };

  const getDefaultLocationForRawField = (field: string): string => {
    const mainFields = ['apyBase', 'apyMean30d', 'tvlUsd', 'count'];
    const secondaryFields = ['apyPct1D', 'apyPct7D', 'apyPct30D', 'volumeUsd1d', 'volumeUsd7d', 'underlyingTokens'];
    
    if (mainFields.includes(field)) return 'card-main';
    if (secondaryFields.includes(field)) return 'card-secondary';
    return 'detail-secondary';
  };

  const getFieldValue = (field: string): any => {
    if (!poolData) return null;
    
    if (field.startsWith('rawData.')) {
      const rawField = field.replace('rawData.', '');
      return poolData.rawData?.[rawField];
    }
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return poolData[parent]?.[child];
    }
    
    return poolData[field];
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      // Special formatting for arrays like underlyingTokens
      if (value.length === 0) return 'None';
      if (value.length <= 3) return value.join(', ');
      return `${value.slice(0, 2).join(', ')} +${value.length - 2} more`;
    }
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'number') return formatNumber(value, { maxDecimals: 2 });
    return String(value);
  };

  const updateMapping = (index: number, updates: Partial<DisplayMapping>) => {
    setDisplayMappings(prev => 
      prev.map((mapping, i) => 
        i === index ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/pools/${poolId}/display-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayMappings })
      });

      if (!response.ok) {
        throw new Error('Failed to save display configuration');
      }

      toast({
        title: "Configuration Saved",
        description: "Pool display configuration has been updated successfully.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save display configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const groupedMappings = displayMappings.reduce((acc, mapping) => {
    const location = mapping.displayLocation;
    if (!acc[location]) acc[location] = [];
    acc[location].push(mapping);
    return acc;
  }, {} as Record<string, DisplayMapping[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <span>Pool Data Configuration</span>
            <Badge variant="outline" className="text-xs">
              {poolData?.project?.toUpperCase() || 'UNKNOWN'} Source
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Left Panel - Raw Data View */}
          <div className="flex flex-col min-h-0">
            <h3 className="font-semibold text-lg border-b pb-2 flex-shrink-0">All Available Data</h3>
            <ScrollArea className="flex-1 mt-4">
              <div className="space-y-4 pr-4">
                
                {/* Core Pool Data */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Core Pool Information</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">Token Pair:</span>
                      <span>{poolData?.tokenPair || 'N/A'}</span>
                      
                      <span className="font-medium">Platform:</span>
                      <span>{poolData?.platform?.displayName || 'N/A'}</span>
                      
                      <span className="font-medium">Chain:</span>
                      <span>{poolData?.chain?.displayName || 'N/A'}</span>
                      
                      <span className="font-medium">Current APY:</span>
                      <span>{poolData?.apy ? `${parseFloat(poolData.apy).toFixed(2)}%` : 'N/A'}</span>
                      
                      <span className="font-medium">TVL:</span>
                      <span>{poolData?.tvl ? formatNumber(parseFloat(poolData.tvl), { currency: '$', maxDecimals: 2 }) : 'N/A'}</span>
                      
                      <span className="font-medium">Risk Level:</span>
                      <span className="capitalize">{poolData?.riskLevel || 'N/A'}</span>
                      
                      <span className="font-medium">Data Source:</span>
                      <span className="capitalize">{poolData?.project || 'N/A'}</span>
                      
                      <span className="font-medium">Visible:</span>
                      <span>{poolData?.isVisible ? 'Yes' : 'No'}</span>
                      
                      <span className="font-medium">Active:</span>
                      <span>{poolData?.isActive ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Underlying Tokens */}
                {poolData?.rawData?.underlyingTokens && Array.isArray(poolData.rawData.underlyingTokens) && poolData.rawData.underlyingTokens.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Underlying Tokens</h4>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {poolData.rawData.underlyingTokens.map((token: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {token}
                          </Badge>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">
                        Total: {poolData.rawData.underlyingTokens.length} token{poolData.rawData.underlyingTokens.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw API Data */}
                {poolData?.rawData && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Raw API Data</h4>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(poolData.rawData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Metadata</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="font-medium">Pool ID:</span>
                      <span className="font-mono text-xs">{poolData?.id}</span>
                      
                      <span className="font-medium">Created:</span>
                      <span>{poolData?.createdAt ? new Date(poolData.createdAt).toLocaleDateString() : 'N/A'}</span>
                      
                      <span className="font-medium">Last Updated:</span>
                      <span>{poolData?.lastUpdated ? new Date(poolData.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                      
                      <span className="font-medium">DeFi Llama ID:</span>
                      <span className="font-mono text-xs">{poolData?.defiLlamaId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Display Configuration */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-lg">Display Configuration</h3>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="gap-2"
                data-testid="button-save-config"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Config'}
              </Button>
            </div>
            
            <ScrollArea className="flex-1 mt-4">
              <div className="space-y-4 pr-4">
                {Object.entries(DISPLAY_LOCATIONS).map(([_, location]) => {
                  const mappingsForLocation = groupedMappings[location.value] || [];
                  
                  return (
                    <div key={location.value} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        {location.label}
                        <Badge variant="secondary" className="text-xs">
                          {mappingsForLocation.filter(m => m.isVisible).length} visible
                        </Badge>
                      </h4>
                      
                      <div className="space-y-2">
                        {displayMappings.map((mapping, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm">
                            <Checkbox
                              checked={mapping.isVisible && mapping.displayLocation === location.value}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updateMapping(index, { 
                                    isVisible: true, 
                                    displayLocation: location.value 
                                  });
                                } else {
                                  updateMapping(index, { isVisible: false });
                                }
                              }}
                              data-testid={`checkbox-field-${mapping.field}`}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <Label className="text-xs font-medium truncate block">
                                {mapping.label}
                              </Label>
                              <div className="text-xs text-muted-foreground truncate">
                                {formatValue(getFieldValue(mapping.field))}
                              </div>
                            </div>
                            
                            {mapping.isVisible && mapping.displayLocation === location.value && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                        ))}
                        
                        {mappingsForLocation.length === 0 && (
                          <div className="text-xs text-muted-foreground italic py-2">
                            No fields configured for this location
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}