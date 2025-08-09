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

class EtherscanService {
  private apiKey: string;
  private baseUrl: string = 'https://api.etherscan.io/api';
  private rateLimit: number = 5; // 5 calls per second (free tier)
  private lastCallTime: number = 0;

  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ETHERSCAN_API_KEY environment variable is required');
    }
  }

  private async rateLimitedFetch(url: string): Promise<any> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    const minInterval = 1000 / this.rateLimit; // milliseconds between calls

    if (timeSinceLastCall < minInterval) {
      const waitTime = minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === '0') {
      throw new Error(`Etherscan API error: ${data.message || data.result}`);
    }

    return data.result;
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
  async getTokenTransfers(contractAddress: string, page: number = 1, offset: number = 25): Promise<EtherscanTokenTransfer[]> {
    try {
      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${contractAddress}&page=${page}&offset=${offset}&sort=desc&apikey=${this.apiKey}`;
      
      const transfers = await this.rateLimitedFetch(url);
      
      if (!Array.isArray(transfers)) {
        console.warn('No transfers found for contract:', contractAddress);
        return [];
      }
      
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