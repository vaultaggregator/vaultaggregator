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

        // Get chain information for this pool (use getChainById which queries networks table)
        const chain = await storage.getChainById(pool.chainId);
        if (!chain) {
          console.log(`⚠️ Skipping pool ${pool.tokenPair} - chain not found`);
          continue;
        }

        console.log(`🔄 Scraping holder count for: ${pool.tokenPair} (${pool.poolAddress}) on ${chain.name}`);
        const holderCount = await this.scrapeHolderCount(pool.poolAddress, chain.name);
        
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
      // Determine the correct scanner URL based on network
      let baseUrl: string;
      let networkName: string;
      
      if (chainName.toLowerCase() === 'ethereum') {
        baseUrl = this.ETHERSCAN_BASE;
        networkName = 'Etherscan';
      } else if (chainName.toLowerCase() === 'base') {
        baseUrl = this.BASESCAN_BASE;
        networkName = 'Basescan';
      } else {
        // Default to Basescan for any other network
        baseUrl = this.BASESCAN_BASE;
        networkName = 'Basescan';
      }
      
      const url = `${baseUrl}/${tokenAddress}`;
      
      console.log(`🌐 Fetching from ${networkName}: ${url}`);
      
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
        // Meta description pattern for Basescan/Etherscan
        /Holders?:\s*(\d{1,3}(?:,\d{3})*)/i,
        // Original patterns
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

    // Get chain information for this pool (use getChainById which queries networks table)
    const chain = await storage.getChainById(pool.chainId);
    if (!chain) {
      console.log(`❌ Chain not found for pool ${poolId}`);
      return;
    }

    const holderCount = await this.scrapeHolderCount(pool.poolAddress, chain.name);
    
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