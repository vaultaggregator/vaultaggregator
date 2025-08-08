import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Zap } from "lucide-react";

export interface RiskSentimentData {
  overallRisk: 'low' | 'medium' | 'high' | 'extreme';
  overallScore?: number; // 1-100 scale
  smartContractRisk?: number;
  liquidityRisk?: number;
  platformRisk?: number;
  marketRisk?: number;
  auditStatus?: 'verified' | 'unaudited' | 'unknown';
  tvlStability?: number;
  apyVolatility?: number;
}

interface RiskSentimentMeterProps {
  data: RiskSentimentData;
  size?: 'sm' | 'md' | 'lg';
  showDetailed?: boolean;
  className?: string;
}

// Emoji mappings for different risk levels and sentiments
const getRiskEmoji = (riskLevel: string, score?: number): string => {
  if (score !== undefined) {
    if (score <= 20) return "🟢"; // Very Safe
    if (score <= 40) return "🟡"; // Low Risk  
    if (score <= 60) return "🟠"; // Medium Risk
    if (score <= 80) return "🔴"; // High Risk
    return "⚫"; // Extreme Risk
  }
  
  switch (riskLevel) {
    case 'low': return "🟢";
    case 'medium': return "🟡"; 
    case 'high': return "🔴";
    case 'extreme': return "⚫";
    default: return "⚪";
  }
};

const getSentimentEmoji = (score: number): string => {
  if (score <= 20) return "😌"; // Very confident/safe
  if (score <= 40) return "😊"; // Optimistic
  if (score <= 60) return "😐"; // Neutral
  if (score <= 80) return "😟"; // Concerned
  return "😰"; // Very worried
};

const getVibeEmoji = (riskLevel: string): string => {
  switch (riskLevel) {
    case 'low': return "✨"; // Magical/safe
    case 'medium': return "⚡"; // Electric/moderate energy
    case 'high': return "🔥"; // Hot/risky
    case 'extreme': return "💀"; // Danger
    default: return "❓"; // Unknown
  }
};

const getAuditEmoji = (auditStatus?: string): string => {
  switch (auditStatus) {
    case 'verified': return "✅";
    case 'unaudited': return "❌";
    case 'unknown': 
    default: return "❓";
  }
};

const getRiskDescription = (riskLevel: string, score?: number): string => {
  if (score !== undefined) {
    if (score <= 20) return "Ultra Safe Zone";
    if (score <= 40) return "Safe Haven";
    if (score <= 60) return "Calculated Risk";
    if (score <= 80) return "High Stakes";
    return "Danger Zone";
  }
  
  switch (riskLevel) {
    case 'low': return "Safe Harbor";
    case 'medium': return "Balanced Waters";
    case 'high': return "Stormy Seas";
    case 'extreme': return "Hurricane Zone";
    default: return "Uncharted Territory";
  }
};

const getRiskColor = (riskLevel: string, score?: number): string => {
  if (score !== undefined) {
    if (score <= 20) return "text-green-600 dark:text-green-400";
    if (score <= 40) return "text-green-500 dark:text-green-400";
    if (score <= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score <= 80) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  }
  
  switch (riskLevel) {
    case 'low': return "text-green-600 dark:text-green-400";
    case 'medium': return "text-yellow-600 dark:text-yellow-400";
    case 'high': return "text-red-600 dark:text-red-400";
    case 'extreme': return "text-red-700 dark:text-red-500";
    default: return "text-gray-600 dark:text-gray-400";
  }
};

const getRiskBgColor = (riskLevel: string, score?: number): string => {
  if (score !== undefined) {
    if (score <= 20) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (score <= 40) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (score <= 60) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    if (score <= 80) return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  }
  
  switch (riskLevel) {
    case 'low': return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    case 'medium': return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    case 'high': return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    case 'extreme': return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
    default: return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
  }
};

export function RiskSentimentMeter({ 
  data, 
  size = 'md', 
  showDetailed = false, 
  className = "" 
}: RiskSentimentMeterProps) {
  const { overallRisk, overallScore } = data;
  
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  if (!showDetailed) {
    // Compact version - just the main risk indicator
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline"
              className={`
                ${getRiskBgColor(overallRisk, overallScore)} 
                ${getRiskColor(overallRisk, overallScore)}
                ${sizeClasses[size]} 
                font-medium border px-2 py-1 cursor-pointer hover:shadow-sm transition-all
                ${className}
              `}
              data-testid="risk-sentiment-badge"
            >
              <span className="mr-1">{getRiskEmoji(overallRisk, overallScore)}</span>
              <span className="mr-1">{getSentimentEmoji(overallScore || 50)}</span>
              <span className="mr-1">{getVibeEmoji(overallRisk)}</span>
              <span className="font-semibold">
                {overallScore ? `${overallScore}/100` : overallRisk.toUpperCase()}
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-center">
                {getRiskDescription(overallRisk, overallScore)}
              </p>
              {overallScore && (
                <p className="text-sm text-center">
                  Risk Score: {overallScore}/100
                </p>
              )}
              <div className="flex justify-center space-x-2 text-lg">
                <span>{getRiskEmoji(overallRisk, overallScore)}</span>
                <span>{getSentimentEmoji(overallScore || 50)}</span>
                <span>{getVibeEmoji(overallRisk)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed version with breakdown
  return (
    <Card className={`${getRiskBgColor(overallRisk, overallScore)} ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Main Risk Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getRiskEmoji(overallRisk, overallScore)}</span>
              <span className="text-2xl">{getSentimentEmoji(overallScore || 50)}</span>
              <span className="text-2xl">{getVibeEmoji(overallRisk)}</span>
              <div>
                <h3 className={`font-bold ${getRiskColor(overallRisk, overallScore)}`}>
                  {getRiskDescription(overallRisk, overallScore)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Overall Risk Assessment
                </p>
              </div>
            </div>
            {overallScore && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${getRiskColor(overallRisk, overallScore)}`}>
                  {overallScore}
                </p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            )}
          </div>

          {/* Risk Factor Breakdown */}
          {(data.smartContractRisk || data.liquidityRisk || data.platformRisk || data.marketRisk) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {data.smartContractRisk && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Smart Contract
                  </span>
                  <span className="flex items-center">
                    {getRiskEmoji('', data.smartContractRisk)} {data.smartContractRisk}
                  </span>
                </div>
              )}
              
              {data.liquidityRisk && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Liquidity
                  </span>
                  <span className="flex items-center">
                    {getRiskEmoji('', data.liquidityRisk)} {data.liquidityRisk}
                  </span>
                </div>
              )}
              
              {data.platformRisk && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    Platform
                  </span>
                  <span className="flex items-center">
                    {getRiskEmoji('', data.platformRisk)} {data.platformRisk}
                  </span>
                </div>
              )}
              
              {data.marketRisk && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Market
                  </span>
                  <span className="flex items-center">
                    {getRiskEmoji('', data.marketRisk)} {data.marketRisk}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Audit Status */}
          {data.auditStatus && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Security Audit
              </span>
              <span className="flex items-center">
                {getAuditEmoji(data.auditStatus)} 
                <span className="ml-1 capitalize">{data.auditStatus}</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskSentimentMeter;