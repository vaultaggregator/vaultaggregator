import { BaseScraper, ScrapedData } from './base-scraper';
import type { PoolWithRelations } from '../storage';

/**
 * Optimized Morpho scraper that fetches vaults concurrently
 * Reduces time significantly by parallel execution instead of sequential
 */
export class MorphoConcurrentScraper extends BaseScraper {
  constructor() {
    super({
      name: 'MorphoConcurrent',
      baseUrl: 'https://api.morpho.org/graphql',
      rateLimit: 100 // Higher rate limit for concurrent requests
    });
  }

  /**
   * Scrape a single pool
   */
  async scrapePool(pool: PoolWithRelations): Promise<ScrapedData | null> {
    try {
      // Only scrape Morpho pools with valid addresses
      if (!pool.poolAddress || pool.platform.name !== 'Morpho') {
        return null;
      }

      // Map chain names to chain IDs
      const chainIdMap: Record<string, number> = {
        'ethereum': 1,
        'Ethereum': 1,
        'ETHEREUM': 1,
        'base': 8453,
        'Base': 8453,
        'BASE': 8453
      };

      const chainId = chainIdMap[pool.chain.name] || 1;
      
      const response = await this.rateLimitedFetch(this.dataSource.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetVault($chainId: Int!, $address: String!) {
              vaultByAddress(chainId: $chainId, address: $address) {
                state {
                  netApy
                  totalAssetsUsd
                }
              }
            }
          `,
          variables: {
            chainId: chainId,
            address: pool.poolAddress
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data.errors && data.errors.length > 0) {
        const errorMessage = data.errors[0].message || 'Unknown error';
        const errorStatus = data.errors[0].status || '';
        if (errorStatus === 'NOT_FOUND') {
          throw new Error(`Vault not found on Morpho: ${pool.poolAddress}`);
        }
        throw new Error(`Morpho API error: ${errorMessage}`);
      }
      
      const vaultData = data.data?.vaultByAddress?.state;
      if (!vaultData) {
        throw new Error('No vault data found in response');
      }

      const scrapedData: ScrapedData = {
        poolId: pool.id,
        apy: (parseFloat(vaultData.netApy) * 100).toFixed(2),
        tvl: vaultData.totalAssetsUsd ? vaultData.totalAssetsUsd.toString() : undefined,
        additionalData: {
          netApy: vaultData.netApy,
          source: 'morpho_concurrent_api'
        },
        scrapedAt: new Date()
      };

      console.log(`[Morpho] Successfully scraped pool ${pool.id}: APY ${scrapedData.apy}%`);
      return scrapedData;

    } catch (error) {
      this.logError(pool.id, error as Error);
      return null;
    }
  }

  /**
   * Scrape multiple pools concurrently
   */
  async scrapePools(pools: PoolWithRelations[]): Promise<Map<string, ScrapedData>> {
    const results = new Map<string, ScrapedData>();
    
    // Filter to only Morpho pools
    const morphoPools = pools.filter(p => p.platform.name === 'Morpho' && p.poolAddress);
    
    if (morphoPools.length === 0) {
      return results;
    }
    
    console.log(`🚀 Scraping ${morphoPools.length} Morpho pools concurrently...`);
    
    // Execute all requests concurrently
    const promises = morphoPools.map(pool => 
      this.scrapePool(pool)
        .then(data => ({ poolId: pool.id, data }))
        .catch(error => {
          console.error(`Failed to scrape pool ${pool.id}:`, error);
          return { poolId: pool.id, data: null };
        })
    );
    
    const allResults = await Promise.all(promises);
    
    // Process results
    for (const result of allResults) {
      if (result.data) {
        results.set(result.poolId, result.data);
      }
    }
    
    console.log(`✅ Concurrent scraping complete: ${results.size}/${morphoPools.length} pools updated`);
    return results;
  }

  validateData(data: any): boolean {
    return (
      data &&
      data.data &&
      typeof data.data === 'object' &&
      (!data.data.vaultByAddress || (
        data.data.vaultByAddress &&
        data.data.vaultByAddress.state &&
        typeof data.data.vaultByAddress.state.netApy === 'number'
      ))
    );
  }
}