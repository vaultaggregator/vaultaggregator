import { storage } from "../storage";
import type { InsertHolderHistory } from "@shared/schema";

export class HolderDataSyncService {
  constructor() {
    // Etherscan functionality removed - keeping service structure for holder data sync
  }

  private async logError(title: string, description: string, error: string, tokenAddress?: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    try {
      const { errorLogger } = await import('./errorLogger.js');
      await errorLogger.logError({
        title,
        description,
        errorType: 'Service',
        severity,
        source: 'HolderDataSyncService',
        stackTrace: error,
        fixPrompt: `Holder data synchronization issue detected. Check if the Etherscan API is accessible, verify database connectivity, and ensure proper token address handling. This affects holder analytics and statistics.`,
        metadata: {
          error,
          tokenAddress,
          timestamp: new Date().toISOString(),
          service: 'HolderDataSync'
        }
      });
    } catch (logError) {
      console.error('Failed to log Holder Data Sync error:', logError);
    }
  }

  /**
   * Sync holder data for all active tokens
   */
  async syncAllHolderData(): Promise<void> {
    console.log("Starting holder data sync for all active tokens...");
    
    try {
      // Get all active pools with token addresses
      const pools = await storage.getPools({ limit: 1000 });
      const activeTokens = new Set<string>();

      // Extract unique token addresses from pools
      for (const pool of pools) {
        if (!pool.isVisible) continue;
        
        const rawData: any = pool.rawData || {};
        let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
        
        // Handle special cases - use actual vault contract addresses for holder data
        if (pool.id === 'd6a1f6b8-a970-4cc0-9f02-14da0152738e') {
          underlyingToken = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB'; // steakUSDC vault contract
        }
        
        if (underlyingToken && this.isValidTokenAddress(underlyingToken)) {
          activeTokens.add(underlyingToken);
        }
      }

      console.log(`Found ${activeTokens.size} unique tokens to sync holder data for`);

      // Sync holder data for each token
      const syncPromises = Array.from(activeTokens).map(tokenAddress => 
        this.syncTokenHolderData(tokenAddress)
      );

      const results = await Promise.allSettled(syncPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Holder data sync completed. Successful: ${successful}, Failed: ${failed}`);
      
      // Log failed syncs for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const tokenAddress = Array.from(activeTokens)[index];
          console.error(`Failed to sync holder data for ${tokenAddress}:`, result.reason);
        }
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error during holder data sync:", errorMsg);
      
      await this.logError(
        'Holder Data Sync Failed',
        'Failed to synchronize holder data for all active tokens. This affects holder analytics, growth tracking, and statistical displays across the platform.',
        errorMsg,
        undefined,
        'high'
      );
    }
  }

  /**
   * Sync holder data for a specific token
   */
  async syncTokenHolderData(tokenAddress: string): Promise<void> {
    try {
      console.log(`Syncing holder data for token: ${tokenAddress}`);

      // Check if we already have recent holder data (within last 4 hours)
      const recentData = await storage.getHolderHistory(tokenAddress, 1);
      if (recentData.length > 0) {
        const lastUpdate = recentData[0].timestamp ? new Date(recentData[0].timestamp) : new Date(0);
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        
        if (lastUpdate > fourHoursAgo) {
          console.log(`Holder data for ${tokenAddress} is recent, skipping`);
          return;
        }
      }

      // Etherscan functionality removed - simplified holder sync
      console.log(`Holder data sync for ${tokenAddress} skipped - Etherscan integration removed`);
      return;

      if (!tokenInfo) {
        console.warn(`Could not fetch token info for ${tokenAddress}`);
        return;
      }

      // Calculate holder count from various sources
      let holdersCount = 0;
      
      // Try to get holder count from token info first
      if (tokenInfo.holdersCount && tokenInfo.holdersCount > 0) {
        holdersCount = tokenInfo.holdersCount;
      } 
      // Fallback to top holders count if available
      else if (topHolders && topHolders.length > 0) {
        // This is a minimum count based on top holders
        holdersCount = Math.max(topHolders.length, analytics?.uniqueAddresses30d || 0);
      }
      // Fallback to analytics unique addresses
      else if (analytics?.uniqueAddresses30d) {
        holdersCount = analytics.uniqueAddresses30d;
      }

      // Calculate market metrics
      const totalSupplyNum = parseFloat(tokenSupply?.totalSupply || '0');
      const decimals = parseInt(tokenInfo.decimals || '18');
      const adjustedSupply = totalSupplyNum / Math.pow(10, decimals);

      // For now, we don't have direct price data, but we can store supply info
      let priceUsd: string | null = null;
      let marketCapUsd: string | null = null;

      // If we have price data from external sources, calculate market cap
      if (priceUsd && adjustedSupply) {
        marketCapUsd = (parseFloat(priceUsd) * adjustedSupply).toString();
      }

      // Store holder history data
      const holderData: InsertHolderHistory = {
        tokenAddress: tokenAddress.toLowerCase(),
        holdersCount,
        priceUsd,
        marketCapUsd,
        timestamp: new Date(),
        totalSupply: tokenSupply?.totalSupply,
        circulatingSupply: tokenSupply?.circulatingSupply,
        uniqueAddresses24h: analytics?.uniqueAddresses24h,
        uniqueAddresses7d: analytics?.uniqueAddresses7d,
        uniqueAddresses30d: analytics?.uniqueAddresses30d,
        transferCount24h: analytics?.transferCount24h,
        transferCount7d: analytics?.transferCount7d,
        transferCount30d: analytics?.transferCount30d,
        volume24h: analytics?.volume24h,
        volume7d: analytics?.volume7d,
        volume30d: analytics?.volume30d
      };

      await storage.storeHolderHistory(holderData);
      console.log(`Successfully synced holder data for ${tokenAddress}: ${holdersCount} holders`);

    } catch (error) {
      console.error(`Error syncing holder data for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced holder analytics with trend analysis
   */
  async getEnhancedHolderAnalytics(tokenAddress: string) {
    try {
      // Get comprehensive holder history
      const holderHistory = await storage.getHolderHistory(tokenAddress);
      const basicAnalytics = await storage.getHolderAnalytics(tokenAddress);

      if (holderHistory.length === 0) {
        return {
          ...basicAnalytics,
          trends: null,
          volatility: null,
          growthPattern: null
        };
      }

      // Calculate trends and patterns
      const trends = this.calculateHolderTrends(holderHistory);
      const volatility = this.calculateHolderVolatility(holderHistory);
      const growthPattern = this.analyzeGrowthPattern(holderHistory);

      return {
        ...basicAnalytics,
        trends,
        volatility,
        growthPattern,
        dataPoints: holderHistory.length,
        lastUpdated: holderHistory[0]?.timestamp
      };

    } catch (error) {
      console.error(`Error getting enhanced holder analytics for ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Calculate holder growth trends
   */
  private calculateHolderTrends(history: any[]) {
    if (history.length < 7) return null;

    const recent7Days = history.slice(0, 7);
    const previous7Days = history.slice(7, 14);

    const recentAvg = recent7Days.reduce((sum, h) => sum + h.holdersCount, 0) / recent7Days.length;
    const previousAvg = previous7Days.length > 0 
      ? previous7Days.reduce((sum, h) => sum + h.holdersCount, 0) / previous7Days.length 
      : recentAvg;

    const trendDirection = recentAvg > previousAvg ? 'growing' : recentAvg < previousAvg ? 'declining' : 'stable';
    const trendStrength = Math.abs((recentAvg - previousAvg) / previousAvg) * 100;

    return {
      direction: trendDirection,
      strength: trendStrength,
      recentAverage: Math.round(recentAvg),
      previousAverage: Math.round(previousAvg)
    };
  }

  /**
   * Calculate holder count volatility
   */
  private calculateHolderVolatility(history: any[]) {
    if (history.length < 7) return null;

    const recent30Days = history.slice(0, Math.min(30, history.length));
    const holderCounts = recent30Days.map(h => h.holdersCount);
    
    const mean = holderCounts.reduce((sum, count) => sum + count, 0) / holderCounts.length;
    const variance = holderCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / holderCounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    const volatilityPercentage = (standardDeviation / mean) * 100;

    return {
      level: volatilityPercentage < 5 ? 'low' : volatilityPercentage < 15 ? 'medium' : 'high',
      percentage: volatilityPercentage,
      standardDeviation: Math.round(standardDeviation)
    };
  }

  /**
   * Analyze growth patterns
   */
  private analyzeGrowthPattern(history: any[]) {
    if (history.length < 14) return null;

    const recent = history.slice(0, 7);
    const previous = history.slice(7, 14);
    const older = history.slice(14, 21);

    const recentGrowth = this.calculatePeriodGrowth(recent);
    const previousGrowth = this.calculatePeriodGrowth(previous);
    const olderGrowth = older.length > 0 ? this.calculatePeriodGrowth(older) : 0;

    // Determine pattern
    let pattern = 'irregular';
    if (recentGrowth > 0 && previousGrowth > 0) {
      pattern = recentGrowth > previousGrowth ? 'accelerating' : 'steady_growth';
    } else if (recentGrowth < 0 && previousGrowth < 0) {
      pattern = recentGrowth < previousGrowth ? 'accelerating_decline' : 'steady_decline';
    } else if (recentGrowth > 0 && previousGrowth <= 0) {
      pattern = 'recovery';
    } else if (recentGrowth <= 0 && previousGrowth > 0) {
      pattern = 'reversal';
    }

    return {
      pattern,
      recentGrowthRate: recentGrowth,
      previousGrowthRate: previousGrowth,
      consistency: Math.abs(recentGrowth - previousGrowth) < 2 ? 'high' : 'low'
    };
  }

  /**
   * Calculate growth rate for a period
   */
  private calculatePeriodGrowth(period: any[]) {
    if (period.length < 2) return 0;
    
    const start = period[period.length - 1].holdersCount;
    const end = period[0].holdersCount;
    
    return start > 0 ? ((end - start) / start) * 100 : 0;
  }

  /**
   * Validate token address format
   */
  private isValidTokenAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Clean old holder history data (keep last 90 days)
   */
  async cleanOldHolderData(): Promise<number> {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      // For now, we'll implement cleanup in the service itself
      // TODO: Add cleanOldHolderHistory method to storage
      console.log(`Cleanup of old holder history records scheduled for implementation`);
      return 0;
    } catch (error) {
      console.error("Error cleaning old holder data:", error);
      return 0;
    }
  }
}