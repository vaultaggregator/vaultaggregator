// Historical data collection script - used once to populate full vault history
import { db } from './server/db';
import { pools } from './shared/schema';
import { MorphoHistoricalService } from './server/services/morphoHistoricalService';

async function collectFullHistoricalData() {
  try {
    console.log('🚀 Starting full historical data collection for all pools...');
    
    // Get all active pools
    const allPools = await db.select().from(pools).where(pools.isVisible);
    console.log(`📊 Found ${allPools.length} active pools to collect data for`);
    
    const morphoHistoricalService = new MorphoHistoricalService();
    
    for (const pool of allPools) {
      if (!pool.poolAddress || !pool.poolAddress.startsWith('0x')) {
        console.log(`⚠️ Skipping pool ${pool.tokenPair} - no valid address`);
        continue;
      }
      
      console.log(`📈 Collecting 600 days of historical data for ${pool.tokenPair}...`);
      
      try {
        await morphoHistoricalService.storeHistoricalData(pool.id, pool.poolAddress, 600);
        console.log(`✅ Completed collection for ${pool.tokenPair}`);
      } catch (error) {
        console.error(`❌ Failed to collect data for ${pool.tokenPair}:`, error);
      }
      
      // Add small delay to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎉 Full historical data collection completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in full historical data collection:', error);
    process.exit(1);
  }
}

collectFullHistoricalData();