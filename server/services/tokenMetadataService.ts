/**
 * Token Metadata API Service
 * Provides rich token information including logos, descriptions, and market data
 */

import { db } from '../db';
import { pools, tokenInfo } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { alchemyService } from './alchemyService';

export class TokenMetadataService {
  private static instance: TokenMetadataService;
  private metadataCache: Map<string, any> = new Map();
  
  private constructor() {
    // Use singleton AlchemyService instance for shared caching
  }

  static getInstance(): TokenMetadataService {
    if (!this.instance) {
      this.instance = new TokenMetadataService();
    }
    return this.instance;
  }

  /**
   * OPTIMIZED: Get comprehensive token metadata (eliminates API calls)
   */
  async getTokenMetadata(tokenAddress: string, network: 'ethereum' | 'base' = 'ethereum') {
    try {
      // OPTIMIZATION 1: Local cache check first
      const cacheKey = `${network}:${tokenAddress}`;
      if (this.metadataCache.has(cacheKey)) {
        console.log(`⚡ Local cache hit for token metadata (NO API CALL)`);
        return this.metadataCache.get(cacheKey);
      }
      
      console.log(`🪙 Optimized metadata fetch for token ${tokenAddress.slice(0, 8)}...`);

      // OPTIMIZATION 2: Database cache check before AlchemyService
      const storedMetadata = await this.getStoredTokenMetadata(tokenAddress);
      if (storedMetadata) {
        console.log(`🗄️ Database cache hit for token metadata (NO API CALL)`);
        this.metadataCache.set(cacheKey, storedMetadata);
        return storedMetadata;
      }

      // OPTIMIZATION 3: AlchemyService static cache (no external API calls)
      const metadata = await alchemyService.getTokenMetadata(tokenAddress, network);

      // OPTIMIZATION 4: Simplified market data (eliminates price API calls)
      const optimizedMarketData = await this.getOptimizedMarketData(tokenAddress, network);

      // Combine all metadata
      const enrichedMetadata = {
        address: tokenAddress,
        network,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        logo: metadata.logo,
        description: this.getTokenDescription(metadata.symbol),
        totalSupply: metadata.totalSupply,
        ...optimizedMarketData,
        lastUpdated: new Date()
      };

      // Cache the result
      this.metadataCache.set(cacheKey, enrichedMetadata);

      // Store in database for future cache hits
      await this.storeTokenMetadata(enrichedMetadata);

      return enrichedMetadata;
    } catch (error) {
      console.error('❌ Error in optimized token metadata fetch:', error);
      
      // Database fallback
      return await this.getStoredTokenMetadata(tokenAddress);
    }
  }

  /**
   * Batch fetch metadata for multiple tokens
   */
  async batchGetTokenMetadata(tokenAddresses: string[], network: 'ethereum' | 'base' = 'ethereum') {
    try {
      console.log(`🪙 Batch fetching metadata for ${tokenAddresses.length} tokens...`);

      const metadataPromises = tokenAddresses.map(address => 
        this.getTokenMetadata(address, network)
      );

      const results = await Promise.allSettled(metadataPromises);

      return results.map((result, index) => ({
        address: tokenAddresses[index],
        metadata: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error('❌ Error batch fetching token metadata:', error);
      return [];
    }
  }

  /**
   * OPTIMIZED: Get token market data (eliminates API calls)
   */
  private async getOptimizedMarketData(tokenAddress: string, network: 'ethereum' | 'base') {
    try {
      // OPTIMIZATION 1: Use optimized price service (no external API calls)
      const price = await alchemyService.getTokenPrice(tokenAddress, network);

      // OPTIMIZATION 2: Use static/cached data instead of real-time API calls
      return {
        price: price.toString(),
        volume24h: 'N/A', // Eliminates volume API calls
        priceChange24h: 'N/A', // Eliminates price change API calls
        marketCap: 'N/A', // Eliminates market cap API calls
        circulatingSupply: null,
        holders: await this.getOptimizedHolderCount(tokenAddress, network)
      };
    } catch (error) {
      console.error('Error in optimized market data fetch:', error);
      return {
        price: null,
        volume24h: null,
        priceChange24h: null,
        marketCap: null,
        circulatingSupply: null,
        holders: null
      };
    }
  }

  /**
   * OPTIMIZED: Get holder count for a token (database cache only)
   */
  private async getOptimizedHolderCount(tokenAddress: string, network: 'ethereum' | 'base') {
    try {
      // Database cache only - no API calls
      const [pool] = await db
        .select()
        .from(pools)
        .where(eq(pools.poolAddress, tokenAddress))
        .limit(1);

      if (pool?.holdersCount) {
        console.log(`📊 Database cached holder count: ${pool.holdersCount} (NO API CALL)`);
        return pool.holdersCount;
      }

      console.log(`⚡ No holder count in cache for ${tokenAddress} (NO API CALL)`);
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token description based on symbol
   */
  private getTokenDescription(symbol?: string): string {
    const descriptions: Record<string, string> = {
      'USDC': 'USD Coin is a stablecoin pegged to the US Dollar, providing stability in the volatile crypto market.',
      'USDT': 'Tether is the most widely used stablecoin, backed by US Dollar reserves.',
      'STETH': 'Lido Staked Ether represents ETH staked on the Ethereum 2.0 Beacon Chain through Lido.',
      'ETH': 'Ethereum is the native cryptocurrency of the Ethereum blockchain, powering smart contracts and DeFi.',
      'WETH': 'Wrapped Ether is an ERC-20 compatible version of ETH used in DeFi protocols.',
      'DAI': 'DAI is a decentralized stablecoin maintained by MakerDAO, backed by crypto collateral.',
      'WBTC': 'Wrapped Bitcoin brings Bitcoin liquidity to the Ethereum ecosystem as an ERC-20 token.'
    };

    if (symbol && descriptions[symbol.toUpperCase()]) {
      return descriptions[symbol.toUpperCase()];
    }

    // Generic description for vault tokens
    if (symbol?.toLowerCase().includes('vault') || symbol?.toLowerCase().includes('usdc')) {
      return 'A yield-bearing vault token that automatically compounds returns from various DeFi strategies.';
    }

    return 'A digital asset token on the blockchain.';
  }

  /**
   * Store token metadata in database
   */
  private async storeTokenMetadata(metadata: any) {
    try {
      await db
        .insert(tokenInfo)
        .values({
          address: metadata.address,
          symbol: metadata.symbol,
          name: metadata.name,
          decimals: metadata.decimals,
          logoUrl: metadata.logo,
          priceUsd: metadata.price ? parseFloat(metadata.price) : null,
          volume24h: metadata.volume24h ? parseFloat(metadata.volume24h) : null,
          marketCapUsd: metadata.marketCap ? parseFloat(metadata.marketCap) : null,
          timestamp: new Date()
        })
        .onConflictDoUpdate({
          target: tokenInfo.address,
          set: {
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: metadata.decimals,
            logoUrl: metadata.logo,
            priceUsd: metadata.price ? parseFloat(metadata.price) : null,
            volume24h: metadata.volume24h ? parseFloat(metadata.volume24h) : null,
            marketCapUsd: metadata.marketCap ? parseFloat(metadata.marketCap) : null,
            timestamp: new Date()
          }
        });

      console.log(`💾 Stored metadata for ${metadata.symbol}`);
    } catch (error) {
      console.error('Error storing token metadata:', error);
    }
  }

  /**
   * Get stored token metadata from database
   */
  private async getStoredTokenMetadata(tokenAddress: string) {
    try {
      const [stored] = await db
        .select()
        .from(tokenInfo)
        .where(eq(tokenInfo.address, tokenAddress))
        .limit(1);

      if (stored) {
        return {
          address: stored.address,
          name: stored.name,
          symbol: stored.symbol,
          decimals: stored.decimals,
          logo: stored.logoUrl,
          price: stored.priceUsd?.toString(),
          volume24h: stored.volume24h?.toString(),
          marketCap: stored.marketCapUsd?.toString(),
          fromCache: true,
          lastUpdated: stored.timestamp
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching stored metadata:', error);
      return null;
    }
  }

  /**
   * Update all pool token metadata
   */
  async updateAllPoolMetadata() {
    try {
      console.log('🔄 Updating metadata for all pools...');

      const allPools = await db.select().from(pools);
      let updated = 0;

      for (const pool of allPools) {
        if (!pool.poolAddress) continue;

        const network = pool.chainId === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'base' : 'ethereum';
        const metadata = await this.getTokenMetadata(pool.poolAddress, network as 'ethereum' | 'base');

        if (metadata) {
          // Update pool with logo if found
          if (metadata.logo && !pool.logoUrl) {
            await db
              .update(pools)
              .set({ logoUrl: metadata.logo })
              .where(eq(pools.id, pool.id));
            
            console.log(`✅ Updated logo for ${pool.tokenPair}`);
          }
          updated++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Updated metadata for ${updated} pools`);
      return { updated, total: allPools.length };
    } catch (error) {
      console.error('❌ Error updating pool metadata:', error);
      throw error;
    }
  }

  /**
   * Get social links for a token
   */
  async getTokenSocialLinks(tokenAddress: string) {
    // This would typically fetch from a real API
    // For now, return common links based on token symbol
    const metadata = await this.getTokenMetadata(tokenAddress);
    
    if (!metadata) return null;

    const socialLinks: Record<string, any> = {
      'USDC': {
        website: 'https://www.circle.com/en/usdc',
        twitter: 'https://twitter.com/circle',
        docs: 'https://developers.circle.com/docs'
      },
      'STETH': {
        website: 'https://lido.fi',
        twitter: 'https://twitter.com/lidofinance',
        docs: 'https://docs.lido.fi'
      },
      'USDT': {
        website: 'https://tether.to',
        twitter: 'https://twitter.com/Tether_to',
        docs: 'https://tether.to/en/transparency'
      }
    };

    return socialLinks[metadata.symbol?.toUpperCase()] || {
      website: null,
      twitter: null,
      docs: null
    };
  }

  /**
   * Clear metadata cache
   */
  clearCache() {
    this.metadataCache.clear();
    console.log('🧹 Token metadata cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedTokens: this.metadataCache.size,
      cacheKeys: Array.from(this.metadataCache.keys())
    };
  }
}

export const tokenMetadataService = TokenMetadataService.getInstance();