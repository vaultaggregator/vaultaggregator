import { db } from '../db';
import { poolHistoricalData } from '@shared/schema';
import { eq, gte, desc, and } from 'drizzle-orm';

export interface HistoricalApyAverages {
  current: number;
  sevenDay: number | null;
  thirtyDay: number | null;
  ninetyDay: number | null;
  allTime: number | null;
}

export class HistoricalApyService {
  /**
   * Calculate real historical APY averages from authentic data
   * Returns null for periods with insufficient data
   */
  async calculateRealHistoricalAverages(poolId: string, platformName?: string): Promise<HistoricalApyAverages> {
    try {
      console.log(`📊 Calculating real historical APY averages for pool ${poolId}`);
      
      // Get current APY from most recent data point
      const latestData = await db
        .select()
        .from(poolHistoricalData)
        .where(eq(poolHistoricalData.poolId, poolId))
        .orderBy(desc(poolHistoricalData.timestamp))
        .limit(1);

      if (latestData.length === 0) {
        console.warn(`⚠️ No historical data found for pool ${poolId}`);
        return {
          current: 0,
          sevenDay: null,
          thirtyDay: null,
          ninetyDay: null,
          allTime: null
        };
      }

      // APY handling depends on platform - Morpho stores decimals, Lido stores percentages
      let currentApy = parseFloat(latestData[0].apy || '0');
      
      // Determine if we need to convert decimals to percentages for current APY
      const isMorpho = platformName?.toLowerCase() === 'morpho';
      if (isMorpho) {
        currentApy = currentApy * 100;
      }
      
      // Calculate date thresholds
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Fetch data for different periods
      const [sevenDayData, thirtyDayData, ninetyDayData, allTimeData] = await Promise.all([
        this.getHistoricalDataSince(poolId, sevenDaysAgo),
        this.getHistoricalDataSince(poolId, thirtyDaysAgo),
        this.getHistoricalDataSince(poolId, ninetyDaysAgo),
        this.getAllHistoricalData(poolId)
      ]);

      console.log(`📈 Historical data counts:`, {
        sevenDay: sevenDayData.length,
        thirtyDay: thirtyDayData.length,
        ninetyDay: ninetyDayData.length,
        allTime: allTimeData.length
      });

      // Determine if we need to convert decimals to percentages (Morpho stores decimals)
      const isMorpho = platformName?.toLowerCase() === 'morpho';
      
      return {
        current: currentApy,
        sevenDay: this.calculateAverage(sevenDayData, isMorpho),
        thirtyDay: this.calculateAverage(thirtyDayData, isMorpho),
        ninetyDay: this.calculateAverage(ninetyDayData, isMorpho),
        allTime: this.calculateAverage(allTimeData, isMorpho)
      };

    } catch (error) {
      console.error('❌ Error calculating historical APY averages:', error);
      return {
        current: 0,
        sevenDay: null,
        thirtyDay: null,
        ninetyDay: null,
        allTime: null
      };
    }
  }

  private async getHistoricalDataSince(poolId: string, sinceDate: Date) {
    return await db
      .select()
      .from(poolHistoricalData)
      .where(
        and(
          eq(poolHistoricalData.poolId, poolId),
          gte(poolHistoricalData.timestamp, sinceDate)
        )
      )
      .orderBy(desc(poolHistoricalData.timestamp));
  }

  private async getAllHistoricalData(poolId: string) {
    return await db
      .select()
      .from(poolHistoricalData)
      .where(eq(poolHistoricalData.poolId, poolId))
      .orderBy(desc(poolHistoricalData.timestamp));
  }

  private calculateAverage(data: any[], isMorpho: boolean = false): number | null {
    if (data.length === 0) return null;
    
    const validApyValues = data
      .map(d => parseFloat(d.apy || '0'))
      .filter(apy => !isNaN(apy) && apy > 0);

    if (validApyValues.length === 0) return null;

    const sum = validApyValues.reduce((acc, apy) => acc + apy, 0);
    let average = sum / validApyValues.length;
    
    // Morpho stores APY as decimals (0.0456 = 4.56%), convert to percentage
    // Lido stores APY as percentages (2.648 = 2.648%), use as-is
    if (isMorpho) {
      average = average * 100;
    }
    
    console.log(`📊 Calculated average from ${validApyValues.length} authentic data points: ${average.toFixed(4)}%`);
    return parseFloat(average.toFixed(4));
  }
}