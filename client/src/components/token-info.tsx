import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Info, 
  DollarSign, 
  Users, 
  ArrowRightLeft, 
  Activity, 
  Code, 
  TrendingUp,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Hash,
  FileCode,
  Wallet,
  BarChart3,
  GitBranch,
  Zap
} from "lucide-react";

interface TokenInfoProps {
  poolId: string;
}

export function TokenInfo({ poolId }: TokenInfoProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: [`/api/pools/${poolId}/token-info`],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: string | number) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return "0";
    
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const formatTokenAmount = (amount: string, decimals: string = "18") => {
    try {
      const value = BigInt(amount);
      const divisor = BigInt(Math.pow(10, parseInt(decimals)));
      const result = value / divisor;
      return formatNumber(result.toString());
    } catch {
      return "0";
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Loading Token Information...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !tokenData) {
    return null; // Silently fail if no token data available
  }

  const { tokenInfo, contractInfo, supplyData, holders, transfers, technical } = tokenData as any;

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Token Information
          </CardTitle>
          {contractInfo?.isVerified && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified Contract
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Token Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {tokenInfo?.name || "Unknown Token"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Symbol: {tokenInfo?.symbol || "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {formatAddress((tokenData as any).tokenAddress)}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard((tokenData as any).tokenAddress)}
              >
                {copiedAddress ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(`https://etherscan.io/token/${(tokenData as any).tokenAddress}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Supply</p>
              <p className="text-sm font-semibold">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Loading...
                  </span>
                ) : supplyData ? (
                  formatTokenAmount(supplyData.totalSupply, tokenInfo?.decimals)
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Holders</p>
              <p className="text-sm font-semibold">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Loading...
                  </span>
                ) : holders?.count > 0 ? (
                  holders.count.toLocaleString()
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">24h Transfers</p>
              <p className="text-sm font-semibold">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    Loading...
                  </span>
                ) : transfers?.analytics?.transferCount24h > 0 ? (
                  transfers.analytics.transferCount24h.toLocaleString()
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Decimals</p>
              <p className="text-sm font-semibold">
                {tokenInfo?.decimals || "18"}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Detailed Information Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holders">Holders</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Contract Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Contract Name:</span>
                    <span className="font-mono">{contractInfo?.contractName || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Creator:</span>
                    <span className="font-mono">
                      {contractInfo?.contractCreator ? formatAddress(contractInfo.contractCreator) : "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Creation Tx:</span>
                    <a 
                      href={`https://etherscan.io/tx/${contractInfo?.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {contractInfo?.txHash ? formatAddress(contractInfo.txHash) : "Unknown"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Verification Status:</span>
                    <span>
                      {contractInfo?.isVerified ? (
                        <Badge variant="outline" className="text-green-600">Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">Unverified</Badge>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {contractInfo?.abi && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Contract ABI
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                    <pre className="text-xs overflow-x-auto max-h-40">
                      {JSON.stringify(JSON.parse(contractInfo.abi), null, 2).slice(0, 500)}...
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="holders" className="mt-4">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Top Token Holders
              </h4>
              {holders?.topHolders?.length > 0 ? (
                <div className="space-y-2">
                  {holders.topHolders.map((holder: any, index: number) => (
                    <div key={holder.address} className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">#{index + 1}</span>
                        <a 
                          href={`https://etherscan.io/address/${holder.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-blue-600 hover:underline"
                        >
                          {formatAddress(holder.address)}
                        </a>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatTokenAmount(holder.balance, tokenInfo?.decimals)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {holder.share}% share
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No holder data available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="mt-4">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Recent Transfers
              </h4>
              {transfers?.recent?.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transfers.recent.slice(0, 10).map((transfer: any, index: number) => (
                    <div key={index} className="text-sm border-b dark:border-gray-700 pb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(parseInt(transfer.timeStamp) * 1000).toLocaleString()}
                        </span>
                        <a
                          href={`https://etherscan.io/tx/${transfer.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Hash className="w-3 h-3" />
                          {formatAddress(transfer.hash)}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono">{formatAddress(transfer.from)}</span>
                        <span>→</span>
                        <span className="font-mono">{formatAddress(transfer.to)}</span>
                        <Badge variant="outline" className="ml-auto">
                          {formatTokenAmount(transfer.value, transfer.tokenDecimal)} {transfer.tokenSymbol}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No recent transfers available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Transaction Analytics
              </h4>
              {transfers?.analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">24h Activity</p>
                    <p className="text-lg font-bold">{transfers.analytics.transferCount24h}</p>
                    <p className="text-xs text-gray-500">Transfers</p>
                    <p className="text-sm font-semibold mt-1">{transfers.analytics.uniqueAddresses24h}</p>
                    <p className="text-xs text-gray-500">Unique Addresses</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">7d Activity</p>
                    <p className="text-lg font-bold">{transfers.analytics.transferCount7d}</p>
                    <p className="text-xs text-gray-500">Transfers</p>
                    <p className="text-sm font-semibold mt-1">{transfers.analytics.uniqueAddresses7d}</p>
                    <p className="text-xs text-gray-500">Unique Addresses</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">30d Activity</p>
                    <p className="text-lg font-bold">{transfers.analytics.transferCount30d}</p>
                    <p className="text-xs text-gray-500">Transfers</p>
                    <p className="text-sm font-semibold mt-1">{transfers.analytics.uniqueAddresses30d}</p>
                    <p className="text-xs text-gray-500">Unique Addresses</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">24h Volume</p>
                    <p className="text-lg font-bold">
                      {formatTokenAmount(transfers.analytics.volume24h, tokenInfo?.decimals)}
                    </p>
                    <p className="text-xs text-gray-500">{tokenInfo?.symbol || "Tokens"}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">7d Volume</p>
                    <p className="text-lg font-bold">
                      {formatTokenAmount(transfers.analytics.volume7d, tokenInfo?.decimals)}
                    </p>
                    <p className="text-xs text-gray-500">{tokenInfo?.symbol || "Tokens"}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">30d Volume</p>
                    <p className="text-lg font-bold">
                      {formatTokenAmount(transfers.analytics.volume30d, tokenInfo?.decimals)}
                    </p>
                    <p className="text-xs text-gray-500">{tokenInfo?.symbol || "Tokens"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No analytics data available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="technical" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Gas Usage Statistics
                </h4>
                {technical?.gasUsage ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Average Gas</p>
                      <p className="text-sm font-semibold">{technical.gasUsage.averageInGwei?.toFixed(2)} Gwei</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Min Gas</p>
                      <p className="text-sm font-semibold">{technical.gasUsage.minInGwei?.toFixed(2)} Gwei</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Max Gas</p>
                      <p className="text-sm font-semibold">{technical.gasUsage.maxInGwei?.toFixed(2)} Gwei</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No gas usage data available</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Recent Contract Events
                </h4>
                {technical?.events?.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {technical.events.slice(0, 5).map((event: any, index: number) => (
                      <div key={index} className="text-xs border-b dark:border-gray-700 pb-2">
                        <div className="flex justify-between mb-1">
                          <span className="font-mono text-gray-600 dark:text-gray-400">
                            Block #{event.blockNumber}
                          </span>
                          <a
                            href={`https://etherscan.io/tx/${event.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {formatAddress(event.transactionHash)}
                          </a>
                        </div>
                        <div className="font-mono text-gray-500">
                          Event: {event.eventName}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No event data available</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}