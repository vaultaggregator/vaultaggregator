import { holderService } from './server/services/holderService';
import { db } from './server/db';
import { pools } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

async function directMEVSync() {
  console.log('🚀 Direct sync for MEV Capital USDC using holderService...');
  
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
  console.log(`🎯 Starting comprehensive holder sync...`);
  
  try {
    // Use the holderService which handles all fields correctly
    await holderService.syncHoldersForPool(pool.id);
    console.log('✅ Sync completed successfully');
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check final count
    const [result] = await db.execute(
      sql`SELECT COUNT(DISTINCT holder_address) as count FROM token_holders WHERE pool_id = ${pool.id}`
    );
    console.log(`\n📊 Final MEV Capital USDC holder count: ${result.count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

directMEVSync().catch(console.error);
