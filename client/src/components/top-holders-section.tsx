import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, Crown, Loader2, AlertCircle } from "lucide-react";
import { AddressLink } from "@/components/entity-links";
import { useQuery } from "@tanstack/react-query";

interface PoolHolder {
  id: string;
  address: string;
  balance: string;
  balanceUSD: string;
  percentage: string;
  rank: number;
  txCount?: number | null;
  firstSeen?: string | null;
}

interface TopHoldersSectionProps {
  poolId: string;
  chainName?: string;
}

export function TopHoldersSection({ poolId, chainName }: TopHoldersSectionProps) {
  // Fetch real holder data from the API
  const { data: holders = [], isLoading, error } = useQuery<PoolHolder[]>({
    queryKey: [`/api/pools/${poolId}/holders`],
    enabled: !!poolId,
    staleTime: 60000, // Cache for 1 minute
  });

  // Get only the top 5 holders
  const topHolders = holders.slice(0, 5);

  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Crown className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Crown className="h-4 w-4 text-amber-600" />;
      default:
        return <Wallet className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRankBadgeVariant = (rank: number): "default" | "secondary" | "destructive" | "outline" => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";  
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  // Parse balanceUSD to get numeric value
  const parseBalanceUSD = (balanceUSD: string | null | undefined): number => {
    if (!balanceUSD) return 0;
    return parseFloat(balanceUSD.replace(/[^0-9.-]/g, ''));
  };

  // Extract token symbol from balance display (usually the last word)
  const getTokenSymbol = (holder: PoolHolder): string => {
    // Try to detect token symbol from the balance
    // For now, default to USDC as most pools are USDC-based
    // This could be enhanced to get the actual token from pool data
    return 'USDC';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Top 5 Holders</CardTitle>
            </div>
            <CardDescription>
              Largest token holders in this vault
            </CardDescription>
          </div>
          <button
            onClick={() => {
              const parts = window.location.pathname.split('/');
              const network = parts[2];
              const protocol = parts[3];
              const tokenPair = parts[4];
              window.location.href = `/yield/${network}/${protocol}/${tokenPair}/holders`;
            }}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View all →
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading holders...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-5 w-5 text-destructive mr-2" />
            <span className="text-sm text-destructive">Failed to load holder data</span>
          </div>
        ) : topHolders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No holder data available for this pool
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide border-b pb-2">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Address</div>
              <div className="col-span-3">Balance</div>
              <div className="col-span-4">Percent</div>
            </div>

            {/* Holders List */}
            <div className="space-y-3">
              {topHolders.map((holder) => {
                const balanceUSDValue = parseBalanceUSD(holder.balanceUSD);
                const tokenSymbol = getTokenSymbol(holder);
                
                return (
                  <div key={holder.id} className="grid grid-cols-12 gap-4 items-center h-[44px] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="col-span-1 text-[13px] text-center">
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        {holder.rank}
                      </span>
                    </div>
                    
                    <div className="col-span-4">
                      <AddressLink 
                        address={holder.address}
                        className="font-mono text-[13px] text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      />
                    </div>

                    <div className="col-span-3 text-[13px] text-right tabular-nums">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {formatAmount(balanceUSDValue)}
                      </div>
                    </div>

                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full transition-all duration-300"
                              style={{ width: `${Math.min(parseFloat(holder.percentage), 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-[13px] text-gray-900 dark:text-gray-100 tabular-nums min-w-[45px] text-right">
                          {parseFloat(holder.percentage).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}