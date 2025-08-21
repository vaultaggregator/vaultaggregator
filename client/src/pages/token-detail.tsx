import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Activity, Coins, ExternalLink, ArrowUpRight, ArrowDownRight, Copy, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/header';
import Footer from '@/components/footer';

interface TokenData {
  name: string;
  symbol: string;
  address: string;
  chainId: string;
  chainName: string;
  logo: string;
  decimals: number;
  price: number;
  price24hChange: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  holderCount: number;
  topHolders: Array<{
    address: string;
    balance: number;
    share: number;
    label?: string;
  }>;
  recentTransfers: Array<{
    from: string;
    to: string;
    amount: number;
    value: number;
    timestamp: number;
    txHash: string;
    explorerUrl: string;
  }>;
  protocols: Array<{
    name: string;
    type: string;
    tvl: number;
    apy?: number;
    logo?: string;
  }>;
  description?: string;
  website?: string;
  coingeckoId?: string;
}

export default function TokenDetail() {
  const { chainId, tokenAddress } = useParams() as { chainId: string; tokenAddress: string };
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { data: tokenData, isLoading, error } = useQuery<TokenData>({
    queryKey: ['/api/tokens', chainId, tokenAddress],
    queryFn: async () => {
      const response = await fetch(`/api/tokens/${chainId}/${tokenAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token data');
      }
      return response.json();
    },
    enabled: !!chainId && !!tokenAddress,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    setCopiedAddress(true);
    toast({
      title: "Address copied",
      description: "Token address has been copied to clipboard",
    });
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onAdminClick={() => {}} />
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
              <Skeleton className="h-12 w-64 mb-4" />
              <Skeleton className="h-6 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mb-8">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header onAdminClick={() => {}} />
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="container mx-auto p-6 max-w-7xl">
            <Card className="border-red-500/20">
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Failed to Load Token Data</h2>
                <p className="text-gray-400 mb-6">{error?.message || 'Unable to fetch token information'}</p>
                <Link href="/">
                  <Button variant="outline">Return to Home</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const priceChangeColor = tokenData.price24hChange >= 0 ? 'text-green-500' : 'text-red-500';
  const priceChangeIcon = tokenData.price24hChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onAdminClick={() => {}} />
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3">
        <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {tokenData.logo && (
            <img 
              src={tokenData.logo} 
              alt={tokenData.symbol} 
              className="w-16 h-16 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/64/64';
              }}
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold" data-testid="text-token-name">{tokenData.name}</h1>
              <Badge variant="secondary" className="text-sm">{tokenData.symbol}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{tokenData.chainName}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{formatAddress(tokenAddress)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0"
                  data-testid="button-copy-address"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              {tokenData.website && (
                <a 
                  href={tokenData.website} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  data-testid="link-website"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Price</span>
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mb-1" data-testid="stat-price">
              {formatCurrency(tokenData.price)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${priceChangeColor}`}>
              {priceChangeIcon}
              <span>{formatPercentage(Math.abs(tokenData.price24hChange))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Market Cap</span>
              <Coins className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold" data-testid="stat-marketcap">
              {formatCurrency(tokenData.marketCap)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Supply</span>
              <Coins className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold" data-testid="stat-supply">
              {formatNumber(tokenData.totalSupply)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Holders</span>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold" data-testid="stat-holders">
              {formatNumber(tokenData.holderCount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {tokenData.description && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About {tokenData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed" data-testid="text-description">
              {tokenData.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Top Holders */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Holders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="pb-3 text-sm font-medium text-gray-400">Rank</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Address</th>
                  <th className="pb-3 text-sm font-medium text-gray-400 text-right">Balance</th>
                  <th className="pb-3 text-sm font-medium text-gray-400 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {tokenData.topHolders.map((holder, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 text-gray-400">#{index + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${holder.address}`}>
                          <a className="font-mono text-sm hover:text-blue-400 transition-colors" data-testid={`holder-address-${index}`}>
                            {formatAddress(holder.address)}
                          </a>
                        </Link>
                        {holder.label && (
                          <Badge variant="outline" className="text-xs">{holder.label}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono">{formatNumber(holder.balance)}</td>
                    <td className="py-3 text-right">{formatPercentage(holder.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokenData.topHolders.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No holder data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transfers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transfers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="pb-3 text-sm font-medium text-gray-400">From</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">To</th>
                  <th className="pb-3 text-sm font-medium text-gray-400 text-right">Amount</th>
                  <th className="pb-3 text-sm font-medium text-gray-400 text-right">Value</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Time</th>
                  <th className="pb-3 text-sm font-medium text-gray-400">Tx</th>
                </tr>
              </thead>
              <tbody>
                {tokenData.recentTransfers.map((transfer, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
                    <td className="py-3">
                      <Link href={`/profile/${transfer.from}`}>
                        <a className="font-mono text-sm hover:text-blue-400 transition-colors" data-testid={`transfer-from-${index}`}>
                          {formatAddress(transfer.from)}
                        </a>
                      </Link>
                    </td>
                    <td className="py-3">
                      <Link href={`/profile/${transfer.to}`}>
                        <a className="font-mono text-sm hover:text-blue-400 transition-colors" data-testid={`transfer-to-${index}`}>
                          {formatAddress(transfer.to)}
                        </a>
                      </Link>
                    </td>
                    <td className="py-3 text-right font-mono">{formatNumber(transfer.amount)}</td>
                    <td className="py-3 text-right">{formatCurrency(transfer.value)}</td>
                    <td className="py-3 text-gray-400 text-sm">{formatTimestamp(transfer.timestamp)}</td>
                    <td className="py-3">
                      <a 
                        href={transfer.explorerUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        data-testid={`transfer-tx-${index}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tokenData.recentTransfers.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No recent transfers available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Protocols Using This Token */}
      <Card>
        <CardHeader>
          <CardTitle>Used in Protocols</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tokenData.protocols.map((protocol, index) => (
              <Card key={index} className="bg-gray-900/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {protocol.logo && (
                      <img 
                        src={protocol.logo} 
                        alt={protocol.name}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold" data-testid={`protocol-name-${index}`}>{protocol.name}</h3>
                      <Badge variant="outline" className="text-xs">{protocol.type}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">TVL:</span>
                      <span className="font-mono">{formatCurrency(protocol.tvl)}</span>
                    </div>
                    {protocol.apy && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">APY:</span>
                        <span className="font-mono text-green-400">{formatPercentage(protocol.apy)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {tokenData.protocols.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No protocol data available for this token
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}