// Comprehensive sync trigger for all pools with 1000 holder limit
import { db } from './server/db';
import { pools } from './shared/schema';
import { holderService } from './server/services/holderService';
import { sql } from 'drizzle-orm';

async function triggerComprehensiveSync() {
  console.log('🚀 Starting comprehensive sync for ALL pools with 1000 holder limit');
  console.log('⚡ This will fetch up to 1000 holders for each pool');
  
  try {
    // Get all pools with contract addresses
    const allPools = await db
      .select()
      .from(pools)
      .where(sql`${pools.poolAddress} IS NOT NULL AND ${pools.poolAddress} != ''`);
    
    console.log(`📊 Found ${allPools.length} pools with contract addresses`);
    
    let successCount = 0;
    let errorCount = 0;
    let totalHolders = 0;
    
    // Process each pool
    for (const pool of allPools) {
      try {
        console.log(`\n🔄 Syncing pool: ${pool.tokenPair} (${pool.id})`);
        console.log(`📍 Contract address: ${pool.poolAddress}`);
        
        // Sync holders for this pool using the holder service (which uses 1000 limit)
        await holderService.syncPoolHolders(pool.id);
        
        // Count holders after sync
        const holderCount = await db.$count(
          db.select().from('token_holders').where(sql`pool_id = ${pool.id}`)
        );
        
        totalHolders += holderCount;
        successCount++;
        console.log(`✅ Successfully synced ${holderCount} holders for ${pool.tokenPair}`);
        
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error syncing ${pool.tokenPair}:`, error.message);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log(`\n📊 Comprehensive Sync Complete!`);
    console.log(`✅ Successful: ${successCount} pools`);
    console.log(`❌ Failed: ${errorCount} pools`);
    console.log(`📈 Total holders synced: ${totalHolders}`);
    
    // Show top pools by holder count
    const topPools = await db.execute(sql`
      SELECT p.token_pair, COUNT(th.id) as holder_count 
      FROM pools p 
      LEFT JOIN token_holders th ON p.id = th.pool_id 
      WHERE p.pool_address IS NOT NULL 
      GROUP BY p.id, p.token_pair 
      ORDER BY holder_count DESC 
      LIMIT 10
    `);
    
    console.log(`\n📈 Top pools by holder count:`);
    for (const row of topPools.rows) {
      console.log(`  ${row.token_pair}: ${row.holder_count} holders`);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the sync
triggerComprehensiveSync().catch(console.error);