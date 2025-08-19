// Using poolHistoricalData table for historical data storage
export interface LidoDataPoint {
  poolId: string;
  timestamp: Date;
  apy: number | null;
  tvl: number | null;
}

export class LidoHistoricalService {
  private readonly lidoBaseUrl = 'https://eth-api.lido.fi/v1';
  private readonly defiLlamaBaseUrl = 'https://yields.llama.fi';
  private readonly stethPoolId = '747c1d2a-c668-4682-b9f9-296708a3dd90'; // Lido stETH pool on DefiLlama

  async fetchComprehensiveHistoricalData(): Promise<any> {
    try {
      console.log('🔍 Fetching comprehensive Lido stETH historical data from DefiLlama...');
      
      // Get comprehensive historical data from DefiLlama
      const response = await fetch(`${this.defiLlamaBaseUrl}/chart/${this.stethPoolId}`);
      
      if (!response.ok) {
        console.error(`❌ DefiLlama API error: ${response.status} ${response.statusText}`);
        // Fallback to recent Lido data if DefiLlama fails
        return this.fetchRecentLidoData();
      }

      const result = await response.json();
      
      if (!result.data || result.data.length === 0) {
        console.warn('⚠️ No historical data found in DefiLlama response, result structure:', result);
        return this.fetchRecentLidoData();
      }

      console.log(`✅ Fetched ${result.data.length} comprehensive historical data points from DefiLlama`);
      return { type: 'defillama', data: result.data };
    } catch (error) {
      console.error('❌ Error fetching comprehensive historical data:', error);
      // Fallback to recent Lido data
      return this.fetchRecentLidoData();
    }
  }

  async fetchRecentLidoData(): Promise<any> {
    try {
      console.log('🔍 Fetching recent Lido historical APR data...');
      
      const response = await fetch(`${this.lidoBaseUrl}/protocol/steth/apr/sma`);
      
      if (!response.ok) {
        console.error(`❌ Lido API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      
      if (!result.data || !result.data.aprs) {
        console.warn('⚠️ No historical APR data found in Lido response');
        return null;
      }

      console.log(`✅ Fetched ${result.data.aprs.length} recent historical APR points from Lido`);
      return { type: 'lido', data: result.data };
    } catch (error) {
      console.error('❌ Error fetching Lido historical data:', error);
      return null;
    }
  }

  async storeHistoricalData(poolId: string): Promise<void> {
    try {
      console.log(`🔄 Starting comprehensive Lido historical data collection for pool ${poolId}`);
      
      const historicalData = await this.fetchComprehensiveHistoricalData();
      
      if (!historicalData) {
        console.warn(`⚠️ No historical data available for Lido stETH`);
        return;
      }

      let dataPointsToInsert: any[] = [];

      if (historicalData.type === 'defillama') {
        // Process DefiLlama comprehensive historical data
        const { data } = historicalData;
        console.log(`📊 Processing ${data.length} comprehensive data points from DefiLlama`);
        
        for (const point of data) {
          const timestamp = new Date(point.timestamp);
          
          const dataPoint = {
            poolId,
            timestamp,
            apy: (point.apy || point.apyBase || 0).toString(), // Use apy or apyBase from DefiLlama
            tvl: point.tvlUsd ? point.tvlUsd.toString() : null, // DefiLlama provides TVL data
            dataSource: 'defillama_api'
          };

          dataPointsToInsert.push(dataPoint);
        }
      } else if (historicalData.type === 'lido') {
        // Process recent Lido SMA data as fallback
        const { data } = historicalData;
        const { aprs } = data;
        
        if (!aprs || aprs.length === 0) {
          console.warn(`⚠️ No APR historical data for Lido stETH`);
          return;
        }

        console.log(`📊 Processing ${aprs.length} recent APR data points from Lido`);

        for (const point of aprs) {
          const timestamp = new Date(point.timeUnix * 1000);
          
          const dataPoint = {
            poolId,
            timestamp,
            apy: point.apr.toString(),
            tvl: null, // Lido SMA API doesn't provide historical TVL
            dataSource: 'lido_api'
          };

          dataPointsToInsert.push(dataPoint);
        }
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
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
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
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
}