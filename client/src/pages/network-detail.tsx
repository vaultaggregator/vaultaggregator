import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Coins, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight, 
  Copy, 
  AlertCircle,
  Globe,
  Twitter,
  Github,
  FileText,
  MessageSquare,
  Clock,
  Fuel,
  Users,
  Layers,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface NetworkData {
  name: string;
  chainId: string;
  logo: string;
  nativeToken: {
    name: string;
    symbol: string;
    decimals: number;
    price: number;
    price24hChange: number;
    marketCap: number;
    volume24h: number;
  };
  metrics: {
    tvl: number;
    tvl24hChange: number;
    blockTime: number;
    gasPrice: number;
    activeAddresses: number;
    transactionCount24h: number;
    blockHeight: number;
    validators?: number;
  };
  links: {
    website?: string;
    twitter?: string;
    discord?: string;
    github?: string;
    docs?: string;
    explorer?: string;
  };
  description?: string;
  rpcUrl?: string;
  isTestnet: boolean;
  ecosystem?: string;
  consensusAlgorithm?: string;
  launchDate?: string;
}

export default function NetworkDetail() {
  const { chainId } = useParams() as { chainId: string };
  const [copiedRpc, setCopiedRpc] = useState(false);

  const { data: networkData, isLoading, error } = useQuery<NetworkData>({
    queryKey: ['/api/networks', chainId],
    queryFn: async () => {
      const response = await fetch(`/api/networks/${chainId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch network data');
      }
      return response.json();
    },
    enabled: !!chainId,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  const copyRpcUrl = () => {
    if (networkData?.rpcUrl) {
      navigator.clipboard.writeText(networkData.rpcUrl);
      setCopiedRpc(true);
      toast({
        title: "RPC URL copied",
        description: "RPC endpoint has been copied to clipboard",
      });
      setTimeout(() => setCopiedRpc(false), 2000);
    }
  };

  const formatGasPrice = (gwei: number) => {
    if (gwei < 1) {
      return `${(gwei * 1000).toFixed(2)} mwei`;
    }
    return `${gwei.toFixed(2)} gwei`;
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const years = now.getFullYear() - date.getFullYear();
    const months = now.getMonth() - date.getMonth();
    const totalMonths = years * 12 + months;
    
    if (totalMonths < 12) {
      return `${totalMonths} months ago`;
    }
    return `${years} years ago`;
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !networkData) {
    return (
      <>
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Card className="border-red-500/20">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Network Data</h2>
            <p className="text-gray-400 mb-6">{error?.message || 'Unable to fetch network information'}</p>
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
        </div>
        <Footer />
      </>
    );
  }

  const priceChangeColor = networkData.nativeToken.price24hChange >= 0 ? 'text-green-500' : 'text-red-500';
  const priceChangeIcon = networkData.nativeToken.price24hChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />;
  
  const tvlChangeColor = networkData.metrics.tvl24hChange >= 0 ? 'text-green-500' : 'text-red-500';
  const tvlChangeIcon = networkData.metrics.tvl24hChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />;

  return (
    <>
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
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {networkData.logo && (
            <img 
              src={networkData.logo} 
              alt={networkData.name} 
              className="w-16 h-16 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/64/64';
              }}
            />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold" data-testid="text-network-name">{networkData.name}</h1>
              <Badge variant="secondary" className="text-sm">Chain ID: {networkData.chainId}</Badge>
              {networkData.isTestnet && (
                <Badge variant="outline" className="text-sm border-yellow-500 text-yellow-500">Testnet</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Native Token: {networkData.nativeToken.symbol}</span>
              {networkData.ecosystem && (
                <span>Ecosystem: {networkData.ecosystem}</span>
              )}
              {networkData.consensusAlgorithm && (
                <span>{networkData.consensusAlgorithm}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Native Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">{networkData.nativeToken.symbol} Price</span>
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mb-1" data-testid="stat-price">
              {formatCurrency(networkData.nativeToken.price)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${priceChangeColor}`}>
              {priceChangeIcon}
              <span>{formatPercentage(Math.abs(networkData.nativeToken.price24hChange))}</span>
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
              {formatCurrency(networkData.nativeToken.marketCap)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">24h Volume</span>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold" data-testid="stat-volume">
              {formatCurrency(networkData.nativeToken.volume24h)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Value Locked</span>
              <Layers className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold mb-1" data-testid="stat-tvl">
              {formatCurrency(networkData.metrics.tvl)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${tvlChangeColor}`}>
              {tvlChangeIcon}
              <span>{formatPercentage(Math.abs(networkData.metrics.tvl24hChange))}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Blockchain Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Fuel className="h-4 w-4" />
                <span>Gas Price</span>
              </div>
              <p className="text-xl font-semibold" data-testid="metric-gas">
                {formatGasPrice(networkData.metrics.gasPrice)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Clock className="h-4 w-4" />
                <span>Block Time</span>
              </div>
              <p className="text-xl font-semibold" data-testid="metric-blocktime">
                {networkData.metrics.blockTime}s
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Users className="h-4 w-4" />
                <span>Active Addresses</span>
              </div>
              <p className="text-xl font-semibold" data-testid="metric-addresses">
                {formatNumber(networkData.metrics.activeAddresses)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Activity className="h-4 w-4" />
                <span>24h Transactions</span>
              </div>
              <p className="text-xl font-semibold" data-testid="metric-transactions">
                {formatNumber(networkData.metrics.transactionCount24h)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Layers className="h-4 w-4" />
                <span>Block Height</span>
              </div>
              <p className="text-xl font-semibold" data-testid="metric-blockheight">
                {formatNumber(networkData.metrics.blockHeight)}
              </p>
            </div>
            
            {networkData.metrics.validators !== undefined && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span>Validators</span>
                </div>
                <p className="text-xl font-semibold" data-testid="metric-validators">
                  {formatNumber(networkData.metrics.validators)}
                </p>
              </div>
            )}
            
            {networkData.launchDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Launched</span>
                </div>
                <p className="text-xl font-semibold" data-testid="metric-launch">
                  {formatTimeAgo(networkData.launchDate)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {networkData.description && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About {networkData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed" data-testid="text-description">
              {networkData.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Developer Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RPC Endpoint */}
        {networkData.rpcUrl && (
          <Card>
            <CardHeader>
              <CardTitle>RPC Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 p-3 bg-gray-900/50 rounded-lg">
                <code className="text-sm text-gray-300 truncate" data-testid="text-rpc">
                  {networkData.rpcUrl}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyRpcUrl}
                  data-testid="button-copy-rpc"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links & Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Links & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {networkData.links.website && (
                <a 
                  href={networkData.links.website} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-website"
                >
                  <Globe className="h-4 w-4" />
                  <span>Official Website</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              
              {networkData.links.explorer && (
                <a 
                  href={networkData.links.explorer} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-explorer"
                >
                  <Activity className="h-4 w-4" />
                  <span>Block Explorer</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              
              {networkData.links.docs && (
                <a 
                  href={networkData.links.docs} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-docs"
                >
                  <FileText className="h-4 w-4" />
                  <span>Documentation</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              
              {networkData.links.github && (
                <a 
                  href={networkData.links.github} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-github"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              
              {networkData.links.twitter && (
                <a 
                  href={networkData.links.twitter} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-twitter"
                >
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              
              {networkData.links.discord && (
                <a 
                  href={networkData.links.discord} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  data-testid="link-discord"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Discord</span>
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </>
  );
}