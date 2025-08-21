import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  TrendingUp,
  Info 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddressLink } from "@/components/entity-links";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface PoolData {
  id: string;
  name: string;
  protocol: string;
  network: string;
  tokenPair: string;
}

interface Holder {
  rank: number;
  address: string;
  balance: string;
  valueUsd: number;
  percentage: number;
  portfolioValue?: number;
}

interface HoldersResponse {
  holders: Holder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  specialCase?: {
    message: string;
    isReadonly?: boolean;
  };
  lidoNote?: {
    isLido: boolean;
    actualTotal: number;
    displayLimit: number;
  };
}

export default function PoolHoldersPage() {
  const { network, protocol, tokenPair } = useParams();
  const [page, setPage] = useState(1);
  const limit = 100;

  // First fetch pool info to get pool ID
  const { data: poolData, isLoading: poolLoading } = useQuery<PoolData>({
    queryKey: [`/api/pools/find/${network}/${protocol}/${tokenPair}`],
    enabled: !!network && !!protocol && !!tokenPair,
  });

  // Then fetch holders data
  const { data: holdersData, isLoading, error } = useQuery<HoldersResponse>({
    queryKey: [`/api/pools/${poolData?.id}/holders`, page, limit],
    enabled: !!poolData?.id,
  });

  // Set browser tab title
  useEffect(() => {
    if (poolData) {
      document.title = `${poolData.name || tokenPair} Holders - ${protocol} on ${network} | Vault Aggregator`;
    }
  }, [poolData, tokenPair, protocol, network]);

  // Format balance display
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  // Format USD value
  const formatUsdValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (holdersData && page < holdersData.pagination.totalPages) {
      setPage(page + 1);
    }
  };

  if (poolLoading || isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Holders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Failed to load holder data. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  if (!holdersData || holdersData.holders.length === 0) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Token Holders</CardTitle>
              </div>
              <CardDescription>
                {poolData?.name || `${tokenPair} Pool`} on {protocol}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No holder data available</p>
                <p className="text-sm">
                  Holder information requires specialized API integration
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const { holders, pagination, lidoNote } = holdersData;
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, pagination.total);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Token Holders</CardTitle>
                </div>
                <CardDescription>
                  {poolData?.name || `${tokenPair} Pool`} on {protocol}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary">
                  {(lidoNote?.actualTotal || pagination.total).toLocaleString()} Total Holders
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.history.back()}
                >
                  Back to Pool
                </Button>
              </div>
            </div>
            {lidoNote?.isLido && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400">
                  Showing top {lidoNote.displayLimit.toLocaleString()} of {lidoNote.actualTotal.toLocaleString()} Lido stETH holders
                </p>
              </div>
            )}
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
                <div className="col-span-2">Share %</div>
              </div>

              {/* Holders List */}
              {holders.map((holder) => (
                <div 
                  key={holder.address} 
                  className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded-lg px-2"
                >
                  <div className="col-span-1">
                    <Badge variant={holder.rank <= 3 ? "default" : "secondary"}>
                      #{holder.rank}
                    </Badge>
                  </div>
                  
                  <div className="col-span-3">
                    <AddressLink 
                      address={holder.address}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatBalance(holder.balance)}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="font-medium">{formatUsdValue(holder.valueUsd)}</span>
                  </div>
                  
                  <div className="col-span-2">
                    {holder.portfolioValue ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{formatUsdValue(holder.portfolioValue)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <Badge variant="outline">
                      {holder.percentage.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex} to {endIndex} of {pagination.total} holders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      if (pagination.totalPages <= 5) {
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      
                      // Show smart pagination for many pages
                      if (pageNum === 1 || pageNum === pagination.totalPages || 
                          (pageNum >= page - 1 && pageNum <= page + 1)) {
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      
                      if ((pageNum === 2 && page > 3) || 
                          (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2)) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      
                      return null;
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}