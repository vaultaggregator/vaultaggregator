import { comprehensiveHolderSyncService } from './server/services/comprehensiveHolderSyncService';
import { db } from './server/db';
import { tokenHolders } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function syncLidoHolders() {
  console.log('🚀 Starting manual sync for Lido stETH pool to fetch 1000 holders...');
  const lidoPoolId = '31e292ba-a842-490b-8688-3868e18bd615';
  
  try {
    // Check current holder count
    const currentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    console.log(`📊 Current holder count for Lido stETH: ${currentCount[0]?.count || 0}`);
    
    // Trigger sync to fetch up to 1000 holders
    console.log('🔄 Triggering sync to fetch up to 1000 holders...');
    await comprehensiveHolderSyncService.syncSinglePool(lidoPoolId);
    
    // Wait for sync to complete
    console.log('⏳ Waiting for sync to complete (this may take a few minutes)...');
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    
    // Check the new holder count
    const newCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    console.log(`✅ New holder count for Lido stETH: ${newCount[0]?.count || 0}`);
    
    if ((newCount[0]?.count || 0) > 100) {
      console.log('🎉 Successfully increased Lido holder count to more than 100!');
    } else {
      console.log('⚠️ Holder count may still be syncing. Please check again in a few minutes.');
    }
    
  } catch (error) {
    console.error('❌ Error syncing Lido holders:', error);
  }
  
  process.exit(0);
}

syncLidoHolders();