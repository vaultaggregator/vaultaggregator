// Using poolHistoricalData table for historical data storage
export interface LidoDataPoint {
  poolId: string;
  timestamp: Date;
  apy: number | null;
  tvl: number | null;
}

export class LidoHistoricalService {
  private readonly baseUrl = 'https://eth-api.lido.fi/v1';

  async fetchHistoricalData(): Promise<any> {
    try {
      console.log('🔍 Fetching Lido historical APR data...');
      
      const response = await fetch(`${this.baseUrl}/protocol/steth/apr/sma`);
      
      if (!response.ok) {
        console.error(`❌ Lido API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      
      if (!result.data || !result.data.aprs) {
        console.warn('⚠️ No historical APR data found in Lido response');
        return null;
      }

      console.log(`✅ Fetched ${result.data.aprs.length} historical APR points from Lido`);
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching Lido historical data:', error);
      return null;
    }
  }

  async storeHistoricalData(poolId: string): Promise<void> {
    try {
      console.log(`🔄 Starting Lido historical data collection for pool ${poolId}`);
      
      const historicalData = await this.fetchHistoricalData();
      
      if (!historicalData?.aprs) {
        console.warn(`⚠️ No historical data available for Lido stETH`);
        return;
      }

      const { aprs } = historicalData;

      if (!aprs || aprs.length === 0) {
        console.warn(`⚠️ No APR historical data for Lido stETH`);
        return;
      }

      console.log(`📊 Processing ${aprs.length} APR data points from Lido`);

      // Convert Lido APR data to our format
      const dataPointsToInsert: any[] = [];

      for (const point of aprs) {
        const timestamp = new Date(point.timeUnix * 1000);
        
        const dataPoint = {
          poolId,
          timestamp,
          apy: point.apr.toString(), // Convert to string for decimal type
          tvl: null, // Lido SMA API doesn't provide historical TVL
          dataSource: 'lido_api'
          // Don't include createdAt - let the database handle it
        };

        dataPointsToInsert.push(dataPoint);
      }

      if (dataPointsToInsert.length > 0) {
        // Import database modules dynamically
        const { db } = await import('../db');
        const { poolHistoricalData } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');

        // Clear existing Lido data for this pool first
        await db.delete(poolHistoricalData)
          .where(eq(poolHistoricalData.poolId, poolId));
        
        console.log(`🧹 Cleared existing historical data for pool ${poolId}`);

        // Insert all historical data points  
        await db.insert(poolHistoricalData).values(dataPointsToInsert);
        
        console.log(`✅ Stored ${dataPointsToInsert.length} Lido historical data points for pool ${poolId}`);
      }

    } catch (error) {
      console.error('❌ Error storing Lido historical data:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  async getHistoricalData(poolId: string, days: number): Promise<LidoDataPoint[]> {
    try {
      console.log(`📊 Retrieving Lido historical data for pool ${poolId}, last ${days} days`);
      
      const { db } = await import('../db');
      const { poolHistoricalData } = await import('@shared/schema');
      const { eq, gte, desc, and } = await import('drizzle-orm');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await db
        .select()
        .from(poolHistoricalData)
        .where(
          and(
            eq(poolHistoricalData.poolId, poolId),
            gte(poolHistoricalData.timestamp, startDate)
          )
        )
        .orderBy(desc(poolHistoricalData.timestamp));

      console.log(`📈 Found ${results.length} historical data points for Lido pool`);

      const mappedResults = results.map(row => ({
        poolId: row.poolId,
        timestamp: new Date(row.timestamp),
        apy: row.apy ? parseFloat(row.apy.toString()) : null,
        tvl: row.tvl ? parseFloat(row.tvl.toString()) : null
      }));

      return mappedResults;

    } catch (error) {
      console.error('❌ Error fetching Lido historical data from database:', error);
      console.error('❌ Error details:', error.message);
      return [];
    }
  }
}