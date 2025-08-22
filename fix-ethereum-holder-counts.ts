/**
 * Script to fix holder counts for Ethereum pools that are stuck at 100
 */

import { db } from './server/db';
import { pools, poolMetricsCurrent } from './shared/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { etherscanHolderScraper } from './server/services/etherscanHolderScraper';

async function fixEthereumHolderCounts() {
  console.log('🔧 Starting holder count fix for Ethereum pools...');
  
  try {
    // Get all pools with exactly 100 holders or where chain is ethereum
    const poolsToFix = await db.query.pools.findMany({
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
    
    // Get current metrics
    const metrics = await db.query.poolMetricsCurrent.findMany();
    const metricsMap = new Map(metrics.map(m => [m.poolId, m]));
    
    let fixedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const pool of poolsToFix) {
      if (!pool.poolAddress) continue;
      
      const currentMetric = metricsMap.get(pool.id);
      // Default to ethereum if chain is null (which is the case for Morpho pools)
      const chainName = pool.chain?.name?.toLowerCase() || 'ethereum';
      
      // Only fix pools with exactly 100 holders
      if (currentMetric?.holdersCount !== 100) {
        console.log(`✓ Skipping ${pool.tokenPair}: ${currentMetric?.holdersCount || 0} holders (not 100)`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔍 Fixing ${pool.tokenPair} on ${chainName} (currently: 100 holders)...`);
      
      try {
        // Get the actual holder count from Etherscan
        const actualCount = await etherscanHolderScraper.getHolderCount(pool.poolAddress, chainName);
        
        if (actualCount > 0) {
          // Update the metric with the correct count
          await db
            .update(poolMetricsCurrent)
            .set({
              holdersCount: actualCount,
              holdersStatus: 'success',
              updatedAt: new Date()
            })
            .where(eq(poolMetricsCurrent.poolId, pool.id));
          
          console.log(`✅ Fixed ${pool.tokenPair}: 100 → ${actualCount} holders`);
          fixedCount++;
        } else {
          console.log(`⚠️ Could not get holder count for ${pool.tokenPair}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${pool.tokenPair}:`, error);
        errorCount++;
      }
      
      // Respectful delay for Etherscan API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Fixed: ${fixedCount} pools`);
    console.log(`❌ Errors: ${errorCount} pools`);
    console.log(`✓ Skipped: ${skippedCount} pools`);
    
  } catch (error) {
    console.error('❌ Failed to fix holder counts:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixEthereumHolderCounts().catch(console.error);