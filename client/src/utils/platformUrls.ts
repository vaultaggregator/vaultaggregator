interface Pool {
  id: string;
  platform?: {
    displayName?: string;
    name?: string;
    visitUrlTemplate?: string;
  };
  chain?: {
    name?: string;
  };
  rawData?: any;
  defiLlamaId?: string;
  poolAddress?: string;
}

interface UrlData {
  url: string;
  label: string;
}

export function generatePlatformVisitUrl(pool: Pool): UrlData | null {
  // Check if platform has a custom URL template
  if (pool.platform?.visitUrlTemplate) {
    const template = pool.platform.visitUrlTemplate;
    let url = template;
    
    // Replace variables in the template
    const chainName = pool.chain?.name?.toLowerCase() || 'ethereum';
    url = url.replace(/\{chainName\}/g, chainName);
    
    if (pool.rawData && typeof pool.rawData === 'object') {
      const rawData = pool.rawData as any;
      if (rawData.underlyingTokens && Array.isArray(rawData.underlyingTokens) && rawData.underlyingTokens.length > 0) {
        const underlyingToken = rawData.underlyingTokens[0];
        url = url.replace(/\{underlyingToken\}/g, underlyingToken);
      }
    }
    
    if (pool.defiLlamaId) {
      url = url.replace(/\{defiLlamaId\}/g, pool.defiLlamaId);
    }
    
    if (pool.poolAddress) {
      url = url.replace(/\{poolAddress\}/g, pool.poolAddress);
    }
    
    // Check if all variables were replaced (no remaining {variable} patterns)
    if (!url.includes('{') || !url.includes('}')) {
      return {
        url,
        label: `Visit ${pool.platform.displayName || pool.platform.name || 'Platform'}`
      };
    }
  }
  
  // Legacy logic for Morpho pools without custom templates
  const isMorpho = pool.platform?.displayName?.toLowerCase().includes('morpho') || 
                 pool.platform?.name?.toLowerCase().includes('morpho');
  
  if (isMorpho && pool.rawData && typeof pool.rawData === 'object') {
    const rawData = pool.rawData as any;
    if (rawData.underlyingTokens && Array.isArray(rawData.underlyingTokens) && rawData.underlyingTokens.length > 0) {
      const underlyingToken = rawData.underlyingTokens[0];
      const chainName = pool.chain?.name?.toLowerCase() || 'ethereum';
      return {
        url: `https://app.morpho.org/${chainName}/vault/${underlyingToken}`,
        label: 'Visit Morpho Platform'
      };
    }
  }
  
  // Default to DeFi Llama for all other pools
  return pool.defiLlamaId ? {
    url: `https://defillama.com/yields/pool/${pool.defiLlamaId}`,
    label: 'Visit DeFiLlama'
  } : null;
}