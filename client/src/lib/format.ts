/**
 * Format large numbers to compact, human-readable format
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string (e.g., "1.2K", "3.5M", "1.2B")
 */
export function formatNumber(
  value: number,
  options: {
    currency?: string;
    maxDecimals?: number;
    forceDecimals?: boolean;
  } = {}
): string {
  const { currency = '', maxDecimals = 1, forceDecimals = false } = options;
  
  if (value < 1000) {
    return `${currency}${value.toString()}`;
  }
  
  const formatWithSuffix = (num: number, suffix: string): string => {
    const hasDecimals = num % 1 !== 0;
    const decimals = forceDecimals ? maxDecimals : (hasDecimals ? maxDecimals : 0);
    return `${currency}${num.toFixed(decimals)}${suffix}`;
  };
  
  if (value >= 1e9) {
    return formatWithSuffix(value / 1e9, 'B');
  }
  
  if (value >= 1e6) {
    return formatWithSuffix(value / 1e6, 'M');
  }
  
  if (value >= 1e3) {
    return formatWithSuffix(value / 1e3, 'K');
  }
  
  return `${currency}${value.toString()}`;
}

/**
 * Format currency values with compact notation
 */
export function formatCurrency(value: number): string {
  return formatNumber(value, { currency: '$', maxDecimals: 1 });
}

/**
 * Format holder counts and other user metrics
 */
export function formatHolders(value: number): string {
  return formatNumber(value, { maxDecimals: 1 });
}

/**
 * Format TVL values consistently across the platform
 */
export function formatTvl(value: number): string {
  return formatNumber(value, { currency: '$', maxDecimals: 1 });
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use formatHolders instead
 */
export function formatHoldersLegacy(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}