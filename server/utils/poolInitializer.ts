import { db } from "../db";
import { pools, poolMetricsCurrent } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Initialize a newly added pool with proper configuration
 * This ensures all new pools are correctly set up for syncing
 */
export class PoolInitializer {
  /**
   * Initialize a pool after it's been added to the database
   */
  static async initializePool(poolId: string): Promise<void> {
    console.log(`🔧 Initializing pool ${poolId}...`);
    
    const [pool] = await db.select().from(pools).where(eq(pools.id, poolId));
    if (!pool) {
      console.error(`❌ Pool ${poolId} not found`);
      return;
    }
    
    // Step 1: Ensure platform_pool_id is set
    if (!pool.platformPoolId && pool.poolAddress) {
      console.log(`   Setting platform_pool_id to match pool address...`);
      await db.update(pools)
        .set({ platformPoolId: pool.poolAddress })
        .where(eq(pools.id, poolId));
    }
    
    // Step 2: Fetch contract creation date if not set
    if (!pool.contractCreatedAt && pool.poolAddress) {
      console.log(`   Fetching contract creation date...`);
      await this.fetchAndStoreContractCreationDate(pool);
    }
    
    // Step 3: Try to fetch vault name from Morpho if needed
    if (pool.tokenPair?.startsWith('Token 0x') && pool.poolAddress) {
      console.log(`   Attempting to fetch proper vault name from Morpho...`);
      await this.fetchAndStoreVaultName(pool);
    }
    
    // Step 4: Ensure pool metrics entry exists
    const [metrics] = await db.select()
      .from(poolMetricsCurrent)
      .where(eq(poolMetricsCurrent.poolId, poolId));
    
    if (!metrics) {
      console.log(`   Creating pool metrics entry...`);
      await db.insert(poolMetricsCurrent).values({
        poolId: poolId,
        apy: 0,
        operatingDays: 0,
        tvl: 0,
        holders: 0,
        apyStatus: 'pending',
        daysStatus: 'pending',
        tvlStatus: 'pending',
        holdersStatus: 'pending'
      });
    }
    
    console.log(`✅ Pool ${poolId} initialization complete`);
  }
  
  /**
   * Fetch and store contract creation date from Basescan/Etherscan
   */
  private static async fetchAndStoreContractCreationDate(pool: any): Promise<void> {
    try {
      const etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
      
      // Determine chain ID
      const [chainInfo] = await db.raw(`
        SELECT chains.* FROM chains 
        WHERE chains.id = $1
      `, [pool.chainId]);
      
      const chainIdMap: Record<string, number> = {
        'ethereum': 1,
        'base': 8453,
        'optimism': 10,
        'arbitrum': 42161,
        'polygon': 137,
        'avalanche': 43114,
        'bsc': 56,
        'fantom': 250,
        'gnosis': 100,
      };
      
      const chainName = chainInfo?.name?.toLowerCase() || 'ethereum';
      const chainId = chainIdMap[chainName] || 1;
      
      // Use Etherscan V2 API for all chains
      const apiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${pool.poolAddress}&apikey=${etherscanApiKey}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === "1" && data.result && data.result.length > 0) {
        const txHash = data.result[0].txHash;
        
        // Get transaction details
        const txUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();
        
        if (txData.result && txData.result.blockNumber) {
          // Get block details for timestamp
          const blockNumber = parseInt(txData.result.blockNumber, 16);
          const blockUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=block&action=getblockreward&blockno=${blockNumber}&apikey=${etherscanApiKey}`;
          
          const blockResponse = await fetch(blockUrl);
          const blockData = await blockResponse.json();
          
          if (blockData.result && blockData.result.timeStamp) {
            const creationDate = new Date(parseInt(blockData.result.timeStamp) * 1000);
            const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log(`      Contract created: ${creationDate.toISOString().split('T')[0]} (${daysSinceCreation} days ago)`);
            
            // Update pool with creation date
            await db.update(pools)
              .set({ 
                contractCreatedAt: creationDate,
                rawData: db.raw(`COALESCE(raw_data, '{}'::jsonb) || $1::jsonb`, [
                  JSON.stringify({ count: daysSinceCreation })
                ])
              })
              .where(eq(pools.id, pool.id));
            
            // Update metrics
            await db.update(poolMetricsCurrent)
              .set({
                operatingDays: daysSinceCreation,
                daysStatus: 'success'
              })
              .where(eq(poolMetricsCurrent.poolId, pool.id));
          }
        }
      }
    } catch (error) {
      console.error(`      ❌ Failed to fetch contract creation date:`, error);
    }
  }
  
  /**
   * Try to fetch vault name from Morpho API
   */
  private static async fetchAndStoreVaultName(pool: any): Promise<void> {
    try {
      // Try both lowercase and checksummed addresses
      const addresses = [
        pool.poolAddress.toLowerCase(),
        pool.poolAddress
      ];
      
      for (const address of addresses) {
        const response = await fetch(`https://api.morpho.org/vaults/${address}`);
        const data = await response.json();
        
        if (data && data.name && data.name !== 'null') {
          console.log(`      Found vault name: ${data.name}`);
          
          await db.update(pools)
            .set({ 
              tokenPair: data.name,
              rawData: db.raw(`COALESCE(raw_data, '{}'::jsonb) || $1::jsonb`, [
                JSON.stringify(data)
              ])
            })
            .where(eq(pools.id, pool.id));
          
          return;
        }
      }
      
      // If Morpho doesn't have it, try to infer from chain
      const [chainInfo] = await db.raw(`
        SELECT chains.name FROM chains 
        WHERE chains.id = $1
      `, [pool.chainId]);
      
      if (chainInfo?.name) {
        // Default to a descriptive name based on chain
        const defaultName = `${chainInfo.name} Vault`;
        console.log(`      Using default name: ${defaultName}`);
        
        await db.update(pools)
          .set({ tokenPair: defaultName })
          .where(eq(pools.id, pool.id));
      }
    } catch (error) {
      console.error(`      ❌ Failed to fetch vault name:`, error);
    }
  }
  
  /**
   * Check and initialize all pools that need initialization
   */
  static async initializeAllPools(): Promise<void> {
    console.log("🔍 Checking for pools that need initialization...");
    
    // Find pools that might need initialization
    const poolsToCheck = await db.raw(`
      SELECT p.* FROM pools p
      LEFT JOIN pool_metrics_current pm ON p.id = pm.pool_id
      WHERE p.contract_created_at IS NULL 
         OR p.platform_pool_id IS NULL
         OR p.token_pair LIKE 'Token 0x%'
         OR pm.pool_id IS NULL
    `);
    
    if (poolsToCheck.length > 0) {
      console.log(`📋 Found ${poolsToCheck.length} pools that need initialization`);
      
      for (const pool of poolsToCheck) {
        await this.initializePool(pool.id);
      }
    } else {
      console.log("✅ All pools are properly initialized");
    }
  }
}

export default PoolInitializer;