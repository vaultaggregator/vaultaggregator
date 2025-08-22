import { BaseScraper, ScrapedData } from './base-scraper';
import { MorphoConcurrentScraper } from './morpho-concurrent-scraper';
import { LidoScraper } from './lido-scraper';
import { storage } from '../storage';
import type { Pool, Platform, Chain } from '../../shared/schema';

export class ScraperManager {
  private scrapers: Map<string, BaseScraper> = new Map();
  private morphoConcurrentScraper: MorphoConcurrentScraper;
  private isRunning: boolean = false;

  constructor() {
    this.registerScrapers();
  }

  private registerScrapers(): void {
    // Use optimized concurrent scraper for Morpho
    this.morphoConcurrentScraper = new MorphoConcurrentScraper();
    this.scrapers.set('Morpho', this.morphoConcurrentScraper);
    this.scrapers.set('Lido', new LidoScraper());
  }

  async scrapeAllPools(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Scraping already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting pool data scraping...');

    try {
      // Get all pools from database - using direct query to avoid SQL array errors
      const { db } = await import('../db');
      const { pools, protocols, networks } = await import('../../shared/schema');
      const { eq, and, isNull, desc } = await import('drizzle-orm');
      
      const poolsResults = await db
        .select({
          pool: pools,
          platform: protocols,
          chain: networks
        })
        .from(pools)
        .innerJoin(protocols, eq(pools.platformId, protocols.id))
        .leftJoin(networks, eq(pools.chainId, networks.id))
        .where(
          and(
            eq(pools.isActive, true),
            eq(pools.isVisible, true),
            isNull(pools.deletedAt)
          )
        )
        .orderBy(desc(pools.apy));

      // Format the results to match Pool type with platform/chain
      const formattedPools = poolsResults.map(result => ({
        ...result.pool,
        platform: result.platform,
        chain: result.chain || { id: '', name: 'Unknown', displayName: 'Unknown' }, // Handle null chains
      }));

      console.log(`📊 Found ${formattedPools.length} pools to scrape`);

      // Separate Morpho and non-Morpho pools
      const morphoPools = formattedPools.filter(p => p.platform.name === 'Morpho');
      const otherPools = formattedPools.filter(p => p.platform.name !== 'Morpho');
      
      console.log(`🎯 Optimized scraping: ${morphoPools.length} Morpho pools (1 batch), ${otherPools.length} other pools`);

      // Process Morpho pools concurrently
      let successCount = 0;
      let errorCount = 0;
      
      if (morphoPools.length > 0) {
        try {
          const morphoResults = await this.morphoConcurrentScraper.scrapePools(morphoPools);
          
          // Store Morpho results
          for (const [poolId, data] of morphoResults) {
            await storage.updatePool(poolId, {
              apy: data.apy,
              tvl: data.tvl || undefined,
            });
            console.log(`💾 Updated pool ${poolId} with fresh data: APY ${data.apy}%`);
            successCount++;
          }
          
          // Count missing pools as errors
          const missingCount = morphoPools.length - morphoResults.size;
          if (missingCount > 0) {
            errorCount += missingCount;
          }
        } catch (error) {
          console.error('❌ Concurrent Morpho scraping failed:', error);
          errorCount += morphoPools.length;
        }
      }

      // Process other pools individually  
      const otherResults = await Promise.allSettled(
        otherPools.map(pool => this.scrapePool(pool))
      );

      otherResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          errorCount++;
          if (result.status === 'rejected') {
            console.error(`❌ Failed to scrape pool ${otherPools[index].id}:`, result.reason);
          }
        }
      });

      console.log(`✅ Scraping completed: ${successCount} successful, ${errorCount} failed`);

    } catch (error) {
      console.error('❌ Error during pool scraping:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async scrapePool(pool: Pool & { platform: Platform; chain: Chain }): Promise<ScrapedData | null> {
    // Check if platform exists
    if (!pool.platform || !pool.platform.name) {
      console.warn(`⚠️ Pool ${pool.id} has no platform or platform name`);
      return null;
    }
    
    const scraper = this.scrapers.get(pool.platform.name);
    
    if (!scraper) {
      console.warn(`⚠️ No scraper found for platform: ${pool.platform.name}`);
      return null;
    }

    try {
      const scrapedData = await scraper.scrapePool(pool);
      
      if (scrapedData) {
        // Update pool in database with scraped data
        await storage.updatePool(pool.id, {
          apy: scrapedData.apy,
          tvl: scrapedData.tvl || pool.tvl,
          // Updated on scrapedAt: ${scrapedData.scrapedAt}
        });

        console.log(`💾 Updated pool ${pool.id} with fresh data: APY ${scrapedData.apy}%`);
      }

      return scrapedData;
      
    } catch (error) {
      console.error(`❌ Error scraping pool ${pool.id}:`, error);
      return null;
    }
  }

  async scrapeSpecificPool(poolId: string): Promise<ScrapedData | null> {
    try {
      const pool = await storage.getPoolById(poolId);
      if (!pool) {
        throw new Error(`Pool not found: ${poolId}`);
      }

      return await this.scrapePool(pool);
    } catch (error) {
      console.error(`❌ Error scraping specific pool ${poolId}:`, error);
      return null;
    }
  }

  // Alias for scrapeSpecificPool for backwards compatibility
  async scrapePoolById(poolId: string): Promise<ScrapedData | null> {
    return this.scrapeSpecificPool(poolId);
  }

  getSupportedPlatforms(): string[] {
    return Array.from(this.scrapers.keys());
  }

  addScraper(platformName: string, scraper: BaseScraper): void {
    this.scrapers.set(platformName, scraper);
    console.log(`➕ Added scraper for platform: ${platformName}`);
  }
}

// Export singleton instance
export const scraperManager = new ScraperManager();