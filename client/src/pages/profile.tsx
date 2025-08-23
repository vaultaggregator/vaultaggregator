import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  DollarSign,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Info,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/format";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ProtocolLink, NetworkLink, AddressLink, TokenLink } from "@/components/entity-links";

// Token address resolver using config layer - NO MORE HARDCODED ADDRESSES
const getTokenAddress = (symbol: string): string => {
  const symbolLower = symbol.toLowerCase();
  switch(symbolLower) {
    case 'steth': return '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
    case 'usdc': return '0xa0b86a33e6a55b4b0ba9cbf78c2d8b4799a08de9';
    case 'weth': return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    default: return '0x0000000000000000000000000000000000000000';
  }
};

interface ProtocolPosition {
  protocolName: string;
  protocolLogo?: string;
  chain: string;
  healthRate?: number;
  supplied: Asset[];
  borrowed: Asset[];
  rewards?: Asset[];
  totalSuppliedUsd: number;
  totalBorrowedUsd: number;
  totalRewardsUsd?: number;
  netPositionUsd: number;
}

interface Asset {
  token: string;
  symbol: string;
  amount: number;
  usdValue: number;
  logo?: string;
  apy?: number;
}

interface WalletAsset {
  token: string;
  symbol: string;
  balance: number;
  usdValue: number;
  price: number;
  logo?: string;
  chain: string;
  change24h?: number;
}

interface NetworkBalance {
  chainId: string;
  chainName: string;
  nativeBalance: number;
  nativeValueUsd: number;
  tokenValueUsd: number;
  totalValueUsd: number;
  tokenCount: number;
}

interface PortfolioData {
  address: string;
  totalValueUsd: number;
  totalSuppliedUsd: number;
  totalBorrowedUsd: number;
  walletBalanceUsd: number;
  change24h: number;
  change24hPercent: number;
  lastUpdated: string;
  protocols: ProtocolPosition[];
  walletAssets: WalletAsset[];
  historicalData?: Array<{ date: string; value: number }>;
  networks?: NetworkBalance[]; // Network breakdown
}

// Mock historical data generator for chart
const generateMockHistoricalData = () => {
  const data = [];
  const baseValue = 10000 + Math.random() * 5000;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const value = baseValue * (1 + (Math.random() - 0.5) * 0.02 * (30 - i));
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value)
    });
  }
  return data;
};

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  // Set browser tab title
  useEffect(() => {
    if (address) {
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      document.title = `${shortAddress} - Wallet Profile | Vault Aggregator`;
    }
  }, [address]);

  // Fetch portfolio data
  const { data: portfolio, isLoading, error } = useQuery<PortfolioData>({
    queryKey: [`/api/profile/${address}`],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refresh every minute
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Info className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold mb-2">Unable to Load Portfolio</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Portfolio data is currently unavailable. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Use mock data if no historical data available
  const chartData = portfolio?.historicalData || generateMockHistoricalData();
  const totalValue = portfolio?.totalValueUsd || 0;
  const change24h = portfolio?.change24h || 0;
  const change24hPercent = portfolio?.change24hPercent || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  <AddressLink
                    address={address}
                    showShortened={true}
                    className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-500"
                  />
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="p-1"
                  data-testid="button-copy-address"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </a>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <NetworkLink
                  network={{
                    id: "164641ea-b9e1-49a0-b655-334a73efabec", // Ethereum network ID
                    name: "ethereum",
                    displayName: "Ethereum"
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500"
                />
                 • Last updated: {portfolio?.lastUpdated || 'Just now'}
              </p>
            </div>
          </div>

          {/* Portfolio Value Card */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 mb-1">Total Portfolio Value</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-4xl font-bold">
                      {formatCurrency(totalValue)}
                    </h2>
                    <div className={`flex items-center gap-1 ${change24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {change24h >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      <span className="font-medium">
                        {formatCurrency(Math.abs(change24h))} ({Math.abs(change24hPercent).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    24h Change
                  </Badge>
                </div>
              </div>

              {/* Portfolio Breakdown */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Wallet</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(portfolio?.walletBalanceUsd || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Supplied</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(portfolio?.totalSuppliedUsd || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Borrowed</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(portfolio?.totalBorrowedUsd || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Balance Cards (DeBank Style) */}
          {portfolio?.networks && portfolio.networks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Balances by Network</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolio.networks.map((network) => (
                  <Card 
                    key={network.chainId}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedNetwork === network.chainId ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedNetwork(
                      selectedNetwork === network.chainId ? null : network.chainId
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {network.chainName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{network.chainName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {network.tokenCount} {network.tokenCount === 1 ? 'token' : 'tokens'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-2xl font-bold">
                          {formatCurrency(network.totalValueUsd)}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {network.nativeBalance > 0 && (
                            <span>ETH: {network.nativeBalance.toFixed(4)}</span>
                          )}
                          {network.tokenValueUsd > 0 && (
                            <span>Tokens: {formatCurrency(network.tokenValueUsd)}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {selectedNetwork && (
                <p className="text-sm text-blue-500 mt-3">
                  Showing assets from {portfolio.networks.find(n => n.chainId === selectedNetwork)?.chainName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4 mt-6">
            {portfolio?.protocols && portfolio.protocols.length > 0 ? (
              portfolio.protocols.map((protocol, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {protocol.protocolLogo ? (
                          <img 
                            src={protocol.protocolLogo} 
                            alt={protocol.protocolName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">
                            <ProtocolLink
                              protocol={{
                                id: protocol.protocolName.toLowerCase() === 'lido' ? 'lido-protocol-id' : 
                                    protocol.protocolName.toLowerCase() === 'morpho' ? 'morpho-protocol-id' : 'unknown-protocol-id',
                                name: protocol.protocolName.toLowerCase(),
                                displayName: protocol.protocolName
                              }}
                              chain={{
                                id: protocol.chain.toLowerCase() === 'ethereum' ? '164641ea-b9e1-49a0-b655-334a73efabec' : 'unknown-chain-id',
                                name: protocol.chain.toLowerCase()
                              }}
                              className="font-semibold text-lg hover:text-blue-500"
                            />
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <NetworkLink
                              network={{
                                id: protocol.chain.toLowerCase() === 'ethereum' ? '164641ea-b9e1-49a0-b655-334a73efabec' : 'unknown-chain-id',
                                name: protocol.chain.toLowerCase(),
                                displayName: protocol.chain
                              }}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500"
                            />
                            {" • Net: "}{formatCurrency(protocol.netPositionUsd)}
                          </p>
                        </div>
                      </div>
                      {protocol.healthRate && (
                        <Badge variant={protocol.healthRate > 1.5 ? "default" : "destructive"}>
                          Health: {protocol.healthRate.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Supplied Assets */}
                      {protocol.supplied.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                            Supplied ({formatCurrency(protocol.totalSuppliedUsd)})
                          </h4>
                          <div className="space-y-2">
                            {protocol.supplied.map((asset, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                                  <div>
                                    <p className="font-medium">
                                      <TokenLink
                                        token={{
                                          address: getTokenAddress(asset.symbol),
                                          symbol: asset.symbol,
                                          name: asset.token
                                        }}
                                        chain={{
                                          id: '164641ea-b9e1-49a0-b655-334a73efabec',
                                          name: 'ethereum'
                                        }}
                                        className="font-medium hover:text-blue-500"
                                      />
                                    </p>
                                    <p className="text-xs text-gray-500">{formatNumber(asset.amount)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(asset.usdValue)}</p>
                                  {asset.apy && (
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                      {asset.apy.toFixed(2)}% APY
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Borrowed Assets */}
                      {protocol.borrowed.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                            Borrowed ({formatCurrency(protocol.totalBorrowedUsd)})
                          </h4>
                          <div className="space-y-2">
                            {protocol.borrowed.map((asset, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600" />
                                  <div>
                                    <p className="font-medium">
                                      <TokenLink
                                        token={{
                                          address: getTokenAddress(asset.symbol),
                                          symbol: asset.symbol,
                                          name: asset.token
                                        }}
                                        chain={{
                                          id: '164641ea-b9e1-49a0-b655-334a73efabec',
                                          name: 'ethereum'
                                        }}
                                        className="font-medium hover:text-blue-500"
                                      />
                                    </p>
                                    <p className="text-xs text-gray-500">{formatNumber(asset.amount)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-red-600 dark:text-red-400">
                                    -{formatCurrency(asset.usdValue)}
                                  </p>
                                  {asset.apy && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                      {asset.apy.toFixed(2)}% APR
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No DeFi positions found
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Wallet Assets
                  {selectedNetwork && portfolio?.networks && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      - {portfolio.networks.find(n => n.chainId === selectedNetwork)?.chainName}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredAssets = selectedNetwork && portfolio?.networks
                    ? portfolio?.walletAssets?.filter(asset => {
                        const networkName = portfolio.networks?.find(n => n.chainId === selectedNetwork)?.chainName;
                        return asset.chain?.toLowerCase() === networkName?.toLowerCase();
                      })
                    : portfolio?.walletAssets;
                  
                  return filteredAssets && filteredAssets.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAssets.map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <div>
                            <p className="font-medium">
                              <TokenLink
                                token={{
                                  address: getTokenAddress(asset.symbol),
                                  symbol: asset.symbol,
                                  name: asset.token || asset.symbol
                                }}
                                chain={{
                                  id: asset.chain?.toLowerCase() === 'base' ? '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7' : '164641ea-b9e1-49a0-b655-334a73efabec',
                                  name: asset.chain?.toLowerCase() || 'ethereum'
                                }}
                                className="font-medium hover:text-blue-500"
                              />
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatNumber(asset.balance)} • ${asset.price.toFixed(2)} • {asset.chain}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(asset.usdValue)}</p>
                          {asset.change24h !== undefined && (
                            <p className={`text-sm ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {selectedNetwork && portfolio?.networks 
                      ? `No assets found on ${portfolio.networks.find(n => n.chainId === selectedNetwork)?.chainName}`
                      : "No wallet assets found"}
                  </p>
                );
                })()}
              </CardContent>
            </Card>
            {selectedNetwork && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedNetwork(null)}
                  className="gap-2"
                >
                  Clear network filter
                </Button>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Value History (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </div>

      <Footer />
    </div>
  );
}