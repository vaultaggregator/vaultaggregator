import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Users, Wallet, TrendingUp, ExternalLink } from "lucide-react";

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
}

interface HoldersSectionProps {
  poolId: string;
  tokenSymbol?: string;
}

export function HoldersSection({ poolId, tokenSymbol = "Token" }: HoldersSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 20;

  const { data: holdersData, isLoading, error } = useQuery<HoldersResponse>({
    queryKey: [`/api/pools/${poolId}/holders`, currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/pools/${poolId}/holders?page=${currentPage}&limit=${limit}`);
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
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Top Holders</CardTitle>
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
            <CardTitle>Top Holders</CardTitle>
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

  const { holders, pagination } = holdersData;

  // Handle case where no authentic holder data is available
  if (holders.length === 0 && pagination.total === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Top Holders</CardTitle>
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
            <CardTitle>Top Holders</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            {pagination.total} Total
          </Badge>
        </div>
        <CardDescription>
          Real-time holder distribution from Etherscan blockchain data
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
            <div className="col-span-2">Wallet ETH</div>
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
                    <button
                      onClick={() => openEtherscan(holder.address)}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                      data-testid={`link-etherscan-${holder.address}`}
                    >
                      {formatAddress(holder.address)}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {formatNumber(parseFloat(holder.tokenBalance))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tokenSymbol}
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
                      {holder.walletBalanceEth != null ? holder.walletBalanceEth.toFixed(2) : '0.00'} ETH
                    </div>
                    <div className="text-xs text-muted-foreground">
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} holders
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1}
                  data-testid="button-previous-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {pagination.pages > 5 && (
                    <>
                      {pagination.pages > 6 && <span className="text-muted-foreground">...</span>}
                      <Button
                        variant={pagination.pages === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pagination.pages)}
                        className="w-8 h-8 p-0"
                        data-testid={`button-page-${pagination.pages}`}
                      >
                        {pagination.pages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={pagination.page >= pagination.pages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}