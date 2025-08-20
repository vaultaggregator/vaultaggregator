import { db } from './server/db';
import { pools, tokenHolders } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { holderService } from './server/services/holderService';

async function forceMEVSync() {
  console.log('🚨 FORCE SYNC: MEV Capital USDC');
  
  const [pool] = await db.select().from(pools).where(eq(pools.tokenPair, 'MEV Capital USDC'));
  if (!pool || !pool.poolAddress) {
    console.error('❌ Pool not found or missing address');
    process.exit(1);
  }
  
  console.log(`📊 Pool: ${pool.tokenPair}`);
  console.log(`📍 Address: ${pool.poolAddress}`);
  console.log(`🆔 Pool ID: ${pool.id}`);
  
  try {
    // Clear existing holders first
    const deleteResult = await db.delete(tokenHolders).where(eq(tokenHolders.poolId, pool.id));
    console.log('🗑️ Cleared old holders');
    
    // Use holderService to sync
    console.log('🔄 Starting holder sync using holderService...');
    await holderService.syncPoolHolders(pool.id);
    
    // Wait for async operations to complete
    console.log('⏳ Waiting for sync to complete...');
    await new Promise(resolve => setTimeout(resolve, 45000)); // 45 seconds should be enough
    
    // Check final count
    const [result] = await db.execute(
      sql`SELECT COUNT(DISTINCT holder_address) as count FROM token_holders WHERE pool_id = ${pool.id}`
    );
    
    console.log(`\n🎉 SUCCESS! MEV Capital USDC now has ${result.count} holders`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

forceMEVSync().catch(console.error);