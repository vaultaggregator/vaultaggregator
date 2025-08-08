import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Globe } from "lucide-react";

interface CoinGeckoDataProps {
  tokenAddress: string;
  chainName?: string;
}

export function CoinGeckoData({ tokenAddress, chainName = 'ethereum' }: CoinGeckoDataProps) {
  // Fetch token data from CoinGecko
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: [`/api/coingecko/token/${tokenAddress}`],
    enabled: !!tokenAddress,
  });

  // Fetch price data
  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: [`/api/coingecko/price/${tokenAddress}?platform=${chainName}`],
    enabled: !!tokenAddress,
  });

  const isLoading = tokenLoading || priceLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            CoinGecko Market Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!tokenData && !priceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            CoinGecko Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No market data available from CoinGecko for this token.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercent = (percent: number) => {
    const formatted = percent?.toFixed(2) || '0.00';
    return `${percent >= 0 ? '+' : ''}${formatted}%`;
  };

  const marketData = tokenData?.market_data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          CoinGecko Market Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Information */}
        {priceData && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-xl font-semibold">${priceData.usd?.toFixed(6) || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">24h Change</p>
              <div className="flex items-center gap-1">
                {priceData.usd_24h_change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={priceData.usd_24h_change >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatPercent(priceData.usd_24h_change)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Market Cap and Volume */}
        {marketData && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="text-lg font-medium">
                  {formatNumber(marketData.market_cap?.usd || 0)}
                </p>
                {marketData.market_cap_rank && (
                  <Badge variant="secondary" className="mt-1">
                    Rank #{marketData.market_cap_rank}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-lg font-medium">
                  {formatNumber(marketData.total_volume?.usd || 0)}
                </p>
              </div>
            </div>

            {/* Supply Information */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Supply Information
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Circulating</p>
                  <p className="font-medium">
                    {marketData.circulating_supply?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Supply</p>
                  <p className="font-medium">
                    {marketData.total_supply?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Performance */}
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Price Performance
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">7d</p>
                  <span className={
                    marketData.price_change_percentage_7d_in_currency?.usd >= 0 
                      ? "text-green-500" 
                      : "text-red-500"
                  }>
                    {formatPercent(marketData.price_change_percentage_7d_in_currency?.usd || 0)}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">30d</p>
                  <span className={
                    marketData.price_change_percentage_30d_in_currency?.usd >= 0 
                      ? "text-green-500" 
                      : "text-red-500"
                  }>
                    {formatPercent(marketData.price_change_percentage_30d_in_currency?.usd || 0)}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">1y</p>
                  <span className={
                    marketData.price_change_percentage_1y_in_currency?.usd >= 0 
                      ? "text-green-500" 
                      : "text-red-500"
                  }>
                    {formatPercent(marketData.price_change_percentage_1y_in_currency?.usd || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* All Time High/Low */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">All Time High</p>
                <p className="font-medium">${marketData.ath?.usd?.toFixed(6) || 'N/A'}</p>
                {marketData.ath_change_percentage?.usd && (
                  <span className="text-xs text-red-500">
                    {formatPercent(marketData.ath_change_percentage.usd)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">All Time Low</p>
                <p className="font-medium">${marketData.atl?.usd?.toFixed(6) || 'N/A'}</p>
                {marketData.atl_change_percentage?.usd && (
                  <span className="text-xs text-green-500">
                    {formatPercent(marketData.atl_change_percentage.usd)}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Additional token info */}
        {tokenData && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              {tokenData.image?.small && (
                <img 
                  src={tokenData.image.small} 
                  alt={tokenData.name} 
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">{tokenData.name}</p>
                <p className="text-sm text-muted-foreground">
                  {tokenData.symbol?.toUpperCase()}
                </p>
              </div>
            </div>
            {tokenData.links?.homepage?.[0] && (
              <a 
                href={tokenData.links.homepage[0]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-2 inline-block"
              >
                Official Website →
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}