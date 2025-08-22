/**
 * Script to fix incorrect holder counts that were set to 100
 * This will re-fetch the actual total holder count from Etherscan for all pools
 */

import { db } from './server/db';
import { pools, poolMetricsCurrent } from './shared/schema';
import { eq } from 'drizzle-orm';
import { etherscanHolderScraper } from './server/services/etherscanHolderScraper';

async function fixHolderCounts() {
  console.log('🔧 Starting holder count fix...');
  
  try {
    // Get all active pools with contract addresses
    const allPools = await db.query.pools.findMany({
      where: (pools, { and, isNotNull, ne, eq }) => 
        and(
          isNotNull(pools.poolAddress),
          ne(pools.poolAddress, ''),
          eq(pools.isActive, true)
        ),
      with: {
        chain: true
      }
    });
    
    console.log(`📊 Found ${allPools.length} pools to check`);
    
    // Get current metrics to see which ones have incorrect counts
    const metrics = await db.query.poolMetricsCurrent.findMany();
    const metricsMap = new Map(metrics.map(m => [m.poolId, m]));
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const pool of allPools) {
      if (!pool.poolAddress || !pool.chain) continue;
      
      const currentMetric = metricsMap.get(pool.id);
      const chainName = pool.chain.name.toLowerCase();
      
      // Skip if no metric or if the count doesn't look suspicious (not 100)
      if (!currentMetric || (currentMetric.holdersCount !== 100 && currentMetric.holdersCount > 0)) {
        console.log(`✓ Pool ${pool.tokenPair} on ${chainName}: ${currentMetric?.holdersCount || 0} holders (looks correct)`);
        continue;
      }
      
      console.log(`🔍 Checking pool ${pool.tokenPair} on ${chainName} (currently: ${currentMetric.holdersCount} holders)...`);
      
      try {
        // Get the actual holder count from Etherscan
        const actualCount = await etherscanHolderScraper.getHolderCount(pool.poolAddress, chainName);
        
        if (actualCount > 0 && actualCount !== currentMetric.holdersCount) {
          // Update the metric with the correct count
          await db
            .update(poolMetricsCurrent)
            .set({
              holdersCount: actualCount,
              holdersStatus: 'success',
              updatedAt: new Date()
            })
            .where(eq(poolMetricsCurrent.poolId, pool.id));
          
          console.log(`✅ Fixed ${pool.tokenPair} on ${chainName}: ${currentMetric.holdersCount} → ${actualCount} holders`);
          fixedCount++;
        } else {
          console.log(`✓ Pool ${pool.tokenPair} on ${chainName}: already correct (${actualCount} holders)`);
        }
      } catch (error) {
        console.error(`❌ Error fixing ${pool.tokenPair} on ${chainName}:`, error);
        errorCount++;
      }
      
      // Respectful delay for Etherscan/Basescan API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount} pools`);
    console.log(`❌ Errors: ${errorCount} pools`);
    console.log(`✓ Already correct: ${allPools.length - fixedCount - errorCount} pools`);
    
  } catch (error) {
    console.error('❌ Failed to fix holder counts:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixHolderCounts().catch(console.error);