import { db } from './server/db';
import { pools, tokenHolders } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { holderService } from './server/services/holderService';

async function finalMEVSync() {
  console.log('🎯 Final MEV Capital USDC sync...');
  
  // Get the pool
  const [pool] = await db
    .select()
    .from(pools)
    .where(eq(pools.tokenPair, 'MEV Capital USDC'));
    
  if (!pool) {
    console.error('❌ Pool not found');
    process.exit(1);
  }
  
  console.log(`📊 Pool ID: ${pool.id}`);
  console.log(`📍 Contract: ${pool.poolAddress}`);
  
  // Clear old data first
  await db.delete(tokenHolders).where(eq(tokenHolders.poolId, pool.id));
  console.log('🗑️ Cleared old holder data');
  
  // Use the holderService to sync
  console.log('🔄 Starting holder sync...');
  await holderService.syncHoldersForPool(pool.id);
  
  // Wait for async operations
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Check result
  const [result] = await db.execute(
    sql`SELECT COUNT(DISTINCT holder_address) as count FROM token_holders WHERE pool_id = ${pool.id}`
  );
  
  console.log(`\n✅ MEV Capital USDC now has ${result.count} holders!`);
  process.exit(0);
}

finalMEVSync().catch(console.error);
