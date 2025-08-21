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
   * Update holder count for a pool using Etherscan scraping
   * @param poolId - The pool ID
   * @param contractAddress - The contract address
   * @returns The total holder count
   */
  async updateHolderCount(poolId: string, contractAddress: string): Promise<number> {
    try {
      const totalCount = await etherscanHolderScraper.getHolderCount(contractAddress);
      
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
      // Get all active pools with contract addresses
      const pools = await db.query.pools.findMany({
        where: (pools, { and, isNotNull, ne, eq }) => 
          and(
            isNotNull(pools.poolAddress),
            ne(pools.poolAddress, ''),
            eq(pools.isActive, true)
          )
      });
      
      console.log(`🔄 Updating holder counts for ${pools.length} pools...`);
      
      for (const pool of pools) {
        if (pool.poolAddress) {
          await this.updateHolderCount(pool.id, pool.poolAddress);
          // Respectful delay for Etherscan scraping
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