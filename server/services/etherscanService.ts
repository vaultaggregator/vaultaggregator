/**
 * Etherscan API Service
 * Provides structured access to Etherscan API endpoints
 */

export interface EtherscanResponse {
  status: string;
  message: string;
  result: any;
}

export interface TokenInfo {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  tokenType: string;
  totalSupply: string;
  blueCheckmark: string;
  description: string;
  website: string;
  email: string;
  blog: string;
  reddit: string;
  slack: string;
  facebook: string;
  twitter: string;
  github: string;
  telegram: string;
  wechat: string;
  linkedin: string;
  discord: string;
  whitepaper: string;
  tokenPriceUSD: string;
  holdersCount?: number;
}

export interface ContractInfo {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

export interface TransactionInfo {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

export interface AccountInfo {
  account: string;
  balance: string;
}

export class EtherscanService {
  private baseUrl = 'https://api.etherscan.io/api';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY || 'demo';
    if (!process.env.ETHERSCAN_API_KEY) {
      console.warn('⚠️ ETHERSCAN_API_KEY not set, using demo key with limited functionality');
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make a request to Etherscan API with error handling
   */
  private async makeRequest(params: Record<string, string>): Promise<EtherscanResponse> {
    const searchParams = new URLSearchParams({
      ...params,
      apikey: this.apiKey
    });

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === '0' && data.message === 'NOTOK') {
        throw new Error(`Etherscan API error: ${data.result || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Etherscan API request failed:', error);
      throw error;
    }
  }

  /**
   * Get account balance and transaction count
   */
  async getAccountInfo(address: string): Promise<AccountInfo> {
    const response = await this.makeRequest({
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest'
    });

    return {
      account: address,
      balance: response.result
    };
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    startblock: number = 0,
    endblock: number = 99999999,
    page: number = 1,
    offset: number = 10000,
    sort: 'asc' | 'desc' = 'asc'
  ): Promise<TransactionInfo[]> {
    const response = await this.makeRequest({
      module: 'account',
      action: 'txlist',
      address,
      startblock: startblock.toString(),
      endblock: endblock.toString(),
      page: page.toString(),
      offset: offset.toString(),
      sort
    });

    return response.result;
  }

  /**
   * Get ERC-20 token balances for an address
   */
  async getTokenBalances(address: string, contractaddress?: string): Promise<any[]> {
    const params: Record<string, string> = {
      module: 'account',
      action: 'tokentx',
      address
    };

    if (contractaddress) {
      params.contractaddress = contractaddress;
    }

    const response = await this.makeRequest(params);
    return response.result;
  }

  /**
   * Get contract source code and ABI
   */
  async getContractInfo(address: string): Promise<ContractInfo[]> {
    const response = await this.makeRequest({
      module: 'contract',
      action: 'getsourcecode',
      address
    });

    return response.result;
  }

  /**
   * Get contract creation transaction
   */
  async getContractCreation(contractaddresses: string[]): Promise<any[]> {
    const response = await this.makeRequest({
      module: 'contract',
      action: 'getcontractcreation',
      contractaddresses: contractaddresses.join(',')
    });

    return response.result;
  }

  /**
   * Get current gas prices
   */
  async getGasTracker(): Promise<any> {
    const response = await this.makeRequest({
      module: 'gastracker',
      action: 'gasoracle'
    });

    return response.result;
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionByHash(txhash: string): Promise<any> {
    const response = await this.makeRequest({
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash
    });

    return response.result;
  }

  /**
   * Get block details by number
   */
  async getBlockByNumber(blockNumber: string): Promise<any> {
    const response = await this.makeRequest({
      module: 'proxy',
      action: 'eth_getBlockByNumber',
      tag: blockNumber,
      boolean: 'false'
    });

    return response.result;
  }

  /**
   * Get current ETH price
   */
  async getEthPrice(): Promise<any> {
    const response = await this.makeRequest({
      module: 'stats',
      action: 'ethprice'
    });

    return response.result;
  }

  /**
   * Get token info by contract address
   */
  async getTokenInfo(contractAddress: string): Promise<TokenInfo | null> {
    try {
      const response = await this.makeRequest({
        module: 'token',
        action: 'tokeninfo',
        contractaddress: contractAddress
      });

      if (response.status === '1' && response.result) {
        return response.result[0] as TokenInfo;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching token info for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Get token holders count by web scraping (fallback method)
   */
  async getTokenHoldersCount(contractAddress: string): Promise<number | null> {
    try {
      const url = `https://etherscan.io/token/${contractAddress}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      
      // Look for holder count in various patterns
      const patterns = [
        /(\d{1,3}(?:,\d{3})*)\s+holders/i,
        /Holders:\s*(\d{1,3}(?:,\d{3})*)/i,
        /"holders":\s*"(\d{1,3}(?:,\d{3})*)"/i,
        /(\d{1,3}(?:,\d{3})*)\s+addresses/i
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const holdersStr = match[1].replace(/,/g, '');
          const holdersCount = parseInt(holdersStr);
          if (!isNaN(holdersCount) && holdersCount > 0) {
            console.log(`📊 Found ${holdersCount} holders for ${contractAddress} via web scraping`);
            return holdersCount;
          }
        }
      }

      console.warn(`⚠️ Could not extract holder count from Etherscan page for ${contractAddress}`);
      return null;
    } catch (error) {
      console.error(`Error scraping token holders for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Calculate operating days from contract creation date
   */
  async getContractOperatingDays(contractAddress: string): Promise<number | null> {
    try {
      // First try the full method if API key is available
      try {
        const creationData = await this.getContractCreation([contractAddress]);
        
        if (creationData && creationData.length > 0) {
          const txHash = creationData[0].txHash;
          
          // Get transaction details
          const txData = await this.getTransactionByHash(txHash);
          
          if (txData && txData.blockNumber) {
            // Get block details for timestamp
            const blockData = await this.getBlockByNumber(txData.blockNumber);
            
            if (blockData && blockData.timestamp) {
              const creationTimestamp = parseInt(blockData.timestamp, 16) * 1000;
              const creationDate = new Date(creationTimestamp);
              const currentDate = new Date();
              const daysDiff = Math.floor((currentDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
              
              console.log(`📅 Contract ${contractAddress} created ${daysDiff} days ago (Etherscan blockchain data)`);
              return daysDiff;
            }
          }
        }
      } catch (apiError) {
        console.log(`⚠️ Etherscan API failed, trying fallback method for ${contractAddress}`);
      }
      
      // Fallback: Use public API with demo key to get first transaction
      const fallbackUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=demo`;
      
      const response = await fetch(fallbackUrl);
      if (!response.ok) {
        throw new Error(`Fallback API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === "1" && data.result && data.result.length > 0) {
        const firstTx = data.result[0];
        const creationTimestamp = parseInt(firstTx.timeStamp) * 1000;
        const creationDate = new Date(creationTimestamp);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`📅 Contract ${contractAddress} created ${daysDiff} days ago (fallback method)`);
        return daysDiff;
      }
      
      return null;
    } catch (error) {
      console.error(`Error calculating operating days for ${contractAddress}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const etherscanService = new EtherscanService();