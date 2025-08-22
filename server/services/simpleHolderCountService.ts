/**
 * Simple service that ONLY updates holder counts in the database using Etherscan
 * Does NOT store individual holders, just the total count
 */

import { db } from '../db';
import { poolMetricsCurrent } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { etherscanHolderScraper } from './etherscanHolderScraper';

export class SimpleHolderCountService {
  
  /**
   * Update holder count for a pool using Etherscan/Basescan scraping
   * @param poolId - The pool ID
   * @param contractAddress - The contract address
   * @param chainName - The chain name (ethereum or base)
   * @returns The total holder count
   */
  async updateHolderCount(poolId: string, contractAddress: string, chainName: string = 'ethereum'): Promise<number> {
    try {
      const totalCount = await etherscanHolderScraper.getHolderCount(contractAddress, chainName);
      
      // Update only the holder count in pool_metrics_current
      const existingMetrics = await db
        .select()
        .from(poolMetricsCurrent)
        .where(eq(poolMetricsCurrent.poolId, poolId))
        .limit(1);
      
      if (existingMetrics.length > 0) {
        await db
          .update(poolMetricsCurrent)
          .set({
            holdersCount: totalCount,
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
            holdersCount: totalCount,
            holdersStatus: 'success',
            updatedAt: new Date(),
            createdAt: new Date()
          });
      }
      
      console.log(`✅ Updated holder count for pool ${poolId}: ${totalCount} holders`);
      return totalCount;
    } catch (error) {
      console.error(`❌ Failed to update holder count for pool ${poolId}:`, error);
      return 0;
    }
  }
  

  /**
   * Update holder counts for all pools
   */
  async updateAllPoolHolderCounts(): Promise<void> {
    try {
      // Get all active pools with contract addresses and chain info
      const pools = await db.query.pools.findMany({
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
      
      console.log(`🔄 Updating holder counts for ${pools.length} pools...`);
      
      for (const pool of pools) {
        if (pool.poolAddress) {
          // Determine which scanner to use based on chain
          // Special case: chain ID 19a7e3af-bc9b-4c6a-9df5-0b24b19934a7 is BASE network (Spark USDC Vault)
          let chainName = 'ethereum';
          if (pool.chain) {
            chainName = pool.chain.name.toLowerCase();
          } else if (pool.chainId === '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7') {
            // This is the Spark USDC Vault on BASE
            chainName = 'base';
          }
          
          await this.updateHolderCount(pool.id, pool.poolAddress, chainName);
          // Respectful delay for Etherscan/Basescan scraping
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`✅ Updated holder counts for all pools`);
    } catch (error) {
      console.error('❌ Failed to update all pool holder counts:', error);
    }
  }
}

// Export singleton instance
export const simpleHolderCountService = new SimpleHolderCountService();