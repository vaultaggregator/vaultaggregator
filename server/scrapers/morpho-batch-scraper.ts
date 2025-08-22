import { BaseScraper, ScrapedData } from './base-scraper';
import type { PoolWithRelations } from '../storage';

/**
 * Optimized Morpho scraper that fetches all vaults in a single GraphQL query
 * Reduces API calls from 45+ per minute to just 1-2 per minute
 */
export class MorphoBatchScraper extends BaseScraper {
  private vaultDataCache: Map<string, any> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  
  constructor() {
    super({
      name: 'MorphoBatch',
      baseUrl: 'https://blue-api.morpho.org/graphql',
      rateLimit: 5 // Only 5 requests per minute needed now
    });
  }

  /**
   * Fetch all vaults data in a single GraphQL query
   */
  private async fetchAllVaultsData(): Promise<void> {
    const now = Date.now();
    
    // Use cached data if fresh enough
    if (now - this.lastFetchTime < this.CACHE_DURATION) {
      return;
    }

    console.log('🚀 Fetching ALL Morpho vaults in single batch query...');
    
    try {
      // Fetch for both Ethereum and Base chains in parallel
      const [ethereumData, baseData] = await Promise.all([
        this.fetchVaultsForChain(1),    // Ethereum
        this.fetchVaultsForChain(8453)  // Base
      ]);

      // Clear old cache
      this.vaultDataCache.clear();
      
      // Store Ethereum vaults
      if (ethereumData?.data?.vaults?.items) {
        for (const vault of ethereumData.data.vaults.items) {
          const key = `${vault.address.toLowerCase()}_1`;
          this.vaultDataCache.set(key, vault);
        }
        console.log(`✅ Cached ${ethereumData.data.vaults.items.length} Ethereum vaults`);
      }
      
      // Store Base vaults
      if (baseData?.data?.vaults?.items) {
        for (const vault of baseData.data.vaults.items) {
          const key = `${vault.address.toLowerCase()}_8453`;
          this.vaultDataCache.set(key, vault);
        }
        console.log(`✅ Cached ${baseData.data.vaults.items.length} Base vaults`);
      }
      
      this.lastFetchTime = now;
      console.log(`📊 Total vaults cached: ${this.vaultDataCache.size}`);
      
    } catch (error) {
      console.error('❌ Error fetching batch vault data:', error);
      throw error;
    }
  }

  /**
   * Fetch all vaults for a specific chain
   */
  private async fetchVaultsForChain(chainId: number): Promise<any> {
    const response = await this.rateLimitedFetch(this.dataSource.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetAllVaults($chainId: [Int!]!) {
            vaults(
              where: { chainId_in: $chainId }
              first: 1000
            ) {
              items {
                address
                symbol
                name
                state {
                  netApy
                  apy
                  totalAssetsUsd
                  fee
                  totalSupplyUsd
                }
                asset {
                  address
                  symbol
                  decimals
                }
                curator {
                  name
                  image
                }
              }
            }
          }
        `,
        variables: {
          chainId: [chainId]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Scrape a single pool using cached batch data
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
      
      // Fetch all vaults if needed (will use cache if fresh)
      await this.fetchAllVaultsData();
      
      // Get vault data from cache
      const cacheKey = `${pool.poolAddress.toLowerCase()}_${chainId}`;
      const vaultData = this.vaultDataCache.get(cacheKey);
      
      if (!vaultData) {
        console.warn(`⚠️ Vault not found in batch data: ${pool.poolAddress} on chain ${chainId}`);
        return null;
      }

      const state = vaultData.state;
      if (!state) {
        console.warn(`⚠️ No state data for vault: ${pool.poolAddress}`);
        return null;
      }

      // Use apy if available, otherwise netApy
      const apyValue = state.apy !== undefined ? state.apy : state.netApy;
      
      const scrapedData: ScrapedData = {
        poolId: pool.id,
        apy: (parseFloat(apyValue) * 100).toFixed(2),
        tvl: state.totalAssetsUsd ? state.totalAssetsUsd.toString() : undefined,
        additionalData: {
          name: vaultData.name,
          symbol: vaultData.symbol,
          netApy: state.netApy,
          apy: state.apy,
          fee: state.fee,
          curator: vaultData.curator?.name,
          source: 'morpho_batch_api'
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
   * Scrape multiple pools efficiently using batch data
   */
  async scrapePools(pools: PoolWithRelations[]): Promise<Map<string, ScrapedData>> {
    const results = new Map<string, ScrapedData>();
    
    // Filter to only Morpho pools
    const morphoPools = pools.filter(p => p.platform.name === 'Morpho' && p.poolAddress);
    
    if (morphoPools.length === 0) {
      return results;
    }
    
    console.log(`🎯 Scraping ${morphoPools.length} Morpho pools with single batch query...`);
    
    // Fetch all data once
    await this.fetchAllVaultsData();
    
    // Process each pool using cached data
    for (const pool of morphoPools) {
      const data = await this.scrapePool(pool);
      if (data) {
        results.set(pool.id, data);
      }
    }
    
    console.log(`✅ Batch scraping complete: ${results.size}/${morphoPools.length} pools updated`);
    return results;
  }

  validateData(data: any): boolean {
    return (
      data &&
      data.data &&
      typeof data.data === 'object' &&
      data.data.vaults &&
      data.data.vaults.items &&
      Array.isArray(data.data.vaults.items)
    );
  }
}