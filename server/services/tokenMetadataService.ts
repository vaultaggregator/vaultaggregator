/**
 * Token Metadata API Service
 * Provides rich token information including logos, descriptions, and market data
 */

import { db } from '../db';
import { pools, tokenInfo } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { AlchemyService } from './alchemyService';

export class TokenMetadataService {
  private static instance: TokenMetadataService;
  private alchemyService: AlchemyService;
  private metadataCache: Map<string, any> = new Map();
  
  private constructor() {
    // Use cached AlchemyService instead of creating new instances
    this.alchemyService = new AlchemyService();
  }

  static getInstance(): TokenMetadataService {
    if (!this.instance) {
      this.instance = new TokenMetadataService();
    }
    return this.instance;
  }

  /**
   * Get comprehensive token metadata
   */
  async getTokenMetadata(tokenAddress: string, network: 'ethereum' | 'base' = 'ethereum') {
    try {
      // Check cache first
      const cacheKey = `${network}:${tokenAddress}`;
      if (this.metadataCache.has(cacheKey)) {
        return this.metadataCache.get(cacheKey);
      }
      
      console.log(`🪙 Fetching metadata for token ${tokenAddress.slice(0, 8)}...`);

      // Get token metadata from cached AlchemyService
      const metadata = await this.alchemyService.getTokenMetadata(tokenAddress, network);

      // Get additional market data
      const marketData = await this.getTokenMarketData(tokenAddress, network);

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
        ...marketData,
        lastUpdated: new Date()
      };

      // Cache the result
      this.metadataCache.set(cacheKey, enrichedMetadata);

      // Store in database
      await this.storeTokenMetadata(enrichedMetadata);

      return enrichedMetadata;
    } catch (error) {
      console.error('❌ Error fetching token metadata:', error);
      
      // Try to get from database as fallback
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
   * Get token market data (price, volume, market cap)
   */
  private async getTokenMarketData(tokenAddress: string, network: 'ethereum' | 'base') {
    try {
      // Get token price from cached AlchemyService
      const price = await this.alchemyService.getTokenPrice(tokenAddress, network);

      // Get 24h volume and other stats (simulated for now)
      const volume24h = Math.random() * 10000000; // Would come from real API
      const priceChange24h = (Math.random() - 0.5) * 20; // -10% to +10%
      const marketCap = Math.random() * 1000000000; // Would come from real API

      return {
        price: prices.tokenBalances[0]?.tokenBalance || '0',
        volume24h: volume24h.toFixed(2),
        priceChange24h: priceChange24h.toFixed(2),
        marketCap: marketCap.toFixed(2),
        circulatingSupply: null, // Would come from real API
        holders: await this.getTokenHolderCount(tokenAddress, network)
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
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
   * Get holder count for a token
   */
  private async getTokenHolderCount(tokenAddress: string, network: 'ethereum' | 'base') {
    try {
      // Check database first
      const [pool] = await db
        .select()
        .from(pools)
        .where(eq(pools.poolAddress, tokenAddress))
        .limit(1);

      if (pool?.holdersCount) {
        return pool.holdersCount;
      }

      // Fallback to estimate
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