import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowUpRight, ArrowDownRight, Activity, Clock, DollarSign, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AddressLink, TransactionLink } from "@/components/entity-links";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VaultTransaction {
  transactionHash: string;
  logIndex: number;
  blockNumber: number;
  timestamp: string;
  type: 'deposit' | 'withdraw';
  direction: 'in' | 'out';
  user: string;
  sender?: string;
  owner?: string;
  amount: number;
  amountUSD: number;
  shares: number;
  asset: string;
  eventType: string;
}

interface VaultActivityResponse {
  poolId: string;
  poolName: string;
  contractAddress: string;
  network: string;
  transactions: VaultTransaction[];
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
  timestamp: string;
}

interface VaultActivitySectionProps {
  poolId: string;
  chainName?: string;
}

export function VaultActivitySection({ poolId, chainName }: VaultActivitySectionProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: activityData, isLoading, error, refetch } = useQuery<{success: boolean; data: VaultActivityResponse}>({
    queryKey: [`/api/transfers/pool/${poolId}?limit=5`, filter],
    queryFn: async () => {
      const response = await fetch(`/api/transfers/pool/${poolId}?limit=5`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transfers: ${response.status}`);
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refetch every 30 seconds if auto-refresh is on
  });

  // Auto-refresh toggle effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTxHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Function removed - now using internal TransactionLink component

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Vault Deposit';
      case 'withdraw':
        return 'Vault Withdraw';
      case 'fee':
        return 'Vault Fee';
      default:
        return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'withdraw':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'fee':
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'default' as const;
      case 'withdraw':
        return 'destructive' as const;
      case 'fee':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Last Transfers</CardTitle>
          </div>
          <CardDescription>
            Loading vault activity...
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

  if (error || !activityData || !activityData.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Last Transfers</CardTitle>
          </div>
          <CardDescription>
            Unable to load vault activity at this time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Vault activity data is currently unavailable.</p>
            <p className="text-sm mt-2">This feature requires blockchain event monitoring.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { transactions } = activityData.data;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Last 5 Transfers</CardTitle>
            </div>
            <CardDescription>
              Recent deposits and withdrawals from the vault
            </CardDescription>
          </div>
          <button
            onClick={() => {
              const parts = window.location.pathname.split('/');
              const network = parts[2];
              const protocol = parts[3];
              const tokenPair = parts[4];
              window.location.href = `/yield/${network}/${protocol}/${tokenPair}/transfers`;
            }}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View all →
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Type</div>
            <div className="col-span-3">Amount</div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Transaction</div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
                <p className="text-sm mt-2">Try changing the filter or check back later</p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={`${transaction.transactionHash}-${transaction.logIndex}`} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded-lg px-2">
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <Badge variant={getTransactionBadgeVariant(transaction.type)} className="text-xs">
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </div>
                  </div>

                  <div className="col-span-3">
                    <div className="font-semibold text-sm flex items-center gap-1">
                      {transaction.type === 'withdraw' && '-'}
                      {transaction.type === 'deposit' && '+'}
                      {formatAmount(transaction.amount)} {transaction.asset}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <AddressLink 
                      address={transaction.user}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    />
                  </div>

                  <div className="col-span-2">
                    <TransactionLink
                      txHash={transaction.transactionHash}
                      network={chainName?.toLowerCase() === 'base' ? 'base' : 'ethereum'}
                      className="text-sm"
                    >
                      {formatTxHash(transaction.transactionHash)}
                    </TransactionLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}