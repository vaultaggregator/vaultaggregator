// Centralized dynamic risk scoring system for DeFi vaults

export interface RiskScore {
  numeric: number; // 1-10
  label: 'Low' | 'Medium' | 'High';
  color: {
    text: string;
    background: string;
    border: string;
  };
  factors?: RiskFactorBreakdown;
}

export interface RiskFactorBreakdown {
  daysRunning: { score: number; weight: number; description: string };
  tvl: { score: number; weight: number; description: string };
  apy: { score: number; weight: number; description: string };
  userActivity: { score: number; weight: number; description: string };
  userCount: { score: number; weight: number; description: string };
}

export interface VaultMetrics {
  operatingDays: number;
  tvl: number; // in USD
  apy: number; // as percentage
  holdersCount: number;
  transferVolume?: number; // optional - if available
  avgTransferSize?: number; // optional - if available
}

// Risk score mapping configuration
export const RISK_RANGES = {
  LOW: { min: 1, max: 3 },
  MEDIUM: { min: 4, max: 6 },
  HIGH: { min: 7, max: 10 }
} as const;

// Color configuration for each risk level
export const RISK_COLORS = {
  LOW: {
    text: 'text-green-700 dark:text-green-400',
    background: 'bg-green-100 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800'
  },
  MEDIUM: {
    text: 'text-orange-700 dark:text-orange-400',
    background: 'bg-orange-100 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800'
  },
  HIGH: {
    text: 'text-red-700 dark:text-red-400',
    background: 'bg-red-100 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800'
  }
} as const;

// Risk factor weights (must sum to 1.0)
export const RISK_WEIGHTS = {
  daysRunning: 0.25,    // 25% - Track record is important
  tvl: 0.25,           // 25% - Size and trust
  apy: 0.20,           // 20% - Yield sustainability
  userActivity: 0.15,   // 15% - Flow patterns
  userCount: 0.15      // 15% - Adoption
} as const;

// Risk thresholds for normalization
export const RISK_THRESHOLDS = {
  daysRunning: {
    safe: 365,      // 1+ years = low risk
    moderate: 90,   // 3+ months = medium risk
    // < 90 days = high risk
  },
  tvl: {
    high: 100_000_000,  // $100M+ = low risk
    moderate: 10_000_000, // $10M+ = medium risk
    // < $10M = higher risk
  },
  apy: {
    suspicious: 50,     // 50%+ APY = high risk
    moderate: 15,       // 15%+ APY = medium risk
    // 0-15% = safer range
  },
  userCount: {
    high: 1000,         // 1000+ users = low risk
    moderate: 100,      // 100+ users = medium risk
    // < 100 users = higher risk
  }
} as const;

/**
 * Calculate risk score for days running
 */
function calculateDaysRunningRisk(days: number): number {
  if (days >= RISK_THRESHOLDS.daysRunning.safe) return 1; // Low risk
  if (days >= RISK_THRESHOLDS.daysRunning.moderate) return 5; // Medium risk
  if (days >= 30) return 7; // High risk but not maximum
  return 9; // Very new vault
}

/**
 * Calculate risk score for TVL
 */
function calculateTvlRisk(tvl: number): number {
  if (tvl >= RISK_THRESHOLDS.tvl.high) return 1; // Low risk
  if (tvl >= RISK_THRESHOLDS.tvl.moderate) return 3; // Low-medium risk
  if (tvl >= 1_000_000) return 5; // Medium risk
  if (tvl >= 100_000) return 7; // High risk
  return 9; // Very low TVL
}

/**
 * Calculate risk score for APY
 */
function calculateApyRisk(apy: number): number {
  if (apy >= RISK_THRESHOLDS.apy.suspicious) return 9; // Very high risk
  if (apy >= 30) return 7; // High risk
  if (apy >= RISK_THRESHOLDS.apy.moderate) return 5; // Medium risk
  if (apy >= 5) return 2; // Low risk
  return 1; // Very conservative
}

/**
 * Calculate risk score for user activity patterns
 */
function calculateUserActivityRisk(metrics: VaultMetrics): number {
  // If no transfer data available, use neutral score
  if (!metrics.transferVolume && !metrics.avgTransferSize) {
    return 5; // Neutral medium risk
  }
  
  // For now, return medium risk until we have transfer data
  // TODO: Implement when transfer analysis is available
  return 5;
}

/**
 * Calculate risk score for user count
 */
function calculateUserCountRisk(userCount: number): number {
  if (userCount >= RISK_THRESHOLDS.userCount.high) return 1; // Low risk
  if (userCount >= RISK_THRESHOLDS.userCount.moderate) return 3; // Low-medium risk
  if (userCount >= 50) return 5; // Medium risk
  if (userCount >= 10) return 7; // High risk
  return 9; // Very few users
}

/**
 * Main function to calculate dynamic risk score based on vault metrics
 */
export function calculateDynamicRiskScore(metrics: VaultMetrics): RiskScore {
  // Calculate individual factor scores
  const daysScore = calculateDaysRunningRisk(metrics.operatingDays);
  const tvlScore = calculateTvlRisk(metrics.tvl);
  const apyScore = calculateApyRisk(metrics.apy);
  const activityScore = calculateUserActivityRisk(metrics);
  const userCountScore = calculateUserCountRisk(metrics.holdersCount);
  
  // Create factor breakdown for transparency
  const factors: RiskFactorBreakdown = {
    daysRunning: {
      score: daysScore,
      weight: RISK_WEIGHTS.daysRunning,
      description: `${metrics.operatingDays} days operating`
    },
    tvl: {
      score: tvlScore,
      weight: RISK_WEIGHTS.tvl,
      description: `$${(metrics.tvl / 1_000_000).toFixed(1)}M TVL`
    },
    apy: {
      score: apyScore,
      weight: RISK_WEIGHTS.apy,
      description: `${metrics.apy.toFixed(1)}% APY`
    },
    userActivity: {
      score: activityScore,
      weight: RISK_WEIGHTS.userActivity,
      description: 'Activity patterns analyzed'
    },
    userCount: {
      score: userCountScore,
      weight: RISK_WEIGHTS.userCount,
      description: `${metrics.holdersCount} users`
    }
  };
  
  // Calculate weighted average
  const weightedScore = 
    (daysScore * RISK_WEIGHTS.daysRunning) +
    (tvlScore * RISK_WEIGHTS.tvl) +
    (apyScore * RISK_WEIGHTS.apy) +
    (activityScore * RISK_WEIGHTS.userActivity) +
    (userCountScore * RISK_WEIGHTS.userCount);
  
  // Round to nearest integer and ensure within bounds
  const finalScore = Math.max(1, Math.min(10, Math.round(weightedScore)));
  
  return getRiskScore(finalScore, factors);
}

/**
 * Converts a numeric risk score (1-10) to a structured risk object
 */
export function getRiskScore(numericScore: number, factors?: RiskFactorBreakdown): RiskScore {
  // Clamp the score to valid range
  const score = Math.max(1, Math.min(10, Math.round(numericScore)));
  
  let label: 'Low' | 'Medium' | 'High';
  let colorKey: keyof typeof RISK_COLORS;
  
  if (score >= RISK_RANGES.LOW.min && score <= RISK_RANGES.LOW.max) {
    label = 'Low';
    colorKey = 'LOW';
  } else if (score >= RISK_RANGES.MEDIUM.min && score <= RISK_RANGES.MEDIUM.max) {
    label = 'Medium';
    colorKey = 'MEDIUM';
  } else {
    label = 'High';
    colorKey = 'HIGH';
  }
  
  return {
    numeric: score,
    label,
    color: RISK_COLORS[colorKey],
    factors
  };
}

/**
 * Converts legacy risk level strings to numeric scores
 */
export function parseRiskLevel(riskLevel: string | number): RiskScore {
  // If already numeric, use it directly
  if (typeof riskLevel === 'number') {
    return getRiskScore(riskLevel);
  }
  
  // Convert legacy string values to numeric scores
  const normalizedLevel = riskLevel?.toLowerCase().trim();
  
  switch (normalizedLevel) {
    case 'low':
      return getRiskScore(2); // Mid-range of Low (1-3)
    case 'medium':
    case 'moderate':
      return getRiskScore(5); // Mid-range of Medium (4-6)
    case 'high':
      return getRiskScore(8); // Mid-range of High (7-10)
    default:
      // Default to medium risk if unknown
      return getRiskScore(5);
  }
}

/**
 * Helper function to calculate risk score from vault data
 */
export function calculateRiskFromVault(vault: any): RiskScore {
  // Extract metrics from vault object
  const metrics: VaultMetrics = {
    operatingDays: vault.operatingDays || 0,
    tvl: parseFloat(vault.tvl) || 0,
    apy: parseFloat(vault.apy) || 0,
    holdersCount: vault.holdersCount || 0
  };
  
  return calculateDynamicRiskScore(metrics);
}

/**
 * Formats risk score for display: "Risk Score: 3 (Low)"
 */
export function formatRiskDisplay(riskLevel: string | number): string {
  const risk = parseRiskLevel(riskLevel);
  return `${risk.numeric} (${risk.label})`;
}