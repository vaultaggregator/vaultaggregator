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
}

export class MoralisService {
  private static instance: MoralisService;
  private baseUrl = 'https://deep-index.moralis.io/api/v2.2';

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
   * Get token holders for a specific token
   */
  async getTokenHolders(
    address: string, 
    network: string = 'ethereum',
    limit: number = 100,
    cursor?: string
  ): Promise<MoralisHoldersResponse> {
    try {
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
      
      return {
        result: (data.result || []).map((holder: any) => ({
          owner_address: holder.owner_address,
          balance: holder.balance,
          balance_formatted: holder.balance_formatted,
          usd_value: holder.usd_value,
          percentage_relative_to_total_supply: holder.percentage_relative_to_total_supply,
          is_contract: holder.is_contract,
          label: holder.owner_address_label
        })),
        cursor: data.cursor,
        page: data.page,
        page_size: data.page_size
      };
    } catch (error) {
      console.error(`❌ Moralis API error for ${address}:`, error);
      throw error;
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

    try {
      while (totalFetched < maxHolders) {
        const remainingLimit = Math.min(100, maxHolders - totalFetched);
        
        const response = await this.getTokenHolders(address, network, remainingLimit, cursor);
        
        allHolders.push(...response.result);
        totalFetched += response.result.length;
        
        // Break if no more data or we've reached our limit
        if (!response.cursor || response.result.length === 0) {
          break;
        }
        
        cursor = response.cursor;
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
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