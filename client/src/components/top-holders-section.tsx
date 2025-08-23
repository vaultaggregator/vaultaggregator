import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, Crown } from "lucide-react";
import { AddressLink } from "@/components/entity-links";

interface TopHolder {
  id: string;
  address: string;
  balance: number;
  balanceUSD: number;
  percentage: number;
  rank: number;
}

interface TopHoldersSectionProps {
  poolId: string;
  chainName?: string;
}

export function TopHoldersSection({ poolId, chainName }: TopHoldersSectionProps) {
  // Hardcoded data for now - will be replaced with real API
  const mockHolders: TopHolder[] = [
    {
      id: '1',
      address: '0xA0b86a33E6441527176204E711E4d9C5dD3CE0C8',
      balance: 2450000,
      balanceUSD: 2449800,
      percentage: 12.45,
      rank: 1
    },
    {
      id: '2',
      address: '0x742d35Cc6596C44562Ff8C1DB728b58D4e32c50F',
      balance: 1890000,
      balanceUSD: 1889650,
      percentage: 9.61,
      rank: 2
    },
    {
      id: '3',
      address: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
      balance: 1520000,
      balanceUSD: 1519740,
      percentage: 7.73,
      rank: 3
    },
    {
      id: '4',
      address: '0x5A52E96BAcdaBb82fd05763E25335261B270Efcb',
      balance: 1285000,
      balanceUSD: 1284710,
      percentage: 6.53,
      rank: 4
    },
    {
      id: '5',
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      balance: 980000,
      balanceUSD: 979800,
      percentage: 4.98,
      rank: 5
    }
  ];

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
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Holder Address</div>
            <div className="col-span-3">Balance</div>
            <div className="col-span-3">Percentage</div>
          </div>

          {/* Holders List */}
          <div className="space-y-3">
            {mockHolders.map((holder) => (
              <div key={holder.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors rounded-lg px-2">
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    {getRankIcon(holder.rank)}
                    <Badge variant={getRankBadgeVariant(holder.rank)} className="text-xs">
                      #{holder.rank}
                    </Badge>
                  </div>
                </div>
                
                <div className="col-span-5">
                  <AddressLink 
                    address={holder.address}
                    className="font-mono text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  />
                </div>

                <div className="col-span-3">
                  <div className="font-semibold text-sm">
                    {formatAmount(holder.balance)} USDC
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${formatAmount(holder.balanceUSD)}
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="font-semibold text-sm">
                    {holder.percentage.toFixed(2)}%
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