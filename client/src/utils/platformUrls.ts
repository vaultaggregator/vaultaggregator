interface Pool {
  id: string;
  platform?: {
    displayName?: string;
    name?: string;
    visitUrlTemplate?: string | null;
  };
  chain?: {
    name?: string;
  };
  rawData?: any;
  platformPoolId?: string | null;
  poolAddress?: string | null;
}

interface UrlData {
  url: string;
  label: string;
}

export function generatePlatformVisitUrl(pool: Pool): UrlData | null {
  // For Morpho pools, use the pool address (which is the vault address)
  const isMorpho = pool.platform?.displayName?.toLowerCase().includes('morpho') || 
                 pool.platform?.name?.toLowerCase().includes('morpho');
  
  if (isMorpho && pool.poolAddress) {
    const chainName = pool.chain?.name?.toLowerCase() || 'ethereum';
    // Use the correct Morpho URL format with query parameters
    const network = chainName === 'base' ? 'base' : 'mainnet';
    return {
      url: `https://app.morpho.org/vault?vault=${pool.poolAddress}&network=${network}`,
      label: 'View on Morpho'
    };
  }
  
  // Check if platform has a custom URL template
  if (pool.platform?.visitUrlTemplate) {
    const template = pool.platform.visitUrlTemplate;
    let url = template;
    
    console.log('Generating URL with template:', template, 'for pool:', pool.id);
    
    // Replace variables in the template
    const chainName = pool.chain?.name?.toLowerCase() || 'ethereum';
    url = url.replace(/\{chainName\}/g, chainName);
    
    // Try to use pool address first for underlyingToken replacement (for Morpho vaults)
    if (pool.poolAddress) {
      url = url.replace(/\{underlyingToken\}/g, pool.poolAddress);
    } else if (pool.rawData && typeof pool.rawData === 'object') {
      const rawData = pool.rawData as any;
      if (rawData.underlyingTokens && Array.isArray(rawData.underlyingTokens) && rawData.underlyingTokens.length > 0) {
        url = url.replace(/\{underlyingToken\}/g, rawData.underlyingTokens[0]);
      }
    }
    
    if (pool.platformPoolId) {
      url = url.replace(/\{platformPoolId\}/g, pool.platformPoolId);
    }
    
    if (pool.poolAddress) {
      url = url.replace(/\{poolAddress\}/g, pool.poolAddress);
    }
    
    console.log('Generated URL:', url);
    
    // Check if all variables were replaced (no remaining {variable} patterns)
    const hasUnreplacedVariables = /\{[^}]+\}/.test(url);
    if (!hasUnreplacedVariables) {
      return {
        url,
        label: `Visit ${pool.platform.displayName || pool.platform.name || 'Platform'}`
      };
    } else {
      console.warn('URL template has unreplaced variables:', url);
    }
  }
  
  // Default to Morpho for all other pools
  return pool.platformPoolId ? {
    url: `https://app.morpho.org/market?id=${pool.platformPoolId}`,
    label: 'Visit Morpho'
  } : null;
}