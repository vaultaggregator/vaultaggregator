import { db } from './server/db';
import { pools } from './shared/schema';
import { eq } from 'drizzle-orm';
import { MorphoScraper } from './server/scrapers/morpho-scraper';

async function syncBaseSparkPool() {
  console.log('🚀 Syncing Spark USDC Vault pool on Base network...');
  
  try {
    // Get the pool data with relations
    const [pool] = await db
      .select()
      .from(pools)
      .where(eq(pools.id, '8dac7eb9-9f09-4a84-b9c0-44c9eb5b7d1c'));
    
    if (!pool) {
      console.error('❌ Pool not found');
      process.exit(1);
    }
    
    console.log(`📊 Found pool: ${pool.tokenPair} at address ${pool.poolAddress}`);
    
    // Create scraper instance
    const scraper = new MorphoScraper();
    
    // Create pool with minimal relations for scraper
    const poolWithRelations = {
      ...pool,
      chain: { name: 'BASE' },
      platform: { name: 'Morpho' }
    };
    
    // Scrape the data
    console.log('🔄 Fetching data from Morpho API...');
    const scrapedData = await scraper.scrapePool(poolWithRelations as any);
    
    if (scrapedData) {
      console.log(`✅ Scraped data: APY ${scrapedData.apy}%, TVL $${scrapedData.tvl}`);
      
      // Update the pool in database
      await db
        .update(pools)
        .set({
          apy: scrapedData.apy,
          tvl: scrapedData.tvl,
          apyBase: scrapedData.apy,
          tvlUsd: scrapedData.tvl,
          updatedAt: new Date()
        })
        .where(eq(pools.id, '8dac7eb9-9f09-4a84-b9c0-44c9eb5b7d1c'));
      
      console.log('✅ Pool data updated successfully!');
    } else {
      console.error('❌ Failed to scrape data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

syncBaseSparkPool();