import { EtherscanService } from './etherscanService.js';
import { storage } from '../storage.js';
import type { Pool, InsertTokenHolder } from '@shared/schema.js';

export interface HolderData {
  address: string;
  balance: string;
  formattedBalance: number;
  usdValue: number;
  walletBalanceEth: number;
  walletBalanceUsd: number;
  poolSharePercentage: number;
  rank: number;
}

export class HolderService {
  private etherscan: EtherscanService;

  constructor() {
    this.etherscan = new EtherscanService();
  }

  private async logError(title: string, description: string, error: string, poolId?: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    try {
      const { errorLogger } = await import('./errorLogger.js');
      await errorLogger.logError({
        title,
        description,
        errorType: 'Service',
        severity,
        source: 'HolderService',
        stackTrace: error,
        fixPrompt: `Holder synchronization issue detected. Check if the Etherscan API is accessible, verify the ETHERSCAN_API_KEY, and ensure proper token address mapping. This affects holder data display and accuracy.`,
        metadata: {
          error,
          poolId,
        }
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  /**
   * Fetch and sync holder data for a specific pool
   */
  async syncPoolHolders(poolId: string): Promise<void> {
    try {
      console.log(`🔍 Starting holder sync for pool ${poolId}`);
      
      // Get pool information
      const pool = await storage.getPoolById(poolId);
      if (!pool || !pool.poolAddress) {
        console.log(`❌ Pool ${poolId} not found or missing contract address`);
        return;
      }

      console.log(`📊 Syncing holders for ${pool.tokenPair} on ${pool.poolAddress}`);

      // Get token holders from Etherscan
      const holders = await this.fetchTokenHolders(pool.poolAddress);
      if (!holders || holders.length === 0) {
        console.log(`⚠️ No holders found for pool ${poolId}`);
        await this.logError(
          'No Holders Found',
          `No token holders found for pool ${pool.tokenPair} (${pool.poolAddress}). This may indicate an issue with the token contract address or API connectivity.`,
          `No holders found for ${pool.poolAddress}`,
          poolId,
          'medium'
        );
        return;
      }

      // Get token price for USD calculations
      const tokenPrice = await this.getTokenPrice(pool.poolAddress);
      console.log(`💰 Token price: $${tokenPrice}`);

      // Process and store holder data
      const processedHolders = await this.processHolderData(
        holders,
        pool.poolAddress,
        tokenPrice,
        poolId
      );

      // Clear existing holders for this pool
      await storage.clearPoolHolders(poolId);

      // Store new holder data
      for (const holder of processedHolders) {
        await storage.insertTokenHolder(holder);
      }

      console.log(`✅ Successfully synced ${processedHolders.length} holders for pool ${poolId}`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error syncing holders for pool ${poolId}:`, errorMsg);
      
      await this.logError(
        'Holder Sync Failed',
        `Failed to synchronize holder data for pool ${poolId}. This affects the holder analytics display on pool detail pages.`,
        errorMsg,
        poolId,
        'high'
      );
    }
  }

  /**
   * Fetch token holders from Etherscan
   */
  private async fetchTokenHolders(tokenAddress: string): Promise<any[]> {
    try {
      // Use Etherscan API to get token holders (top 100)
      // Note: Etherscan doesn't provide a direct "token holders" endpoint
      // We'll use the token transfers to derive holder information
      const transfers = await this.etherscan.getTokenBalances(tokenAddress);
      
      // Group transfers by holder address to calculate balances
      const holderBalances = new Map<string, number>();
      
      for (const transfer of transfers) {
        const { from, to, value } = transfer;
        const amount = parseFloat(value) || 0;
        
        // Update balances
        if (from && from !== '0x0000000000000000000000000000000000000000') {
          holderBalances.set(from, (holderBalances.get(from) || 0) - amount);
        }
        if (to && to !== '0x0000000000000000000000000000000000000000') {
          holderBalances.set(to, (holderBalances.get(to) || 0) + amount);
        }
      }

      // Convert to array and filter positive balances
      const holders = Array.from(holderBalances.entries())
        .filter(([_, balance]) => balance > 0)
        .map(([address, balance]) => ({
          address,
          balance: balance.toString()
        }))
        .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
        .slice(0, 100); // Top 100 holders

      return holders;
    } catch (error) {
      console.error('Error fetching token holders:', error);
      return [];
    }
  }

  /**
   * Get token price in USD
   */
  private async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      // Try to get price from stored token info
      const tokenInfo = await storage.getTokenInfoByAddress(tokenAddress);
      if (tokenInfo?.priceUsd) {
        return parseFloat(tokenInfo.priceUsd);
      }

      // Fallback to a default price (could integrate with price APIs later)
      return 1.0; // Default $1 for stablecoins
    } catch (error) {
      console.error('Error getting token price:', error);
      return 1.0; // Default fallback
    }
  }

  /**
   * Process holder data and calculate metrics
   */
  private async processHolderData(
    holders: any[],
    tokenAddress: string,
    tokenPrice: number,
    poolId: string
  ): Promise<InsertTokenHolder[]> {
    const processedHolders: InsertTokenHolder[] = [];
    const totalSupply = holders.reduce((sum, holder) => sum + parseFloat(holder.balance), 0);

    for (let i = 0; i < holders.length; i++) {
      const holder = holders[i];
      const balance = parseFloat(holder.balance);
      const formattedBalance = balance / Math.pow(10, 18); // Assuming 18 decimals
      const usdValue = formattedBalance * tokenPrice;
      const poolSharePercentage = (balance / totalSupply) * 100;

      // Get wallet ETH balance
      let walletBalanceEth = 0;
      let walletBalanceUsd = 0;
      
      try {
        const accountInfo = await this.etherscan.getAccountInfo(holder.address);
        walletBalanceEth = parseFloat(accountInfo.balance) / Math.pow(10, 18);
        walletBalanceUsd = walletBalanceEth * 3000; // Approximate ETH price
      } catch (error) {
        console.log(`⚠️ Could not fetch wallet balance for ${holder.address}`);
      }

      processedHolders.push({
        poolId,
        tokenAddress,
        holderAddress: holder.address,
        tokenBalance: holder.balance,
        tokenBalanceFormatted: formattedBalance.toString(),
        usdValue: usdValue.toString(),
        walletBalanceEth: walletBalanceEth.toString(),
        walletBalanceUsd: walletBalanceUsd.toString(),
        poolSharePercentage: poolSharePercentage.toString(),
        rank: i + 1,
      });
    }

    return processedHolders;
  }

  /**
   * Get paginated holders for a pool
   */
  async getPoolHolders(
    poolId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ holders: any[], total: number, pages: number }> {
    try {
      const result = await storage.getPoolHolders(poolId, page, limit);
      return result;
    } catch (error) {
      console.error(`Error getting holders for pool ${poolId}:`, error);
      return { holders: [], total: 0, pages: 0 };
    }
  }

  /**
   * Sync holders for all active pools (called by admin service)
   */
  async syncAllPoolHolders(): Promise<void> {
    try {
      console.log('🔄 Starting holder sync for all active pools');
      
      const pools = await storage.getActivePools();
      console.log(`📊 Found ${pools.length} active pools to sync`);

      let successCount = 0;
      let errorCount = 0;

      for (const pool of pools) {
        try {
          await this.syncPoolHolders(pool.id);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to sync holders for pool ${pool.id}:`, error);
          errorCount++;
        }
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`✅ Holder sync completed: ${successCount} successful, ${errorCount} failed`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error in syncAllPoolHolders:', errorMsg);
      
      await this.logError(
        'Bulk Holder Sync Failed',
        'Failed to synchronize holder data for all pools. This affects holder analytics across the platform.',
        errorMsg,
        undefined,
        'critical'
      );
    }
  }
}

export const holderService = new HolderService();