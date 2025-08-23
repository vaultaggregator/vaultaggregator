import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

interface TopHolder {
  address: string;
  balance: string;
  pct: number;
}

interface TopHoldersData {
  updatedAt: string;
  tokenAddress: string;
  totalSupply?: string;
  holders: TopHolder[];
  metadata: {
    chainId: string;
    poolId: string;
    transfersProcessed: number;
    fromBlock: number;
    toBlock: number;
    processingTimeMs: number;
  };
}

interface TopHoldersSectionProps {
  poolId: string;
  chain: string;
  protocol: string;
  vault: string;
}

export function TopHoldersSection({ poolId, chain, protocol, vault }: TopHoldersSectionProps) {
  const [data, setData] = useState<TopHoldersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTopHolders = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      
      const response = await fetch(`/api/top-holders/${chain}/${protocol}/${vault}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        setIsStale(result.isStale || false);
        setError(null);
      } else if (result.success && !result.data) {
        // No data yet, background build is happening
        setData(null);
        setError(null);
        console.log('Top holders data is being generated...');
      } else {
        setError(result.message || 'Failed to load top holders');
      }
    } catch (err) {
      console.error('Error fetching top holders:', err);
      setError('Failed to load top holders data');
    } finally {
      setIsLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Trigger revalidation
      const response = await fetch(`/api/revalidate/top-holders/${chain}/${protocol}/${vault}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({
          title: "Refresh triggered",
          description: "Top holders data is being updated...",
        });
        
        // Wait a bit then fetch new data
        setTimeout(() => {
          fetchTopHolders();
        }, 2000);
      } else {
        throw new Error('Failed to trigger refresh');
      }
    } catch (err) {
      console.error('Error refreshing top holders:', err);
      toast({
        title: "Refresh failed",
        description: "Failed to trigger data refresh",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string, decimals: number = 18) => {
    const value = Number(balance) / Math.pow(10, decimals);
    return formatNumber(value, 2);
  };

  const getExplorerUrl = (address: string) => {
    const baseUrl = chain === 'ethereum' ? 'https://etherscan.io' : 'https://basescan.org';
    return `${baseUrl}/address/${address}`;
  };

  useEffect(() => {
    fetchTopHolders();
    
    // Retry if no data after initial load
    const retryTimeout = setTimeout(() => {
      if (!data && !error) {
        fetchTopHolders();
      }
    }, 5000);

    return () => clearTimeout(retryTimeout);
  }, [chain, protocol, vault]);

  if (isLoading && !data) {
    return (
      <Card data-testid="top-holders-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Top Holders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Fetching top token holders...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card data-testid="top-holders-error">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top Holders
            <Button variant="outline" size="sm" onClick={() => fetchTopHolders(true)} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card data-testid="top-holders-building">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Top Holders
            <Button variant="outline" size="sm" onClick={() => fetchTopHolders(true)} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground">
              Generating top holders data... This may take a few minutes for the first time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="top-holders-section">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Top Holders
            {isStale && <Badge variant="secondary">Updating</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Top {data.holders.length} holders</span>
            <span>Updated {new Date(data.updatedAt).toLocaleString()}</span>
          </div>

          {/* Holders Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
              <span>Rank</span>
              <span>Address</span>
              <span>Balance</span>
              <span>Share %</span>
            </div>
            
            {data.holders.map((holder, index) => (
              <div key={holder.address} className="grid grid-cols-4 gap-4 text-sm items-center py-2 border-b border-border/50">
                <span className="font-medium">#{index + 1}</span>
                
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {formatAddress(holder.address)}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => copyAddress(holder.address)}
                    data-testid={`copy-address-${index}`}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(getExplorerUrl(holder.address), '_blank')}
                    data-testid={`view-address-${index}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                
                <span className="font-mono">
                  {formatBalance(holder.balance)}
                </span>
                
                <span className="font-medium">
                  {holder.pct.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
            <p>Processed {formatNumber(data.metadata.transfersProcessed)} transfers</p>
            <p>From block {formatNumber(data.metadata.fromBlock)} to {formatNumber(data.metadata.toBlock)}</p>
            <p>Processing time: {data.metadata.processingTimeMs}ms</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}