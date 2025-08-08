import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ExternalLink, Activity, DollarSign, Fuel, Clock, Hash } from "lucide-react";

interface EtherscanAccountInfo {
  account: string;
  balance: string;
  balanceEth: string;
  txCount: number;
}

interface EtherscanTransaction {
  hash: string;
  blockNumber: string;
  timestamp: string;
  from: string;
  to: string;
  valueEth: string;
  gasPriceGwei: string;
  gasUsed: string;
  isError: string;
  methodId?: string;
}

interface EtherscanGasData {
  timestamp: string;
  safeLowGwei: string;
  standardGwei: string;
  fastGwei: string;
  proposeGasPrice: string;
}

interface EthPrice {
  timestamp: string;
  ethBtc: string;
  ethUsd: string;
  ethUsdTimestamp: string;
}

interface LatestBlock {
  latestBlock: number;
  timestamp: string;
}

export default function EtherscanDashboard() {
  const [selectedAddress, setSelectedAddress] = useState("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"); // Vitalik's address
  const [inputAddress, setInputAddress] = useState("");

  // Queries for general blockchain data
  const { data: ethPrice, isLoading: ethPriceLoading } = useQuery<EthPrice>({
    queryKey: ["/api/etherscan/eth-price"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: gasData, isLoading: gasLoading } = useQuery<EtherscanGasData>({
    queryKey: ["/api/etherscan/gas"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: latestBlock, isLoading: blockLoading } = useQuery<LatestBlock>({
    queryKey: ["/api/etherscan/blocks/latest"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Queries for address-specific data
  const { data: accountInfo, isLoading: accountLoading, error: accountError } = useQuery<EtherscanAccountInfo>({
    queryKey: ["/api/etherscan/account", selectedAddress],
    enabled: !!selectedAddress,
  });

  const { data: transactionData, isLoading: transactionsLoading } = useQuery<{
    address: string;
    page: number;
    limit: number;
    transactions: EtherscanTransaction[];
  }>({
    queryKey: ["/api/etherscan/transactions", selectedAddress],
    enabled: !!selectedAddress,
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress.trim()) {
      setSelectedAddress(inputAddress.trim());
      setInputAddress("");
    }
  };

  const formatNumber = (num: string | number) => {
    return new Intl.NumberFormat().format(Number(num));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Etherscan Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Real-time Ethereum blockchain data and analytics
          </p>
        </div>

        {/* Blockchain Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ETH Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {ethPriceLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : ethPrice ? (
                <div>
                  <div className="text-2xl font-bold">${formatNumber(parseFloat(ethPrice.ethUsd).toFixed(2))}</div>
                  <p className="text-xs text-muted-foreground">
                    Updated: {formatTimestamp(ethPrice.timestamp)}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-red-500">Failed to load</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {gasLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : gasData ? (
                <div>
                  <div className="text-2xl font-bold">{gasData.standardGwei} Gwei</div>
                  <div className="flex space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Safe: {gasData.safeLowGwei}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Fast: {gasData.fastGwei}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500">Failed to load</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {blockLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : latestBlock ? (
                <div>
                  <div className="text-2xl font-bold">#{formatNumber(latestBlock.latestBlock)}</div>
                  <p className="text-xs text-muted-foreground">
                    Updated: {formatTimestamp(latestBlock.timestamp)}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-red-500">Failed to load</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Address Analysis Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Address Analysis
            </CardTitle>
            <CardDescription>
              Analyze any Ethereum address for balance, transactions, and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddressSubmit} className="flex gap-4 mb-6">
              <Input
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                placeholder="Enter Ethereum address (0x...)"
                className="flex-1"
              />
              <Button type="submit" disabled={!inputAddress.trim()}>
                Analyze
              </Button>
            </form>

            {selectedAddress && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Address: {formatAddress(selectedAddress)}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://etherscan.io/address/${selectedAddress}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Etherscan
                  </Button>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <Card>
                      <CardContent className="pt-6">
                        {accountLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading account information...
                          </div>
                        ) : accountError ? (
                          <div className="text-center py-8 text-red-500">
                            Failed to load account information. Please check the address format.
                          </div>
                        ) : accountInfo ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-2">Balance</h4>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {parseFloat(accountInfo.balanceEth).toFixed(6)} ETH
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatNumber(accountInfo.balance)} Wei
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Transaction Count</h4>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatNumber(accountInfo.txCount)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total transactions
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="transactions">
                    <Card>
                      <CardContent className="pt-6">
                        {transactionsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            Loading transactions...
                          </div>
                        ) : transactionData?.transactions ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">Recent Transactions</h4>
                              <Badge variant="secondary">
                                Showing {transactionData.transactions.length} transactions
                              </Badge>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {transactionData.transactions.map((tx, index) => (
                                <div key={tx.hash} className="border rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={tx.isError === "0" ? "default" : "destructive"}>
                                        {tx.isError === "0" ? "Success" : "Failed"}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        Block #{formatNumber(tx.blockNumber)}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank')}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <span className="font-medium">Hash:</span><br/>
                                      <span className="text-muted-foreground font-mono">
                                        {formatAddress(tx.hash)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Value:</span><br/>
                                      <span className="text-muted-foreground">
                                        {parseFloat(tx.valueEth).toFixed(6)} ETH
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Gas Price:</span><br/>
                                      <span className="text-muted-foreground">
                                        {tx.gasPriceGwei} Gwei
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <Separator className="my-2" />
                                  
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>From: {formatAddress(tx.from)}</span>
                                    <span>To: {formatAddress(tx.to)}</span>
                                    <span>{formatTimestamp(tx.timestamp)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No transaction data available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle>Available Etherscan API Endpoints</CardTitle>
            <CardDescription>
              All endpoints require API key authentication via Authorization header
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Account & Address Data:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• GET /api/etherscan/account/:address</li>
                  <li>• GET /api/etherscan/transactions/:address</li>
                  <li>• GET /api/etherscan/tokens/:address</li>
                  <li>• GET /api/etherscan/contract/:address</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Blockchain Data:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• GET /api/etherscan/gas</li>
                  <li>• GET /api/etherscan/eth-price</li>
                  <li>• GET /api/etherscan/blocks/latest</li>
                  <li>• GET /api/etherscan/blocks/:number</li>
                  <li>• GET /api/etherscan/transaction/:hash</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}