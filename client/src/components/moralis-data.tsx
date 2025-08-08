import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Activity, Coins, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MoralisDataProps {
  tokenAddress: string;
  chainName?: string;
}

export function MoralisData({ tokenAddress, chainName = 'ethereum' }: MoralisDataProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');

  // Fetch token price from Moralis
  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: [`/api/moralis/token-price/${tokenAddress}?chain=${chainName}`],
    enabled: !!tokenAddress,
  });

  // Fetch wallet balance if address is provided
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: [`/api/moralis/balance/${searchAddress}?chain=${chainName}`],
    enabled: !!searchAddress,
  });

  // Fetch DeFi positions if address is provided
  const { data: defiData, isLoading: defiLoading } = useQuery({
    queryKey: [`/api/moralis/defi/${searchAddress}?chain=${chainName}`],
    enabled: !!searchAddress,
  });

  const handleSearch = () => {
    setSearchAddress(walletAddress);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (priceLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Moralis Web3 Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Moralis Web3 Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token Price Data */}
        {priceData && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <Coins className="h-4 w-4" />
              On-Chain Price Data
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">USD Price</p>
                <p className="text-lg font-semibold">
                  ${priceData.usdPrice?.toFixed(6) || 'N/A'}
                </p>
              </div>
              {priceData['24hrPercentChange'] && (
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <span className={
                    parseFloat(priceData['24hrPercentChange']) >= 0 
                      ? "text-green-500" 
                      : "text-red-500"
                  }>
                    {priceData['24hrPercentChange']}%
                  </span>
                </div>
              )}
            </div>
            {priceData.exchangeName && (
              <p className="text-xs text-muted-foreground">
                Data from: {priceData.exchangeName}
              </p>
            )}
          </div>
        )}

        {/* Wallet Analysis Section */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium flex items-center gap-1">
            <Wallet className="h-4 w-4" />
            Wallet Analysis
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter wallet address..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              Analyze
            </Button>
          </div>
        </div>

        {/* Wallet Balance Data */}
        {balanceLoading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {balanceData && (
          <div className="space-y-3">
            {/* Native Balance */}
            {balanceData.native && (
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Native Balance</p>
                <p className="text-lg font-medium">
                  {(parseFloat(balanceData.native.balance) / 1e18).toFixed(4)} ETH
                </p>
              </div>
            )}

            {/* Token Balances */}
            {balanceData.tokens && balanceData.tokens.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Token Holdings</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {balanceData.tokens.slice(0, 10).map((token: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                      <div className="flex items-center gap-2">
                        {token.logo && (
                          <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{token.symbol}</p>
                          <p className="text-xs text-muted-foreground">{token.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {(parseFloat(token.balance) / Math.pow(10, token.decimals)).toFixed(4)}
                        </p>
                        {token.usd_value && (
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(token.usd_value)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {balanceData.tokens.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{balanceData.tokens.length - 10} more tokens
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* DeFi Positions */}
        {defiLoading && (
          <Skeleton className="h-20 w-full" />
        )}

        {defiData && defiData.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              DeFi Positions
            </p>
            <div className="space-y-2">
              {defiData.map((position: any, index: number) => (
                <div key={index} className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {position.protocol_logo && (
                        <img src={position.protocol_logo} alt={position.protocol_name} className="w-5 h-5 rounded-full" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{position.protocol_name}</p>
                        <p className="text-xs text-muted-foreground">{position.position_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatNumber(position.balance_usd || 0)}
                      </p>
                      {position.apy && (
                        <Badge variant="secondary" className="text-xs">
                          {position.apy.toFixed(2)}% APY
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No data message */}
        {searchAddress && !balanceData && !balanceLoading && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No data found for this address
          </p>
        )}
      </CardContent>
    </Card>
  );
}