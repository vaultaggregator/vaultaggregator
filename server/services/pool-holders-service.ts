import { storage } from "../storage";
import type { Pool, InsertPoolHolder } from "@shared/schema";
// Simple logging helpers (no external dependency)
const logMessage = (msg: string) => console.log(msg);
const logSuccess = (msg: string) => console.log(msg);
const logError = (msg: string, error?: any) => console.error(msg, error);

/**
 * Pool Holders Service - Fetches individual pool holder addresses from Moralis and balances from Alchemy
 * Supports both Ethereum and Base networks, maximum 15 holders per pool
 */
export class PoolHoldersService {
  private static readonly MAX_HOLDERS_PER_POOL = 15;
  private static readonly MORALIS_BASE_URL = "https://deep-index.moralis.io/api/v2.2";
  private static readonly ALCHEMY_BASE_URL = {
    ethereum: "https://eth-mainnet.g.alchemy.com/v2",
    base: "https://base-mainnet.g.alchemy.com/v2",
  };

  /**
   * Sync pool holders for all active pools
   */
  static async syncAllPoolHolders(): Promise<{ success: number; failed: number }> {
    logMessage("🔍 Starting Pool Holders sync...");
    
    const pools = await storage.getActivePools();
    logMessage(`📊 Found ${pools.length} total pools to process`);
    
    let success = 0;
    let failed = 0;

    for (const pool of pools) {
      try {
        logMessage(`🔄 Processing pool: ${pool.tokenPair} (${pool.id})`);
        await this.syncPoolHolders(pool.id);
        success++;
        logSuccess(`✅ Updated holders for pool: ${pool.tokenPair}`);
      } catch (error) {
        failed++;
        logError(`❌ Failed to update holders for pool ${pool.tokenPair}:`, error);
        logError(`❌ Full error details:`, error);
      }
    }

    logMessage(`🏁 Pool Holders sync completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Sync holders for a specific pool
   */
  static async syncPoolHolders(poolId: string): Promise<void> {
    logMessage(`🔍 Starting sync for pool ID: ${poolId}`);
    
    const pool = await storage.getPoolById(poolId);
    if (!pool?.poolAddress) {
      logError(`❌ Pool not found or missing address: ${poolId}`);
      throw new Error(`Pool not found or missing address: ${poolId}`);
    }

    logMessage(`📋 Pool details: ${pool.tokenPair}, address: ${pool.poolAddress}, chain: ${pool.chain.name}`);

    // Determine network based on chain
    const network = this.getNetworkFromChain(pool.chain.name);
    if (!network) {
      logError(`❌ Unsupported network: ${pool.chain.name}`);
      throw new Error(`Unsupported network: ${pool.chain.name}`);
    }

    logMessage(`🌐 Network determined: ${network}`);

    // Step 1: Get holder addresses from Moralis
    logMessage(`🔍 Step 1: Getting holder addresses from Moralis...`);
    const holderAddresses = await this.getHolderAddresses(pool.poolAddress, network);
    logMessage(`📊 Found ${holderAddresses.length} holder addresses`);
    
    if (holderAddresses.length === 0) {
      logMessage(`⚠️ No holders found for pool ${pool.tokenPair}, skipping further processing`);
      return;
    }
    
    // Step 2: Get balances from Alchemy
    logMessage(`🔍 Step 2: Getting balances from Alchemy...`);
    const holdersWithBalances = await this.getHolderBalances(
      holderAddresses,
      pool.poolAddress,
      network
    );
    logMessage(`📊 Got balances for ${holdersWithBalances.length} holders`);

    // Step 3: Calculate USD values and percentages
    logMessage(`🔍 Step 3: Calculating metrics...`);
    const holdersWithMetrics = await this.calculateHolderMetrics(holdersWithBalances, pool);
    logMessage(`📊 Calculated metrics for ${holdersWithMetrics.length} holders`);

    // Step 4: Clear old data and store new holders
    logMessage(`🔍 Step 4: Clearing old data and storing new holders...`);
    await storage.clearPoolHolders(poolId);
    
    for (const holder of holdersWithMetrics) {
      try {
        await storage.upsertPoolHolder({
          poolId,
          address: holder.address,
          balance: holder.balance,
          balanceUsd: holder.balanceUsd,
          percentage: holder.percentage,
          rank: holder.rank,
          txCount: holder.txCount,
          firstSeen: holder.firstSeen,
        });
      } catch (storageError) {
        logError(`❌ Failed to store holder ${holder.address}:`, storageError);
      }
    }

    logMessage(`💾 Successfully stored ${holdersWithMetrics.length} holders for pool ${pool.tokenPair}`);
  }

  /**
   * Get holder addresses from Moralis API
   */
  private static async getHolderAddresses(tokenAddress: string, network: string): Promise<string[]> {
    const moralisApiKey = process.env.MORALIS_API_KEY;
    if (!moralisApiKey) {
      logError("❌ MORALIS_API_KEY not found in environment variables");
      return [];
    }

    try {
      const chainName = network === "ethereum" ? "eth" : "base";
      const url = `${this.MORALIS_BASE_URL}/erc20/${tokenAddress}/owners`;
      
      const response = await fetch(`${url}?chain=${chainName}&limit=${this.MAX_HOLDERS_PER_POOL}`, {
        headers: {
          "X-API-Key": moralisApiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.result?.map((holder: any) => holder.owner_address) || [];
    } catch (error) {
      logError("❌ Error fetching holder addresses from Moralis:", error);
      return [];
    }
  }

  /**
   * Get holder balances from Alchemy API
   */
  private static async getHolderBalances(
    addresses: string[],
    tokenAddress: string,
    network: string
  ): Promise<Array<{ address: string; balance: string; txCount?: number; firstSeen?: Date }>> {
    const alchemyApiKey = process.env.ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      logError("❌ ALCHEMY_API_KEY not found in environment variables");
      return addresses.map(addr => ({ address: addr, balance: "0" }));
    }

    try {
      const baseUrl = this.ALCHEMY_BASE_URL[network as keyof typeof this.ALCHEMY_BASE_URL];
      if (!baseUrl) {
        throw new Error(`Unsupported network for Alchemy: ${network}`);
      }

      const holders: Array<{ address: string; balance: string; txCount?: number; firstSeen?: Date }> = [];
      
      // Get balances for each address
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        
        try {
          // Get ERC-20 token balance
          const balanceResponse = await fetch(`${baseUrl}/${alchemyApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: i + 1,
              method: "alchemy_getTokenBalances",
              params: [address, [tokenAddress]],
            }),
          });

          const balanceData = await balanceResponse.json();
          const balance = balanceData.result?.tokenBalances?.[0]?.tokenBalance || "0x0";

          holders.push({
            address,
            balance: BigInt(balance).toString(),
            txCount: undefined, // We could get this from additional API calls if needed
            firstSeen: undefined,
          });
        } catch (error) {
          logError(`❌ Error fetching balance for address ${address}:`, error);
          holders.push({ address, balance: "0" });
        }
      }

      return holders;
    } catch (error) {
      logError("❌ Error fetching holder balances from Alchemy:", error);
      return addresses.map(addr => ({ address: addr, balance: "0" }));
    }
  }

  /**
   * Calculate holder metrics (USD values, percentages, rankings)
   */
  private static async calculateHolderMetrics(
    holders: Array<{ address: string; balance: string; txCount?: number; firstSeen?: Date }>,
    pool: any
  ): Promise<Array<{
    address: string;
    balance: string;
    balanceUsd: string | null;
    percentage: string | null;
    rank: number;
    txCount: number | null;
    firstSeen: Date | null;
  }>> {
    // Sort by balance (descending)
    const sortedHolders = holders.sort((a, b) => {
      const balanceA = BigInt(a.balance);
      const balanceB = BigInt(b.balance);
      return balanceA > balanceB ? -1 : balanceA < balanceB ? 1 : 0;
    });

    // Calculate total supply for percentage calculations
    const totalSupply = sortedHolders.reduce((sum, holder) => {
      return sum + BigInt(holder.balance);
    }, BigInt(0));

    // Get token price for USD calculations (simplified)
    let tokenPriceUsd = 0;
    try {
      // For now, we'll use a simple mapping or could integrate with a price API
      // This is a placeholder - in production, you'd want to fetch real prices
      if (pool.tokenPair.toLowerCase().includes('usdc')) {
        tokenPriceUsd = 1; // USDC is ~$1
      } else if (pool.tokenPair.toLowerCase().includes('eth')) {
        tokenPriceUsd = 2500; // ETH placeholder price
      }
    } catch (error) {
      logError("❌ Error fetching token price:", error);
    }

    return sortedHolders.map((holder, index) => {
      const balance = BigInt(holder.balance);
      const rank = index + 1;
      
      // Calculate percentage of total supply
      const percentage = totalSupply > 0 
        ? (Number(balance * BigInt(10000)) / Number(totalSupply)) / 100
        : 0;

      // Calculate USD value
      const decimals = 18; // Most tokens use 18 decimals, could be improved
      const tokenAmount = Number(balance) / Math.pow(10, decimals);
      const balanceUsd = tokenPriceUsd > 0 ? tokenAmount * tokenPriceUsd : 0;

      return {
        address: holder.address,
        balance: holder.balance,
        balanceUsd: balanceUsd > 0 ? balanceUsd.toFixed(2) : null,
        percentage: percentage > 0 ? percentage.toFixed(2) : null,
        rank,
        txCount: holder.txCount || null,
        firstSeen: holder.firstSeen || null,
      };
    });
  }

  /**
   * Determine network name from chain info
   */
  private static getNetworkFromChain(chainName: string): string | null {
    const normalizedChain = chainName.toLowerCase().trim();
    
    logMessage(`🔍 Chain name mapping: "${chainName}" -> normalized: "${normalizedChain}"`);
    
    if (normalizedChain.includes('ethereum') || normalizedChain.includes('mainnet') || normalizedChain === 'eth') {
      logMessage(`✅ Mapped to: ethereum`);
      return 'ethereum';
    } else if (normalizedChain.includes('base') || normalizedChain === 'base') {
      logMessage(`✅ Mapped to: base`);
      return 'base';
    }
    
    logMessage(`❌ Unknown chain: "${chainName}" -> returning null`);
    return null;
  }

  /**
   * Get holders for a specific pool (public method for API endpoints)
   */
  static async getPoolHolders(poolId: string, limit: number = 15): Promise<any[]> {
    try {
      const holders = await storage.getPoolHolders(poolId, limit);
      return holders.map(holder => ({
        id: holder.id,
        address: holder.address,
        balance: holder.balance,
        balanceUSD: holder.balanceUsd,
        percentage: holder.percentage,
        rank: holder.rank,
        txCount: holder.txCount,
        firstSeen: holder.firstSeen,
      }));
    } catch (error) {
      logError("❌ Error fetching pool holders:", error);
      return [];
    }
  }
}