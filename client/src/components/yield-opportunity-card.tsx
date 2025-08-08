
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricTooltip } from "./metric-tooltip";
import type { YieldOpportunity } from "@/types";
import { getChainIcon } from "@/components/chain-icons";
import { getPlatformIcon } from "@/components/platform-icons";
import { getCategoryIcon } from "@/components/category-icons";

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
    <Link href={generateYieldUrl(opportunity)} className="block">
      <Card className={`bg-card cursor-pointer ${showHeaders ? 'rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-blue-300 transition-all duration-300 animate-fade-in border-l-4 border-l-transparent hover:border-l-blue-500' : 'rounded-none shadow-none border-0 hover:bg-muted/50 transition-colors'}`}>
        <CardContent className="p-1.5 sm:p-3">
        <div className="flex items-center flex-col sm:flex-row gap-2 sm:gap-0">
          {/* Left section - Token and Platform info */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1 w-full sm:w-auto">
            {/* Subcategory Icon First */}
            <div className="flex-shrink-0">
              {opportunity.categories && opportunity.categories.length > 0 && (() => {
                // Check all categories for USDC or stETH, not just the first one
                const usdcCategory = opportunity.categories.find(cat => cat.name === 'USDC');
                const stethCategory = opportunity.categories.find(cat => cat.name === 'stETH');
                
                if (usdcCategory) {
                  return (
                    <img 
                      src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
                      alt="USDC"
                      className="w-4 h-4 flex-shrink-0 rounded-full"
                      data-testid={`logo-usdc-${opportunity.id}`}
                    />
                  );
                } else if (stethCategory) {
                  return (
                    <img 
                      src="https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png"
                      alt="stETH"
                      className="w-4 h-4 flex-shrink-0 rounded-full"
                      data-testid={`logo-steth-${opportunity.id}`}
                    />
                  );
                }
                
                // Fall back to SVG icons for other categories
                const CategoryIcon = getCategoryIcon(opportunity.categories[0].name);
                return <CategoryIcon size={16} className="flex-shrink-0" />;
              })()}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-bold text-base text-foreground truncate" data-testid={`text-token-pair-${opportunity.id}`}>
                    {opportunity.tokenPair}
                  </h3>
                  {/* Protocol Icon - Smaller */}
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
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
                        return <PlatformIcon size={16} className="flex-shrink-0" />;
                      })()
                    )}
                  </div>
                </div>
                {showNetworkName && (
                  <div 
                    className="flex items-center justify-center flex-shrink-0"
                    data-testid={`badge-chain-${opportunity.id}`}
                  >
                    {(() => {
                      const ChainIcon = getChainIcon(opportunity.chain.name);
                      return <ChainIcon size={16} className="flex-shrink-0" />;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center section - Key metrics */}
          <div className="w-full sm:flex sm:items-center sm:justify-between sm:flex-1 sm:max-w-4xl sm:mx-2 sm:mx-6">
            {/* Mobile grid, desktop flex layout */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-0 w-full">
              <div className="text-center sm:w-14">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium">24h APY</p>
                )}
                <p className="text-xs font-bold text-green-600" data-testid={`text-apy-${opportunity.id}`}>
                  {opportunity.rawData?.apyBase ? formatApy(opportunity.rawData.apyBase.toString()) : 
                   opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-14">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium">30d APY</p>
                )}
                <p className="text-xs font-bold text-green-500" data-testid={`text-apy-30d-${opportunity.id}`}>
                  {opportunity.rawData?.apyMean30d ? formatApy(opportunity.rawData.apyMean30d.toString()) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-16">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium">TVL</p>
                )}
                <p className="text-xs font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
                  {opportunity.rawData?.tvlUsd ? formatTvl(opportunity.rawData.tvlUsd.toString()) : 
                   opportunity.tvl ? formatTvl(opportunity.tvl) : 'N/A'}
                </p>
              </div>
              <div className="text-center sm:w-16 sm:block hidden">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium">Since</p>
                )}
                <p className="text-xs font-semibold text-foreground" data-testid={`text-operating-since-${opportunity.id}`}>
                  {opportunity.rawData?.count ? `${opportunity.rawData.count} days` : 'N/A'}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 text-center sm:w-16 flex justify-center">
                {showHeaders && (
                  <p className="text-xs text-muted-foreground mb-0.5 font-medium">Risk</p>
                )}
                <Badge 
                  variant="secondary"
                  className={`text-xs font-medium px-2 py-0.5 ${getRiskColor(opportunity.riskLevel)}`}
                  data-testid={`badge-risk-${opportunity.id}`}
                >
                  {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
