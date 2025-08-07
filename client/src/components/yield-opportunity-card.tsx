
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="p-6">
        <div className="flex items-center">
          {/* Left section - Platform and Token info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shadow-md"
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
          <div className="flex items-center justify-between flex-1 max-w-4xl mx-8">
            <div className="w-20 text-center">
              {showHeaders && <p className="text-xs text-muted-foreground mb-1 font-medium">24h APY</p>}
              <p className="text-lg font-bold text-green-600" data-testid={`text-apy-${opportunity.id}`}>
                {formatApy(opportunity.apy)}
              </p>
            </div>
            <div className="w-20 text-center">
              {showHeaders && <p className="text-xs text-muted-foreground mb-1 font-medium">30d APY</p>}
              <p className="text-lg font-bold text-green-500" data-testid={`text-apy-30d-${opportunity.id}`}>
                {opportunity.rawData?.apyMean30d ? formatApy(opportunity.rawData.apyMean30d.toString()) : 'N/A'}
              </p>
            </div>
            <div className="w-24 text-center">
              {showHeaders && <p className="text-xs text-muted-foreground mb-1 font-medium">TVL</p>}
              <p className="text-lg font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
                {formatTvl(opportunity.tvl)}
              </p>
            </div>
            <div className="w-28 text-center">
              {showHeaders && <p className="text-xs text-muted-foreground mb-1 font-medium">Since</p>}
              <p className="text-sm font-semibold text-foreground" data-testid={`text-operating-since-${opportunity.id}`}>
                {opportunity.rawData?.count ? `${opportunity.rawData.count} days` : 'N/A'}
              </p>
            </div>
            <div className="w-16 text-center">
              {showHeaders && <p className="text-sm text-muted-foreground mb-2 font-medium">Risk</p>}
              <Badge 
                variant="secondary"
                className={`text-sm font-medium px-3 py-1 ${getRiskColor(opportunity.riskLevel)}`}
                data-testid={`badge-risk-${opportunity.id}`}
              >
                {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)}
              </Badge>
            </div>
            <div className="w-20 flex items-center justify-center">
              <div className="flex items-center space-x-2">

                
                <Link href={`/pool/${opportunity.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hover:bg-blue-50"
                    data-testid={`button-view-details-${opportunity.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {opportunity.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p 
              className="text-sm text-gray-600 italic"
              data-testid={`text-notes-${opportunity.id}`}
            >
              💡 {opportunity.notes[0].content}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
