import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parseRiskLevel, calculateRiskFromVault } from "@/lib/risk-scoring";

interface RiskBadgeProps {
  risk?: string | number;
  vault?: any; // For dynamic calculation
  variant?: 'full' | 'compact' | 'minimal' | 'legacy';
  className?: string;
  showLabel?: boolean;
  showScore?: boolean;
  useDynamic?: boolean; // Enable dynamic risk calculation
}

/**
 * Enhanced Risk Badge with dynamic calculation support
 */
export function RiskBadge({ 
  risk, 
  vault,
  variant = 'compact',
  className,
  showLabel = true,
  showScore = true,
  useDynamic = true
}: RiskBadgeProps) {
  // Calculate dynamic risk if enabled and vault data is available
  let riskData;
  
  if (useDynamic && vault) {
    try {
      riskData = calculateRiskFromVault(vault);
    } catch (error) {
      console.warn('Failed to calculate dynamic risk, falling back to static:', error);
      riskData = risk ? parseRiskLevel(risk) : parseRiskLevel('medium');
    }
  } else if (risk !== undefined) {
    riskData = parseRiskLevel(risk);
  } else {
    riskData = parseRiskLevel('medium'); // Default fallback
  }
  
  // Legacy mode - only show the label (old behavior)
  if (variant === 'legacy') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          riskData.color.text,
          riskData.color.background, 
          riskData.color.border,
          className
        )}
        data-testid="risk-badge-legacy"
      >
        {riskData.label}
      </Badge>
    );
  }
  
  // New enhanced modes - Updated to show "number followed by word" format
  const getDisplayText = () => {
    if (variant === 'minimal') {
      return showScore ? riskData.numeric.toString() : riskData.label;
    }
    
    if (variant === 'compact') {
      if (showScore && showLabel) {
        return `${riskData.numeric} ${riskData.label}`;  // Changed to "number word" format
      }
      return showScore ? riskData.numeric.toString() : riskData.label;
    }
    
    // Full variant
    if (showScore && showLabel) {
      return `${riskData.numeric} ${riskData.label}`;  // Changed to "number word" format
    } else if (showScore) {
      return `Risk Score: ${riskData.numeric}`;
    } else {
      return `Risk: ${riskData.label}`;
    }
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        riskData.color.text,
        riskData.color.background, 
        riskData.color.border,
        "whitespace-nowrap", // Ensure text stays on one line
        className
      )}
      data-testid="risk-badge"
      title={riskData.factors ? `Calculated from: Days (${riskData.factors.daysRunning.description}), TVL (${riskData.factors.tvl.description}), APY (${riskData.factors.apy.description}), Users (${riskData.factors.userCount.description})` : undefined}
    >
      {getDisplayText()}
    </Badge>
  );
}