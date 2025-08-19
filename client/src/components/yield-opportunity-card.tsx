
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricTooltip } from "./metric-tooltip";
import { RiskBadge } from "@/components/risk-badge";
import { AnimatedValue, ShimmerEffect } from "@/components/animated-value";
import { useRealtimeApy } from "@/hooks/useRealtimeApy";
import { WebSocketStatus } from "@/components/websocket-status";
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

  const formatHolders = (holders: number | null | undefined): string => {
    if (!holders) return 'N/A';
    if (holders >= 1000000) return `${(holders / 1000000).toFixed(1)}M`;
    if (holders >= 1000) return `${(holders / 1000).toFixed(1)}K`;
    return holders.toString();
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
      <Card className={`bg-card cursor-pointer card-hover ${showHeaders ? 'rounded-lg sm:rounded-xl shadow-soft border border-border hover:shadow-medium hover:border-accent-primary/50 transition-all duration-300 animate-fade-in border-l-4 border-l-transparent hover:border-l-accent-primary' : 'rounded-none shadow-none border-0 hover:bg-muted/50 transition-colors'}`}>
        <CardContent className="p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          {/* Left section - Token and Platform info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Subcategory Icon and Pool Name together - moved to leftmost position */}
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                {opportunity.categories && opportunity.categories.length > 0 && (() => {
                  // Check all categories for USDC, USDT, or stETH
                  const usdcCategory = opportunity.categories.find(cat => cat.name === 'USDC');
                  const usdtCategory = opportunity.categories.find(cat => cat.name === 'USDT');
                  const stethCategory = opportunity.categories.find(cat => cat.name === 'stETH');
                  
                  if (usdcCategory) {
                    return (
                      <img 
                        src="/public-objects/images/a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png"
                        alt="USDC"
                        className="w-6 h-6 flex-shrink-0 rounded-full"
                        data-testid={`logo-usdc-${opportunity.id}`}
                      />
                    );
                  } else if (usdtCategory) {
                    return (
                      <img 
                        src="/usdt-logo.png"
                        alt="USDT"
                        className="w-6 h-6 flex-shrink-0 rounded-full"
                        data-testid={`logo-usdt-${opportunity.id}`}
                      />
                    );
                  } else if (stethCategory) {
                    return (
                      <img 
                        src="/public-objects/images/ae7ab96520de3a18e5e111b5eaab095312d7fe84.png"
                        alt="stETH"
                        className="w-6 h-6 flex-shrink-0 rounded-full"
                        data-testid={`logo-steth-${opportunity.id}`}
                      />
                    );
                  }
                  
                  // Fall back to SVG icons for other categories
                  const CategoryIcon = getCategoryIcon(opportunity.categories[0].name);
                  return <CategoryIcon size={24} className="flex-shrink-0" />;
                })()}
              </div>
              
              <div className="min-w-0 flex-1 flex items-center">
                <h3 className="font-bold text-base text-foreground truncate m-0 leading-5" data-testid={`text-token-pair-${opportunity.id}`}>
                  {opportunity.tokenPair}
                </h3>
              </div>
            </div>
            
            {/* Protocol info - center aligned */}
            <div className="flex items-center justify-center space-x-2 flex-shrink-0">
              <div className="w-4 h-4 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {opportunity.platform.logoUrl ? (
                  <img 
                    src={opportunity.platform.logoUrl} 
                    alt={opportunity.platform.displayName}
                    className="w-full h-full object-cover rounded-full"
                    data-testid={`logo-platform-${opportunity.platform.name.toLowerCase()}`}
                  />
                ) : (
                  <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {getPlatformInitials(opportunity.platform.displayName)}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground text-center">
                {opportunity.platform.displayName || opportunity.platform.name}
              </span>
            </div>
            
            {/* Network info - center aligned */}
            {showNetworkName && (
              <div className="flex items-center justify-center space-x-2 flex-shrink-0 w-24">
                <div 
                  className="flex items-center justify-center flex-shrink-0"
                  data-testid={`badge-chain-${opportunity.id}`}
                >
                  {(() => {
                    const ChainIcon = getChainIcon(opportunity.chain.name);
                    return <ChainIcon size={16} className="flex-shrink-0" />;
                  })()}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {opportunity.chain.displayName || opportunity.chain.name}
                </span>
              </div>
            )}
          </div>

          {/* Desktop grid layout - matches header structure */}
          <div className="hidden sm:grid sm:grid-cols-8 sm:gap-4 sm:items-center sm:flex-1 sm:max-w-2xl">
            {/* APY */}
            <div className="text-center">
              <AnimatedValue
                value={opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                className="text-lg font-bold text-green-600"
              >
                <p data-testid={`text-apy-${opportunity.id}`}>
                  {opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                </p>
              </AnimatedValue>
            </div>
            
            {/* Days */}
            <div className="text-center">
              <p className="text-base font-semibold text-blue-500" data-testid={`text-operating-days-${opportunity.id}`}>
                {opportunity.operatingDays || opportunity.rawData?.count || 'N/A'}
              </p>
            </div>
            
            {/* TVL */}
            <div className="col-span-2 text-center">
              <p className="text-base font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
                {opportunity.tvl ? formatTvl(opportunity.tvl) : 'N/A'}
              </p>
            </div>
            
            {/* Holders */}
            <div className="col-span-2 text-center">
              <p className="text-base font-semibold text-purple-600" data-testid={`text-holders-${opportunity.id}`}>
                {formatHolders(opportunity.holdersCount)}
              </p>
            </div>
            
            {/* Risk */}
            <div className="text-center">
              <RiskBadge 
                vault={opportunity}
                risk={opportunity.riskLevel || 'medium'}
                variant="compact"
                showScore={true}
                showLabel={true}
                useDynamic={true}
                data-testid={`badge-risk-${opportunity.id}`}
              />
            </div>
          </div>

          {/* Mobile layout */}
          <div className="sm:hidden">
            <div className="space-y-3">
              {/* First row with 3 metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="h-4 mb-0.5 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground font-medium">24h APY</p>
                  </div>
                  <AnimatedValue
                    value={opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                    className="text-lg font-bold text-green-600"
                  >
                    <p data-testid={`text-apy-${opportunity.id}`}>
                      {opportunity.apy ? formatApy(opportunity.apy) : 'N/A'}
                    </p>
                  </AnimatedValue>
                </div>
                <div className="text-center">
                  <div className="h-4 mb-0.5 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground font-medium">Days</p>
                  </div>
                  <p className="text-base font-bold text-blue-500" data-testid={`text-operating-days-${opportunity.id}`}>
                    {opportunity.operatingDays || opportunity.rawData?.count || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-4 mb-0.5 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground font-medium">TVL</p>
                  </div>
                  <p className="text-base font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
                    {opportunity.tvl ? formatTvl(opportunity.tvl) : 'N/A'}
                  </p>
                </div>
              </div>
              
              {/* Second row with Platform, Holders and Risk */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="h-4 mb-0.5 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground font-medium">Platform</p>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
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
                    <span className="text-xs text-foreground leading-none truncate max-w-12">{opportunity.platform.displayName || opportunity.platform.name}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-4 mb-0.5 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground font-medium">Holders</p>
                  </div>
                  <p className="text-base font-semibold text-purple-600" data-testid={`text-holders-${opportunity.id}`}>
                    {formatHolders(opportunity.holdersCount)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-4 mb-0.5 sm:hidden flex items-center justify-center">
                    <p className="text-xs text-muted-foreground font-medium">Risk</p>
                  </div>
                  {showHeaders && (
                    <p className="text-xs text-muted-foreground mb-0.5 font-medium hidden sm:block">Risk</p>
                  )}
                  <div className="flex justify-center">
                    <RiskBadge 
                      vault={opportunity}
                      risk={opportunity.riskLevel || 'medium'}
                      variant="compact"
                      showScore={true}
                      showLabel={true}
                      useDynamic={true}
                      data-testid={`badge-risk-${opportunity.id}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
