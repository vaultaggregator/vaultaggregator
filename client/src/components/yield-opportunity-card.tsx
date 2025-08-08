
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricTooltip } from "./metric-tooltip";
import type { YieldOpportunity } from "@/types";

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
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center flex-col sm:flex-row gap-3 sm:gap-0">
          {/* Left section - Platform and Token info */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 w-full sm:w-auto">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden shadow-md flex-shrink-0"
              data-testid={`logo-${opportunity.platform.name}`}
            >
              {opportunity.platform.logoUrl ? (
                <img 
                  src={opportunity.platform.logoUrl} 
                  alt={opportunity.platform.displayName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${opportunity.chain.color}80, ${opportunity.chain.color})`
                  }}
                >
                  {getPlatformInitials(opportunity.platform.displayName)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-bold text-xl text-foreground truncate" data-testid={`text-token-pair-${opportunity.id}`}>
                  {opportunity.tokenPair}
                </h3>
                {showNetworkName && (
                  <Badge 
                    variant="outline"
                    className="text-xs font-medium px-2 py-1"
                    style={getChainColor(opportunity.chain.color)}
                    data-testid={`badge-chain-${opportunity.id}`}
                  >
                    {opportunity.chain.displayName}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground truncate" data-testid={`text-platform-${opportunity.id}`}>
                {opportunity.platform.displayName}
              </p>
            </div>
          </div>

          {/* Center section - Key metrics */}
          <div className="w-full sm:flex sm:items-center sm:justify-between sm:flex-1 sm:max-w-4xl sm:mx-8">
            {/* Mobile grid, desktop flex layout */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between sm:gap-0 w-full">
              <div className="text-center sm:w-20">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">24h APY</p>
                )}
                <p className="text-sm sm:text-lg font-bold text-green-600" data-testid={`text-apy-${opportunity.id}`}>
                  {opportunity.rawData?.apyBase ? formatApy(opportunity.rawData.apyBase.toString()) : 
                   opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-20">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">30d APY</p>
                )}
                <p className="text-sm sm:text-lg font-bold text-green-500" data-testid={`text-apy-30d-${opportunity.id}`}>
                  {opportunity.rawData?.apyMean30d ? formatApy(opportunity.rawData.apyMean30d.toString()) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-24">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">TVL</p>
                )}
                <p className="text-sm sm:text-lg font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
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
              <div className="col-span-2 sm:col-span-1 text-center sm:w-16 flex flex-col sm:block items-center gap-2 sm:gap-0">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Risk</p>
                )}
                <Badge 
                  variant="secondary"
                  className={`text-xs sm:text-sm font-medium px-2 py-1 sm:px-3 sm:py-1 ${getRiskColor(opportunity.riskLevel)}`}
                  data-testid={`badge-risk-${opportunity.id}`}
                >
                  {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)}
                </Badge>
                <Link href={`/pool/${opportunity.id}`} className="mt-2 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-4"
                    data-testid={`button-view-details-${opportunity.id}`}
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
