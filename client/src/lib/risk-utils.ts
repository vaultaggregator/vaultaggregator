// Centralized risk scoring configuration and utilities

export interface RiskConfig {
  score: number; // 1-10
  label: 'Low' | 'Medium' | 'High';
  color: {
    bg: string;
    text: string;
    border: string;
  };
}

// Risk score mapping configuration - modify ranges here
const RISK_RANGES = {
  low: { min: 1, max: 3 },
  medium: { min: 4, max: 6 },
  high: { min: 7, max: 10 }
} as const;

// Color themes for each risk level
const RISK_COLORS = {
  low: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800'
  },
  medium: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-800 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800'
  },
  high: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  }
} as const;

/**
 * Convert overall risk score (0-100) to 1-10 scale
 */
export function convertToRiskScore(overallScore: number | null): number {
  if (!overallScore) return 5; // Default to medium risk
  
  // Convert 0-100 scale to 1-10 scale
  // Higher overall score = higher risk
  return Math.max(1, Math.min(10, Math.round((overallScore / 100) * 9) + 1));
}

/**
 * Get risk configuration based on numeric score (1-10)
 */
export function getRiskConfig(score: number): RiskConfig {
  let label: 'Low' | 'Medium' | 'High';
  let colorKey: keyof typeof RISK_COLORS;

  if (score >= RISK_RANGES.low.min && score <= RISK_RANGES.low.max) {
    label = 'Low';
    colorKey = 'low';
  } else if (score >= RISK_RANGES.medium.min && score <= RISK_RANGES.medium.max) {
    label = 'Medium';
    colorKey = 'medium';
  } else {
    label = 'High';
    colorKey = 'high';
  }

  return {
    score,
    label,
    color: RISK_COLORS[colorKey]
  };
}

/**
 * Convert legacy risk level strings to new risk config
 */
export function getLegacyRiskConfig(riskLevel: string): RiskConfig {
  const normalizedLevel = riskLevel.toLowerCase();
  
  switch (normalizedLevel) {
    case 'low':
      return getRiskConfig(2); // Middle of low range
    case 'medium':
      return getRiskConfig(5); // Middle of medium range
    case 'high':
      return getRiskConfig(8); // Middle of high range
    default:
      return getRiskConfig(5); // Default to medium
  }
}

/**
 * Format risk display text
 */
export function formatRiskDisplay(score: number): string {
  const config = getRiskConfig(score);
  return `${score} (${config.label})`;
}

/**
 * Get complete CSS classes for risk badge styling
 */
export function getRiskBadgeClasses(score: number): string {
  const config = getRiskConfig(score);
  return `${config.color.bg} ${config.color.text} ${config.color.border}`;
}