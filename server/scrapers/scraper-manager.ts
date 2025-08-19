import { BaseScraper, ScrapedData } from './base-scraper';
import { MorphoScraper } from './morpho-scraper';
import { LidoScraper } from './lido-scraper';
import { storage } from '../storage';
import type { Pool, Platform, Chain } from '../../shared/schema';

export class ScraperManager {
  private scrapers: Map<string, BaseScraper> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.registerScrapers();
  }

  private registerScrapers(): void {
    this.scrapers.set('Morpho', new MorphoScraper());
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
      const { pools, platforms, chains } = await import('../../shared/schema');
      const { eq, and, isNull, desc } = await import('drizzle-orm');
      
      const poolsResults = await db
        .select()
        .from(pools)
        .leftJoin(platforms, eq(pools.platformId, platforms.id))
        .leftJoin(chains, eq(pools.chainId, chains.id))
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
        ...result.pools,
        platform: result.platforms!,
        chain: result.chains!,
      }));

      console.log(`📊 Found ${formattedPools.length} pools to scrape`);

      const results = await Promise.allSettled(
        formattedPools.map(pool => this.scrapePool(pool))
      );

      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          errorCount++;
          if (result.status === 'rejected') {
            console.error(`❌ Failed to scrape pool ${formattedPools[index].id}:`, result.reason);
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
        
        // TODO: Trigger WebSocket broadcast when we integrate with the routes system
        // This will notify clients of database changes
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