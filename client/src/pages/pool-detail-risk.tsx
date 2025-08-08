import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskSentimentMeter } from "@/components/risk-sentiment-meter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Shield, TrendingUp, Zap } from "lucide-react";
import type { YieldOpportunity } from "@/types";

interface PoolDetailRiskProps {
  opportunity: YieldOpportunity;
}

export default function PoolDetailRisk({ opportunity }: PoolDetailRiskProps) {
  const getRiskFactorColor = (score: number) => {
    if (score <= 20) return "text-green-600 dark:text-green-400";
    if (score <= 40) return "text-green-500 dark:text-green-400";
    if (score <= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score <= 80) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRiskFactorBg = (score: number) => {
    if (score <= 20) return "bg-green-50 dark:bg-green-900/20";
    if (score <= 40) return "bg-green-50 dark:bg-green-900/20";
    if (score <= 60) return "bg-yellow-50 dark:bg-yellow-900/20";
    if (score <= 80) return "bg-orange-50 dark:bg-orange-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  const getRiskDescription = (category: string, score: number) => {
    const descriptions: Record<string, Record<string, string>> = {
      smart_contract: {
        low: "Smart contracts are well-audited, battle-tested, and have strong security practices.",
        medium: "Smart contracts have been audited but may have some complexity or newer features.",
        high: "Smart contracts may be unaudited, experimental, or have complex interaction patterns.",
        extreme: "Smart contracts are unaudited, experimental, or have known security concerns."
      },
      liquidity: {
        low: "Deep liquidity pools with stable volume and low slippage risk.",
        medium: "Good liquidity with moderate volume but potential for some slippage during high volatility.",
        high: "Limited liquidity that may result in significant slippage during large transactions.",
        extreme: "Very low liquidity with high slippage risk and potential for liquidity crises."
      },
      platform: {
        low: "Established platform with strong reputation, good governance, and proven track record.",
        medium: "Well-known platform with good reputation but may have some operational risks.",
        high: "Newer platform or one with limited track record but generally trustworthy.",
        extreme: "New, unproven platform or one with governance/operational concerns."
      },
      market: {
        low: "Stable market conditions with low volatility and predictable price movements.",
        medium: "Normal market conditions with typical volatility for the asset class.",
        high: "Elevated market volatility with potential for significant price swings.",
        extreme: "Extreme market conditions with high volatility and unpredictable movements."
      }
    };

    const level = score <= 20 ? 'low' : score <= 40 ? 'low' : score <= 60 ? 'medium' : score <= 80 ? 'high' : 'extreme';
    return descriptions[category]?.[level] || "Risk assessment unavailable.";
  };

  return (
    <div className="space-y-6">
      {/* Main Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Risk Assessment Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskSentimentMeter 
            data={{
              overallRisk: opportunity.riskLevel as 'low' | 'medium' | 'high' | 'extreme',
              overallScore: opportunity.riskScore,
              smartContractRisk: opportunity.smartContractRisk,
              liquidityRisk: opportunity.liquidityRisk,
              platformRisk: opportunity.platformRisk,
              marketRisk: opportunity.marketRisk,
              auditStatus: opportunity.auditStatus,
              tvlStability: opportunity.tvlStability,
              apyVolatility: opportunity.apyVolatility
            }}
            size="lg"
            showDetailed={true}
          />
        </CardContent>
      </Card>

      {/* Detailed Risk Breakdown */}
      {(opportunity.smartContractRisk || opportunity.liquidityRisk || opportunity.platformRisk || opportunity.marketRisk) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Smart Contract Risk */}
          {opportunity.smartContractRisk && (
            <Card className={getRiskFactorBg(opportunity.smartContractRisk)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Smart Contract Risk</span>
                  </div>
                  <Badge variant="outline" className={getRiskFactorColor(opportunity.smartContractRisk)}>
                    {opportunity.smartContractRisk}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress 
                  value={opportunity.smartContractRisk} 
                  className="mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {getRiskDescription('smart_contract', opportunity.smartContractRisk)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Liquidity Risk */}
          {opportunity.liquidityRisk && (
            <Card className={getRiskFactorBg(opportunity.liquidityRisk)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Liquidity Risk</span>
                  </div>
                  <Badge variant="outline" className={getRiskFactorColor(opportunity.liquidityRisk)}>
                    {opportunity.liquidityRisk}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress 
                  value={opportunity.liquidityRisk} 
                  className="mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {getRiskDescription('liquidity', opportunity.liquidityRisk)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Platform Risk */}
          {opportunity.platformRisk && (
            <Card className={getRiskFactorBg(opportunity.platformRisk)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Platform Risk</span>
                  </div>
                  <Badge variant="outline" className={getRiskFactorColor(opportunity.platformRisk)}>
                    {opportunity.platformRisk}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress 
                  value={opportunity.platformRisk} 
                  className="mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {getRiskDescription('platform', opportunity.platformRisk)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Market Risk */}
          {opportunity.marketRisk && (
            <Card className={getRiskFactorBg(opportunity.marketRisk)}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Market Risk</span>
                  </div>
                  <Badge variant="outline" className={getRiskFactorColor(opportunity.marketRisk)}>
                    {opportunity.marketRisk}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress 
                  value={opportunity.marketRisk} 
                  className="mb-3"
                />
                <p className="text-sm text-muted-foreground">
                  {getRiskDescription('market', opportunity.marketRisk)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Risk Factors Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Factors Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Audit Status */}
            {opportunity.auditStatus && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Security Audit Status</span>
                <Badge 
                  variant={opportunity.auditStatus === 'verified' ? 'default' : 'destructive'}
                  className="capitalize"
                >
                  {opportunity.auditStatus === 'verified' ? '✅ Verified' : 
                   opportunity.auditStatus === 'unaudited' ? '❌ Unaudited' : '❓ Unknown'}
                </Badge>
              </div>
            )}

            {/* TVL Stability */}
            {opportunity.tvlStability && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">TVL Stability</span>
                <span className="text-sm font-medium">
                  {opportunity.tvlStability > 0.8 ? '🟢 Stable' :
                   opportunity.tvlStability > 0.6 ? '🟡 Moderate' : '🔴 Volatile'}
                </span>
              </div>
            )}

            {/* APY Volatility */}
            {opportunity.apyVolatility && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="font-medium">APY Volatility</span>
                <span className="text-sm font-medium">
                  {opportunity.apyVolatility < 0.1 ? '🟢 Low' :
                   opportunity.apyVolatility < 0.3 ? '🟡 Medium' : '🔴 High'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}