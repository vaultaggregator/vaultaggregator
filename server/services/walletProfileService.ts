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

export interface NetworkBalance {
  chainId: string;
  chainName: string;
  nativeBalance: number;
  nativeValueUsd: number;
  tokenValueUsd: number;
  totalValueUsd: number;
  tokenCount: number;
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
  networks?: NetworkBalance[]; // Network breakdown like DeBank
}

export class WalletProfileService {
  private alchemyService: AlchemyService;

  constructor() {
    this.alchemyService = new AlchemyService();
  }

  /**
   * Get comprehensive wallet profile showing balances across multiple chains
   */
  async getWalletProfile(walletAddress: string): Promise<WalletProfileData> {
    try {
      console.log(`📊 Fetching multi-chain wallet profile for ${walletAddress}`);
      
      // 1. Get all tracked tokens from our database
      const trackedTokens = await storage.getActiveTokens();
      console.log(`🎯 Found ${trackedTokens.length} tracked tokens in database`);

      if (trackedTokens.length === 0) {
        console.log('⚠️ No tracked tokens found - returning empty profile');
        return this.createEmptyProfile(walletAddress);
      }

      // Network configurations
      const networks = [
        { id: 'ethereum', name: 'Ethereum', nativeSymbol: 'ETH', nativePrice: 3200 },
        { id: 'base', name: 'Base', nativeSymbol: 'ETH', nativePrice: 3200 }
      ];

      const walletTokens: WalletToken[] = [];
      const networkBalances: NetworkBalance[] = [];
      let totalValueUsd = 0;

      // Process each network
      for (const network of networks) {
        console.log(`🌐 Fetching balances for ${network.name}...`);
        
        // Get native balance (ETH) for this network
        const nativeBalance = await this.alchemyService.getEthBalance(walletAddress, network.id as 'ethereum' | 'base');
        const nativeValueUsd = nativeBalance * network.nativePrice;
        
        let networkTokenValueUsd = 0;
        let networkTokenCount = 0;

        // Get token balances for this network
        for (const token of trackedTokens) {
          try {
            console.log(`🔍 [${network.name}] Checking token: ${token.symbol}`);
            
            // Get token balance using Alchemy's batch method
            const balanceMap = await this.alchemyService.batchGetTokenBalances(
              [walletAddress],
              token.address,
              network.id as 'ethereum' | 'base'
            );
            
            const balance = balanceMap.get(walletAddress.toLowerCase());

            if (balance && balance !== '0') {
              // Calculate formatted balance
              const rawBalance = BigInt(balance);
              const formattedBalance = Number(rawBalance) / Math.pow(10, token.decimals);

              if (formattedBalance > 0.0001) { // Only show meaningful balances
                // Get token price
                const tokenPrice = await this.alchemyService.getTokenPrice(token.address, network.id as 'ethereum' | 'base');
                const usdValue = formattedBalance * tokenPrice;

                console.log(`💰 [${network.name}] Found: ${formattedBalance} ${token.symbol} = $${usdValue.toFixed(2)}`);

                walletTokens.push({
                  address: token.address,
                  symbol: token.symbol,
                  name: token.name,
                  balance: balance,
                  formattedBalance,
                  usdValue,
                  price: tokenPrice,
                  decimals: token.decimals,
                  chain: network.name,
                  change24h: 0
                });

                networkTokenValueUsd += usdValue;
                networkTokenCount++;
              }
            }
          } catch (error) {
            console.log(`⚠️ [${network.name}] Error fetching ${token.symbol}:`, error);
            // Continue with other tokens
          }
        }

        // Add network balance summary
        const networkTotalUsd = nativeValueUsd + networkTokenValueUsd;
        if (networkTotalUsd > 0 || nativeBalance > 0) {
          networkBalances.push({
            chainId: network.id,
            chainName: network.name,
            nativeBalance,
            nativeValueUsd,
            tokenValueUsd: networkTokenValueUsd,
            totalValueUsd: networkTotalUsd,
            tokenCount: networkTokenCount
          });
        }

        totalValueUsd += networkTotalUsd;
      }

      // Get the primary ETH balance (from Ethereum network)
      const ethNetworkBalance = networkBalances.find(n => n.chainId === 'ethereum');
      const ethBalance = ethNetworkBalance?.nativeBalance || 0;
      const ethValueUsd = ethNetworkBalance?.nativeValueUsd || 0;

      console.log(`✅ Multi-chain profile complete: ${walletTokens.length} tokens across ${networkBalances.length} networks, total: $${totalValueUsd.toFixed(2)}`);

      return {
        address: walletAddress,
        totalValueUsd,
        ethBalance, // Keep for backward compatibility
        ethValueUsd, // Keep for backward compatibility
        tokenCount: walletTokens.length,
        trackedTokens: walletTokens,
        lastUpdated: new Date().toLocaleTimeString(),
        chainInfo: {
          name: 'multi-chain',
          displayName: 'Multi-Chain'
        },
        networks: networkBalances
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