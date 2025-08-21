import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowUpRight, ArrowDownRight, Activity, Clock, DollarSign, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AddressLink } from "@/components/entity-links";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VaultTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'fee';
  amount: number;
  amountUSD: number;
  user: string;
  transactionHash: string;
  timestamp: number;
  blockNumber: number;
}

interface VaultActivityResponse {
  transactions: VaultTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface VaultActivitySectionProps {
  poolId: string;
  chainName?: string;
}

export function VaultActivitySection({ poolId, chainName }: VaultActivitySectionProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: activityData, isLoading, error, refetch } = useQuery<VaultActivityResponse>({
    queryKey: [`/api/pools/${poolId}/activity`, filter],
    queryFn: async () => {
      // For now, return mock data - will be replaced with real API
      const mockTransactions: VaultTransaction[] = [
        {
          id: '1',
          type: 'withdraw',
          amount: 1622.27,
          amountUSD: 1622.11,
          user: '0xEeE5...f4e4',
          transactionHash: '0xdfd...3f9c',
          timestamp: Date.now() - 7 * 60 * 1000,
          blockNumber: 20589765
        },
        {
          id: '2',
          type: 'deposit',
          amount: 65000,
          amountUSD: 64990,
          user: '0xCa75...5c35',
          transactionHash: '0x3d7b...8014',
          timestamp: Date.now() - 17 * 60 * 1000,
          blockNumber: 20589750
        },
        {
          id: '3',
          type: 'deposit',
          amount: 104.86,
          amountUSD: 104.84,
          user: '0x0312...1734',
          transactionHash: '0x10aa...d1a6',
          timestamp: Date.now() - 19 * 60 * 1000,
          blockNumber: 20589745
        },
        {
          id: '4',
          type: 'withdraw',
          amount: 50,
          amountUSD: 49.99,
          user: '0xEeE5...f4e4',
          transactionHash: '0x35f8...5261',
          timestamp: Date.now() - 25 * 60 * 1000,
          blockNumber: 20589700
        },
        {
          id: '5',
          type: 'deposit',
          amount: 1600,
          amountUSD: 1599.84,
          user: '0xEeE5...f4e4',
          transactionHash: '0x98b7...8bff',
          timestamp: Date.now() - 36 * 60 * 1000,
          blockNumber: 20589650
        }
      ];

      // Filter transactions based on selected filter
      const filteredTransactions = filter === 'all' 
        ? mockTransactions.slice(0, 5)
        : mockTransactions.filter(tx => tx.type === filter).slice(0, 5);

      return {
        transactions: filteredTransactions,
        pagination: {
          page: 1,
          limit: 5,
          total: filteredTransactions.length,
          pages: 1
        }
      };
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

  const openEtherscan = (txHash: string) => {
    const explorerUrl = chainName?.toLowerCase() === 'base' 
      ? `https://basescan.org/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

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

  if (error || !activityData) {
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

  const { transactions } = activityData;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>Last 5 Transfers</CardTitle>
        </div>
        <CardDescription>
          Recent deposits and withdrawals from the vault
        </CardDescription>
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
                <div key={transaction.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded-lg px-2">
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(transaction.timestamp, { addSuffix: true })}</span>
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
                      {formatAmount(transaction.amount)} USDC
                    </div>
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
                      title={`View transaction on ${chainName === 'base' ? 'Basescan' : 'Etherscan'}`}
                    >
                      {formatTxHash(transaction.transactionHash)}
                      <ExternalLink className="h-3 w-3" />
                    </button>
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