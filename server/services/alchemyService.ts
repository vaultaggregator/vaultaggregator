// No external config needed - using environment variables directly

export interface AlchemyTransfer {
  from: string;
  to: string;
  value: string;
  tokenId?: string;
  asset: string;
  category: 'token' | 'internal' | 'external';
  rawContract: {
    address: string;
    decimal: string;
  };
  metadata: {
    blockTimestamp: string;
    blockNumber: string;
    transactionHash: string;
  };
}

export interface AlchemyTransferResponse {
  transfers: AlchemyTransfer[];
  pageKey?: string;
}

export class AlchemyService {
  private apiKey: string;
  private baseUrl: string = 'https://eth-mainnet.g.alchemy.com/v2';

  constructor() {
    this.apiKey = process.env.ALCHEMY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ALCHEMY_API_KEY not found - Alchemy service will not be available');
    }
  }

  /**
   * Check if Alchemy API is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get token transfers for a contract address using Alchemy API
   * Much higher rate limits than Etherscan (300 req/sec on paid plans)
   */
  async getTokenTransfers(
    contractAddress: string,
    fromBlock?: string,
    toBlock?: string,
    maxCount: number = 1000,
    pageKey?: string
  ): Promise<AlchemyTransferResponse> {
    if (!this.isAvailable()) {
      throw new Error('Alchemy API key not configured');
    }

    try {
      const requestBody = {
        id: 1,
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          category: ['erc20'],
          contractAddresses: [contractAddress],
          fromBlock: fromBlock || '0x0',
          toBlock: toBlock || 'latest',
          maxCount: `0x${maxCount.toString(16)}`,
          order: 'desc',
          withMetadata: true,
          ...(pageKey && { pageKey })
        }]
      };

      const url = `${this.baseUrl}/${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Alchemy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      // Convert Alchemy format to our expected format
      const transfers = data.result.transfers.map((transfer: AlchemyTransfer) => ({
        from: transfer.from,
        to: transfer.to,
        value: transfer.value,
        timeStamp: Math.floor(new Date(transfer.metadata.blockTimestamp).getTime() / 1000).toString(),
        hash: transfer.metadata.transactionHash,
        blockNumber: transfer.metadata.blockNumber,
        tokenDecimal: transfer.rawContract.decimal
      }));

      return {
        transfers,
        pageKey: data.result.pageKey
      };
    } catch (error) {
      console.error('Alchemy API error:', error);
      throw error;
    }
  }

  /**
   * Get historical token transfers with automatic pagination
   * Can fetch much more historical data than Etherscan
   */
  async getHistoricalTransfers(
    contractAddress: string,
    daysBack: number = 90,
    maxTransfers: number = 15000
  ): Promise<any[]> {
    if (!this.isAvailable()) {
      throw new Error('Alchemy API key not configured');
    }

    const allTransfers: any[] = [];
    let pageKey: string | undefined;
    const startTime = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    const startBlock = await this.getBlockByTimestamp(startTime);

    console.log(`Fetching ${daysBack} days of transfers for ${contractAddress} using Alchemy (targeting historical coverage)...`);

    try {
      while (allTransfers.length < maxTransfers) {
        const response = await this.getTokenTransfers(
          contractAddress,
          startBlock,
          'latest',
          Math.min(1000, maxTransfers - allTransfers.length),
          pageKey
        );

        if (response.transfers.length === 0) {
          break;
        }

        allTransfers.push(...response.transfers);
        console.log(`Alchemy: Fetched ${response.transfers.length} transfers, total: ${allTransfers.length}`);

        // Check if we have more pages
        if (!response.pageKey) {
          break;
        }

        pageKey = response.pageKey;

        // Rate limiting - Alchemy allows 300 req/sec on paid plans
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }

      console.log(`Alchemy: Successfully fetched ${allTransfers.length} transfers over ${daysBack} days`);
      return allTransfers;

    } catch (error) {
      console.error('Error fetching historical transfers from Alchemy:', error);
      throw error;
    }
  }

  /**
   * Get block number by timestamp (approximate)
   */
  private async getBlockByTimestamp(timestamp: number): Promise<string> {
    // Ethereum blocks are roughly 12 seconds apart
    const currentTime = Date.now();
    const secondsBack = Math.floor((currentTime - timestamp) / 1000);
    const blocksBack = Math.floor(secondsBack / 12);
    
    // Get current block number
    const response = await fetch(`${this.baseUrl}/${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: []
      })
    });

    const data = await response.json();
    const currentBlock = parseInt(data.result, 16);
    const targetBlock = Math.max(0, currentBlock - blocksBack);
    
    return `0x${targetBlock.toString(16)}`;
  }
}

export const alchemyService = new AlchemyService();