import { db } from '../db';
import { pools, tokenHolders, poolMetricsCurrent } from '@shared/schema';
import { eq, sql, isNull, or } from 'drizzle-orm';
import { holderService } from './holderService';

class ComprehensiveHolderSyncService {
  private isRunning = false;
  private syncInterval: NodeJS.Timer | null = null;

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
   * Sync holders for all pools that need it
   */
  async syncAllPools() {
    if (this.isRunning) {
      console.log('⏳ Comprehensive holder sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting comprehensive holder sync for all pools...');

    try {
      // Get all pools with contract addresses
      const allPools = await db
        .select({
          id: pools.id,
          tokenPair: pools.tokenPair,
          poolAddress: pools.poolAddress,
          platformId: pools.platformId
        })
        .from(pools)
        .where(sql`${pools.poolAddress} IS NOT NULL AND ${pools.poolAddress} != ''`);

      console.log(`📊 Found ${allPools.length} pools with contract addresses`);

      // Check which pools need holder sync
      const poolsNeedingSync: typeof allPools = [];
      
      for (const pool of allPools) {
        // Check if pool has any holders
        const holderCount = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(tokenHolders)
          .where(eq(tokenHolders.poolId, pool.id));

        // Also check pool metrics
        const metrics = await db
          .select({ holdersCount: poolMetricsCurrent.holdersCount })
          .from(poolMetricsCurrent)
          .where(eq(poolMetricsCurrent.poolId, pool.id));

        const hasHolders = holderCount[0]?.count > 0;
        const hasMetrics = metrics[0]?.holdersCount && metrics[0].holdersCount > 0;

        if (!hasHolders || !hasMetrics) {
          poolsNeedingSync.push(pool);
          console.log(`📝 Pool "${pool.tokenPair}" (${pool.id}) needs holder sync`);
        }
      }

      if (poolsNeedingSync.length === 0) {
        console.log('✅ All pools have holder data, no sync needed');
        this.isRunning = false;
        return;
      }

      console.log(`🎯 Syncing holders for ${poolsNeedingSync.length} pools...`);

      // Sync each pool that needs it
      let successCount = 0;
      let errorCount = 0;

      for (const pool of poolsNeedingSync) {
        try {
          console.log(`🔄 Syncing holders for "${pool.tokenPair}"...`);
          await holderService.syncPoolHolders(pool.id);
          successCount++;
          console.log(`✅ Successfully synced holders for "${pool.tokenPair}"`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to sync holders for "${pool.tokenPair}":`, error);
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
}

// Export singleton instance
export const comprehensiveHolderSyncService = new ComprehensiveHolderSyncService();