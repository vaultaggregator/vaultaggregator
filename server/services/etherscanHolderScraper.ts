/**
 * Etherscan holder count scraper
 * Gets the total holder count directly from Etherscan's token page
 */

import { JSDOM } from 'jsdom';
import { db } from '../db';
import { poolMetricsCurrent } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export class EtherscanHolderScraper {
  private readonly ETHERSCAN_URL = 'https://etherscan.io';
  private readonly BASESCAN_URL = 'https://basescan.org';
  
  /**
   * Get holder count from Etherscan/Basescan by scraping the token page
   * @param contractAddress - The contract address to check
   * @param chain - The chain name ('ethereum' or 'base')
   */
  async getHolderCount(contractAddress: string, chain: string = 'ethereum'): Promise<number> {
    try {
      // Choose the correct scanner based on chain
      const baseUrl = chain.toLowerCase() === 'base' ? this.BASESCAN_URL : this.ETHERSCAN_URL;
      const scannerName = chain.toLowerCase() === 'base' ? 'Basescan' : 'Etherscan';
      
      const url = `${baseUrl}/token/${contractAddress}`;
      console.log(`🔍 Fetching holder count from ${scannerName} for ${contractAddress}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Etherscan returned ${response.status}`);
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Look for the holder count in the page
      // Etherscan displays it as "Holders: X,XXX addresses"
      const holderElements = Array.from(document.querySelectorAll('div'));
      let holderCount = 0;
      
      for (const element of holderElements) {
        const text = element.textContent || '';
        
        // Look for patterns like "Holders:", "holders:", or "X holders"
        const holderMatch = text.match(/holders[:\s]+([0-9,]+)/i);
        if (holderMatch) {
          // Remove commas and parse the number
          const countStr = holderMatch[1].replace(/,/g, '');
          const count = parseInt(countStr);
          if (!isNaN(count) && count > 0) {
            holderCount = count;
            console.log(`✅ Found holder count: ${count.toLocaleString()}`);
            break;
          }
        }
        
        // Alternative pattern: look for "X addresses" near "Holders"
        if (text.includes('Holders') || text.includes('holders')) {
          const addressMatch = text.match(/([0-9,]+)\s+addresses/i);
          if (addressMatch) {
            const countStr = addressMatch[1].replace(/,/g, '');
            const count = parseInt(countStr);
            if (!isNaN(count) && count > 0) {
              holderCount = count;
              console.log(`✅ Found holder count: ${count.toLocaleString()}`);
              break;
            }
          }
        }
      }
      
      // If we couldn't find it in divs, try looking in the token tracker info card
      if (holderCount === 0) {
        const cardElements = Array.from(document.querySelectorAll('.card-body'));
        for (const card of cardElements) {
          const text = card.textContent || '';
          if (text.includes('Holders')) {
            const match = text.match(/([0-9,]+)\s+(?:addresses|holders)/i);
            if (match) {
              const countStr = match[1].replace(/,/g, '');
              const count = parseInt(countStr);
              if (!isNaN(count) && count > 0) {
                holderCount = count;
                console.log(`✅ Found holder count in card: ${count.toLocaleString()}`);
                break;
              }
            }
          }
        }
      }
      
      if (holderCount === 0) {
        console.log(`⚠️ Could not find holder count on Etherscan page for ${contractAddress}`);
      }
      
      return holderCount;
    } catch (error) {
      console.error(`❌ Failed to scrape Etherscan for ${contractAddress}:`, error);
      return 0;
    }
  }
  
  /**
   * Update holder count for a pool using Etherscan data
   */
  async updatePoolHolderCount(poolId: string, contractAddress: string): Promise<number> {
    try {
      const holderCount = await this.getHolderCount(contractAddress);
      
      if (holderCount > 0) {
        // Update the holder count in pool_metrics_current
        const existingMetrics = await db
          .select()
          .from(poolMetricsCurrent)
          .where(eq(poolMetricsCurrent.poolId, poolId))
          .limit(1);
        
        if (existingMetrics.length > 0) {
          await db
            .update(poolMetricsCurrent)
            .set({
              holdersCount: holderCount,
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
              holdersCount: holderCount,
              holdersStatus: 'success',
              updatedAt: new Date(),
              createdAt: new Date()
            });
        }
        
        console.log(`📊 Updated holder count for pool ${poolId}: ${holderCount.toLocaleString()} holders`);
      }
      
      return holderCount;
    } catch (error) {
      console.error(`❌ Failed to update holder count for pool ${poolId}:`, error);
      return 0;
    }
  }
  
  /**
   * Update holder counts for all pools using Etherscan
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
      
      console.log(`🔄 Updating holder counts for ${pools.length} pools from Etherscan...`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const pool of pools) {
        if (pool.poolAddress) {
          const count = await this.updatePoolHolderCount(pool.id, pool.poolAddress);
          if (count > 0) {
            successCount++;
          } else {
            failCount++;
          }
          
          // Add delay to be respectful to Etherscan
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`✅ Etherscan holder count update complete: ${successCount} successful, ${failCount} failed`);
    } catch (error) {
      console.error('❌ Failed to update all pool holder counts from Etherscan:', error);
    }
  }
}

// Export singleton instance
export const etherscanHolderScraper = new EtherscanHolderScraper();