/**
 * Moralis API Service
 * Provides Web3 data including NFTs, tokens, DeFi positions, and blockchain analytics
 */

interface MoralisTokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_collection?: boolean;
  usd_price?: number;
  usd_value?: number;
  native_token?: boolean;
  portfolio_percentage?: number;
}

interface MoralisTransaction {
  hash: string;
  nonce: string;
  transaction_index: string;
  from_address: string;
  to_address: string;
  value: string;
  gas?: string;
  gas_price: string;
  input: string;
  receipt_cumulative_gas_used: string;
  receipt_gas_used: string;
  receipt_status: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
}

interface MoralisNFT {
  token_address: string;
  token_id: string;
  owner_of: string;
  block_number: string;
  block_number_minted: string;
  token_hash: string;
  amount: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri?: string;
  metadata?: any;
  last_token_uri_sync?: string;
  last_metadata_sync?: string;
  minter_address?: string;
}

interface MoralisDeFiPosition {
  protocol_name: string;
  protocol_id: string;
  protocol_logo?: string;
  position_type: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balance_usd?: number;
  apy?: number;
  reward_tokens?: Array<{
    token_address: string;
    symbol: string;
    decimals: number;
    balance: string;
  }>;
}

interface TokenPriceResponse {
  tokenAddress: string;
  usdPrice: number;
  usdPriceFormatted?: string;
  exchangeName?: string;
  exchangeAddress?: string;
  '24hrPercentChange'?: string;
  nativePrice?: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
  };
}

export class MoralisService {
  private readonly baseUrl = 'https://deep-index.moralis.io/api/v2.2';
  private readonly apiKey = process.env.MORALIS_API_KEY || '';
  private rateLimitDelay = 100; // Moralis rate limits vary by plan
  private lastRequestTime = 0;

  /**
   * Rate limiting to respect API limits
   */
  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Make API request with rate limiting
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    try {
      if (!this.apiKey) {
        console.error('Moralis API key not configured');
        return null;
      }

      await this.enforceRateLimit();
      
      const queryParams = new URLSearchParams(params);
      const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
      console.log(`Fetching Moralis data from: ${endpoint}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        console.error(`Moralis API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Moralis API request failed:', error);
      return null;
    }
  }

  /**
   * Get native balance for an address
   */
  async getNativeBalance(address: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/${address}/balance`, { chain });
  }

  /**
   * Get ERC20 token balances for an address
   */
  async getTokenBalances(address: string, chain: string = '0x1'): Promise<MoralisTokenBalance[] | null> {
    const response = await this.makeRequest<any>(`/${address}/erc20`, { chain });
    return response?.result || null;
  }

  /**
   * Get transactions for an address
   */
  async getTransactions(address: string, chain: string = '0x1', limit: number = 100): Promise<MoralisTransaction[] | null> {
    const response = await this.makeRequest<any>(`/${address}`, {
      chain,
      limit: limit.toString()
    });
    return response?.result || null;
  }

  /**
   * Get NFTs owned by an address
   */
  async getNFTs(address: string, chain: string = '0x1'): Promise<MoralisNFT[] | null> {
    const response = await this.makeRequest<any>(`/${address}/nft`, {
      chain,
      format: 'decimal',
      normalizeMetadata: 'true'
    });
    return response?.result || null;
  }

  /**
   * Get token price by contract address
   */
  async getTokenPrice(address: string, chain: string = '0x1'): Promise<TokenPriceResponse | null> {
    return this.makeRequest(`/erc20/${address}/price`, { chain });
  }

  /**
   * Get multiple token prices
   */
  async getMultipleTokenPrices(addresses: string[], chain: string = '0x1'): Promise<TokenPriceResponse[] | null> {
    const response = await this.makeRequest<any>('/erc20/prices', {
      chain,
      token_addresses: addresses.join(',')
    });
    return response || null;
  }

  /**
   * Get token metadata
   */
  async getTokenMetadata(addresses: string[], chain: string = '0x1'): Promise<any> {
    return this.makeRequest('/erc20/metadata', {
      chain,
      addresses: addresses.join(',')
    });
  }

  /**
   * Get DeFi positions for a wallet
   */
  async getDeFiPositions(address: string, chain: string = '0x1'): Promise<MoralisDeFiPosition[] | null> {
    const response = await this.makeRequest<any>(`/wallets/${address}/defi/positions`, {
      chain
    });
    return response?.result || null;
  }

  /**
   * Get token transfers for an address
   */
  async getTokenTransfers(address: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/${address}/erc20/transfers`, {
      chain,
      limit: '100'
    });
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockNumberOrHash: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/block/${blockNumberOrHash}`, { chain });
  }

  /**
   * Get events for a contract
   */
  async getContractEvents(address: string, topic: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/${address}/events`, {
      chain,
      topic,
      limit: '100'
    });
  }

  /**
   * Get logs for a contract
   */
  async getContractLogs(address: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/${address}/logs`, {
      chain,
      limit: '100'
    });
  }

  /**
   * Resolve ENS domain to address
   */
  async resolveENS(domain: string): Promise<any> {
    return this.makeRequest(`/resolve/ens/${domain}`);
  }

  /**
   * Get pair reserves for DEX
   */
  async getPairReserves(pairAddress: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/pairs/${pairAddress}/reserves`, { chain });
  }

  /**
   * Get wallet net worth
   */
  async getWalletNetWorth(address: string, chains: string[] = ['0x1']): Promise<any> {
    return this.makeRequest(`/wallets/${address}/net-worth`, {
      chains: chains.join(','),
      exclude_spam: 'true',
      exclude_unverified_contracts: 'true'
    });
  }

  /**
   * Get wallet stats
   */
  async getWalletStats(address: string, chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/wallets/${address}/stats`, { chain });
  }

  /**
   * Get chain stats
   */
  async getChainStats(chain: string = '0x1'): Promise<any> {
    return this.makeRequest(`/market-data/global/market-cap`, { chain });
  }

  /**
   * Convert chain name to Moralis chain ID
   */
  getChainId(chainName: string): string {
    const chainMap: Record<string, string> = {
      'ethereum': '0x1',
      'bsc': '0x38',
      'polygon': '0x89',
      'avalanche': '0xa86a',
      'fantom': '0xfa',
      'arbitrum': '0xa4b1',
      'optimism': '0xa',
      'base': '0x2105',
      'cronos': '0x19',
      'palm': '0x2a15c308d',
    };
    return chainMap[chainName.toLowerCase()] || '0x1';
  }
}

// Export singleton instance
export const moralisService = new MoralisService();