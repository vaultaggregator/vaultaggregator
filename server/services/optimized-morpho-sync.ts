/**
 * Optimized Morpho Sync Service
 * Reduces API calls by:
 * 1. Batching all Morpho pools in a single GraphQL query
 * 2. Only updating changed values  
 * 3. Running less frequently (15 minutes instead of 5)
 * 4. Caching vault metadata that rarely changes
 */

import { db } from "../db";
import { pools, poolMetricsCurrent } from "../../shared/schema";
import { eq, and, isNull } from "drizzle-orm";

interface MorphoVaultData {
  id: string;
  address: string;
  name: string;
  symbol: string;
  state: {
    apy: number;
    totalAssetsUsd: string;
    netApy: number;
  };
}

export class OptimizedMorphoSync {
  private static readonly MORPHO_API_ENDPOINT = 'https://blue-api.morpho.org/graphql';
  private lastFetchedData = new Map<string, { apy: number; tvl: number }>();
  
  /**
   * Fetch all Morpho vaults in a single optimized query
   * This reduces API calls from N pools to 1 call
   */
  private async fetchAllMorphoVaults(): Promise<Map<string, MorphoVaultData>> {
    const query = `
      query GetAllVaults {
        vaults(first: 500) {
          items {
            id
            address
            name
            symbol
            state {
              apy
              netApy
              totalAssetsUsd
            }
          }
        }
      }
    `;

    try {
      console.log('🔵 Fetching all Morpho vaults in single batch...');
      
      const response = await fetch(OptimizedMorphoSync.MORPHO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Morpho API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const vaultMap = new Map<string, MorphoVaultData>();
      
      if (data.data?.vaults?.items) {
        for (const vault of data.data.vaults.items) {
          // Map by address (lowercase for case-insensitive matching)
          vaultMap.set(vault.address.toLowerCase(), vault);
        }
        console.log(`✅ Fetched ${vaultMap.size} Morpho vaults in 1 API call`);
      }
      
      return vaultMap;
    } catch (error) {
      console.error('❌ Failed to fetch Morpho vaults:', error);
      return new Map();
    }
  }

  /**
   * Sync all Morpho pools with optimized batching
   */
  async syncMorphoPools(): Promise<void> {
    console.log('🚀 Starting optimized Morpho sync...');
    
    try {
      // 1. Get all Morpho pools from database
      const morphoPools = await db
        .select()
        .from(pools)
        .where(
          and(
            eq(pools.platformId, (
              await db.query.protocols.findFirst({
                where: (protocols, { eq }) => eq(protocols.name, 'Morpho')
              })
            )?.id || ''),
            eq(pools.isActive, true),
            isNull(pools.deletedAt)
          )
        );

      if (morphoPools.length === 0) {
        console.log('📊 No Morpho pools to sync');
        return;
      }

      console.log(`📊 Found ${morphoPools.length} Morpho pools to sync`);

      // 2. Fetch all vault data in single API call
      const vaultData = await this.fetchAllMorphoVaults();
      
      if (vaultData.size === 0) {
        console.log('⚠️ No vault data retrieved');
        return;
      }

      // 3. Update only pools with changed data
      let updatedCount = 0;
      let unchangedCount = 0;
      
      for (const pool of morphoPools) {
        if (!pool.poolAddress) continue;
        
        const vault = vaultData.get(pool.poolAddress.toLowerCase());
        
        if (!vault) {
          console.log(`⚠️ No data for pool ${pool.tokenPair} (${pool.poolAddress})`);
          continue;
        }

        // Calculate new values
        const newApy = vault.state.netApy || vault.state.apy || 0;
        const newTvl = parseFloat(vault.state.totalAssetsUsd || '0');
        
        // Check if values actually changed (with small epsilon for floating point)
        const lastData = this.lastFetchedData.get(pool.id);
        const apyChanged = !lastData || Math.abs(lastData.apy - newApy) > 0.001;
        const tvlChanged = !lastData || Math.abs(lastData.tvl - newTvl) > 1000; // $1000 threshold
        
        if (apyChanged || tvlChanged) {
          // Update pool data
          await db.update(pools)
            .set({ 
              apy: newApy.toFixed(2),
              tvl: newTvl.toString(),
              updatedAt: new Date()
            })
            .where(eq(pools.id, pool.id));
          
          // Update metrics
          await db.update(poolMetricsCurrent)
            .set({
              apy: newApy,
              tvl: newTvl,
              updatedAt: new Date()
            })
            .where(eq(poolMetricsCurrent.poolId, pool.id));
          
          // Cache the new values
          this.lastFetchedData.set(pool.id, { apy: newApy, tvl: newTvl });
          
          console.log(`✅ Updated ${pool.tokenPair}: APY ${newApy.toFixed(2)}% (${apyChanged ? 'changed' : 'same'}), TVL $${(newTvl/1000000).toFixed(2)}M (${tvlChanged ? 'changed' : 'same'})`);
          updatedCount++;
        } else {
          // No changes, skip update to save database writes
          unchangedCount++;
        }
      }
      
      console.log(`✅ Morpho sync complete: ${updatedCount} updated, ${unchangedCount} unchanged (1 API call total)`);
      
    } catch (error) {
      console.error('❌ Optimized Morpho sync failed:', error);
    }
  }

  /**
   * Fetch historical data for a specific vault (only when needed)
   * This is called on-demand, not during regular sync
   */
  async fetchVaultHistory(vaultAddress: string, days: number = 30): Promise<any[]> {
    const query = `
      query GetVaultHistory($address: String!, $days: Int!) {
        vault(address: $address) {
          historicalState(numberOfDays: $days) {
            timestamp
            apy
            netApy
            totalAssetsUsd
          }
        }
      }
    `;

    try {
      const response = await fetch(OptimizedMorphoSync.MORPHO_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { address: vaultAddress, days }
        }),
      });

      const data = await response.json();
      return data.data?.vault?.historicalState || [];
    } catch (error) {
      console.error(`Failed to fetch history for ${vaultAddress}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const optimizedMorphoSync = new OptimizedMorphoSync();