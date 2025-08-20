import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Users, Wallet, TrendingUp, ExternalLink, ChevronsLeft, ChevronsRight, Info } from "lucide-react";
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
}

export function HoldersSection({ poolId, tokenSymbol = "Token" }: HoldersSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("");
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

  const handleGoToPage = () => {
    const page = parseInt(pageInput);
    if (page && page > 0 && page <= (holdersData?.pagination.pages || 1)) {
      setCurrentPage(page);
      setPageInput("");
    }
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
            <CardTitle>Top Holders</CardTitle>
            <span className="text-xs text-muted-foreground ml-2">(Up to 1,000)</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {(lidoNote?.actualTotal || pagination.total).toLocaleString()} Total Holders
          </Badge>
        </div>
        <CardDescription>
          <div className="space-y-1">
            <div>
              {lidoNote?.isLido ? (
                <>Showing top {lidoNote.sampleSize} of {lidoNote.actualTotal.toLocaleString()} holders • Lido stETH • Data from Etherscan</>
              ) : (
                <>Showing holders {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.total)} • Real-time blockchain data from Etherscan</>
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col gap-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages} • Total {pagination.total} holders
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
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
                  
                  {/* Page Numbers with First Page Button */}
                  <div className="flex items-center gap-1">
                    {/* First Page Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={pagination.page <= 1}
                      data-testid="button-first-page"
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
                      let end = Math.min(pagination.pages, start + maxVisible - 1);
                      
                      if (end - start < maxVisible - 1) {
                        start = Math.max(1, end - maxVisible + 1);
                      }
                      
                      if (start > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant={1 === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="w-8 h-8 p-0"
                            data-testid="button-page-1"
                          >
                            1
                          </Button>
                        );
                        if (start > 2) {
                          pages.push(<span key="dots1" className="text-muted-foreground px-1">...</span>);
                        }
                      }
                      
                      for (let i = start; i <= end; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={i === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="w-8 h-8 p-0"
                            data-testid={`button-page-${i}`}
                          >
                            {i}
                          </Button>
                        );
                      }
                      
                      if (end < pagination.pages) {
                        if (end < pagination.pages - 1) {
                          pages.push(<span key="dots2" className="text-muted-foreground px-1">...</span>);
                        }
                        pages.push(
                          <Button
                            key={pagination.pages}
                            variant={pagination.pages === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pagination.pages)}
                            className="w-8 h-8 p-0"
                            data-testid={`button-page-${pagination.pages}`}
                          >
                            {pagination.pages}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  {/* Next Button */}
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
                  
                  {/* Last Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pagination.pages)}
                    disabled={pagination.page >= pagination.pages}
                    data-testid="button-last-page"
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Go to Page Input - Moved to the right */}
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-sm text-muted-foreground">Go to page:</span>
                    <Input
                      type="number"
                      min="1"
                      max={pagination.pages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleGoToPage();
                        }
                      }}
                      className="w-16 h-8"
                      placeholder={`1-${pagination.pages}`}
                      data-testid="input-go-to-page"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGoToPage}
                      disabled={!pageInput || parseInt(pageInput) < 1 || parseInt(pageInput) > pagination.pages}
                      data-testid="button-go-to-page"
                      className="h-8 px-2"
                    >
                      Go
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}