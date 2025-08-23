interface UrlParams {
  poolId?: string;
  network?: string;
  protocol?: string;
  tokenPair?: string;
}

interface ParsedYieldUrl {
  isNewUrlFormat: boolean;
  poolId?: string;
  network?: string;
  protocol?: string;
  tokenPair?: string;
}

/**
 * Parse URL parameters to determine yield opportunity details
 * Supports both legacy /pool/:poolId format and new SEO-friendly format
 */
export function parseYieldUrl(params: UrlParams): ParsedYieldUrl {
  const { poolId, network, protocol, tokenPair } = params;
  
  // New URL format: /yield/:network/:protocol/:tokenPair
  const isNewUrlFormat = !poolId && !!(network && protocol && tokenPair);
  
  return {
    isNewUrlFormat,
    poolId,
    network,
    protocol,
    tokenPair
  };
}

/**
 * Generate a URL for a yield opportunity based on available data
 */
export function generateYieldUrl(params: {
  poolId?: string;
  network?: string;
  protocol?: string;
  tokenPair?: string;
}): string {
  const { poolId, network, protocol, tokenPair } = params;
  
  // Prefer new SEO-friendly format if we have the required data
  if (network && protocol && tokenPair) {
    const networkSlug = network.toLowerCase().replace(/\s+/g, '-');
    const protocolSlug = protocol.toLowerCase().replace(/\s+/g, '-');
    const tokenPairSlug = tokenPair.toLowerCase().replace(/\s+/g, '-');
    return `/yield/${networkSlug}/${protocolSlug}/${tokenPairSlug}`;
  }
  
  // Fall back to legacy format
  if (poolId) {
    return `/pool/${poolId}`;
  }
  
  // Default fallback
  return '/';
}