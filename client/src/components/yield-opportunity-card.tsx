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
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Protocol logo placeholder */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, ${opportunity.chain.color}80, ${opportunity.chain.color})`
              }}
              data-testid={`logo-${opportunity.platform.name}`}
            >
              {getPlatformInitials(opportunity.platform.displayName)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900" data-testid={`text-platform-${opportunity.id}`}>
                {opportunity.platform.displayName}
              </h3>
              <p className="text-sm text-gray-500" data-testid={`text-token-pair-${opportunity.id}`}>
                {opportunity.tokenPair}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary"
              className="text-xs font-medium"
              style={getChainColor(opportunity.chain.color)}
              data-testid={`badge-chain-${opportunity.id}`}
            >
              {opportunity.chain.displayName}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              className="text-gray-400 hover:text-gray-600 p-1"
              data-testid={`button-favorite-${opportunity.id}`}
            >
              <Heart 
                className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">APY</span>
            <span 
              className="text-lg font-bold text-success-600" 
              data-testid={`text-apy-${opportunity.id}`}
            >
              {formatApy(opportunity.apy)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">TVL</span>
            <span 
              className="font-semibold text-gray-900"
              data-testid={`text-tvl-${opportunity.id}`}
            >
              {formatTvl(opportunity.tvl)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Risk Level</span>
            <Badge 
              variant="secondary"
              className={`text-xs font-medium ${getRiskColor(opportunity.riskLevel)}`}
              data-testid={`badge-risk-${opportunity.id}`}
            >
              {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)}
            </Badge>
          </div>
        </div>

        {opportunity.notes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p 
              className="text-xs text-gray-500"
              data-testid={`text-notes-${opportunity.id}`}
            >
              {opportunity.notes[0].content}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            data-testid={`button-view-details-${opportunity.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
