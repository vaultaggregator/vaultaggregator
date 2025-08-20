import { EtherscanService } from './etherscanService.js';
import { AlchemyService } from './alchemyService.js';
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
  private alchemy: AlchemyService | null = null;

  constructor() {
    this.etherscan = new EtherscanService();
    try {
      this.alchemy = new AlchemyService();
      console.log('✅ Alchemy service initialized for holder data');
    } catch (error) {
      console.log('⚠️ Alchemy service not available:', error);
    }
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

      // Update pool's holder count with actual synced data
      await storage.updatePool(poolId, {
        holdersCount: processedHolders.length
      });

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
   * Fetch token holders using Alchemy API
   */
  private async fetchTokenHolders(tokenAddress: string): Promise<any[]> {
    try {
      console.log(`🔍 Fetching token holders for ${tokenAddress}`);
      
      // Use Alchemy if available
      if (this.alchemy) {
        try {
          // Special handling for Lido stETH - fetch more holders
          const LIDO_STETH_ADDRESS = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
          const holderLimit = tokenAddress.toLowerCase() === LIDO_STETH_ADDRESS.toLowerCase() ? 500 : 100;
          
          console.log(`📊 Fetching top ${holderLimit} holders for ${tokenAddress}`);
          const holders = await this.alchemy.getTopTokenHolders(tokenAddress, holderLimit);
          console.log(`✅ Fetched ${holders.length} holders from Alchemy`);
          
          // Convert to expected format
          return holders.map(holder => ({
            address: holder.address,
            balance: holder.balance
          }));
        } catch (alchemyError) {
          console.error('❌ Alchemy fetch failed:', alchemyError);
        }
      }
      
      // Fallback to Etherscan token info (no detailed holder data)
      const tokenInfo = await this.etherscan.getTokenInfo(tokenAddress);
      if (!tokenInfo) {
        console.log(`❌ Token info not found for ${tokenAddress}`);
        return [];
      }
      
      console.log(`✅ Token found: ${tokenInfo.tokenName} (${tokenInfo.symbol})`);
      console.log(`⚠️ Detailed holder data not available - Alchemy API error`);
      return [];
      
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
      // Try Alchemy price first
      if (this.alchemy) {
        const price = await this.alchemy.getTokenPrice(tokenAddress);
        if (price > 0) {
          return price;
        }
      }
      
      // Try to get price from stored token info
      const tokenInfo = await storage.getTokenInfoByAddress(tokenAddress);
      if (tokenInfo?.priceUsd) {
        return parseFloat(tokenInfo.priceUsd);
      }

      // Fallback to a default price
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
      // Handle balance properly - it may already be formatted from Alchemy
      let formattedBalance: number;
      let balance: number;
      
      if (holder.formattedBalance !== undefined) {
        // If Alchemy provided formatted balance, use it
        formattedBalance = holder.formattedBalance;
        balance = formattedBalance * Math.pow(10, 18); // Convert back for percentage calc
      } else {
        // Otherwise parse the raw balance
        balance = parseFloat(holder.balance) || 0;
        formattedBalance = balance / Math.pow(10, 18); // Assuming 18 decimals
      }
      
      const usdValue = formattedBalance * tokenPrice;
      const poolSharePercentage = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;

      // Get wallet ETH balance
      let walletBalanceEth = 0;
      let walletBalanceUsd = 0;
      
      try {
        if (this.alchemy) {
          // Use Alchemy for more accurate ETH balance
          walletBalanceEth = await this.alchemy.getEthBalance(holder.address);
          walletBalanceUsd = walletBalanceEth * 3200; // Approximate ETH price
        } else {
          // Fallback to Etherscan
          const accountInfo = await this.etherscan.getAccountInfo(holder.address);
          walletBalanceEth = parseFloat(accountInfo.balance) / Math.pow(10, 18);
          walletBalanceUsd = walletBalanceEth * 3200; // Approximate ETH price
        }
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