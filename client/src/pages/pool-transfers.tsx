import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  ExternalLink,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressLink } from "@/components/entity-links";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { formatDistanceToNow } from "date-fns";

interface PoolData {
  id: string;
  name: string;
  protocol: string;
  network: string;
  tokenPair: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  user: string;
  amount: number;
  amountUSD: number;
  transactionHash: string;
  timestamp: Date;
  blockNumber?: number;
  gasFee?: number;
}

interface TransfersResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalVolumeUSD: number;
  };
}

export default function PoolTransfersPage() {
  const { network, protocol, tokenPair } = useParams();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const limit = 100;

  // First fetch pool info to get pool ID
  const { data: poolData, isLoading: poolLoading } = useQuery<PoolData>({
    queryKey: [`/api/pools/find/${network}/${protocol}/${tokenPair}`],
    enabled: !!network && !!protocol && !!tokenPair,
  });

  // Mock data for transfers - in real implementation, this would come from API
  const mockTransfers: Transaction[] = Array.from({ length: 100 }, (_, i) => ({
    id: `tx-${i}`,
    type: Math.random() > 0.5 ? 'deposit' : 'withdraw',
    user: `0x${Math.random().toString(16).substr(2, 40)}`,
    amount: Math.random() * 10000,
    amountUSD: Math.random() * 10000 * 1.01,
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    blockNumber: 15000000 + Math.floor(Math.random() * 100000),
    gasFee: Math.random() * 0.01
  }));

  // Filter transactions
  const filteredTransfers = filter === 'all' 
    ? mockTransfers 
    : mockTransfers.filter(t => t.type === filter);

  // Paginate
  const totalPages = Math.ceil(filteredTransfers.length / limit);
  const paginatedTransfers = filteredTransfers.slice(
    (page - 1) * limit, 
    page * limit
  );

  // Format functions
  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
    return amount.toFixed(2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getTransactionIcon = (type: 'deposit' | 'withdraw') => {
    if (type === 'deposit') {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  const getTransactionBadgeVariant = (type: 'deposit' | 'withdraw') => {
    return type === 'deposit' ? 'default' : 'destructive';
  };

  const getTransactionTypeLabel = (type: 'deposit' | 'withdraw') => {
    return type === 'deposit' ? 'Deposit' : 'Withdrawal';
  };

  const openEtherscan = (hash: string) => {
    const baseUrl = network === 'base' 
      ? 'https://basescan.org'
      : 'https://etherscan.io';
    window.open(`${baseUrl}/tx/${hash}`, '_blank');
  };

  // Handle pagination
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  if (poolLoading) {
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

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, filteredTransfers.length);

  // Calculate summary
  const deposits = paginatedTransfers.filter(t => t.type === 'deposit');
  const withdrawals = paginatedTransfers.filter(t => t.type === 'withdraw');
  const totalVolume = paginatedTransfers.reduce((sum, t) => sum + t.amountUSD, 0);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>Transfer History</CardTitle>
                </div>
                <CardDescription>
                  {poolData?.name || `${tokenPair} Pool`} on {protocol}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter transfers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transfers</SelectItem>
                    <SelectItem value="deposit">Deposits Only</SelectItem>
                    <SelectItem value="withdraw">Withdrawals Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.history.back()}
                >
                  Back to Pool
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Deposits</p>
                      <p className="text-xl font-bold text-green-500">{deposits.length}</p>
                    </div>
                    <ArrowDownRight className="h-5 w-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Withdrawals</p>
                      <p className="text-xl font-bold text-red-500">{withdrawals.length}</p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Page Volume</p>
                      <p className="text-xl font-bold">{formatCurrency(totalVolume)}</p>
                    </div>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">USD Value</div>
                <div className="col-span-2">From/To</div>
                <div className="col-span-2">Transaction</div>
              </div>

              {/* Transfers List */}
              {paginatedTransfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No transfers found</p>
                  <p className="text-sm">
                    {filter !== 'all' ? 'Try changing the filter' : 'Check back later for transfer data'}
                  </p>
                </div>
              ) : (
                paginatedTransfers.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded-lg px-2"
                  >
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(transaction.timestamp, { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <Badge variant={getTransactionBadgeVariant(transaction.type)} className="text-xs">
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="font-semibold text-sm flex items-center gap-1">
                        {transaction.type === 'withdraw' && '-'}
                        {transaction.type === 'deposit' && '+'}
                        {formatAmount(transaction.amount)} USDC
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className="text-sm font-medium">{formatCurrency(transaction.amountUSD)}</span>
                    </div>

                    <div className="col-span-2">
                      <AddressLink 
                        address={transaction.user}
                        className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      />
                    </div>

                    <div className="col-span-2">
                      <button
                        onClick={() => openEtherscan(transaction.transactionHash)}
                        className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                        title={`View transaction on ${network === 'base' ? 'Basescan' : 'Etherscan'}`}
                      >
                        {formatTxHash(transaction.transactionHash)}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Pagination */}
              {filteredTransfers.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex} to {endIndex} of {filteredTransfers.length} transfers
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
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        if (totalPages <= 5) {
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
                        if (pageNum === 1 || pageNum === totalPages || 
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
                            (pageNum === totalPages - 1 && page < totalPages - 2)) {
                          return <span key={pageNum} className="px-2">...</span>;
                        }
                        
                        return null;
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}