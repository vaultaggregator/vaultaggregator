/**
 * Alchemy API Service for Token Analytics
 * Provides token holder data and on-chain analytics
 */

import { Alchemy, Network, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';

export interface TokenHolder {
  address: string;
  balance: string;
  formattedBalance: number;
}

export class AlchemyService {
  private alchemy: Alchemy;
  
  constructor() {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY is required for holder data');
    }
    
    this.alchemy = new Alchemy({
      apiKey,
      network: Network.ETH_MAINNET,
    });
  }

  /**
   * Get top token holders for a specific token contract
   */
  async getTopTokenHolders(tokenAddress: string, limit: number = 100): Promise<TokenHolder[]> {
    try {
      console.log(`🔍 Fetching token holders from Alchemy for ${tokenAddress}`);
      
      // Get token metadata first
      const metadata = await this.alchemy.core.getTokenMetadata(tokenAddress);
      console.log(`📊 Token: ${metadata.name} (${metadata.symbol}), Decimals: ${metadata.decimals}`);
      
      // Get owners of the token (for ERC-20 tokens)
      // Note: This requires the Enhanced API tier for some tokens
      const holders: TokenHolder[] = [];
      
      // Alternative approach: Get transfer events and derive holders
      const latestBlock = await this.alchemy.core.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // Look back ~1.5 days
      
      // Get recent transfer events
      const transfers = await this.alchemy.core.getAssetTransfers({
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        contractAddresses: [tokenAddress],
        category: [AssetTransfersCategory.ERC20],
        maxCount: 1000,
        excludeZeroValue: true,
        order: SortingOrder.DESCENDING,
      });
      
      // Aggregate balances from transfers
      const balanceMap = new Map<string, number>();
      
      for (const transfer of transfers.transfers) {
        if (transfer.to && transfer.value) {
          const current = balanceMap.get(transfer.to) || 0;
          balanceMap.set(transfer.to, current + (transfer.value || 0));
        }
        if (transfer.from && transfer.value) {
          const current = balanceMap.get(transfer.from) || 0;
          balanceMap.set(transfer.from, Math.max(0, current - (transfer.value || 0)));
        }
      }
      
      // Get current balances for top addresses
      const topAddresses = Array.from(balanceMap.keys()).slice(0, limit);
      
      if (topAddresses.length > 0) {
        // Batch get token balances
        const balances = await this.alchemy.core.getTokenBalances(
          topAddresses[0], // Use first address as owner
          [tokenAddress]
        );
        
        // For each top address, get their actual balance
        for (const address of topAddresses) {
          try {
            const balance = await this.alchemy.core.getTokenBalances(address, [tokenAddress]);
            if (balance.tokenBalances.length > 0 && balance.tokenBalances[0].tokenBalance) {
              const rawBalance = balance.tokenBalances[0].tokenBalance;
              const decimals = metadata.decimals || 18;
              const formattedBalance = parseInt(rawBalance, 16) / Math.pow(10, decimals);
              
              if (formattedBalance > 0) {
                holders.push({
                  address,
                  balance: rawBalance,
                  formattedBalance,
                });
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not fetch balance for ${address}`);
          }
        }
      }
      
      // Sort by balance
      holders.sort((a, b) => b.formattedBalance - a.formattedBalance);
      
      console.log(`✅ Found ${holders.length} token holders`);
      return holders.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Error fetching token holders from Alchemy:', error);
      throw error;
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getEthBalance(address: string): Promise<number> {
    try {
      const balance = await this.alchemy.core.getBalance(address);
      return parseFloat(balance.toString()) / Math.pow(10, 18);
    } catch (error) {
      console.error(`Error fetching ETH balance for ${address}:`, error);
      return 0;
    }
  }

  /**
   * Get token price in USD (requires additional price oracle integration)
   */
  async getTokenPrice(tokenAddress: string): Promise<number> {
    // For now, return estimated prices for known tokens
    const knownPrices: Record<string, number> = {
      '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84': 3200, // stETH
      '0xBEeF1f5Bd88285E5B239B6AAcb991d38ccA23Ac9': 1.0, // USDC variant
    };
    
    return knownPrices[tokenAddress.toLowerCase()] || 1.0;
  }
}

export const alchemyService = new AlchemyService();