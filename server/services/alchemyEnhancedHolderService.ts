import { Alchemy, Network } from 'alchemy-sdk';
import { db } from '../db';
import { pools, tokenHolders, poolMetricsCurrent } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { etherscanHolderScraper } from './etherscanHolderScraper';

class AlchemyEnhancedHolderService {
  private alchemy: Alchemy | null = null;
  private isRunning = false;
  private lastSyncTime: Date | null = null;

  constructor() {
    if (!process.env.ALCHEMY_RPC_URL) {
      console.warn('⚠️ Alchemy RPC URL not configured for enhanced holder service');
      return;
    }

    // Extract API key from RPC URL
    const apiKey = process.env.ALCHEMY_RPC_URL.split('/').pop();
    
    this.alchemy = new Alchemy({
      apiKey: apiKey,
      network: Network.ETH_MAINNET,
    });

    console.log('✅ Alchemy Enhanced Holder Service initialized');
  }

  /**
   * Sync top 100 holders for all active pools
   * Combines Etherscan scraping with Alchemy token metadata
   */
  async syncAllPoolHolders(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Enhanced holder sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting enhanced holder sync for all pools...');

    try {
      // Get all active pools with contract addresses
      const activePools = await db
        .select()
        .from(pools)
        .where(sql`${pools.poolAddress} IS NOT NULL 
          AND ${pools.poolAddress} != '' 
          AND ${pools.isActive} = true`);

      console.log(`📊 Found ${activePools.length} active pools to sync holders`);

      let successCount = 0;
      let errorCount = 0;
      const batchSize = 3; // Process 3 pools at a time

      // Process pools in batches
      for (let i = 0; i < activePools.length; i += batchSize) {
        const batch = activePools.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (pool) => {
            try {
              await this.syncPoolHolders(pool.id, pool.poolAddress!, pool.chainId);
              successCount++;
            } catch (error) {
              console.error(`❌ Failed to sync holders for pool ${pool.tokenPair}:`, error);
              errorCount++;
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < activePools.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.lastSyncTime = new Date();
      console.log(`✅ Enhanced holder sync completed: ${successCount} successful, ${errorCount} failed`);

    } catch (error) {
      console.error('❌ Error during enhanced holder sync:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sync top 100 holders for a specific pool
   */
  private async syncPoolHolders(poolId: string, contractAddress: string, chainId: string): Promise<void> {
    console.log(`📊 Syncing enhanced holders for pool ${poolId}...`);

    try {
      // Get holder addresses from Etherscan scraping
      const holderAddresses = await etherscanHolderScraper.getTopHolders(contractAddress, chainId);
      
      if (!holderAddresses || holderAddresses.length === 0) {
        console.log(`⚠️ No holder data found for pool ${poolId}`);
        return;
      }

      // Get token metadata from Alchemy if available
      let tokenDecimals = 18;
      let tokenSymbol = '';
      
      if (this.alchemy && chainId === 'ethereum') {
        try {
          const metadata = await this.alchemy.core.getTokenMetadata(contractAddress);
          tokenDecimals = metadata.decimals || 18;
          tokenSymbol = metadata.symbol || '';
        } catch (error) {
          console.warn(`⚠️ Could not fetch token metadata from Alchemy for ${contractAddress}`);
        }
      }

      // Get token price (simplified - you may want to use a price oracle)
      const tokenPrice = await this.getTokenPrice(contractAddress, tokenSymbol);

      // Process holder data
      const processedHolders = holderAddresses.slice(0, 100).map((holder, index) => {
        // Calculate USD value
        const usdValue = holder.balance * tokenPrice;
        
        return {
          poolId,
          tokenAddress: contractAddress,
          holderAddress: holder.address,
          tokenBalance: holder.rawBalance || '0',
          tokenBalanceFormatted: holder.balance,
          usdValue,
          poolSharePercentage: holder.percentage,
          rank: index + 1,
          walletBalanceEth: '0',
          walletBalanceUsd: '0',
        };
      });

      // Clear existing holders for this pool
      await db
        .delete(tokenHolders)
        .where(eq(tokenHolders.poolId, poolId));

      // Insert new holder data
      if (processedHolders.length > 0) {
        await db
          .insert(tokenHolders)
          .values(processedHolders.map(holder => ({
            id: crypto.randomUUID(),
            ...holder,
            lastUpdated: new Date(),
            createdAt: new Date(),
          })));

        console.log(`✅ Synced ${processedHolders.length} holders for pool ${poolId}`);
      }

      // Update holder count in metrics
      await this.updateHolderCount(poolId, holderAddresses.length);

    } catch (error) {
      console.error(`❌ Error syncing holders for pool ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Get token price (simplified implementation)
   */
  private async getTokenPrice(contractAddress: string, symbol: string): Promise<number> {
    // For stablecoins, return $1
    if (symbol && ['USDC', 'USDT', 'DAI', 'BUSD'].includes(symbol.toUpperCase())) {
      return 1;
    }

    // For other tokens, you could integrate with a price oracle
    // For now, return a default value
    return 1;
  }

  /**
   * Update holder count in pool metrics
   */
  private async updateHolderCount(poolId: string, count: number): Promise<void> {
    const existingMetrics = await db
      .select()
      .from(poolMetricsCurrent)
      .where(eq(poolMetricsCurrent.poolId, poolId))
      .limit(1);

    if (existingMetrics.length > 0) {
      await db
        .update(poolMetricsCurrent)
        .set({
          holdersCount: count,
          holdersStatus: 'success',
          updatedAt: new Date()
        })
        .where(eq(poolMetricsCurrent.poolId, poolId));
    } else {
      await db
        .insert(poolMetricsCurrent)
        .values({
          id: crypto.randomUUID(),
          poolId,
          holdersCount: count,
          holdersStatus: 'success',
          updatedAt: new Date(),
          createdAt: new Date()
        });
    }
  }

  /**
   * Clean up holders beyond top 100 for all pools
   */
  async cleanupExcessHolders(): Promise<void> {
    console.log('🧹 Cleaning up excess holders beyond top 100...');
    
    try {
      // Get all pools
      const allPools = await db
        .select({ id: pools.id })
        .from(pools);

      for (const pool of allPools) {
        // Get holders sorted by rank
        const poolHolders = await db
          .select({ id: tokenHolders.id, rank: tokenHolders.rank })
          .from(tokenHolders)
          .where(eq(tokenHolders.poolId, pool.id))
          .orderBy(tokenHolders.rank);

        // Delete any holders beyond rank 100
        if (poolHolders.length > 100) {
          const toDelete = poolHolders.slice(100);
          for (const holder of toDelete) {
            await db
              .delete(tokenHolders)
              .where(eq(tokenHolders.id, holder.id));
          }
          console.log(`🗑️ Removed ${toDelete.length} excess holders from pool ${pool.id}`);
        }
      }

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

export const alchemyEnhancedHolderService = new AlchemyEnhancedHolderService();