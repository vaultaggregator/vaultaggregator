import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Activity,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Coins,
  ArrowLeft
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { NetworkLink, AddressLink } from "@/components/entity-links";

interface ProtocolAsset {
  symbol: string;
  name: string;
  logo?: string;
  balance: number;
  usdValue: number;
  apy?: number;
  type: 'supplied' | 'borrowed' | 'staked';
}

interface ProtocolMarket {
  id: string;
  asset: string;
  totalSupply: number;
  totalBorrow: number;
  supplyApy: number;
  borrowApy: number;
  utilization: number;
}

interface ProtocolHolder {
  address: string;
  balance: number;
  usdValue: number;
  percentage: number;
  rank: number;
}

interface ProtocolData {
  id: string;
  name: string;
  logo?: string;
  chainName: string;
  chainId: string;
  description?: string;
  website?: string;
  tvl: number;
  userCount: number;
  transactionCount?: number;
  totalSupplied?: number;
  totalBorrowed?: number;
  avgApy?: number;
  assets: ProtocolAsset[];
  markets?: ProtocolMarket[];
  topHolders?: ProtocolHolder[];
  stats?: {
    volume24h?: number;
    fees24h?: number;
    revenue24h?: number;
    activeUsers24h?: number;
  };
}

export function ProtocolDetailPage() {
  const { chainId, protocolId } = useParams();

  const { data: protocol, isLoading, error } = useQuery<ProtocolData>({
    queryKey: [`/api/protocols/${chainId}/${protocolId}`],
    enabled: !!chainId && !!protocolId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Protocol Not Found</h2>
              <p className="text-gray-500">
                Unable to load protocol data. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-6 gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {/* Protocol Header */}
        <div className="mb-8">
          <Card className="overflow-hidden bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {protocol.logo ? (
                    <img 
                      src={protocol.logo} 
                      alt={protocol.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold">{protocol.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <NetworkLink
                        network={{
                          id: protocol.chainId,
                          name: protocol.chainName,
                          displayName: protocol.chainName
                        }}
                        className="inline-flex h-6 px-2 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      />
                      {protocol.website && (
                        <a
                          href={protocol.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 flex items-center gap-1 text-sm"
                        >
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Value Locked</p>
                  <p className="text-3xl font-bold">{formatCurrency(protocol.tvl)}</p>
                </div>
              </div>

              {protocol.description && (
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {protocol.description}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold">{formatNumber(protocol.userCount)}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {protocol.totalSupplied !== undefined && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Supplied</p>
                    <p className="text-2xl font-bold">{formatCurrency(protocol.totalSupplied)}</p>
                  </div>
                  <ArrowUpRight className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {protocol.totalBorrowed !== undefined && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Borrowed</p>
                    <p className="text-2xl font-bold">{formatCurrency(protocol.totalBorrowed)}</p>
                  </div>
                  <ArrowDownRight className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {protocol.avgApy !== undefined && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Average APY</p>
                    <p className="text-2xl font-bold">{formatPercentage(protocol.avgApy)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 24h Stats if available */}
        {protocol.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {protocol.stats.volume24h !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">24h Volume</p>
                  <p className="text-lg font-semibold">{formatCurrency(protocol.stats.volume24h)}</p>
                </CardContent>
              </Card>
            )}
            {protocol.stats.fees24h !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">24h Fees</p>
                  <p className="text-lg font-semibold">{formatCurrency(protocol.stats.fees24h)}</p>
                </CardContent>
              </Card>
            )}
            {protocol.stats.revenue24h !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">24h Revenue</p>
                  <p className="text-lg font-semibold">{formatCurrency(protocol.stats.revenue24h)}</p>
                </CardContent>
              </Card>
            )}
            {protocol.stats.activeUsers24h !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">24h Active Users</p>
                  <p className="text-lg font-semibold">{formatNumber(protocol.stats.activeUsers24h)}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tabs for Assets, Markets, and Holders */}
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="holders">Top Holders</TabsTrigger>
          </TabsList>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Protocol Assets</CardTitle>
                <CardDescription>
                  All assets managed by {protocol.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocol.assets && protocol.assets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Asset</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Balance</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">USD Value</th>
                          {protocol.assets.some(a => a.apy !== undefined) && (
                            <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">APY</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {protocol.assets.map((asset, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                {asset.logo ? (
                                  <img 
                                    src={asset.logo} 
                                    alt={asset.symbol}
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <Coins className="w-6 h-6 text-gray-400" />
                                )}
                                <div>
                                  <p className="font-medium">{asset.symbol}</p>
                                  <p className="text-xs text-gray-500">{asset.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge 
                                variant={
                                  asset.type === 'supplied' ? 'default' : 
                                  asset.type === 'borrowed' ? 'destructive' : 
                                  'secondary'
                                }
                              >
                                {asset.type}
                              </Badge>
                            </td>
                            <td className="py-3 text-right font-mono">
                              {formatNumber(asset.balance)}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {formatCurrency(asset.usdValue)}
                            </td>
                            {protocol.assets.some(a => a.apy !== undefined) && (
                              <td className="py-3 text-right">
                                {asset.apy !== undefined ? (
                                  <span className="text-green-500 font-medium">
                                    {formatPercentage(asset.apy)}
                                  </span>
                                ) : '-'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No asset data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Markets</CardTitle>
                <CardDescription>
                  Lending and borrowing markets on {protocol.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocol.markets && protocol.markets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Asset</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Total Supply</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Total Borrow</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Supply APY</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Borrow APY</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Utilization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {protocol.markets.map((market) => (
                          <tr key={market.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 font-medium">{market.asset}</td>
                            <td className="py-3 text-right">{formatCurrency(market.totalSupply)}</td>
                            <td className="py-3 text-right">{formatCurrency(market.totalBorrow)}</td>
                            <td className="py-3 text-right text-green-500">
                              {formatPercentage(market.supplyApy)}
                            </td>
                            <td className="py-3 text-right text-red-500">
                              {formatPercentage(market.borrowApy)}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${market.utilization}%` }}
                                  />
                                </div>
                                <span className="text-sm">{market.utilization}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No market data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Holders Tab */}
          <TabsContent value="holders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Protocol Holders</CardTitle>
                <CardDescription>
                  Largest holders of {protocol.name} positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocol.topHolders && protocol.topHolders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Rank</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Address</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Balance</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">USD Value</th>
                          <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {protocol.topHolders.map((holder) => (
                          <tr key={holder.address} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3">
                              <Badge variant="outline">#{holder.rank}</Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <AddressLink
                                  address={holder.address}
                                  showShortened={true}
                                  className="text-blue-500 hover:text-blue-400 text-sm"
                                />
                                <Wallet className="w-3 h-3" />
                              </div>
                            </td>
                            <td className="py-3 text-right font-mono">
                              {formatNumber(holder.balance)}
                            </td>
                            <td className="py-3 text-right font-medium">
                              {formatCurrency(holder.usdValue)}
                            </td>
                            <td className="py-3 text-right">
                              <Badge variant="secondary">
                                {formatPercentage(holder.percentage)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No holder data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}