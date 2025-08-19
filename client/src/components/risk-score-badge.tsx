import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parseRiskLevel, calculateRiskFromVault } from "@/lib/risk-scoring";

interface RiskScoreBadgeProps {
  riskLevel?: string | number;
  vault?: any; // For dynamic calculation
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
  showLabel?: boolean;
  showScore?: boolean;
  useDynamic?: boolean; // Enable dynamic risk calculation
  showFactors?: boolean; // Show factor breakdown in tooltip
}

export function RiskScoreBadge({ 
  riskLevel, 
  vault,
  variant = 'full', 
  className,
  showLabel = true,
  showScore = true,
  useDynamic = true,
  showFactors = false
}: RiskScoreBadgeProps) {
  // Calculate dynamic risk if enabled and vault data is available
  let risk;
  
  if (useDynamic && vault) {
    try {
      risk = calculateRiskFromVault(vault);
    } catch (error) {
      console.warn('Failed to calculate dynamic risk, falling back to static:', error);
      risk = riskLevel ? parseRiskLevel(riskLevel) : parseRiskLevel('medium');
    }
  } else if (riskLevel !== undefined) {
    risk = parseRiskLevel(riskLevel);
  } else {
    risk = parseRiskLevel('medium'); // Default fallback
  }
  
  const getDisplayText = () => {
    if (variant === 'minimal') {
      return showScore ? risk.numeric.toString() : risk.label;
    }
    
    if (variant === 'compact') {
      if (showScore && showLabel) {
        return `${risk.numeric} (${risk.label})`;
      }
      return showScore ? risk.numeric.toString() : risk.label;
    }
    
    // Full variant
    if (showScore && showLabel) {
      return `Risk Score: ${risk.numeric} (${risk.label})`;
    } else if (showScore) {
      return `Risk Score: ${risk.numeric}`;
    } else {
      return `Risk: ${risk.label}`;
    }
  };
  
  // Generate tooltip with factor breakdown if available
  const getTooltip = () => {
    if (!showFactors || !risk.factors) return undefined;
    
    const factors = risk.factors;
    return `Risk Breakdown:
• Days Running: ${factors.daysRunning.description} (${factors.daysRunning.score}/10)
• TVL: ${factors.tvl.description} (${factors.tvl.score}/10)
• APY: ${factors.apy.description} (${factors.apy.score}/10)
• User Count: ${factors.userCount.description} (${factors.userCount.score}/10)
• Activity: ${factors.userActivity.description} (${factors.userActivity.score}/10)`;
  };
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        risk.color.text,
        risk.color.background,
        risk.color.border,
        className
      )}
      data-testid="risk-score-badge"
      title={getTooltip()}
    >
      {getDisplayText()}
    </Badge>
  );
}