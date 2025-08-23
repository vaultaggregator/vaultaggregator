import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Activity, 
  ChevronLeft, 
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
  type: 'deposit' | 'withdraw';
  user: string;
  amount: number;
  amountUSD: number;
  transactionHash: string;
  timestamp: string;
  blockNumber?: string;
  asset?: string;
  direction?: string;
}

interface TransfersAPIResponse {
  success: boolean;
  data?: {
    poolId: string;
    poolName: string;
    contractAddress: string;
    network: string;
    transactions: Transaction[];
    summary: {
      totalDeposits: number;
      totalWithdrawals: number;
      totalVolumeUSD: number;
      depositsVolumeUSD: number;
      withdrawalsVolumeUSD: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: Date;
  };
  error?: string;
}

export default function PoolTransfersPage() {
  const { network, protocol, tokenPair } = useParams();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');

  // First fetch pool info to get pool ID
  const { data: poolData, isLoading: poolLoading } = useQuery<PoolData>({
    queryKey: [`/api/pools/find/${network}/${protocol}/${tokenPair}`],
    enabled: !!network && !!protocol && !!tokenPair,
  });

  // Fetch real transfer data from API (last 15 transfers)
  const { data: transfersResponse, isLoading: transfersLoading, error: transfersError } = useQuery<TransfersAPIResponse>({
    queryKey: [`/api/transfers/pool/${poolData?.id}?limit=15`],
    enabled: !!poolData?.id,
  });

  // Set browser tab title
  useEffect(() => {
    if (poolData) {
      document.title = `${poolData.name || tokenPair} Transfers - ${protocol} on ${network} | Vault Aggregator`;
    }
  }, [poolData, tokenPair, protocol, network]);

  // Get transactions from response data
  const allTransfers = transfersResponse?.data?.transactions || [];

  // Filter transactions
  const filteredTransfers = filter === 'all' 
    ? allTransfers 
    : allTransfers.filter(t => t.type === filter);

  // Format functions
  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`;
    return amount.toFixed(4);
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

  const isLoading = poolLoading || transfersLoading;

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4 gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
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

  // Get summary from API response or calculate from filtered transfers
  const deposits = filteredTransfers.filter(t => t.type === 'deposit');
  const withdrawals = filteredTransfers.filter(t => t.type === 'withdraw');
  const totalVolume = filteredTransfers.reduce((sum, t) => sum + t.amountUSD, 0);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-4 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5" />
                  <CardTitle>Transfer History</CardTitle>
                </div>
                <CardDescription>
                  {poolData?.name || `${tokenPair} Pool`} on {protocol} - Last 15 Transfers
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

            {/* Summary Stats - Only show if we have data */}
            {transfersResponse?.data?.summary && (
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
                        <p className="text-sm text-muted-foreground">Total Volume</p>
                        <p className="text-xl font-bold">{formatCurrency(totalVolume)}</p>
                      </div>
                      <DollarSign className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Transactions List - Show last 15 transfers */}
            <div className="space-y-2">
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((tx, index) => (
                  <Card key={`${tx.transactionHash}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.type)}
                            <Badge variant={getTransactionBadgeVariant(tx.type)}>
                              {getTransactionTypeLabel(tx.type)}
                            </Badge>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <AddressLink 
                                address={tx.user} 
                                chainId={network === 'base' ? '8c22f749-65ca-4340-a4c8-fc837df48928' : '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7'}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold">{formatAmount(tx.amount)} {tx.asset || 'USDC'}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(tx.amountUSD)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEtherscan(tx.transactionHash)}
                            className="gap-1"
                          >
                            {formatTxHash(tx.transactionHash)}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : transfersError ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="text-muted-foreground">
                      Error loading transfers. Please try again later.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No transfers found for this pool.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {filter !== 'all' ? 'Try adjusting your filter or check back later.' : 'Check back later for new transactions.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Status Message */}
            {filteredTransfers.length > 0 && (
              <div className="text-sm text-muted-foreground text-center mt-4">
                Showing last {filteredTransfers.length} transfer{filteredTransfers.length !== 1 ? 's' : ''} for this pool
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}