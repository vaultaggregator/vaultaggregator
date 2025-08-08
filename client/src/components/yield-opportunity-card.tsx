
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricTooltip } from "./metric-tooltip";
import type { YieldOpportunity } from "@/types";
import { getChainIcon } from "@/components/chain-icons";
import { getPlatformIcon } from "@/components/platform-icons";
import { generateYieldUrl } from "@/lib/seo-urls";

interface YieldOpportunityCardProps {
  opportunity: YieldOpportunity;
  showHeaders?: boolean;
  showNetworkName?: boolean;
}

export default function YieldOpportunityCard({ opportunity, showHeaders = true, showNetworkName = true }: YieldOpportunityCardProps) {
  const formatTvl = (tvl: string): string => {
    const num = parseFloat(tvl);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatApy = (apy: string): string => {
    const num = parseFloat(apy);
    return `${num.toFixed(2)}%`;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'high': return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getChainColor = (color: string) => {
    return { backgroundColor: `${color}20`, color: color };
  };

  const getPlatformInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={`bg-card ${showHeaders ? 'rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-blue-300 transition-all duration-300 animate-fade-in border-l-4 border-l-transparent hover:border-l-blue-500' : 'rounded-none shadow-none border-0 hover:bg-muted/50 transition-colors'}`}>
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-0">
          {/* Left section - Platform and Token info */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 w-full sm:w-auto">
            <div 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden shadow-md flex-shrink-0"
              data-testid={`logo-${opportunity.platform.name}`}
            >
{opportunity.platform.logoUrl ? (
                <img 
                  src={opportunity.platform.logoUrl} 
                  alt={opportunity.platform.displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                (() => {
                  const PlatformIcon = getPlatformIcon(opportunity.platform.name);
                  return <PlatformIcon size={48} className="flex-shrink-0" />;
                })()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-bold text-lg text-foreground truncate" data-testid={`text-token-pair-${opportunity.id}`}>
                  {opportunity.tokenPair}
                </h3>
                {showNetworkName && (
                  <div className="flex items-center space-x-1.5">
                    <Badge 
                      variant="outline"
                      className="text-xs font-medium px-1.5 py-0.5 flex items-center space-x-1"
                      style={getChainColor(opportunity.chain.color)}
                      data-testid={`badge-chain-${opportunity.id}`}
                    >
                      {(() => {
                        const ChainIcon = getChainIcon(opportunity.chain.name);
                        return <ChainIcon size={12} className="flex-shrink-0" />;
                      })()}
                      <span>{opportunity.chain.displayName}</span>
                    </Badge>
                    {opportunity.categories && opportunity.categories.length > 0 && (
                      <Badge 
                        variant="secondary"
                        className="text-xs font-medium px-1.5 py-0.5"
                        data-testid={`badge-category-${opportunity.id}`}
                      >
                        {opportunity.categories[0].displayName}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center section - Key metrics */}
          <div className="w-full sm:flex sm:items-center sm:justify-between sm:flex-1 sm:max-w-4xl sm:mx-2 sm:mx-8">
            {/* Mobile grid, desktop flex layout */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between sm:gap-0 w-full">
              <div className="text-center sm:w-20">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">24h APY</p>
                )}
                <p className="text-sm sm:text-base font-bold text-green-600" data-testid={`text-apy-${opportunity.id}`}>
                  {opportunity.rawData?.apyBase ? formatApy(opportunity.rawData.apyBase.toString()) : 
                   opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-20">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">30d APY</p>
                )}
                <p className="text-sm sm:text-base font-bold text-green-500" data-testid={`text-apy-30d-${opportunity.id}`}>
                  {opportunity.rawData?.apyMean30d ? formatApy(opportunity.rawData.apyMean30d.toString()) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-24">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">TVL</p>
                )}
                <p className="text-sm sm:text-base font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
                  {opportunity.rawData?.tvlUsd ? formatTvl(opportunity.rawData.tvlUsd.toString()) : 
                   opportunity.tvl ? formatTvl(opportunity.tvl) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-28 sm:block hidden">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Since</p>
                )}
                <p className="text-sm font-semibold text-foreground" data-testid={`text-operating-since-${opportunity.id}`}>
                  {opportunity.rawData?.count ? `${opportunity.rawData.count} days` : 'N/A'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 text-center sm:w-16 flex justify-center">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Risk</p>
                )}
                <Badge 
                  variant="secondary"
                  className={`text-xs font-medium px-2 py-1 ${getRiskColor(opportunity.riskLevel)}`}
                  data-testid={`badge-risk-${opportunity.id}`}
                >
                  {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)}
                </Badge>
              </div>
              <div className="col-span-2 sm:col-span-1 text-center sm:w-20 flex justify-center sm:block">
                <Link href={generateYieldUrl(opportunity)}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-blue-50 text-xs px-3 py-1"
                    data-testid={`button-view-details-${opportunity.id}`}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
