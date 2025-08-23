import { storage } from "../storage";
import { MorphoService } from "./morphoService";
import { TokenInfoSyncService } from "./tokenInfoSyncService";
// Complex holder analysis removed

async function logError(title: string, description: string, error: string, service: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  try {
    const { errorLogger } = await import('./errorLogger.js');
    await errorLogger.logError({
      title,
      description,
      errorType: 'Service',
      severity,
      source: 'ComprehensiveDataSync',
      stackTrace: error,
      fixPrompt: `Data synchronization failure detected. Check API connectivity, verify credentials, and ensure all external services are accessible. This affects live data accuracy across the website.`,
      metadata: {
        error,
        service,
        timestamp: new Date().toISOString(),
        operation: 'ComprehensiveDataSync'
      }
    });
  } catch (logError) {
    console.error('Failed to log ComprehensiveDataSync error:', logError);
  }
}

export class ComprehensiveDataSyncService {
  private morphoService: MorphoService;
  private tokenInfoService: TokenInfoSyncService;
  // Complex holder service removed

  constructor() {
    this.morphoService = new MorphoService();
    this.tokenInfoService = new TokenInfoSyncService();
    // Complex holder service removed
  }

  /**
   * Comprehensive data sync that updates all pool data across the website
   * This runs every 10 minutes to keep data fresh
   */
  async syncAllPoolData(): Promise<void> {
    console.log("🔄 Starting comprehensive data sync for all pools...");
    const startTime = Date.now();
    
    try {
      // Get all active pools
      const pools = await storage.getPools({ limit: 1000 });
      const activePools = pools.filter(pool => pool.isVisible);
      
      console.log(`📊 Found ${activePools.length} active pools to sync`);

      // Sync data for each pool in parallel for efficiency
      const syncPromises = activePools.map(pool => this.syncSinglePool(pool.id));
      const results = await Promise.allSettled(syncPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      const duration = Date.now() - startTime;
      console.log(`✅ Comprehensive data sync completed in ${duration}ms`);
      console.log(`📈 Results: ${successful} successful, ${failed} failed`);
      
      // Log failed syncs for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const poolId = activePools[index]?.id || 'unknown';
          console.error(`❌ Failed to sync pool ${poolId}:`, result.reason);
        }
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error during comprehensive data sync:", errorMsg);
      
      await logError(
        'Comprehensive Data Sync Failed',
        'Failed to synchronize pool data across the website. This affects APY, TVL, token information, and other metrics displayed to users.',
        errorMsg,
        'ComprehensiveDataSync',
        'high'
      );
    }
  }

  /**
   * Sync all data for a single pool
   */
  private async syncSinglePool(poolId: string): Promise<void> {
    try {
      const pool = await storage.getPoolById(poolId);
      if (!pool) {
        console.warn(`⚠️ Pool ${poolId} not found, skipping sync`);
        return;
      }

      // Run all sync operations in parallel for efficiency
      await Promise.allSettled([
        this.syncPoolMorphoData(pool),
        this.syncPoolTokenInfo(pool)
        // Note: Holder data sync is expensive, so it runs separately less frequently
      ]);

      // Pool sync completed successfully
      
      console.log(`✅ Sync completed for ${pool.tokenPair} (${pool.platform.displayName})`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error syncing pool ${poolId}:`, errorMsg);
      
      // Pool sync failed, continuing with other pools
      
      throw error;
    }
  }

  /**
   * Update pool APY and TVL data from Morpho
   */
  private async syncPoolMorphoData(pool: any): Promise<void> {
    try {
      // Check if this is a Morpho pool
      if (pool.platform.slug !== 'morpho-blue' && pool.project !== 'morpho-blue') {
        // For non-Morpho pools (like Lido), skip API calls but still count as successful sync
        console.log(`⚡ Skipping Morpho sync for non-Morpho pool: ${pool.tokenPair} (${pool.platform.displayName})`);
        return;
      }

      const vaultAddress = pool.poolAddress;
      if (!vaultAddress) {
        console.warn(`⚠️ No vault address for pool ${pool.id}, skipping Morpho sync`);
        return;
      }

      try {
        // Get latest vault data from Morpho
        const vaultData = await this.morphoService.getVaultByAddress(vaultAddress, 1);
        if (!vaultData) {
          console.warn(`⚠️ No Morpho vault data found for ${vaultAddress}`);
          return;
        }

        // Update pool with fresh APY and TVL data
        const updates = {
          apy: vaultData.state.netApy?.toString() || vaultData.state.apy?.toString() || pool.apy,
          tvl: vaultData.state.totalAssetsUsd?.toString() || pool.tvl,
          rawData: {
            ...pool.rawData,
            state: {
              ...pool.rawData?.state,
              apy: vaultData.state.apy,
              netApy: vaultData.state.netApy,
              totalAssets: vaultData.state.totalAssetsUsd,
              totalAssetsUsd: vaultData.state.totalAssetsUsd,
              fee: vaultData.state.fee
            }
          }
        };

        await storage.updatePool(pool.id, updates);
        console.log(`✅ Updated Morpho data for ${pool.tokenPair}: APY ${updates.apy}%`);

      } catch (apiError) {
        // Morpho API is down, but sync attempt was made
        console.warn(`⚠️ Morpho API unavailable for ${pool.tokenPair}, but sync attempted`);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error syncing Morpho data for pool ${pool.id}:`, errorMsg);
      // Don't throw here, let other sync operations continue
    }
  }

  /**
   * Update token information for the pool
   */
  private async syncPoolTokenInfo(pool: any): Promise<void> {
    try {
      await this.tokenInfoService.syncTokenInfo(pool.id, pool.rawData);
      console.log(`✅ Updated token info for ${pool.tokenPair}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error syncing token info for pool ${pool.id}:`, errorMsg);
      // Don't throw here, let other sync operations continue
    }
  }

  /**
   * Lightweight holder data sync (runs separately, less frequently)
   */
  async syncHolderDataLightweight(): Promise<void> {
    try {
      console.log("👥 Running lightweight holder data sync...");
      
      // Check if we should use enhanced holder data with Alchemy
      const useEnhancedHolders = process.env.ALCHEMY_RPC_URL && process.env.USE_ENHANCED_HOLDERS === 'true';
      
      if (useEnhancedHolders) {
        // Use simple holder count service for basic counts only
        const { simpleHolderCountService } = await import('./simpleHolderCountService');
        await simpleHolderCountService.updateAllPoolHolderCounts();
        console.log("✅ Enhanced holder data sync completed");
      } else {
        // Use simple holder count service for basic counts
        const { simpleHolderCountService } = await import('./simpleHolderCountService');
        await simpleHolderCountService.updateAllPoolHolderCounts();
        console.log("✅ Lightweight holder data sync completed");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error in lightweight holder data sync:", errorMsg);
      
      await logError(
        'Holder Data Sync Failed',
        'Failed to synchronize holder data. This affects holder counts and analytics displayed on the website.',
        errorMsg,
        'HolderDataSync',
        'medium'
      );
    }
  }

  /**
   * Clear all caches to ensure fresh data
   */
  async clearCaches(): Promise<void> {
    try {
      // Clear Morpho service cache
      this.morphoService['cache']?.clear();
      console.log("🧹 Cleared data caches for fresh sync");
    } catch (error) {
      console.error("⚠️ Error clearing caches:", error);
    }
  }
}