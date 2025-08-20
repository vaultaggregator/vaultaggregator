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
      
      const holders: TokenHolder[] = [];
      const processedAddresses = new Set<string>();
      
      // Strategy 1: Try to get owners directly (works for NFTs and some ERC-20s)
      try {
        const ownersResponse = await this.alchemy.nft.getOwnersForContract(tokenAddress);
        console.log(`📈 Found ${ownersResponse.owners.length} owners via NFT API`);
        
        for (const owner of ownersResponse.owners.slice(0, limit)) {
          if (!processedAddresses.has(owner.toLowerCase())) {
            processedAddresses.add(owner.toLowerCase());
            
            try {
              const balance = await this.alchemy.core.getTokenBalances(owner, [tokenAddress]);
              if (balance.tokenBalances.length > 0 && balance.tokenBalances[0].tokenBalance) {
                const rawBalance = balance.tokenBalances[0].tokenBalance;
                const decimals = metadata.decimals || 18;
                
                if (rawBalance !== '0x0') {
                  const balanceBigInt = BigInt(rawBalance);
                  const formattedBalance = Number(balanceBigInt) / Math.pow(10, decimals);
                  
                  if (formattedBalance > 0) {
                    holders.push({
                      address: owner,
                      balance: balanceBigInt.toString(),
                      formattedBalance,
                    });
                  }
                }
              }
            } catch (error) {
              console.log(`⚠️ Could not fetch balance for ${owner}`);
            }
          }
        }
      } catch (error) {
        console.log(`📌 NFT API approach failed, trying transfer events...`);
      }
      
      // Strategy 2: Get ALL transfer events to find all holders
      if (holders.length < 20) {
        console.log(`🔄 Fetching all transfer events to find holders...`);
        
        const latestBlock = await this.alchemy.core.getBlockNumber();
        const uniqueAddresses = new Set<string>();
        let pageKey: string | undefined;
        let iterations = 0;
        const maxIterations = 100; // Even more iterations to ensure complete coverage
        
        // Get transfers in multiple batches going further back in time
        while (iterations < maxIterations) {
          const transfers = await this.alchemy.core.getAssetTransfers({
            fromBlock: '0x0', // Start from genesis
            toBlock: 'latest',
            contractAddresses: [tokenAddress],
            category: [AssetTransfersCategory.ERC20],
            maxCount: 1000,
            excludeZeroValue: false, // Include all transfers
            order: SortingOrder.DESCENDING,
            pageKey,
          });
          
          // Collect all unique addresses
          for (const transfer of transfers.transfers) {
            if (transfer.to && !uniqueAddresses.has(transfer.to.toLowerCase())) {
              uniqueAddresses.add(transfer.to.toLowerCase());
            }
            if (transfer.from && !uniqueAddresses.has(transfer.from.toLowerCase())) {
              uniqueAddresses.add(transfer.from.toLowerCase());
            }
          }
          
          console.log(`📊 Iteration ${iterations + 1}: Found ${uniqueAddresses.size} unique addresses`);
          
          pageKey = transfers.pageKey;
          iterations++;
          
          // Continue until we have ALL holders or no more pages
          if (!pageKey) {
            break;
          }
          
          // Don't stop early - get ALL holders up to the limit
          if (uniqueAddresses.size >= limit * 3) {
            console.log(`📊 Reached ${uniqueAddresses.size} addresses, stopping iteration`);
            break;
          }
        }
        
        console.log(`🎯 Found ${uniqueAddresses.size} unique addresses from transfers`);
        
        // Now get balances for all unique addresses
        const addressArray = Array.from(uniqueAddresses);
        let checkedCount = 0;
        
        console.log(`📊 Checking balances for ${addressArray.length} addresses...`);
        
        for (const address of addressArray) {
          if (processedAddresses.has(address)) {
            continue;
          }
          
          processedAddresses.add(address);
          checkedCount++;
          
          try {
            const balance = await this.alchemy.core.getTokenBalances(address, [tokenAddress]);
            if (balance.tokenBalances.length > 0 && balance.tokenBalances[0].tokenBalance) {
              const rawBalance = balance.tokenBalances[0].tokenBalance;
              const decimals = metadata.decimals || 18;
              
              if (rawBalance !== '0x0') {
                const balanceBigInt = BigInt(rawBalance);
                const formattedBalance = Number(balanceBigInt) / Math.pow(10, decimals);
                
                if (formattedBalance > 0) { // Zero threshold to capture all holders
                  holders.push({
                    address,
                    balance: balanceBigInt.toString(),
                    formattedBalance,
                  });
                }
              }
            }
          } catch (error) {
            // Skip addresses that fail
          }
          
          // Progress update and rate limiting
          if (checkedCount % 50 === 0) {
            console.log(`📊 Checked ${checkedCount}/${addressArray.length} addresses, found ${holders.length} holders`);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          // Stop if we have enough holders
          if (holders.length >= limit) {
            console.log(`✅ Reached limit of ${limit} holders`);
            break;
          }
        }
      }
      
      // Sort by balance descending
      holders.sort((a, b) => b.formattedBalance - a.formattedBalance);
      
      console.log(`✅ Found ${holders.length} token holders with non-zero balances`);
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

  /**
   * Get total portfolio value across all chains for an address
   * This fetches all token balances and calculates total USD value
   */
  async getTotalPortfolioValue(address: string): Promise<number> {
    try {
      console.log(`📊 Fetching total portfolio value for ${address}`);
      
      let totalValue = 0;
      
      // Get ETH balance
      const ethBalance = await this.alchemy.core.getBalance(address);
      const ethValue = (parseFloat(ethBalance.toString()) / Math.pow(10, 18)) * 3200; // ETH price ~$3200
      totalValue += ethValue;
      
      // Get all token balances on Ethereum mainnet
      const tokenBalances = await this.alchemy.core.getTokenBalances(address);
      
      for (const token of tokenBalances.tokenBalances) {
        if (token.tokenBalance && token.tokenBalance !== '0x0') {
          try {
            // Get token metadata
            const metadata = await this.alchemy.core.getTokenMetadata(token.contractAddress);
            const decimals = metadata.decimals || 18;
            
            // Calculate token amount
            const balance = BigInt(token.tokenBalance);
            const tokenAmount = Number(balance) / Math.pow(10, decimals);
            
            // Get token price (simplified - in production would use price oracle)
            let tokenPrice = 1.0; // Default for stablecoins
            
            // Known token prices (simplified)
            const symbol = metadata.symbol?.toUpperCase();
            if (symbol === 'USDC' || symbol === 'USDT' || symbol === 'DAI') {
              tokenPrice = 1.0;
            } else if (symbol === 'WETH' || symbol === 'STETH') {
              tokenPrice = 3200;
            } else if (symbol === 'WBTC') {
              tokenPrice = 65000;
            }
            
            // For vault tokens like TAC USDC, apply exchange rate
            if (token.contractAddress.toLowerCase() === '0x1e2aaadcf528b9cc08f43d4fd7db488ce89f5741') {
              tokenPrice = 3.6; // TAC USDC vault rate
            }
            
            const tokenValue = tokenAmount * tokenPrice;
            if (tokenValue > 0.01) { // Ignore dust
              totalValue += tokenValue;
            }
          } catch (error) {
            // Skip tokens we can't price
            continue;
          }
        }
      }
      
      console.log(`💰 Total portfolio value for ${address}: $${totalValue.toLocaleString()}`);
      return totalValue;
      
    } catch (error) {
      console.error(`Error fetching portfolio value for ${address}:`, error);
      // Fallback to ETH-only value
      const ethBalance = await this.getEthBalance(address);
      return ethBalance * 3200;
    }
  }
}

export const alchemyService = new AlchemyService();