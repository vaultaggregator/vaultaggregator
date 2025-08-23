/**
 * Comprehensive Wallet Profile Service
 * Uses Alchemy API to get real wallet token balances for tracked tokens only
 * Provides detailed wallet information while avoiding expensive API calls for untracked tokens
 */

import { storage } from '../storage';
import { AlchemyService } from './alchemyService';

export interface WalletToken {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  formattedBalance: number;
  usdValue: number;
  price: number;
  decimals: number;
  logo?: string;
  chain: string;
  change24h?: number;
}

export interface WalletProfileData {
  address: string;
  totalValueUsd: number;
  ethBalance: number;
  ethValueUsd: number;
  tokenCount: number;
  trackedTokens: WalletToken[];
  lastUpdated: string;
  chainInfo: {
    name: string;
    displayName: string;
  };
}

export class WalletProfileService {
  private alchemyService: AlchemyService;

  constructor() {
    this.alchemyService = new AlchemyService();
  }

  /**
   * Get comprehensive wallet profile showing only tracked tokens
   */
  async getWalletProfile(walletAddress: string): Promise<WalletProfileData> {
    try {
      console.log(`📊 Fetching comprehensive wallet profile for ${walletAddress}`);
      
      // 1. Get all tracked tokens from our database
      const trackedTokens = await storage.getActiveTokens();
      console.log(`🎯 Found ${trackedTokens.length} tracked tokens in database`);

      if (trackedTokens.length === 0) {
        console.log('⚠️ No tracked tokens found - returning empty profile');
        return this.createEmptyProfile(walletAddress);
      }

      // 2. Get ETH balance
      const ethBalance = await this.alchemyService.getEthBalance(walletAddress);
      const ethPrice = 3200; // Static ETH price for now
      const ethValueUsd = ethBalance * ethPrice;

      // 3. Get token balances for tracked tokens only
      const walletTokens: WalletToken[] = [];
      let totalTokenValueUsd = 0;

      for (const token of trackedTokens) {
        try {
          console.log(`🔍 Checking balance for tracked token: ${token.symbol} (${token.address})`);
          
          // Get token balance using Alchemy's batch method for single token
          const balanceMap = await this.alchemyService.batchGetTokenBalances(
            [walletAddress],
            token.address,
            'ethereum' // For now, focusing on Ethereum
          );
          
          const balance = balanceMap.get(walletAddress.toLowerCase());

          if (balance && balance !== '0') {
            // Calculate formatted balance
            const rawBalance = BigInt(balance);
            const formattedBalance = Number(rawBalance) / Math.pow(10, token.decimals);

            if (formattedBalance > 0) {
              // Get token price
              const tokenPrice = await this.alchemyService.getTokenPrice(token.address, 'ethereum');
              const usdValue = formattedBalance * tokenPrice;

              console.log(`💰 Found balance: ${formattedBalance} ${token.symbol} = $${usdValue.toFixed(2)}`);

              walletTokens.push({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                balance: balance,
                formattedBalance,
                usdValue,
                price: tokenPrice,
                decimals: token.decimals,
                chain: 'Ethereum',
                change24h: 0 // TODO: Could fetch from price API if needed
              });

              totalTokenValueUsd += usdValue;
            }
          }
        } catch (error) {
          console.log(`⚠️ Error fetching balance for ${token.symbol}:`, error);
          // Continue with other tokens
        }
      }

      const totalValueUsd = ethValueUsd + totalTokenValueUsd;

      console.log(`✅ Wallet profile complete: ${walletTokens.length} tokens found, total value: $${totalValueUsd.toFixed(2)}`);

      return {
        address: walletAddress,
        totalValueUsd,
        ethBalance,
        ethValueUsd,
        tokenCount: walletTokens.length,
        trackedTokens: walletTokens,
        lastUpdated: new Date().toLocaleTimeString(),
        chainInfo: {
          name: 'ethereum',
          displayName: 'Ethereum'
        }
      };

    } catch (error) {
      console.error('❌ Error in wallet profile service:', error);
      return this.createEmptyProfile(walletAddress);
    }
  }

  /**
   * Create empty profile structure when no data is available
   */
  private createEmptyProfile(walletAddress: string): WalletProfileData {
    return {
      address: walletAddress,
      totalValueUsd: 0,
      ethBalance: 0,
      ethValueUsd: 0,
      tokenCount: 0,
      trackedTokens: [],
      lastUpdated: new Date().toLocaleTimeString(),
      chainInfo: {
        name: 'ethereum',
        displayName: 'Ethereum'
      }
    };
  }

  /**
   * Check if we track a specific token address
   */
  async isTokenTracked(tokenAddress: string): Promise<boolean> {
    try {
      const trackedTokens = await storage.getActiveTokens();
      return trackedTokens.some(token => 
        token.address.toLowerCase() === tokenAddress.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking if token is tracked:', error);
      return false;
    }
  }

  /**
   * Get summary of tracked tokens for admin reference
   */
  async getTrackedTokensSummary(): Promise<{count: number, tokens: Array<{symbol: string, address: string}>}> {
    try {
      const trackedTokens = await storage.getActiveTokens();
      return {
        count: trackedTokens.length,
        tokens: trackedTokens.map(token => ({
          symbol: token.symbol,
          address: token.address
        }))
      };
    } catch (error) {
      console.error('Error getting tracked tokens summary:', error);
      return { count: 0, tokens: [] };
    }
  }
}