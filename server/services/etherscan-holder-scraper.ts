/**
 * Etherscan Holder Count Scraper
 * Scrapes total holder counts from Etherscan/Basescan for pools
 */
import { storage } from '../storage';

export class EtherscanHolderScraper {
  private static readonly ETHERSCAN_BASE = "https://etherscan.io/token";
  private static readonly BASESCAN_BASE = "https://basescan.org/token";
  private static readonly DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests
  private static readonly BATCH_SIZE = 5; // Process 5 pools before longer pause
  private static readonly BATCH_DELAY = 10000; // 10 seconds between batches
  private static readonly MAX_RETRIES = 2;

  /**
   * Sleep helper for rate limiting
   */
  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape holder counts for all active pools
   */
  static async scrapeAllPoolHolderCounts(): Promise<{ success: number; failed: number }> {
    console.log("🔍 Starting Etherscan holder count scraping with rate limiting...");
    
    const pools = await storage.getActivePools();
    console.log(`📊 Found ${pools.length} active pools to scrape holder counts`);
    console.log(`⏱️ Rate limiting: ${this.DELAY_BETWEEN_REQUESTS}ms between requests, ${this.BATCH_SIZE} pools per batch`);
    
    let success = 0;
    let failed = 0;
    let requestCount = 0;

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

        // Add delay between requests to avoid rate limiting
        if (requestCount > 0) {
          await this.sleep(this.DELAY_BETWEEN_REQUESTS);
          
          // Add longer pause after each batch
          if (requestCount % this.BATCH_SIZE === 0) {
            console.log(`⏸️ Batch complete. Pausing for ${this.BATCH_DELAY / 1000} seconds...`);
            await this.sleep(this.BATCH_DELAY);
          }
        }

        console.log(`🔄 [${requestCount + 1}/${pools.length}] Scraping: ${pool.tokenPair} (${pool.poolAddress}) on ${chain.name}`);
        
        // Try scraping with retry logic
        let holderCount: number | null = null;
        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            console.log(`🔁 Retry attempt ${attempt} for ${pool.tokenPair}`);
            await this.sleep(this.DELAY_BETWEEN_REQUESTS * attempt); // Exponential backoff
          }
          
          holderCount = await this.scrapeHolderCount(pool.poolAddress, chain.name);
          if (holderCount !== null) break;
        }
        
        requestCount++;
        
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
          console.log(`⚠️ Could not get holder count for ${pool.tokenPair} after ${this.MAX_RETRIES + 1} attempts`);
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
      
      // Check if we're being rate limited or blocked
      if (html.includes('Cloudflare') || html.includes('rate limit') || html.includes('too many requests')) {
        console.log(`🚫 Rate limited or blocked for ${tokenAddress}`);
        return null;
      }
      
      // Check if this is a valid token page
      if (!html.includes('Token') && !html.includes('Contract')) {
        console.log(`⚠️ Invalid token page for ${tokenAddress}`);
        return null;
      }
      
      // Look for holder count patterns in the HTML
      const holderPatterns = [
        // Meta description pattern for Basescan/Etherscan (most reliable)
        /Holders?:\s*(\d{1,3}(?:,\d{3})*)/i,
        // Content patterns with holders
        /data-bs-title="Holders"[^>]*>(\d{1,3}(?:,\d{3})*)/i,
        /<span[^>]*>(\d{1,3}(?:,\d{3})*)\s*(?:addresses|holders?)/i,
        /Holders?[^>]*>(\d{1,3}(?:,\d{3})*)/i,
        /(\d{1,3}(?:,\d{3})*)\s*addresses/i,
        /(\d{1,3}(?:,\d{3})*)\s*holders?/i,
        // Additional patterns for different page formats
        /title="Holders"[^>]*>(\d{1,3}(?:,\d{3})*)/i,
        /Holders.*?(\d{1,3}(?:,\d{3})*)</i
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

      // If no pattern found, check if page has holder info at all
      if (!html.includes('holder') && !html.includes('Holder')) {
        console.log(`⚠️ No holder information on page for ${tokenAddress}`);
      } else {
        console.log(`⚠️ Holder info exists but pattern not matched for ${tokenAddress}`);
      }
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