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

      // Sync ALL pools to ensure we have up to 1000 holders for each
      console.log(`🎯 Syncing holders for ALL ${allPools.length} pools to ensure complete data...`);

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
          
          await holderService.syncPoolHolders(pool.id);
          
          // Verify new count
          const newCount = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(tokenHolders)
            .where(eq(tokenHolders.poolId, pool.id));
          
          const updatedCount = newCount[0]?.count || 0;
          successCount++;
          console.log(`✅ Successfully synced "${pool.tokenPair}": ${storedCount} → ${updatedCount} holders`);
          
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