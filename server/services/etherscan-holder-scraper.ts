/**
 * Etherscan Holder Count Scraper
 * Scrapes total holder counts from Etherscan/Basescan for pools
 */
import { storage } from '../storage';

export class EtherscanHolderScraper {
  private static readonly ETHERSCAN_BASE = "https://etherscan.io/token";
  private static readonly BASESCAN_BASE = "https://basescan.org/token";

  /**
   * Scrape holder counts for all active pools
   */
  static async scrapeAllPoolHolderCounts(): Promise<{ success: number; failed: number }> {
    console.log("🔍 Starting Etherscan holder count scraping...");
    
    const pools = await storage.getActivePools();
    console.log(`📊 Found ${pools.length} active pools to scrape holder counts`);
    
    let success = 0;
    let failed = 0;

    for (const pool of pools) {
      try {
        if (!pool.poolAddress) {
          console.log(`⚠️ Skipping pool ${pool.tokenPair} - no pool address`);
          continue;
        }

        console.log(`🔄 Scraping holder count for: ${pool.tokenPair} (${pool.poolAddress})`);
        const holderCount = await this.scrapeHolderCount(pool.poolAddress, pool.chain.name);
        
        if (holderCount !== null) {
          // Store in holder history
          await storage.storeHolderHistory({
            tokenAddress: pool.poolAddress,
            holdersCount: holderCount,
            priceUsd: null,
            marketCapUsd: null,
          });
          
          console.log(`✅ ${pool.tokenPair}: ${holderCount} total holders`);
          success++;
        } else {
          console.log(`⚠️ Could not get holder count for ${pool.tokenPair}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error scraping holder count for ${pool.tokenPair}:`, error);
        failed++;
      }
    }

    console.log(`🏁 Etherscan holder count scraping completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Scrape holder count for a specific token address
   */
  private static async scrapeHolderCount(tokenAddress: string, chainName: string): Promise<number | null> {
    try {
      const baseUrl = chainName.toLowerCase() === 'ethereum' ? this.ETHERSCAN_BASE : this.BASESCAN_BASE;
      const url = `${baseUrl}/${tokenAddress}`;
      
      console.log(`🌐 Fetching: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.error(`❌ HTTP error ${response.status} for ${tokenAddress}`);
        return null;
      }

      const html = await response.text();
      
      // Look for holder count patterns in the HTML
      const holderPatterns = [
        /<span[^>]*>(\d{1,3}(?:,\d{3})*)\s*(?:addresses|holders?)/i,
        /Holders?[^>]*>(\d{1,3}(?:,\d{3})*)/i,
        /(\d{1,3}(?:,\d{3})*)\s*addresses/i,
        /(\d{1,3}(?:,\d{3})*)\s*holders?/i
      ];

      for (const pattern of holderPatterns) {
        const match = html.match(pattern);
        if (match) {
          const holderCountStr = match[1].replace(/,/g, '');
          const holderCount = parseInt(holderCountStr, 10);
          
          if (!isNaN(holderCount) && holderCount > 0) {
            console.log(`📊 Found holder count: ${holderCount} for ${tokenAddress}`);
            return holderCount;
          }
        }
      }

      console.log(`⚠️ No holder count pattern found for ${tokenAddress}`);
      return null;
    } catch (error) {
      console.error(`❌ Error scraping ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Scrape holder count for a single pool by ID
   */
  static async scrapeSinglePoolHolderCount(poolId: string): Promise<void> {
    console.log(`🔍 Scraping holder count for pool ${poolId}`);
    
    const pool = await storage.getPoolById(poolId);
    if (!pool?.poolAddress) {
      console.log(`❌ Pool ${poolId} not found or missing address`);
      return;
    }

    const holderCount = await this.scrapeHolderCount(pool.poolAddress, pool.chain.name);
    
    if (holderCount !== null) {
      await storage.storeHolderHistory({
        tokenAddress: pool.poolAddress,
        holdersCount: holderCount,
        priceUsd: null,
        marketCapUsd: null,
      });
      
      console.log(`✅ Updated holder count for ${pool.tokenPair}: ${holderCount} holders`);
    } else {
      console.log(`❌ Failed to get holder count for ${pool.tokenPair}`);
    }
  }
}