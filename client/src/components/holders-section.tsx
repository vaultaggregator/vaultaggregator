import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Users, Wallet, TrendingUp, ExternalLink, ChevronsLeft, ChevronsRight, Info, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Holder {
  address: string;
  tokenBalance: string;
  usdValue: number;
  walletBalanceEth: number;
  walletBalanceUsd: number;
  poolSharePercentage: number;
  rank: number;
}

interface HoldersResponse {
  holders: Holder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  specialCase?: {
    isLido: boolean;
    message: string;
    totalHolders: number;
  };
  lidoNote?: {
    isLido: boolean;
    actualTotal: number;
    sampleSize: number;
  };
}

interface HoldersSectionProps {
  poolId: string;
  tokenSymbol?: string;
  chainName?: string;
}

export function HoldersSection({ poolId, tokenSymbol = "Token", chainName }: HoldersSectionProps) {
  const limit = 5; // Only show top 5 holders

  const { data: holdersData, isLoading, error } = useQuery<HoldersResponse>({
    queryKey: [`/api/pools/${poolId}/holders`],
    queryFn: async () => {
      const response = await fetch(`/api/pools/${poolId}/holders?page=1&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch holders data');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num == null || isNaN(num)) return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number | null | undefined) => {
    if (percentage == null || isNaN(percentage)) return '0.00%';
    return `${percentage.toFixed(2)}%`;
  };

  const openEtherscan = (address: string) => {
    // Use Basescan for Base network, Etherscan for others
    const explorerUrl = chainName?.toLowerCase() === 'base' 
      ? `https://basescan.org/address/${address}`
      : `https://etherscan.io/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>All Holders</CardTitle>
          </div>
          <CardDescription>
            Loading holder information...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !holdersData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>All Holders</CardTitle>
          </div>
          <CardDescription>
            Unable to load holder information at this time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Holder data is currently unavailable.</p>
            <p className="text-sm mt-2">This feature requires synchronization from blockchain data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { holders, pagination, specialCase, lidoNote } = holdersData;

  // Handle case where no authentic holder data is available
  if (holders.length === 0 && pagination.total === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>All Holders</CardTitle>
          </div>
          <CardDescription>
            Token holder data not currently available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Holder data requires specialized API integration</p>
            <p className="text-sm">
              Professional token analytics services are needed to provide authentic holder information
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Top 5 Holders</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {(lidoNote?.actualTotal || pagination.total).toLocaleString()} Total Holders
            </Badge>
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
        </div>
        <CardDescription>
          <div className="space-y-1">
            <div>
              {lidoNote?.isLido ? (
                <>Showing top 5 of {lidoNote.actualTotal.toLocaleString()} holders • Lido stETH</>
              ) : (
                <>Showing top 5 holders</>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>Portfolio values only include assets from networks, protocols and tokens tracked by our platform</span>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Address</div>
            <div className="col-span-2">Balance</div>
            <div className="col-span-2">USD Value</div>
            <div className="col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      Portfolio Value
                      <Info className="h-3 w-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Portfolio values only include assets from networks, protocols and tokens tracked by our platform</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="col-span-2">Pool Share</div>
          </div>

          {/* Holders List */}
          <div className="space-y-3">
            {holders.map((holder) => (
              <div key={holder.address} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded-lg px-2">
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{holder.rank}</span>
                  </div>
                </div>
                
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/profile/${holder.address}`}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                      data-testid={`link-profile-${holder.address}`}
                    >
                      {formatAddress(holder.address)}
                      <User className="h-3 w-3" />
                    </Link>
                    <button
                      onClick={() => openEtherscan(holder.address)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      title="View on Etherscan"
                      data-testid={`link-etherscan-${holder.address}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {formatNumber(parseFloat(holder.tokenBalance))}
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm font-medium">
                    {formatCurrency(holder.usdValue)}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      {formatCurrency(holder.walletBalanceUsd)}
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-medium">
                      {formatPercentage(holder.poolSharePercentage)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}