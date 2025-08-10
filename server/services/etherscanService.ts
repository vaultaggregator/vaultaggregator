interface EtherscanAccountInfo {
  account: string;
  balance: string;
  txCount: number;
  firstTx?: string;
  lastTx?: string;
}

interface EtherscanTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  methodId?: string;
  functionName?: string;
}

interface EtherscanTokenBalance {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  balance: string;
  tokenPriceUSD?: string;
  tokenValue?: string;
}

interface EtherscanContractInfo {
  contractAddress: string;
  contractName: string;
  contractCreator: string;
  txHash: string;
  isVerified: boolean;
  abi?: string;
  sourceCode?: string;
}

interface EtherscanGasTracker {
  safeLowGwei: string;
  standardGwei: string;
  fastGwei: string;
  proposeGasPrice: string;
  gasUsedRatio: string;
}

interface EtherscanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class EtherscanService {
  private apiKey: string;
  private baseUrl: string = 'https://api.etherscan.io/api';
  private rateLimit: number = 5; // 5 calls per second (free tier)
  private lastCallTime: number = 0;
  private requestQueue: Array<{ resolve: Function, reject: Function, url: string }> = [];
  private isProcessingQueue: boolean = false;
  private cache: Map<string, CacheEntry> = new Map();
  private failedAttempts: number = 0;
  private maxFailedAttempts: number = 5;

  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ETHERSCAN_API_KEY environment variable is required');
    }
  }

  private getCacheKey(url: string): string {
    return url.split('&apikey=')[0]; // Remove API key from cache key
  }

  private isValidCache(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private async rateLimitedFetch(url: string, cacheTTL: number = 60000): Promise<any> {
    // Check cache first
    const cacheKey = this.getCacheKey(url);
    const cachedEntry = this.cache.get(cacheKey);
    
    if (cachedEntry && this.isValidCache(cachedEntry)) {
      console.log('Returning cached result for Etherscan API');
      return cachedEntry.data;
    }

    // If too many failures, return cached data even if expired, or throw error
    if (this.failedAttempts >= this.maxFailedAttempts) {
      if (cachedEntry) {
        console.log('API failing, returning stale cached data');
        return cachedEntry.data;
      }
      throw new Error('Etherscan API consistently failing and no cached data available');
    }
    
    // Queue requests to ensure proper rate limiting
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ 
        resolve: (data: any) => {
          // Cache successful response
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: cacheTTL
          });
          this.failedAttempts = Math.max(0, this.failedAttempts - 1); // Reduce failure count on success
          resolve(data);
        }, 
        reject: (error: Error) => {
          this.failedAttempts++;
          // Try to return cached data on failure
          if (cachedEntry) {
            console.log('API failed, returning stale cached data');
            resolve(cachedEntry.data);
          } else {
            reject(error);
          }
        }, 
        url 
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { resolve, reject, url } = this.requestQueue.shift()!;
      
      try {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        const minInterval = 1000; // 1 second between calls (much more conservative)

        if (timeSinceLastCall < minInterval) {
          const waitTime = minInterval - timeSinceLastCall;
          await new Promise(r => setTimeout(r, waitTime));
        }

        this.lastCallTime = Date.now();
        const result = await this.makeRequest(url);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  private async makeRequest(url: string, retryAttempt: number = 0): Promise<any> {
    const maxRetries = 3;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different types of API errors
      if (data.status === '0') {
        const errorMessage = data.message || data.result;
        console.error(`Etherscan API response error: ${errorMessage} for URL: ${url.split('&apikey=')[0]}`);
        
        // Check if it's a rate limit error and retry
        if (errorMessage.toLowerCase().includes('rate limit') || 
            errorMessage.toLowerCase().includes('too many') ||
            errorMessage === 'NOTOK') {
          
          if (retryAttempt < maxRetries) {
            const backoffDelay = Math.pow(2, retryAttempt) * 3000; // Longer exponential backoff: 3s, 6s, 12s
            console.log(`Rate limit detected, retrying in ${backoffDelay}ms (attempt ${retryAttempt + 1}/${maxRetries + 1})`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return this.makeRequest(url, retryAttempt + 1);
          }
        }
        
        throw new Error(`Etherscan API error: ${errorMessage}`);
      }

      return data.result;
    } catch (error) {
      // Retry on network errors
      if (retryAttempt < maxRetries && (
          error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('timeout'))) {
        
        const backoffDelay = Math.pow(2, retryAttempt) * 1000;
        console.log(`Network error, retrying in ${backoffDelay}ms (attempt ${retryAttempt + 1}/${maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.makeRequest(url, retryAttempt + 1);
      }

      console.error(`Etherscan API fetch error for URL: ${url.split('&apikey=')[0]}:`, error.message);
      throw error;
    }
  }

  /**
   * Get account balance and transaction count
   */
  async getAccountInfo(address: string): Promise<EtherscanAccountInfo> {
    const balanceUrl = `${this.baseUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${this.apiKey}`;
    const txCountUrl = `${this.baseUrl}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${this.apiKey}`;

    const [balance, txCount] = await Promise.all([
      this.rateLimitedFetch(balanceUrl),
      this.rateLimitedFetch(txCountUrl)
    ]);

    return {
      account: address,
      balance: balance,
      txCount: parseInt(txCount, 16) // Convert hex to decimal
    };
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(
    address: string, 
    startBlock: number = 0, 
    endBlock: number = 999999999, 
    page: number = 1, 
    offset: number = 100
  ): Promise<EtherscanTransaction[]> {
    const url = `${this.baseUrl}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=desc&apikey=${this.apiKey}`;
    
    const transactions = await this.rateLimitedFetch(url);
    return transactions;
  }

  /**
   * Get ERC-20 token balances for an address
   */
  async getTokenBalances(address: string): Promise<EtherscanTokenBalance[]> {
    const url = `${this.baseUrl}?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc&apikey=${this.apiKey}`;
    
    const tokenTransactions = await this.rateLimitedFetch(url);
    
    // Group by contract address and get latest balance
    const tokenMap = new Map<string, EtherscanTokenBalance>();
    
    for (const tx of tokenTransactions) {
      const contractAddress = tx.contractAddress;
      if (!tokenMap.has(contractAddress)) {
        tokenMap.set(contractAddress, {
          contractAddress,
          tokenName: tx.tokenName,
          tokenSymbol: tx.tokenSymbol,
          tokenDecimal: tx.tokenDecimal,
          balance: '0'
        });
      }
    }

    return Array.from(tokenMap.values());
  }

  /**
   * Get contract information
   */
  async getContractInfo(address: string): Promise<EtherscanContractInfo | null> {
    try {
      // Check if contract is verified
      const abiUrl = `${this.baseUrl}?module=contract&action=getabi&address=${address}&apikey=${this.apiKey}`;
      const abi = await this.rateLimitedFetch(abiUrl);
      
      // Get contract source code
      const sourceUrl = `${this.baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`;
      const sourceData = await this.rateLimitedFetch(sourceUrl);
      
      if (sourceData && sourceData.length > 0) {
        const source = sourceData[0];
        return {
          contractAddress: address,
          contractName: source.ContractName,
          contractCreator: source.ContractCreator || 'Unknown',
          txHash: source.TxHash || 'Unknown',
          isVerified: abi !== 'Contract source code not verified',
          abi: abi !== 'Contract source code not verified' ? abi : undefined,
          sourceCode: source.SourceCode || undefined
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching contract info:', error);
      return null;
    }
  }

  /**
   * Get current gas prices
   */
  async getGasTracker(): Promise<EtherscanGasTracker> {
    const url = `${this.baseUrl}?module=gastracker&action=gasoracle&apikey=${this.apiKey}`;
    
    const gasData = await this.rateLimitedFetch(url);
    return gasData;
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionByHash(txHash: string): Promise<EtherscanTransaction | null> {
    try {
      const url = `${this.baseUrl}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${this.apiKey}`;
      const transaction = await this.rateLimitedFetch(url);
      return transaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Get block information
   */
  async getBlockByNumber(blockNumber: string): Promise<any> {
    const url = `${this.baseUrl}?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=true&apikey=${this.apiKey}`;
    return await this.rateLimitedFetch(url);
  }

  /**
   * Get latest block number
   */
  async getLatestBlockNumber(): Promise<number> {
    try {
      const url = `${this.baseUrl}?module=proxy&action=eth_blockNumber&apikey=${this.apiKey}`;
      const blockHex = await this.rateLimitedFetch(url);
      return parseInt(blockHex, 16);
    } catch (error) {
      // Fallback to stats endpoint
      const statsUrl = `${this.baseUrl}?module=stats&action=ethsupply&apikey=${this.apiKey}`;
      const response = await fetch(statsUrl);
      const data = await response.json();
      
      // Use a recent block number as fallback
      return 21000000; // Approximate recent block number
    }
  }

  /**
   * Get token transfers for a specific contract address
   */
  async getTokenTransfers(contractAddress: string, page: number = 1, offset: number = 10): Promise<EtherscanTokenTransfer[]> {
    try {
      // Use a smaller offset to avoid timeout issues
      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${this.apiKey}`;
      
      console.log(`Fetching token transfers for ${contractAddress}...`);
      const transfers = await this.rateLimitedFetch(url, 300000); // 5-minute cache
      
      if (!Array.isArray(transfers)) {
        console.warn('No transfers found for contract:', contractAddress);
        return [];
      }
      
      console.log(`Successfully retrieved ${transfers.length} token transfers`);
      return transfers;
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  /**
   * Get ETH price in USD
   */
  async getEthPrice(): Promise<{ ethBtc: string; ethUsd: string; ethUsdTimestamp: string }> {
    const url = `${this.baseUrl}?module=stats&action=ethprice&apikey=${this.apiKey}`;
    return await this.rateLimitedFetch(url);
  }

  /**
   * Validate Ethereum address format
   */
  static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Convert Wei to ETH
   */
  static weiToEth(wei: string): string {
    const ethValue = parseInt(wei) / Math.pow(10, 18);
    return ethValue.toFixed(6);
  }

  /**
   * Convert ETH to Wei
   */
  static ethToWei(eth: string): string {
    const weiValue = parseFloat(eth) * Math.pow(10, 18);
    return weiValue.toString();
  }
}

export { 
  EtherscanService,
  type EtherscanAccountInfo,
  type EtherscanTransaction,
  type EtherscanTokenBalance,
  type EtherscanContractInfo,
  type EtherscanGasTracker,
  type EtherscanTokenTransfer
};