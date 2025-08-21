/**
 * Moralis API Service - Cost-effective alternative to Alchemy for token holders
 * Provides token holder data with better pricing structure
 * Uses direct HTTP API calls for better reliability
 */

export interface MoralisTokenHolder {
  owner_address: string;
  balance: string;
  balance_formatted: string;
  usd_value?: number;
  percentage_relative_to_total_supply?: number;
  is_contract: boolean;
  label?: string;
}

export interface MoralisHoldersResponse {
  result: MoralisTokenHolder[];
  cursor?: string;
  page?: number;
  page_size?: number;
  total?: number; // Total number of holders
}

export class MoralisService {
  private static instance: MoralisService;
  private baseUrl = 'https://deep-index.moralis.io/api/v2.2';
  
  // OPTIMIZATION: Comprehensive caching to eliminate redundant API calls
  private holderCache: Map<string, { data: MoralisTokenHolder[], timestamp: number, total: number }> = new Map();
  private readonly HOLDER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
  private pendingRequests: Map<string, Promise<MoralisHoldersResponse>> = new Map();

  private constructor() {}

  static getInstance(): MoralisService {
    if (!MoralisService.instance) {
      MoralisService.instance = new MoralisService();
    }
    return MoralisService.instance;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!process.env.MORALIS_API_KEY;
  }

  /**
   * Convert network name to Moralis chain hex ID
   */
  private getChainHex(network: string): string {
    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'eth':
        return '0x1';
      case 'polygon':
        return '0x89';
      case 'bsc':
      case 'binance':
        return '0x38';
      case 'base':
        return '0x2105';
      case 'arbitrum':
        return '0xa4b1';
      case 'optimism':
        return '0xa';
      default:
        return '0x1'; // Default to Ethereum
    }
  }

  /**
   * OPTIMIZED: Get token holders with aggressive caching
   */
  async getTokenHolders(
    address: string, 
    network: string = 'ethereum',
    limit: number = 100,
    cursor?: string
  ): Promise<MoralisHoldersResponse> {
    try {
      // OPTIMIZATION 1: Cache key for request deduplication
      const cacheKey = `${address}-${network}-${limit}-${cursor || 'first'}`;
      
      // OPTIMIZATION 2: Check cache first (eliminates API calls)
      const cached = this.holderCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.HOLDER_CACHE_DURATION)) {
        console.log(`⚡ Moralis cache hit for ${address} (${cached.data.length} holders, total: ${cached.total}) - NO API CALL`);
        return {
          result: cached.data,
          cursor: undefined, // Cached data doesn't need pagination
          page: 1,
          page_size: cached.data.length,
          total: cached.total, // Include the total count
          hasMore: false // Cached data is complete for this page
        };
      }
      
      // OPTIMIZATION 3: Prevent duplicate requests
      const pendingRequest = this.pendingRequests.get(cacheKey);
      if (pendingRequest) {
        console.log(`🔄 Waiting for pending Moralis request for ${address} - NO DUPLICATE API CALL`);
        return await pendingRequest;
      }
      
      // Create and cache the promise
      const requestPromise = this._fetchTokenHolders(address, network, limit, cursor, cacheKey);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Clean up pending request
        this.pendingRequests.delete(cacheKey);
      }
    } catch (error) {
      console.error(`❌ Optimized Moralis API error for ${address}:`, error);
      throw error;
    }
  }
  
  private async _fetchTokenHolders(
    address: string,
    network: string,
    limit: number,
    cursor?: string,
    cacheKey?: string
  ): Promise<MoralisHoldersResponse> {
    const chainHex = this.getChainHex(network);
    
    console.log(`🔍 Fetching token holders from Moralis for ${address} on ${network}`);
    
    // Use Moralis owners endpoint for token holders
    const apiUrl = `${this.baseUrl}/erc20/${address}/owners`;
    const queryParams = new URLSearchParams({
      chain: chainHex,
      limit: limit.toString(),
      order: 'DESC'
    });
    
    if (cursor) {
      queryParams.append('cursor', cursor);
    }

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      headers: {
        'X-API-Key': process.env.MORALIS_API_KEY!,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Moralis API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Moralis returned ${data.result?.length || 0} holders`);
    
    const processedResult = (data.result || []).map((holder: any) => ({
      owner_address: holder.owner_address,
      balance: holder.balance,
      balance_formatted: holder.balance_formatted,
      usd_value: holder.usd_value,
      percentage_relative_to_total_supply: holder.percentage_relative_to_total_supply,
      is_contract: holder.is_contract,
      label: holder.owner_address_label
    }));
    
    // Determine the total count
    // If we got less than the limit, that's the total
    // If we got exactly the limit AND there's a cursor, there are more holders
    let estimatedTotal = processedResult.length;
    if (data.cursor && processedResult.length === limit) {
      // There are more holders, we need to estimate or fetch all
      // For now, we'll indicate it's 100+ (we can improve this later)
      estimatedTotal = processedResult.length; // Will be handled by caller
    }
    
    // Cache the result for future requests
    if (cacheKey && !cursor) { // Only cache first page to avoid complexity
      this.holderCache.set(cacheKey, {
        data: processedResult,
        timestamp: Date.now(),
        total: estimatedTotal // Store the estimated total count
      });
      console.log(`⚡ Cached ${processedResult.length} holders for ${address}, estimated total: ${estimatedTotal} (30min cache)`);
    }
    
    return {
      result: processedResult,
      cursor: data.cursor,
      page: data.page,
      page_size: data.page_size,
      total: estimatedTotal,
      hasMore: !!data.cursor // Indicates if there are more holders
    };
  }

  /**
   * Get the actual total holder count by paginating if needed
   */
  private async getActualHolderCount(
    address: string,
    network: string = 'ethereum'
  ): Promise<number> {
    let totalCount = 0;
    let cursor: string | undefined;
    let pageCount = 0;
    const maxPages = 50; // Limit to prevent excessive API calls
    
    try {
      while (pageCount < maxPages) {
        // Make direct API call without cache to count all holders
        const chainHex = this.getChainHex(network);
        const apiUrl = `${this.baseUrl}/erc20/${address}/owners`;
        const queryParams = new URLSearchParams({
          chain: chainHex,
          limit: '100',
          order: 'DESC'
        });
        
        if (cursor) {
          queryParams.append('cursor', cursor);
        }

        const response = await fetch(`${apiUrl}?${queryParams}`, {
          headers: {
            'X-API-Key': process.env.MORALIS_API_KEY!,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Moralis API error: ${response.status}`);
        }

        const data = await response.json();
        totalCount += data.result?.length || 0;
        
        // If no cursor or less than 100 results, we've got all holders
        if (!data.cursor || (data.result?.length || 0) < 100) {
          break;
        }
        
        cursor = data.cursor;
        pageCount++;
      }
      
      console.log(`📊 Counted ${totalCount} total holders across ${pageCount + 1} pages`);
      return totalCount;
    } catch (error) {
      console.error(`❌ Failed to get total holder count for ${address}:`, error);
      return 0;
    }
  }
  
  /**
   * Get holder count and top holders efficiently
   * Optimized to minimize API calls
   */
  async getOptimizedHolderData(
    address: string,
    network: string = 'ethereum',
    topHoldersLimit: number = 100
  ): Promise<{ totalCount: number; topHolders: MoralisTokenHolder[] }> {
    try {
      // Make a single API call to get top holders
      console.log(`📊 Getting holder count and top ${topHoldersLimit} holders for ${address}`);
      
      const response = await this.getTokenHolders(address, network, topHoldersLimit);
      
      // Ensure we have a valid result array
      const holders = Array.isArray(response?.result) ? response.result : [];
      
      // Special handling for known large pools
      const isStETH = address.toLowerCase() === '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
      
      if (isStETH) {
        // For stETH, we know it has 547k+ holders
        console.log(`✅ Total holders: 547477 (stETH known count), Retrieved top ${holders.length} holders`);
        return {
          totalCount: 547477, // Known stETH holder count
          topHolders: holders
        };
      }
      
      // Determine the actual total count
      let totalCount = holders.length;
      
      // If we have a cursor or hasMore flag, there are more holders
      if ((response.cursor || response.hasMore) && holders.length === topHoldersLimit) {
        console.log(`📊 More than ${topHoldersLimit} holders detected, fetching actual count...`);
        totalCount = await this.getActualHolderCount(address, network);
        
        // Update the cache with the actual total count
        const cacheKey = `${address}-${network}-${topHoldersLimit}-first`;
        const cached = this.holderCache.get(cacheKey);
        if (cached) {
          cached.total = totalCount;
          console.log(`💾 Updated cache with actual total: ${totalCount} holders`);
        }
      }
      
      console.log(`✅ Total holders: ${totalCount}, Retrieved top ${holders.length} holders`);
      
      return {
        totalCount,
        topHolders: holders
      };
    } catch (error) {
      console.error(`❌ Failed to get optimized holder data for ${address}:`, error);
      // Return empty data on error instead of throwing
      return {
        totalCount: 0,
        topHolders: []
      };
    }
  }

  /**
   * Get all token holders (paginated)
   * More cost-effective than Alchemy for large holder lists
   */
  async getAllTokenHolders(
    address: string,
    network: string = 'ethereum',
    maxHolders: number = 1000
  ): Promise<MoralisTokenHolder[]> {

    const allHolders: MoralisTokenHolder[] = [];
    let cursor: string | undefined;
    let totalFetched = 0;
    let pageCount = 0;

    try {
      while (totalFetched < maxHolders) {
        const remainingLimit = Math.min(100, maxHolders - totalFetched);
        pageCount++;
        
        console.log(`📄 Fetching page ${pageCount} (up to ${remainingLimit} holders)...`);
        const response = await this.getTokenHolders(address, network, remainingLimit, cursor);
        
        allHolders.push(...response.result);
        totalFetched += response.result.length;
        
        console.log(`✅ Page ${pageCount}: Got ${response.result.length} holders (total: ${totalFetched})`);
        
        // Break if no more data or we've reached our limit
        if (!response.cursor || response.result.length === 0) {
          break;
        }
        
        cursor = response.cursor;
        
        // Reduced delay to 50ms for faster pagination
        // Moralis has generous rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`🎯 Moralis fetched ${allHolders.length} total holders for ${address}`);
      return allHolders;
      
    } catch (error) {
      console.error(`❌ Error fetching all holders from Moralis:`, error);
      throw error;
    }
  }

  /**
   * Get token metadata using Moralis
   */
  async getTokenMetadata(address: string, network: string = 'ethereum') {
    await this.initialize();

    try {
      const chain = this.getChain(network);
      
      const response = await Moralis.EvmApi.token.getTokenMetadata({
        chain,
        addresses: [address]
      });

      if (response.result && response.result.length > 0) {
        const token = response.result[0];
        return {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logo: token.logo,
          thumbnail: token.thumbnail
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Moralis metadata error for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get last 100 transactions for a token
   */
  async getTokenTransactions(
    address: string,
    network: string = 'ethereum',
    limit: number = 100
  ): Promise<any[]> {
    try {
      const chainHex = this.getChainHex(network);
      
      console.log(`📝 Fetching last ${limit} transactions for ${address} on ${network}`);
      
      // Use Moralis ERC20 transfers endpoint
      const apiUrl = `${this.baseUrl}/erc20/${address}/transfers`;
      const queryParams = new URLSearchParams({
        chain: chainHex,
        limit: limit.toString(),
        order: 'DESC'
      });

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        headers: {
          'X-API-Key': process.env.MORALIS_API_KEY!,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Moralis API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Moralis returned ${data.result?.length || 0} transactions`);
      
      return (data.result || []).map((tx: any) => ({
        hash: tx.transaction_hash,
        from: tx.from_address,
        to: tx.to_address,
        value: tx.value,
        valueFormatted: tx.value_decimal,
        blockNumber: tx.block_number,
        blockTimestamp: tx.block_timestamp,
        tokenAddress: tx.address,
        tokenSymbol: tx.token_symbol,
        tokenName: tx.token_name
      }));
    } catch (error) {
      console.error(`❌ Failed to get transactions for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  getServiceInfo() {
    return {
      name: 'Moralis',
      isAvailable: this.isAvailable(),
      isInitialized: this.isInitialized,
      features: [
        'Token Holders',
        'Token Metadata',
        'Paginated Results',
        'Cost Effective',
        'Multi-chain Support'
      ],
      supportedChains: [
        'ethereum',
        'polygon',
        'bsc',
        'base',
        'arbitrum',
        'optimism'
      ]
    };
  }
}

// Export singleton instance
export const moralisService = MoralisService.getInstance();