import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Crown, Wallet, ExternalLink, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AddressLink, ProtocolLink, NetworkLink } from "@/components/entity-links";
import { parseYieldUrl } from "@/lib/pool-url-parser";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface PoolHolder {
  id: string;
  address: string;
  balance: number;
  balanceUSD: number;
  percentage: number;
  rank: number;
  firstSeen?: string;
  txCount?: number;
}

interface YieldOpportunity {
  id: string;
  tokenPair: string;
  chain: {
    id: string;
    name: string;
    displayName: string;
    iconUrl?: string;
  };
  platform: {
    id: string;
    name: string;
    displayName: string;
    logoUrl?: string;
  };
  poolAddress: string;
  apy?: string;
  tvl?: string;
  holdersCount?: number;
}

export default function PoolHoldersPage() {
  const params = useParams<{
    poolId?: string;
    network?: string;
    protocol?: string;
    tokenPair?: string;
  }>();

  const [searchTerm, setSearchTerm] = useState("");

  // Handle both new SEO URLs and legacy URLs
  const poolId = params.poolId;
  const urlInfo = parseYieldUrl(params);
  
  // Determine if we're using new URL format or legacy
  const isNewUrlFormat = !poolId && params.network && params.protocol && params.tokenPair;
  const apiEndpoint = isNewUrlFormat 
    ? `/api/pools/find/${params.network}/${params.protocol}/${params.tokenPair}`
    : `/api/pools/${poolId}`;

  const { data: pool, isLoading: poolLoading } = useQuery<YieldOpportunity>({
    queryKey: [apiEndpoint],
    enabled: !!(poolId || isNewUrlFormat),
  });

  // Fetch real holders data from API
  const { data: holders = [], isLoading: holdersLoading } = useQuery<PoolHolder[]>({
    queryKey: [`/api/pools/${pool?.id}/holders`],
    enabled: !!pool?.id,
  });

  // Legacy mock holders data (for fallback reference)
  const mockHolders: PoolHolder[] = [
    {
      id: '1',
      address: '0xA0b86a33E6441527176204E711E4d9C5dD3CE0C8',
      balance: 2450000,
      balanceUSD: 2449800,
      percentage: 12.45,
      rank: 1,
      firstSeen: '2024-03-15',
      txCount: 45
    },
    {
      id: '2', 
      address: '0x742d35Cc6596C44562Ff8C1DB728b58D4e32c50F',
      balance: 1890000,
      balanceUSD: 1889650,
      percentage: 9.61,
      rank: 2,
      firstSeen: '2024-02-20',
      txCount: 32
    },
    {
      id: '3',
      address: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
      balance: 1520000,
      balanceUSD: 1519740,
      percentage: 7.73,
      rank: 3,
      firstSeen: '2024-01-08',
      txCount: 67
    },
    {
      id: '4',
      address: '0x5A52E96BAcdaBb82fd05763E25335261B270Efcb',
      balance: 1285000,
      balanceUSD: 1284710,
      percentage: 6.53,
      rank: 4,
      firstSeen: '2024-04-12',
      txCount: 18
    },
    {
      id: '5',
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      balance: 980000,
      balanceUSD: 979800,
      percentage: 4.98,
      rank: 5,
      firstSeen: '2024-05-03',
      txCount: 24
    },
    {
      id: '6',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      balance: 875000,
      balanceUSD: 874825,
      percentage: 4.45,
      rank: 6,
      firstSeen: '2024-03-28',
      txCount: 56
    },
    {
      id: '7',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      balance: 720000,
      balanceUSD: 719856,
      percentage: 3.66,
      rank: 7,
      firstSeen: '2024-02-14',
      txCount: 41
    },
    {
      id: '8',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      balance: 650000,
      balanceUSD: 649675,
      percentage: 3.31,
      rank: 8,
      firstSeen: '2024-06-01',
      txCount: 13
    },
    {
      id: '9',
      address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
      balance: 580000,
      balanceUSD: 579770,
      percentage: 2.95,
      rank: 9,
      firstSeen: '2024-01-22',
      txCount: 78
    },
    {
      id: '10',
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
      balance: 520000,
      balanceUSD: 519740,
      percentage: 2.64,
      rank: 10,
      firstSeen: '2024-04-07',
      txCount: 29
    },
    {
      id: '11',
      address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52',
      balance: 485000,
      balanceUSD: 484760,
      percentage: 2.47,
      rank: 11,
      firstSeen: '2024-03-01',
      txCount: 35
    },
    {
      id: '12',
      address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
      balance: 430000,
      balanceUSD: 429570,
      percentage: 2.19,
      rank: 12,
      firstSeen: '2024-05-18',
      txCount: 22
    },
    {
      id: '13',
      address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
      balance: 395000,
      balanceUSD: 394805,
      percentage: 2.01,
      rank: 13,
      firstSeen: '2024-02-09',
      txCount: 48
    },
    {
      id: '14',
      address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
      balance: 360000,
      balanceUSD: 359640,
      percentage: 1.83,
      rank: 14,
      firstSeen: '2024-06-12',
      txCount: 11
    },
    {
      id: '15',
      address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
      balance: 320000,
      balanceUSD: 319680,
      percentage: 1.63,
      rank: 15,
      firstSeen: '2024-04-25',
      txCount: 19
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

  const getBackUrl = () => {
    if (isNewUrlFormat) {
      return `/yield/${params.network}/${params.protocol}/${params.tokenPair}`;
    }
    return `/pool/${poolId}`;
  };

  // Use real holders data if available, fallback to mock for development
  const displayHolders = holders.length > 0 ? holders : mockHolders;
  const filteredHolders = displayHolders.filter(holder =>
    holder.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holder.rank.toString().includes(searchTerm)
  );

  if (poolLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold">Pool not found</h1>
            <p className="text-muted-foreground mt-2">The requested pool could not be found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
            data-testid="button-back-to-pool"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pool
          </Button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              {pool.platform.logoUrl && (
                <img 
                  src={pool.platform.logoUrl} 
                  alt={pool.platform.displayName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              {pool.chain.iconUrl && (
                <img 
                  src={pool.chain.iconUrl} 
                  alt={pool.chain.displayName}
                  className="w-6 h-6 rounded-full"
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {pool.tokenPair} Holders
              </h1>
              <p className="text-muted-foreground">
                <ProtocolLink 
                  protocol={{
                    id: pool.platform.id,
                    name: pool.platform.name,
                    displayName: pool.platform.displayName
                  }}
                  className="hover:underline"
                />
                {" on "}
                <NetworkLink 
                  network={{
                    id: pool.chain.id,
                    name: pool.chain.name,
                    displayName: pool.chain.displayName
                  }}
                  className="hover:underline"
                />
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Token Holders ({mockHolders.length})</CardTitle>
                </div>
                <CardDescription>
                  All addresses holding tokens in this vault
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by address or rank..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-holders"
                  />
                </div>
                <Button variant="outline" size="sm" data-testid="button-refresh-holders">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-10 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Holder Address</div>
                <div className="col-span-3">Balance</div>
                <div className="col-span-2">Percentage</div>
              </div>

              {/* Holders List */}
              <div className="space-y-2">
                {holdersLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="grid grid-cols-10 gap-4 items-center py-3 border-b border-border/30 px-2">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 col-span-3" />
                        <Skeleton className="h-8 col-span-2" />
                        <Skeleton className="h-8 col-span-2" />
                        <Skeleton className="h-8 col-span-2" />
                      </div>
                    ))}
                  </div>
                ) : filteredHolders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No holders found</p>
                    <p className="text-sm mt-2">{holders.length === 0 ? "Data is being collected..." : "Try adjusting your search terms"}</p>
                  </div>
                ) : (
                  filteredHolders.map((holder) => (
                    <div key={holder.id} className="grid grid-cols-10 gap-4 items-center py-3 border-b border-border/30 hover:bg-muted/30 transition-colors rounded-lg px-2">
                      <div className="col-span-1">
                        <div className="flex items-center gap-2">
                          {getRankIcon(holder.rank)}
                          <Badge variant={getRankBadgeVariant(holder.rank)} className="text-xs">
                            #{holder.rank}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="col-span-4">
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

                      <div className="col-span-2">
                        <div className="font-semibold text-sm">
                          {Number(holder.percentage).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredHolders.length > 0 && (
                <div className="flex justify-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredHolders.length} of {displayHolders.length} holders
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}