interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  owner?: string;
  transfersCount?: number;
  holdersCount?: number;
  isVerified?: boolean;
  contractName?: string;
}

interface TokenSupplyData {
  totalSupply: string;
  circulatingSupply?: string;
  maxSupply?: string;
  burnedAmount?: string;
}

interface TokenHolder {
  address: string;
  balance: string;
  share: string;
}

interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  blockNumber: string;
  timeStamp: string;
  gasPrice: string;
  gasUsed: string;
}

interface TokenAnalytics {
  transferCount24h: number;
  transferCount7d: number;
  transferCount30d: number;
  uniqueAddresses24h: number;
  uniqueAddresses7d: number;
  uniqueAddresses30d: number;
  volume24h: string;
  volume7d: string;
  volume30d: string;
}

interface ContractEvent {
  blockNumber: string;
  timeStamp: string;
  eventName: string;
  topics: string[];
  data: string;
  transactionHash: string;
}

interface DexTradeData {
  pairAddress: string;
  dexName: string;
  token0: string;
  token1: string;
  reserves0: string;
  reserves1: string;
  price: string;
  liquidityUSD: string;
}

export class EtherscanTokenService {
  private apiKey: string;
  private baseUrl: string = 'https://api.etherscan.io/api';
  private rateLimit: number = 5;
  private lastCallTime: number = 0;

  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ETHERSCAN_API_KEY not set - some features may be limited');
    }
  }

  private async rateLimitedFetch(url: string): Promise<any> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    const minInterval = 1000 / this.rateLimit;

    if (timeSinceLastCall < minInterval) {
      const waitTime = minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(`Etherscan API error: ${data.message || data.result}`);
      }

      return data.result;
    } catch (error) {
      console.error('Etherscan API fetch error:', error);
      return null;
    }
  }

  /**
   * Get comprehensive token information
   */
  async getTokenInfo(address: string): Promise<TokenInfo | null> {
    try {
      // Get token transfers to extract token info
      const transferUrl = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=1&apikey=${this.apiKey}`;
      const transfers = await this.rateLimitedFetch(transferUrl);
      
      if (transfers && transfers.length > 0) {
        const firstTransfer = transfers[0];
        
        // Get total supply
        const supplyUrl = `${this.baseUrl}?module=stats&action=tokensupply&contractaddress=${address}&apikey=${this.apiKey}`;
        const totalSupply = await this.rateLimitedFetch(supplyUrl);
        
        return {
          address,
          name: firstTransfer.tokenName || 'Unknown Token',
          symbol: firstTransfer.tokenSymbol || 'N/A',
          decimals: firstTransfer.tokenDecimal || '18',
          totalSupply: totalSupply || '0',
          transfersCount: transfers.length
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return null;
    }
  }

  /**
   * Get token supply data
   */
  async getTokenSupply(address: string): Promise<TokenSupplyData | null> {
    try {
      const url = `${this.baseUrl}?module=stats&action=tokensupply&contractaddress=${address}&apikey=${this.apiKey}`;
      const totalSupply = await this.rateLimitedFetch(url);
      
      return {
        totalSupply: totalSupply || '0',
        circulatingSupply: totalSupply, // Simplified - would need more complex calculation
      };
    } catch (error) {
      console.error('Error fetching token supply:', error);
      return null;
    }
  }

  /**
   * Get top token holders
   */
  async getTopHolders(address: string, limit: number = 10): Promise<TokenHolder[]> {
    try {
      // Get token transfer events to calculate holders
      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=10000&sort=desc&apikey=${this.apiKey}`;
      const transfers = await this.rateLimitedFetch(url);
      
      if (!transfers || transfers.length === 0) {
        return [];
      }

      // Calculate balances from transfers
      const balances = new Map<string, bigint>();
      
      for (const tx of transfers) {
        const from = tx.from.toLowerCase();
        const to = tx.to.toLowerCase();
        const value = BigInt(tx.value);
        
        if (from !== '0x0000000000000000000000000000000000000000') {
          balances.set(from, (balances.get(from) || 0n) - value);
        }
        
        balances.set(to, (balances.get(to) || 0n) + value);
      }

      // Sort by balance and get top holders
      const sortedHolders = Array.from(balances.entries())
        .filter(([_, balance]) => balance > 0n)
        .sort((a, b) => Number(b[1] - a[1]))
        .slice(0, limit);

      const totalSupply = sortedHolders.reduce((sum, [_, balance]) => sum + balance, 0n);
      
      return sortedHolders.map(([address, balance]) => ({
        address,
        balance: balance.toString(),
        share: totalSupply > 0n ? ((balance * 10000n) / totalSupply / 100n).toString() : '0'
      }));
    } catch (error) {
      console.error('Error fetching top holders:', error);
      return [];
    }
  }

  /**
   * Get recent token transfers
   */
  async getRecentTransfers(address: string, limit: number = 50): Promise<TokenTransfer[]> {
    try {
      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=${limit}&sort=desc&apikey=${this.apiKey}`;
      const transfers = await this.rateLimitedFetch(url);
      
      return transfers || [];
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  /**
   * Get token analytics
   */
  async getTokenAnalytics(address: string): Promise<TokenAnalytics | null> {
    try {
      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=10000&sort=desc&apikey=${this.apiKey}`;
      const transfers = await this.rateLimitedFetch(url);
      
      if (!transfers || transfers.length === 0) {
        return null;
      }

      const now = Date.now() / 1000;
      const day = 86400;
      
      const transfers24h = transfers.filter((tx: any) => now - parseInt(tx.timeStamp) < day);
      const transfers7d = transfers.filter((tx: any) => now - parseInt(tx.timeStamp) < day * 7);
      const transfers30d = transfers.filter((tx: any) => now - parseInt(tx.timeStamp) < day * 30);
      
      const uniqueAddresses = (txList: any[]) => {
        const addresses = new Set<string>();
        txList.forEach(tx => {
          addresses.add(tx.from);
          addresses.add(tx.to);
        });
        return addresses.size;
      };
      
      const calculateVolume = (txList: any[]) => {
        return txList.reduce((sum, tx) => sum + BigInt(tx.value), 0n).toString();
      };
      
      return {
        transferCount24h: transfers24h.length,
        transferCount7d: transfers7d.length,
        transferCount30d: transfers30d.length,
        uniqueAddresses24h: uniqueAddresses(transfers24h),
        uniqueAddresses7d: uniqueAddresses(transfers7d),
        uniqueAddresses30d: uniqueAddresses(transfers30d),
        volume24h: calculateVolume(transfers24h),
        volume7d: calculateVolume(transfers7d),
        volume30d: calculateVolume(transfers30d),
      };
    } catch (error) {
      console.error('Error fetching token analytics:', error);
      return null;
    }
  }

  /**
   * Get contract events
   */
  async getContractEvents(address: string, limit: number = 100): Promise<ContractEvent[]> {
    try {
      const url = `${this.baseUrl}?module=logs&action=getLogs&address=${address}&fromBlock=0&toBlock=latest&page=1&offset=${limit}&apikey=${this.apiKey}`;
      const events = await this.rateLimitedFetch(url);
      
      if (!events || events.length === 0) {
        return [];
      }

      return events.map((event: any) => ({
        blockNumber: event.blockNumber,
        timeStamp: event.timeStamp,
        eventName: event.topics[0] ? event.topics[0].slice(0, 10) : 'Unknown',
        topics: event.topics,
        data: event.data,
        transactionHash: event.transactionHash
      }));
    } catch (error) {
      console.error('Error fetching contract events:', error);
      return [];
    }
  }

  /**
   * Get gas usage statistics
   */
  async getGasUsageStats(address: string): Promise<any> {
    try {
      const url = `${this.baseUrl}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=1000&sort=desc&apikey=${this.apiKey}`;
      const transfers = await this.rateLimitedFetch(url);
      
      if (!transfers || transfers.length === 0) {
        return null;
      }

      const gasUsages = transfers.map((tx: any) => parseInt(tx.gasUsed) * parseInt(tx.gasPrice));
      const avgGasUsage = gasUsages.reduce((a: number, b: number) => a + b, 0) / gasUsages.length;
      const minGasUsage = Math.min(...gasUsages);
      const maxGasUsage = Math.max(...gasUsages);
      
      return {
        average: avgGasUsage,
        min: minGasUsage,
        max: maxGasUsage,
        averageInGwei: avgGasUsage / 1e9,
        minInGwei: minGasUsage / 1e9,
        maxInGwei: maxGasUsage / 1e9
      };
    } catch (error) {
      console.error('Error fetching gas usage stats:', error);
      return null;
    }
  }
}

export {
  type TokenInfo,
  type TokenSupplyData,
  type TokenHolder,
  type TokenTransfer,
  type TokenAnalytics,
  type ContractEvent,
  type DexTradeData
};