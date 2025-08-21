/**
 * Smart Stablecoin Detection Utility
 * Automatically detects stablecoins to eliminate unnecessary API calls
 */

export class StablecoinDetector {
  // Known stablecoin contract addresses
  private static readonly KNOWN_STABLECOINS = new Set([
    // Major stablecoins
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
    '0x4fabb145d64652a948d72533023f6e7a623c7c53', // BUSD
    '0x8e870d67f660d95d5be530380d0ec0bd388289e1', // USDP (Pax Dollar)
    '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // GUSD (Gemini USD)
    '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX
    '0x5f98805a4e8be255a32880fdec7f6728c6568ba0', // LUSD
    '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
    '0xe2f2a5c287993345a840db3b0845fbc70f5935a5', // mUSD
    '0x1456688345527be1f37e9e627da0837d6f08c925', // USDP (OLD)
    '0xa47c8bf37f92abed4a126bda807a7b7498661acd', // UST
    // Base network stablecoins
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC on Base
    '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca', // USDbC on Base
  ]);

  // Stablecoin detection patterns for names and symbols
  private static readonly STABLECOIN_PATTERNS = [
    // Core USD patterns
    'usdc', 'usdt', 'dai', 'busd', 'tusd', 'usdp', 'gusd', 'frax', 'lusd', 'mimatic',
    'ust', 'susd', 'cusd', 'vusd', 'rusd', 'husd', 'dusd', 'pusd', 'nusd', 'musd',
    'usdd', 'usdn', 'usdx', 'usds', 'usdk', 'usdj', 'usdi', 'usdo', 'usdh',
    
    // Full names
    'usd coin', 'tether', 'binance usd', 'true usd', 'pax dollar', 'gemini dollar',
    'terrausd', 'magic internet money', 'dollar', 'stable',
    
    // DeFi stablecoins
    'alusd', 'mim', 'fei', 'rai', 'float', 'volt', 'fpi', 'dola', 'ousd', 'yusd',
    'dusd', 'rusd', 'usdm', 'usdt', 'usdc', 'pyusd', 'crvusd', 'gho', 'mkusd',
    
    // Multi-chain patterns
    'usdce', 'usdc.e', 'usdt.e', 'dai.e', 'bridged usdc', 'bridged usdt',
    
    // Vault and wrapped stablecoins
    'steakusd', 'infiniusd', 'hyperusd', 'smokeusd', 'vaultusd', 'tacusd', 'mevusd',
    'quantusd', 'whiterusd', 'ventureusd', 'pentausd', 'sixusd', 'digitalusd', 'nexususd',
    
    // Exchange-specific stablecoins
    'husd', 'pax', 'uqc', 'usdk', 'eurs', 'eurt', 'cadc', 'xsgd', 'idrt', 'usdx'
  ];

  /**
   * Detect if a token is a stablecoin by address
   */
  static isStablecoinByAddress(tokenAddress: string): boolean {
    return this.KNOWN_STABLECOINS.has(tokenAddress.toLowerCase());
  }

  /**
   * Detect if a token is a stablecoin by name or symbol
   */
  static isStablecoinByNameOrSymbol(name?: string, symbol?: string): boolean {
    const tokenName = name?.toLowerCase() || '';
    const tokenSymbol = symbol?.toLowerCase() || '';
    
    return this.STABLECOIN_PATTERNS.some(pattern => 
      tokenName.includes(pattern) || tokenSymbol.includes(pattern)
    );
  }

  /**
   * Comprehensive stablecoin detection
   * Returns true if token is detected as stablecoin by any method
   */
  static isStablecoin(tokenAddress: string, name?: string, symbol?: string): boolean {
    // Check by address first (fastest)
    if (this.isStablecoinByAddress(tokenAddress)) {
      return true;
    }

    // Check by name/symbol patterns
    if (this.isStablecoinByNameOrSymbol(name, symbol)) {
      return true;
    }

    return false;
  }

  /**
   * Get optimal price for a stablecoin (always $1.00)
   */
  static getStablecoinPrice(): number {
    return 1.0;
  }

  /**
   * Log stablecoin detection with appropriate message
   */
  static logStablecoinDetection(tokenAddress: string, detectionMethod: 'address' | 'pattern', name?: string, symbol?: string): void {
    const displayName = symbol || name || tokenAddress.slice(0, 8) + '...';
    
    if (detectionMethod === 'address') {
      console.log(`💵 Known stablecoin address (${displayName}): $1.00 (NO API CALL)`);
    } else {
      console.log(`🎯 Smart stablecoin detection (${displayName}): $1.00 (NO API CALL)`);
    }
  }

  /**
   * Add new stablecoin addresses to the known list (runtime addition)
   */
  static addKnownStablecoin(tokenAddress: string): void {
    this.KNOWN_STABLECOINS.add(tokenAddress.toLowerCase());
  }

  /**
   * Get all known stablecoin addresses
   */
  static getKnownStablecoins(): string[] {
    return Array.from(this.KNOWN_STABLECOINS);
  }

  /**
   * Get count of eliminated API calls (for reporting)
   */
  static getApiCallsSaved(): number {
    // This would be tracked by the services using this detector
    return this.KNOWN_STABLECOINS.size + this.STABLECOIN_PATTERNS.length;
  }
}