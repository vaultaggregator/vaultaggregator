import { Badge } from "@/components/ui/badge";
import { getRiskConfig, convertToRiskScore, getLegacyRiskConfig, formatRiskDisplay } from "@/lib/risk-utils";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  // Either provide a numeric score (1-10) or legacy risk level string
  riskScore?: number;
  riskLevel?: string;
  overallScore?: number; // 0-100 scale from database
  className?: string;
  showScore?: boolean; // Whether to show numeric score
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ 
  riskScore, 
  riskLevel, 
  overallScore,
  className, 
  showScore = true,
  size = 'md'
}: RiskBadgeProps) {
  // Determine risk configuration from available data
  let riskConfig;
  
  if (riskScore) {
    riskConfig = getRiskConfig(riskScore);
  } else if (overallScore !== undefined) {
    const convertedScore = convertToRiskScore(overallScore);
    riskConfig = getRiskConfig(convertedScore);
  } else if (riskLevel) {
    riskConfig = getLegacyRiskConfig(riskLevel);
  } else {
    // Default fallback
    riskConfig = getRiskConfig(5);
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge 
      className={cn(
        'font-medium border',
        riskConfig.color.bg,
        riskConfig.color.text,
        riskConfig.color.border,
        sizeClasses[size],
        className
      )}
    >
      {riskConfig.label}
    </Badge>
  );
}