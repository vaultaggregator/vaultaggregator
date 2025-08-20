import { storage } from "../storage";
import { db } from "../db";
import { pools } from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
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
   * Sync holder data for all active pools using the new holderService
   */
  async syncAllHolderData(): Promise<void> {
    console.log("Starting holder data sync for all active pools...");
    
    try {
      // Use the newer holderService for comprehensive sync
      const { holderService } = await import('./holderService');
      await holderService.syncAllPoolHolders();
      
      console.log('✅ Holder data sync completed using holderService');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error during holder data sync:", errorMsg);
      
      await this.logError(
        'Holder Data Sync Failed',
        'Failed to synchronize holder data for all active pools. This affects holder analytics, growth tracking, and statistical displays across the platform.',
        errorMsg,
        undefined,
        'high'
      );
    }
  }

  /**
   * Sync holder data for a specific pool using the new holderService
   */
  async syncPoolHolderData(poolId: string): Promise<void> {
    try {
      console.log(`Syncing holder data for pool: ${poolId}`);
      
      // Use the newer holderService for individual pool sync
      const { holderService } = await import('./holderService');
      await holderService.syncPoolHolders(poolId);
      
      console.log(`✅ Successfully synced holder data for pool ${poolId}`);
    } catch (error) {
      console.error(`Error syncing holder data for pool ${poolId}:`, error);
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