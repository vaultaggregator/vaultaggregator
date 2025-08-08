// Token address normalization utilities for better display

// Common token address mappings for major tokens
const TOKEN_ADDRESS_MAP: Record<string, string> = {
  // Ethereum mainnet tokens
  "0x0000000000000000000000000000000000000000": "ETH",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "USDC",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7": "USDT", 
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "DAI",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": "WBTC",
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "WETH",
  "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": "UNI",
  "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9": "AAVE",
  "0x514910771AF9Ca656af840dff83E8264EcF986CA": "LINK",
  "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE": "SHIB",
  "0xae78736Cd615f374D3085123A210448E74Fc6393": "rETH",
  "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB": "bEEFY",
  "0x58d97b57bb95320f9a05dc918aef65434969c2b2": "STEAK",
  
  // Stablecoins
  "0x4Fabb145d64652a948d72533023f6E7A623C7C53": "BUSD",
  "0x853d955aCEf822Db058eb8505911ED77F175b99e": "FRAX",
  "0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E": "crvUSD",
  
  // Staking tokens
  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84": "stETH",
  "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0": "wstETH",
  "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b": "ETHx",
  
  // Layer 2 and other chains
  "0x4200000000000000000000000000000000000006": "WETH", // Optimism
  "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": "WETH", // Arbitrum
};

/**
 * Normalizes a token address to a human-readable format
 * @param address - The token address to normalize
 * @param options - Display options
 * @returns The normalized token display string
 */
export function normalizeTokenAddress(
  address: string, 
  options: {
    preferSymbol?: boolean;
    truncateLength?: number;
    showPrefix?: boolean;
  } = {}
): string {
  const { 
    preferSymbol = true, 
    truncateLength = 6, 
    showPrefix = false 
  } = options;

  if (!address || typeof address !== 'string') {
    return 'Unknown';
  }

  // Convert to lowercase for consistent mapping
  const normalizedAddress = address.toLowerCase();
  
  // Check if we have a known token symbol
  const knownToken = TOKEN_ADDRESS_MAP[normalizedAddress] || TOKEN_ADDRESS_MAP[address];
  
  if (knownToken && preferSymbol) {
    return showPrefix ? `${knownToken} (${truncateAddress(address, truncateLength)})` : knownToken;
  }
  
  // If not a known token or preferSymbol is false, truncate the address
  return truncateAddress(address, truncateLength);
}

/**
 * Truncates an address to a more readable format
 * @param address - The address to truncate
 * @param length - Number of characters to show from start and end
 * @returns Truncated address string
 */
export function truncateAddress(address: string, length: number = 6): string {
  if (!address || address.length <= length * 2 + 3) {
    return address;
  }
  
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Normalizes an array of token addresses
 * @param addresses - Array of token addresses
 * @param options - Display options
 * @returns Array of normalized token strings
 */
export function normalizeTokenAddresses(
  addresses: string[], 
  options: {
    preferSymbol?: boolean;
    truncateLength?: number;
    showPrefix?: boolean;
    maxDisplay?: number;
  } = {}
): string[] {
  const { maxDisplay, ...normalizeOptions } = options;
  
  if (!Array.isArray(addresses)) {
    return [];
  }
  
  const normalized = addresses.map(addr => normalizeTokenAddress(addr, normalizeOptions));
  
  if (maxDisplay && normalized.length > maxDisplay) {
    return [
      ...normalized.slice(0, maxDisplay),
      `+${normalized.length - maxDisplay} more`
    ];
  }
  
  return normalized;
}

/**
 * Checks if an address is a known token
 * @param address - Token address to check
 * @returns Boolean indicating if the token is known
 */
export function isKnownToken(address: string): boolean {
  if (!address) return false;
  const normalizedAddress = address.toLowerCase();
  return !!(TOKEN_ADDRESS_MAP[normalizedAddress] || TOKEN_ADDRESS_MAP[address]);
}

/**
 * Gets the symbol for a known token address
 * @param address - Token address
 * @returns Token symbol or null if not found
 */
export function getTokenSymbol(address: string): string | null {
  if (!address) return null;
  const normalizedAddress = address.toLowerCase();
  return TOKEN_ADDRESS_MAP[normalizedAddress] || TOKEN_ADDRESS_MAP[address] || null;
}

/**
 * Adds a new token to the address mapping
 * @param address - Token address
 * @param symbol - Token symbol
 */
export function addTokenMapping(address: string, symbol: string): void {
  if (address && symbol) {
    TOKEN_ADDRESS_MAP[address.toLowerCase()] = symbol;
  }
}

/**
 * Component helper for token display with one-click normalization
 * @param addresses - Token addresses to display
 * @param onClick - Optional click handler for normalization action
 * @returns Object with display data and handlers
 */
export function useTokenDisplay(addresses: string | string[], onClick?: () => void) {
  const addressArray = Array.isArray(addresses) ? addresses : [addresses];
  
  const normalizedTokens = normalizeTokenAddresses(addressArray, {
    preferSymbol: true,
    maxDisplay: 3
  });
  
  const hasUnknownTokens = addressArray.some(addr => !isKnownToken(addr));
  
  return {
    normalizedTokens,
    hasUnknownTokens,
    canNormalize: hasUnknownTokens,
    onClick: onClick || (() => {}),
    rawAddresses: addressArray
  };
}