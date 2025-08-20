import { holderService } from './server/services/holderService.js';
import { storage } from './server/storage.js';

async function syncAllPools() {
  console.log('🔄 Starting comprehensive holder sync for ALL pools...\n');
  
  try {
    // Get all active pools
    const pools = await storage.getActivePools();
    console.log(`📊 Found ${pools.length} active pools to sync\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const results = [];
    
    for (const pool of pools) {
      console.log(`\n🔍 Syncing pool: ${pool.tokenPair} (${pool.id})`);
      console.log(`   Contract: ${pool.poolAddress || 'No address'}`);
      
      if (!pool.poolAddress) {
        console.log(`   ⚠️ Skipped - no contract address`);
        continue;
      }
      
      try {
        await holderService.syncPoolHolders(pool.id);
        
        // Check the result
        const holderData = await storage.getPoolHolders(pool.id, 1, 1);
        console.log(`   ✅ Success - ${holderData.total} holders synced`);
        
        results.push({
          pool: pool.tokenPair,
          holders: holderData.total,
          status: 'success'
        });
        
        successCount++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          pool: pool.tokenPair,
          holders: 0,
          status: 'error'
        });
        errorCount++;
      }
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount} pools`);
    console.log(`❌ Failed: ${errorCount} pools`);
    console.log(`⏭️ Skipped: ${pools.length - successCount - errorCount} pools\n`);
    
    console.log('Detailed Results:');
    for (const result of results) {
      const icon = result.status === 'success' ? '✅' : '❌';
      console.log(`${icon} ${result.pool}: ${result.holders} holders`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

syncAllPools();
