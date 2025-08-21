import { db } from '../db';
import { pools, tokenHolders, poolMetricsCurrent } from '@shared/schema';
import { eq, sql, isNull, or } from 'drizzle-orm';
import { holderService } from './holderService';

class ComprehensiveHolderSyncService {
  /**
   * Auto-detect vault tokens for new pools and add appropriate pricing
   */
  private async autoDetectVaultTokens(pools: any[]) {
    for (const pool of pools) {
      if (!pool.poolAddress) continue;
      
      try {
        // Check if this might be a vault token based on platform and naming patterns
        const isLikelyVaultToken = 
          pool.platform?.name?.toLowerCase().includes('morpho') ||
          pool.tokenPair?.toLowerCase().includes('vault') ||
          pool.tokenPair?.toLowerCase().includes('shares');
        
        if (isLikelyVaultToken) {
          console.log(`🔍 Detected potential vault token: ${pool.tokenPair} (${pool.poolAddress})`);
          console.log(`💡 Consider adding exchange rate for accurate portfolio calculations`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking vault token for ${pool.id}:`, error);
      }
    }
  }
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start the comprehensive holder sync service
   */
  startService(intervalMinutes: number = 30) {
    console.log(`🚀 Starting Comprehensive Holder Sync Service (${intervalMinutes} minute interval)`);
    
    // Run immediately
    this.syncAllPools();
    
    // Then run on interval
    this.syncInterval = setInterval(() => {
      this.syncAllPools();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the service
   */
  stopService() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Comprehensive Holder Sync Service stopped');
    }
  }

  /**
   * Sync holders for all pools - simplified to only update counts
   */
  async syncAllPools() {
    if (this.isRunning) {
      console.log('⏳ Holder count update already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📊 Updating holder counts for all pools (simplified approach)...');

    try {
      // Get all ACTIVE pools with contract addresses
      const allPools = await db
        .select({
          id: pools.id,
          tokenPair: pools.tokenPair,
          poolAddress: pools.poolAddress,
          platformId: pools.platformId,
          isActive: pools.isActive
        })
        .from(pools)
        .where(sql`${pools.poolAddress} IS NOT NULL AND ${pools.poolAddress} != '' AND ${pools.isActive} = true`);

      console.log(`📊 Found ${allPools.length} active pools with contract addresses`);

      // Sync ALL ACTIVE pools to ensure we have up to 1000 holders for each
      console.log(`🎯 Syncing holders for ${allPools.length} active pools to ensure complete data...`);

      // Sync each pool
      let successCount = 0;
      let errorCount = 0;

      for (const pool of allPools) {
        try {
          // Check current holder count
          const currentCount = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(tokenHolders)
            .where(eq(tokenHolders.poolId, pool.id));
          
          const storedCount = currentCount[0]?.count || 0;
          console.log(`🔄 Syncing holders for "${pool.tokenPair}" (currently ${storedCount} holders stored)...`);
          
          // Add timeout wrapper to prevent hanging on any single pool
          // Increased timeout to 120 seconds for pools with many holders
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Sync timeout after 120 seconds')), 120000);
          });
          
          const syncPromise = holderService.syncPoolHolders(pool.id);
          
          // Race between sync and timeout
          await Promise.race([syncPromise, timeoutPromise]);
          
          // Verify new count
          const newCount = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(tokenHolders)
            .where(eq(tokenHolders.poolId, pool.id));
          
          const updatedCount = newCount[0]?.count || 0;
          
          // CRITICAL: Update pool_metrics_current with the new holder count from Etherscan
          // This ensures homepage and single pool page show the same holder count
          const existingMetrics = await db
            .select()
            .from(poolMetricsCurrent)
            .where(eq(poolMetricsCurrent.poolId, pool.id))
            .limit(1);
          
          if (existingMetrics.length > 0) {
            // Update existing metrics
            await db
              .update(poolMetricsCurrent)
              .set({
                holdersCount: updatedCount,
                holdersStatus: 'success',
                updatedAt: new Date()
              })
              .where(eq(poolMetricsCurrent.poolId, pool.id));
          } else {
            // Insert new metrics record
            await db
              .insert(poolMetricsCurrent)
              .values({
                id: crypto.randomUUID(),
                poolId: pool.id,
                holdersCount: updatedCount,
                holdersStatus: 'success',
                updatedAt: new Date(),
                createdAt: new Date()
              });
          }
          
          successCount++;
          console.log(`✅ Successfully synced "${pool.tokenPair}": ${storedCount} → ${updatedCount} holders`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          errorCount++;
          if (error instanceof Error && error.message.includes('timeout')) {
            console.error(`⏱️ Timeout syncing holders for "${pool.tokenPair}" - skipping to next pool`);
          } else {
            console.error(`❌ Failed to sync holders for "${pool.tokenPair}":`, error);
          }
        }
      }

      console.log(`
📊 Comprehensive Holder Sync Complete:
   ✅ Successful: ${successCount}
   ❌ Failed: ${errorCount}
   📈 Total pools: ${allPools.length}
      `);

    } catch (error) {
      console.error('❌ Error in comprehensive holder sync:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger sync for a specific pool
   */
  async syncSinglePool(poolId: string): Promise<void> {
    console.log(`🔄 Manual sync triggered for pool ${poolId}`);
    
    try {
      await holderService.syncPoolHolders(poolId);
      console.log(`✅ Successfully synced holders for pool ${poolId}`);
    } catch (error) {
      console.error(`❌ Failed to sync holders for pool ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      serviceActive: this.syncInterval !== null
    };
  }

  /**
   * Update pool_metrics_current for a single pool (used after manual sync)
   */
  async updatePoolMetricsForSinglePool(poolId: string) {
    try {
      // Get the current holder count for this pool
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(tokenHolders)
        .where(eq(tokenHolders.poolId, poolId));
      
      const holderCount = countResult?.count || 0;
      
      // Check if metrics record exists
      const existingMetrics = await db
        .select()
        .from(poolMetricsCurrent)
        .where(eq(poolMetricsCurrent.poolId, poolId))
        .limit(1);
      
      if (existingMetrics.length > 0) {
        // Update existing metrics
        await db
          .update(poolMetricsCurrent)
          .set({
            holdersCount: holderCount,
            holdersStatus: 'success',
            updatedAt: new Date()
          })
          .where(eq(poolMetricsCurrent.poolId, poolId));
      } else {
        // Insert new metrics record
        await db
          .insert(poolMetricsCurrent)
          .values({
            id: crypto.randomUUID(),
            poolId: poolId,
            holdersCount: holderCount,
            holdersStatus: 'success',
            updatedAt: new Date(),
            createdAt: new Date()
          });
      }
      
      console.log(`📊 Updated pool_metrics_current for pool ${poolId}: ${holderCount} holders`);
    } catch (error) {
      console.error(`Error updating pool metrics for pool ${poolId}:`, error);
    }
  }
}

// Export singleton instance
export const comprehensiveHolderSyncService = new ComprehensiveHolderSyncService();