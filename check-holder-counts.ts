import { db } from './server/db';
import { pools, poolMetricsCurrent, tokenHolders } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function checkHolderCounts() {
  try {
    // Get all pools with their current metrics
    const allPools = await db
      .select({
        id: pools.id,
        tokenPair: pools.tokenPair,
        poolAddress: pools.poolAddress,
        metricsHolderCount: poolMetricsCurrent.holdersCount,
        storedHolderCount: sql<number>`(SELECT COUNT(*) FROM token_holders WHERE pool_id = ${pools.id})`
      })
      .from(pools)
      .leftJoin(poolMetricsCurrent, eq(pools.id, poolMetricsCurrent.poolId))
      .where(eq(pools.isActive, true));

    console.log('📊 Holder Count Analysis:');
    console.log('=====================================');
    
    for (const pool of allPools) {
      if (pool.poolAddress) {
        console.log(`\n${pool.tokenPair}:`);
        console.log(`  Pool ID: ${pool.id}`);
        console.log(`  Contract: ${pool.poolAddress}`);
        console.log(`  Metrics Table Count: ${pool.metricsHolderCount || 'NOT SET'}`);
        console.log(`  Stored Holders: ${pool.storedHolderCount}`);
        
        if (pool.metricsHolderCount !== pool.storedHolderCount) {
          console.log(`  ⚠️ MISMATCH: Metrics shows ${pool.metricsHolderCount}, but only ${pool.storedHolderCount} holders stored`);
          
          // Check if this is expected (optimization working correctly)
          if (pool.storedHolderCount === 100 && pool.metricsHolderCount && pool.metricsHolderCount > 100) {
            console.log(`  ✅ This is CORRECT - Optimization storing top 100 of ${pool.metricsHolderCount} total holders`);
          } else if (pool.storedHolderCount === pool.metricsHolderCount) {
            console.log(`  ✅ This is CORRECT - Pool has less than 100 holders total`);
          } else {
            console.log(`  ❌ This needs investigation - unexpected count mismatch`);
          }
        }
      }
    }
    
    // Find pools with 413 holders specifically
    const poolsWith413 = allPools.filter(p => 
      p.metricsHolderCount === 413 || p.storedHolderCount === 413
    );
    
    if (poolsWith413.length > 0) {
      console.log('\n\n🔍 Found pools with 413 holders:');
      for (const pool of poolsWith413) {
        console.log(`  - ${pool.tokenPair}: Metrics=${pool.metricsHolderCount}, Stored=${pool.storedHolderCount}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking holder counts:', error);
    process.exit(1);
  }
}

checkHolderCounts();