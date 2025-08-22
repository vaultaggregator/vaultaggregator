import { db } from './server/db';
import { pools, poolMetricsCurrent } from './shared/schema';
import { eq } from 'drizzle-orm';

async function checkHolderCounts() {
  try {
    // Find Spark USDC Vault
    const sparkPool = await db
      .select()
      .from(pools)
      .where(eq(pools.name, 'Spark USDC Vault'))
      .limit(1);
    
    if (sparkPool[0]) {
      console.log('✅ Spark USDC Vault found:');
      console.log('  - Pool ID:', sparkPool[0].id);
      console.log('  - Contract:', sparkPool[0].poolAddress);
      console.log('  - Chain ID:', sparkPool[0].chainId);
      
      // Check metrics
      const metrics = await db
        .select()
        .from(poolMetricsCurrent)
        .where(eq(poolMetricsCurrent.poolId, sparkPool[0].id))
        .limit(1);
      
      if (metrics[0]) {
        console.log('  - Holder Count:', metrics[0].holdersCount || 'Not set');
        console.log('  - Holder Status:', metrics[0].holdersStatus || 'Not set');
        console.log('  - Last Updated:', metrics[0].updatedAt);
      } else {
        console.log('  - No metrics found for this pool');
      }
    } else {
      console.log('❌ Spark USDC Vault not found');
    }
    
    // Check a few other pools for comparison
    console.log('\n📊 Sample of other pools with holder counts:');
    const samplePools = await db
      .select({
        id: pools.id,
        name: pools.name,
        address: pools.poolAddress,
        chainId: pools.chainId
      })
      .from(pools)
      .limit(5);
    
    for (const pool of samplePools) {
      const metrics = await db
        .select()
        .from(poolMetricsCurrent)
        .where(eq(poolMetricsCurrent.poolId, pool.id))
        .limit(1);
      
      console.log(`  - ${pool.name}: ${metrics[0]?.holdersCount || 'No count'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkHolderCounts();