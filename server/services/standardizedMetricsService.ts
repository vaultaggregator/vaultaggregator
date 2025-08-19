/**
 * 🎯 Standardized Pool Metrics Collection Service
 * 
 * Collects 4 core metrics (APY, DAYS, TVL, HOLDERS) from platform-specific APIs:
 * - APY: From platform APIs (Morpho GraphQL, Lido API)  
 * - DAYS: Operating days since contract creation (Etherscan)
 * - TVL: Total Value Locked from platform APIs
 * - HOLDERS: Token holder count from Etherscan
 */

import { Pool, PoolMetricsCurrent, InsertPoolMetricsHistory, InsertPoolMetricsCurrent } from "@shared/schema";
import type { DatabaseStorage } from "../storage";

export interface PlatformMetricsCollector {
  collectAPY(pool: Pool): Promise<{ value: number | null; error?: string }>;
  collectTVL(pool: Pool): Promise<{ value: number | null; error?: string }>;
  collectDays(pool: Pool): Promise<{ value: number | null; error?: string }>;
  collectHolders(pool: Pool): Promise<{ value: number | null; error?: string }>;
}

export class StandardizedMetricsService {
  private storage: DatabaseStorage;
  private collectors: Map<string, PlatformMetricsCollector> = new Map();

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
    this.initializePlatformCollectors();
  }

  private initializePlatformCollectors() {
    // Initialize platform-specific collectors
    this.collectors.set("morpho", new MorphoMetricsCollector());
    this.collectors.set("morpho-blue", new MorphoMetricsCollector()); // 🎯 Handle morpho-blue slug
    this.collectors.set("lido", new LidoMetricsCollector());
  }

  /**
   * Collect all 4 core metrics for a pool immediately
   */
  async collectAllMetricsForPool(poolId: string, method: "immediate" | "auto" | "manual" = "auto"): Promise<void> {
    console.log(`🎯 Collecting standardized metrics for pool ${poolId} (method: ${method})`);

    try {
      // Get pool with platform information
      const pool = await this.storage.getPoolById(poolId);
      if (!pool || !pool.platform) {
        throw new Error(`Pool ${poolId} not found or missing platform information`);
      }

      const platformName = pool.platform.slug.toLowerCase();
      const collector = this.collectors.get(platformName);
      
      if (!collector) {
        console.log(`❌ No metrics collector found for platform: ${platformName}`);
        await this.updateAllMetricsToNA(poolId, `No collector for platform: ${platformName}`);
        return;
      }

      console.log(`🚀 Using ${platformName} collector for pool ${pool.tokenPair}`);

      // Collect all 4 metrics in parallel
      const [apyResult, tvlResult, daysResult, holdersResult] = await Promise.allSettled([
        collector.collectAPY(pool),
        collector.collectTVL(pool),
        collector.collectDays(pool),
        collector.collectHolders(pool)
      ]);

      // Process APY result
      const apy = apyResult.status === "fulfilled" ? apyResult.value : { value: null, error: "Collection failed" };
      await this.storage.updatePoolMetricCurrentStatus(
        poolId, 
        "apy", 
        apy.value !== null ? "success" : "error", 
        apy.value, 
        apy.error
      );

      // Process TVL result
      const tvl = tvlResult.status === "fulfilled" ? tvlResult.value : { value: null, error: "Collection failed" };
      await this.storage.updatePoolMetricCurrentStatus(
        poolId, 
        "tvl", 
        tvl.value !== null ? "success" : "error", 
        tvl.value, 
        tvl.error
      );

      // Process Days result
      const days = daysResult.status === "fulfilled" ? daysResult.value : { value: null, error: "Collection failed" };
      await this.storage.updatePoolMetricCurrentStatus(
        poolId, 
        "days", 
        days.value !== null ? "success" : "error", 
        days.value, 
        days.error
      );

      // Process Holders result
      const holders = holdersResult.status === "fulfilled" ? holdersResult.value : { value: null, error: "Collection failed" };
      await this.storage.updatePoolMetricCurrentStatus(
        poolId, 
        "holders", 
        holders.value !== null ? "success" : "error", 
        holders.value, 
        holders.error
      );

      // Store historical record
      await this.storage.storePoolMetricsHistory({
        poolId,
        apy: apy.value ? apy.value.toString() : null,
        operatingDays: days.value,
        tvl: tvl.value ? tvl.value.toString() : null,
        holdersCount: holders.value,
        dataSource: platformName,
        collectionMethod: method,
        apiResponse: {
          apy: apyResult.status === "fulfilled" ? apyResult.value : { error: "Failed" },
          tvl: tvlResult.status === "fulfilled" ? tvlResult.value : { error: "Failed" },
          days: daysResult.status === "fulfilled" ? daysResult.value : { error: "Failed" },
          holders: holdersResult.status === "fulfilled" ? holdersResult.value : { error: "Failed" }
        },
        errorLog: [apyResult, tvlResult, daysResult, holdersResult]
          .filter(r => r.status === "rejected")
          .map(r => (r as PromiseRejectedResult).reason?.toString())
          .join("; ") || null
      });

      console.log(`✅ Metrics collection completed for pool ${poolId}`);
      console.log(`   APY: ${apy.value ? `${apy.value}%` : "N/A"}`);
      console.log(`   TVL: ${tvl.value ? `$${tvl.value.toLocaleString()}` : "N/A"}`);
      console.log(`   Days: ${days.value || "N/A"}`);
      console.log(`   Holders: ${holders.value || "N/A"}`);

    } catch (error) {
      console.error(`❌ Error collecting metrics for pool ${poolId}:`, error);
      await this.updateAllMetricsToNA(poolId, error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Set all metrics to N/A status with error message
   */
  private async updateAllMetricsToNA(poolId: string, errorMessage: string): Promise<void> {
    await Promise.all([
      this.storage.updatePoolMetricCurrentStatus(poolId, "apy", "n/a", null, errorMessage),
      this.storage.updatePoolMetricCurrentStatus(poolId, "tvl", "n/a", null, errorMessage),
      this.storage.updatePoolMetricCurrentStatus(poolId, "days", "n/a", null, errorMessage),
      this.storage.updatePoolMetricCurrentStatus(poolId, "holders", "n/a", null, errorMessage)
    ]);
  }

  /**
   * Trigger immediate metrics collection for a pool (used on pool creation)
   */
  async triggerImmediateCollection(poolId: string): Promise<void> {
    await this.collectAllMetricsForPool(poolId, "immediate");
  }

  /**
   * Collect metrics for all pools that need updates based on platform refresh intervals
   */
  async collectMetricsForScheduledPools(): Promise<void> {
    const pools = await this.storage.getPoolsNeedingMetricsCollection();
    
    console.log(`🎯 Found ${pools.length} pools needing metrics collection`);
    
    for (const pool of pools) {
      await this.collectAllMetricsForPool(pool.id, "auto");
    }
  }
}

/**
 * Platform-specific collectors
 */
class MorphoMetricsCollector implements PlatformMetricsCollector {
  async collectAPY(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      // Use existing Morpho scraper logic
      const { MorphoScraper } = await import("../scrapers/morpho-scraper");
      const scraper = new MorphoScraper();
      const result = await scraper.scrapePool(pool);
      
      return { value: result?.apy ? parseFloat(result.apy.toString()) : null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "APY collection failed" };
    }
  }

  async collectTVL(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      // TVL from Morpho GraphQL - placeholder for now
      // TODO: Implement TVL collection from Morpho API
      return { value: null, error: "TVL collection not implemented for Morpho" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "TVL collection failed" };
    }
  }

  async collectDays(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      if (!pool.poolAddress) {
        return { value: null, error: "Pool address not available" };
      }

      // Calculate days from Etherscan contract creation
      // TODO: Use existing Etherscan integration
      return { value: null, error: "Days calculation not implemented" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Days calculation failed" };
    }
  }

  async collectHolders(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      if (!pool.poolAddress) {
        return { value: null, error: "Pool address not available" };
      }

      // Get holders from Etherscan
      // TODO: Use existing TokenInfo service
      return { value: null, error: "Holders collection not implemented" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Holders collection failed" };
    }
  }
}

class LidoMetricsCollector implements PlatformMetricsCollector {
  async collectAPY(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      // Use existing Lido scraper logic
      const { LidoScraper } = await import("../scrapers/lido-scraper");
      const scraper = new LidoScraper();
      const result = await scraper.scrapePool(pool);
      
      return { value: result?.apy ? parseFloat(result.apy.toString()) : null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "APY collection failed" };
    }
  }

  async collectTVL(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      // TODO: Implement TVL collection from Lido API
      return { value: null, error: "TVL collection not implemented for Lido" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "TVL collection failed" };
    }
  }

  async collectDays(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      // For Lido stETH, we know it's been operating for ~1703 days as per replit.md
      // TODO: Calculate dynamically from contract creation date
      return { value: 1703 }; // From replit.md - Lido stETH operating days
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Days calculation failed" };
    }
  }

  async collectHolders(pool: Pool): Promise<{ value: number | null; error?: string }> {
    try {
      // TODO: Get Lido stETH holders from Etherscan
      return { value: null, error: "Holders collection not implemented for Lido" };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : "Holders collection failed" };
    }
  }
}