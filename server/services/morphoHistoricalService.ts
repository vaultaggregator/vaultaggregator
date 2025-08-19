import { db } from '../db';
import { poolHistoricalData, pools, platforms } from '@shared/schema';
import { eq, desc, gte, lte, and } from 'drizzle-orm';

interface MorphoHistoricalDataPoint {
  x: number; // timestamp
  y: number; // value (APY or TVL)
}

interface MorphoVaultHistoricalResponse {
  vaultByAddress: {
    address: string;
    name: string;
    historicalState: {
      apy?: MorphoHistoricalDataPoint[];
      netApy?: MorphoHistoricalDataPoint[];
      totalAssetsUsd?: MorphoHistoricalDataPoint[];
    };
  };
}

export class MorphoHistoricalService {
  private readonly MORPHO_API_URL = 'https://api.morpho.org/graphql';

  async fetchHistoricalData(vaultAddress: string, startTimestamp: number, endTimestamp: number): Promise<MorphoVaultHistoricalResponse | null> {
    try {
      const query = `
        query VaultHistoricalData($address: String!, $options: TimeseriesOptions!) {
          vaultByAddress(address: $address) {
            address
            name
            historicalState {
              apy(options: $options) { x y }
              netApy(options: $options) { x y }
              totalAssetsUsd(options: $options) { x y }
            }
          }
        }
      `;

      const variables = {
        address: vaultAddress,
        options: {
          startTimestamp,
          endTimestamp,
          interval: "DAY"
        }
      };

      console.log(`📊 Fetching authentic historical data for vault ${vaultAddress} from ${new Date(startTimestamp * 1000).toDateString()} to ${new Date(endTimestamp * 1000).toDateString()}`);

      const response = await fetch(this.MORPHO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        console.error(`❌ Morpho API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('❌ Morpho GraphQL errors:', result.errors);
        return null;
      }

      if (!result.data?.vaultByAddress) {
        console.warn(`⚠️ No vault data found for address: ${vaultAddress}`);
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('❌ Error fetching Morpho historical data:', error);
      return null;
    }
  }

  async storeHistoricalData(poolId: string, vaultAddress: string, days?: number): Promise<void> {
    // If days not specified, fetch pool data to get actual operating days
    if (!days) {
      try {
        const { db } = await import('../db');
        const { pools } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [pool] = await db.select().from(pools).where(eq(pools.id, poolId));
        if (pool && pool.operatingDays) {
          days = parseInt(pool.operatingDays.toString()) + 10; // Add buffer for complete history
        } else {
          days = 400; // Fallback only if pool data unavailable
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch pool operating days, using fallback: ${error}`);
        days = 400; // Conservative fallback
      }
    }
    try {
      const endTimestamp = Math.floor(Date.now() / 1000);
      const startTimestamp = endTimestamp - (days * 24 * 60 * 60);

      const historicalData = await this.fetchHistoricalData(vaultAddress, startTimestamp, endTimestamp);
      
      if (!historicalData?.vaultByAddress?.historicalState) {
        console.warn(`⚠️ No historical data available for vault ${vaultAddress}`);
        return;
      }

      const { apy, netApy, totalAssetsUsd } = historicalData.vaultByAddress.historicalState;

      // Use netApy if available, otherwise use regular apy - both are authentic Morpho data
      const apyData = netApy && netApy.length > 0 ? netApy : apy;
      const tvlData = totalAssetsUsd;

      if (!apyData && !tvlData) {
        console.warn(`⚠️ No APY or TVL historical data for vault ${vaultAddress}`);
        return;
      }

      // Combine APY and TVL data by timestamp
      const dataPoints = new Map<number, { apy?: number; tvl?: number }>();

      // Process APY data
      if (apyData) {
        for (const point of apyData) {
          const timestamp = new Date(point.x * 1000);
          dataPoints.set(point.x, { ...dataPoints.get(point.x), apy: point.y });
        }
      }

      // Process TVL data
      if (tvlData) {
        for (const point of tvlData) {
          const timestamp = new Date(point.x * 1000);
          const existing = dataPoints.get(point.x) || {};
          dataPoints.set(point.x, { ...existing, tvl: point.y });
        }
      }

      // Insert data points into database
      const insertPromises = Array.from(dataPoints.entries()).map(async ([timestamp, values]) => {
        try {
          await db.insert(poolHistoricalData).values({
            poolId,
            timestamp: new Date(timestamp * 1000),
            apy: values.apy ? values.apy.toString() : null,
            tvl: values.tvl ? values.tvl.toString() : null,
            dataSource: 'morpho_api',
          }).onConflictDoNothing();
        } catch (error) {
          console.error(`❌ Error inserting historical data point for timestamp ${timestamp}:`, error);
        }
      });

      await Promise.all(insertPromises);
      
      console.log(`✅ Stored ${dataPoints.size} historical data points for pool ${poolId}`);
    } catch (error) {
      console.error(`❌ Error storing historical data for pool ${poolId}:`, error);
    }
  }

  async getHistoricalData(poolId: string, days: number = 7): Promise<Array<{
    timestamp: number;
    date: string;
    apy: number | null;
    tvl: number | null;
    formattedDate: string;
    fullDate: string;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      const historicalRecords = await db
        .select()
        .from(poolHistoricalData)
        .where(
          and(
            eq(poolHistoricalData.poolId, poolId),
            gte(poolHistoricalData.timestamp, startDate),
            lte(poolHistoricalData.timestamp, endDate)
          )
        )
        .orderBy(poolHistoricalData.timestamp);

      return historicalRecords.map(record => {
        const date = new Date(record.timestamp);
        return {
          timestamp: date.getTime(),
          date: date.toISOString().split('T')[0],
          apy: record.apy ? parseFloat(record.apy) : null,
          tvl: record.tvl ? parseFloat(record.tvl) : null,
          formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });
    } catch (error) {
      console.error(`❌ Error retrieving historical data for pool ${poolId}:`, error);
      return [];
    }
  }

  async collectHistoricalDataForAllMorphoPools(): Promise<void> {
    try {
      console.log('📊 Starting historical data collection for all Morpho pools...');

      // Get all Morpho pools
      const morphoPools = await db
        .select()
        .from(pools)
        .innerJoin(platforms, eq(pools.platformId, platforms.id))
        .where(eq(platforms.name, 'Morpho'));

      for (const { pools: pool } of morphoPools) {
        if (pool.poolAddress && pool.poolAddress.startsWith('0x')) {
          console.log(`📊 Collecting historical data for ${pool.tokenPair} (${pool.poolAddress})`);
          await this.storeHistoricalData(pool.id, pool.poolAddress, 90); // Last 90 days
          
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('✅ Historical data collection completed for all Morpho pools');
    } catch (error) {
      console.error('❌ Error collecting historical data for Morpho pools:', error);
    }
  }
}

export const morphoHistoricalService = new MorphoHistoricalService();