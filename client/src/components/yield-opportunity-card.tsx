import { useState } from "react";
import { Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { YieldOpportunity } from "@/types";

interface YieldOpportunityCardProps {
  opportunity: YieldOpportunity;
}

export default function YieldOpportunityCard({ opportunity }: YieldOpportunityCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

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
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 animate-fade-in border-l-4 border-l-transparent hover:border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left section - Platform and Token info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{
                background: `linear-gradient(135deg, ${opportunity.chain.color}80, ${opportunity.chain.color})`
              }}
              data-testid={`logo-${opportunity.platform.name}`}
            >
              {getPlatformInitials(opportunity.platform.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="font-bold text-lg text-gray-900 truncate" data-testid={`text-platform-${opportunity.id}`}>
                  {opportunity.platform.displayName}
                </h3>
                <Badge 
                  variant="outline"
                  className="text-xs font-medium px-2 py-1"
                  style={getChainColor(opportunity.chain.color)}
                  data-testid={`badge-chain-${opportunity.id}`}
                >
                  {opportunity.chain.displayName}
                </Badge>
              </div>
              <p className="font-mono text-base font-semibold text-gray-700 truncate" data-testid={`text-token-pair-${opportunity.id}`}>
                {opportunity.tokenPair}
              </p>
            </div>
          </div>

          {/* Center section - Key metrics */}
          <div className="flex items-center space-x-8 mx-8">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1 font-medium">APY</p>
              <p className="text-2xl font-bold text-green-600" data-testid={`text-apy-${opportunity.id}`}>
                {formatApy(opportunity.apy)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1 font-medium">TVL</p>
              <p className="text-2xl font-bold text-blue-600" data-testid={`text-tvl-${opportunity.id}`}>
                {formatTvl(opportunity.tvl)}
              </p>
            </div>
          </div>

          {/* Right section - Risk, actions and notes */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2 font-medium">Risk</p>
              <Badge 
                variant="secondary"
                className={`text-sm font-medium px-3 py-1 ${getRiskColor(opportunity.riskLevel)}`}
                data-testid={`badge-risk-${opportunity.id}`}
              >
                {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFavorite}
                className="text-gray-400 hover:text-red-500 p-2"
                data-testid={`button-favorite-${opportunity.id}`}
              >
                <Heart 
                  className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} 
                />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50"
                data-testid={`button-view-details-${opportunity.id}`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Details
              </Button>
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
