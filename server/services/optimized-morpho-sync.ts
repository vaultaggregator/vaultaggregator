/**
 * Optimized Morpho Sync Service
 * Reduces API calls by:
 * 1. Batching all Morpho pools in a single GraphQL query
 * 2. Only updating changed values  
 * 3. Running less frequently (15 minutes instead of 5)
 * 4. Caching vault metadata that rarely changes
 */

import { db } from "../db";
import { pools, poolMetricsCurrent, networks } from "../../shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

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
   * Fetch all Morpho vaults from both Ethereum and Base networks
   * This fetches vaults from both chains in parallel
   */
  private async fetchAllMorphoVaults(): Promise<Map<string, MorphoVaultData>> {
    const query = `
      query GetVaultsForChain($chainId: [Int!]!) {
        vaults(
          where: { chainId_in: $chainId }
          first: 1000
        ) {
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
      console.log('🔵 Fetching Morpho vaults from both Ethereum and Base...');
      
      // Fetch from both chains in parallel
      const [ethereumResponse, baseResponse] = await Promise.all([
        // Ethereum (chainId: 1)
        fetch(OptimizedMorphoSync.MORPHO_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ 
            query,
            variables: { chainId: [1] }
          }),
        }),
        // Base (chainId: 8453)
        fetch(OptimizedMorphoSync.MORPHO_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ 
            query,
            variables: { chainId: [8453] }
          }),
        })
      ]);

      const vaultMap = new Map<string, MorphoVaultData>();
      
      // Process Ethereum vaults
      if (ethereumResponse.ok) {
        const ethData = await ethereumResponse.json();
        if (ethData.data?.vaults?.items) {
          for (const vault of ethData.data.vaults.items) {
            // Include chain identifier in the key for uniqueness
            const key = `${vault.address.toLowerCase()}_1`;
            vaultMap.set(key, vault);
          }
          console.log(`✅ Fetched ${ethData.data.vaults.items.length} Ethereum vaults`);
        }
      }
      
      // Process Base vaults
      if (baseResponse.ok) {
        const baseData = await baseResponse.json();
        if (baseData.data?.vaults?.items) {
          for (const vault of baseData.data.vaults.items) {
            // Include chain identifier in the key for uniqueness
            const key = `${vault.address.toLowerCase()}_8453`;
            vaultMap.set(key, vault);
          }
          console.log(`✅ Fetched ${baseData.data.vaults.items.length} Base vaults`);
        }
      }
      
      console.log(`✅ Total: ${vaultMap.size} Morpho vaults fetched in 2 parallel API calls`);
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
      // 1. Get all Morpho pools from database with chain information
      const morphoPools = await db
        .select({
          pool: pools,
          chainName: networks.name
        })
        .from(pools)
        .leftJoin(networks, eq(pools.chainId, networks.id))
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

      // 2. Fetch all vault data from both chains
      const vaultData = await this.fetchAllMorphoVaults();
      
      if (vaultData.size === 0) {
        console.log('⚠️ No vault data retrieved');
        return;
      }

      // 3. Update only pools with changed data
      let updatedCount = 0;
      let unchangedCount = 0;
      
      for (const { pool, chainName } of morphoPools) {
        if (!pool.poolAddress) continue;
        
        // Determine chain ID based on network name
        const chainIdMap: Record<string, number> = {
          'ethereum': 1,
          'Ethereum': 1,
          'base': 8453,
          'Base': 8453
        };
        
        const chainId = chainIdMap[chainName] || 1;
        const vaultKey = `${pool.poolAddress.toLowerCase()}_${chainId}`;
        const vault = vaultData.get(vaultKey);
        
        if (!vault) {
          console.log(`⚠️ No data for pool ${pool.tokenPair} (${pool.poolAddress}) on chain ${chainId}`);
          continue;
        }

        // Calculate new values (convert APY from decimal to percentage)
        const rawApy = vault.state.netApy || vault.state.apy || 0;
        const newApy = rawApy * 100; // Convert from decimal (0.0829) to percentage (8.29)
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
            })
            .where(eq(pools.id, pool.id));
          
          // Update metrics (APY is already converted to percentage)
          await db.update(poolMetricsCurrent)
            .set({
              apy: newApy.toString(),
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