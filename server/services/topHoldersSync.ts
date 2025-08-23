import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { pools } from '@shared/schema';

interface TopHolder {
  address: string;
  balance: string;
  pct: number;
}

interface TopHoldersSnapshot {
  updatedAt: string;
  tokenAddress: string;
  totalSupply?: string;
  holders: TopHolder[];
  metadata: {
    chainId: string;
    poolId: string;
    transfersProcessed: number;
    fromBlock: number;
    toBlock: number;
    processingTimeMs: number;
  };
}

interface AlchemyTransfer {
  from: string;
  to: string;
  value: string;
  blockNum: string;
}

interface AlchemyResponse {
  transfers: AlchemyTransfer[];
  pageKey?: string;
}

export class TopHoldersSyncService {
  private static readonly CHAIN_URLS = {
    'ethereum': process.env.ALCHEMY_RPC_URL,
    'base': process.env.ALCHEMY_RPC_URL, // Use same URL for now, can be split later if needed
  };

  private static readonly ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  private static readonly MAX_HOLDERS = 20;
  private static readonly MAX_PAGES = 100; // Prevent runaway costs
  private static readonly RATE_LIMIT_MS = 100; // 100ms between requests

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getSnapshotPath(chain: string, poolId: string): string {
    return path.join(process.cwd(), 'data', 'snapshots', 'top-holders', chain, `${poolId}.json`);
  }

  private static async loadExistingSnapshot(chain: string, poolId: string): Promise<TopHoldersSnapshot | null> {
    try {
      const snapshotPath = this.getSnapshotPath(chain, poolId);
      const content = await fs.readFile(snapshotPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private static async saveSnapshot(chain: string, poolId: string, snapshot: TopHoldersSnapshot): Promise<void> {
    const snapshotPath = this.getSnapshotPath(chain, poolId);
    const dir = path.dirname(snapshotPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  }

  private static async getCreationBlock(poolAddress: string): Promise<number | null> {
    try {
      const creationInfoPath = path.join(process.cwd(), 'data', 'creation-info.json');
      const content = await fs.readFile(creationInfoPath, 'utf-8');
      const creationInfo = JSON.parse(content);
      return creationInfo[poolAddress]?.blockNumber || null;
    } catch (error) {
      return null;
    }
  }

  private static async fetchTransfers(
    chain: string,
    contractAddress: string,
    fromBlock: number,
    toBlock: number = 'latest' as any
  ): Promise<AlchemyTransfer[]> {
    const baseUrl = this.CHAIN_URLS[chain as keyof typeof this.CHAIN_URLS];
    if (!baseUrl) {
      throw new Error(`No Alchemy URL configured for chain: ${chain}`);
    }

    const allTransfers: AlchemyTransfer[] = [];
    let pageKey: string | undefined;
    let pageCount = 0;

    console.log(`🔄 Fetching transfers for ${contractAddress} on ${chain} from block ${fromBlock}`);

    while (pageCount < this.MAX_PAGES) {
      const body = {
        id: 1,
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [{
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: toBlock === 'latest' ? 'latest' : `0x${Number(toBlock).toString(16)}`,
          contractAddresses: [contractAddress],
          category: ["erc20"],
          withMetadata: false,
          excludeZeroValue: false,
          maxCount: "0x3e8", // 1000 transfers per page
          ...(pageKey && { pageKey })
        }]
      };

      try {
        await this.delay(this.RATE_LIMIT_MS);
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error(`Alchemy API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(`Alchemy API error: ${data.error.message}`);
        }

        const result: AlchemyResponse = data.result;
        allTransfers.push(...result.transfers);
        
        console.log(`📄 Page ${pageCount + 1}: ${result.transfers.length} transfers`);
        
        if (!result.pageKey) {
          break;
        }
        
        pageKey = result.pageKey;
        pageCount++;
      } catch (error) {
        console.error(`❌ Error fetching transfers page ${pageCount + 1}:`, error);
        break;
      }
    }

    console.log(`✅ Total transfers fetched: ${allTransfers.length} across ${pageCount + 1} pages`);
    return allTransfers;
  }

  private static calculateHolderBalances(transfers: AlchemyTransfer[], contractAddress: string): Map<string, bigint> {
    const balances = new Map<string, bigint>();

    for (const transfer of transfers) {
      const { from, to, value } = transfer;
      const amount = BigInt(Math.floor(parseFloat(value || '0')));

      // Skip zero address and contract itself
      if (from !== this.ZERO_ADDRESS && from.toLowerCase() !== contractAddress.toLowerCase()) {
        const currentBalance = balances.get(from) || BigInt(0);
        balances.set(from, currentBalance - amount);
      }

      if (to !== this.ZERO_ADDRESS && to.toLowerCase() !== contractAddress.toLowerCase()) {
        const currentBalance = balances.get(to) || BigInt(0);
        balances.set(to, currentBalance + amount);
      }
    }

    // Remove zero balances
    for (const [address, balance] of Array.from(balances.entries())) {
      if (balance <= BigInt(0)) {
        balances.delete(address);
      }
    }

    return balances;
  }

  private static async getCurrentTotalSupply(chain: string, contractAddress: string): Promise<bigint | null> {
    const baseUrl = this.CHAIN_URLS[chain as keyof typeof this.CHAIN_URLS];
    if (!baseUrl) return null;

    try {
      const body = {
        id: 1,
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{
          to: contractAddress,
          data: "0x18160ddd" // totalSupply() function selector
        }, "latest"]
      };

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.result && data.result !== '0x') {
        return BigInt(data.result);
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch total supply for ${contractAddress}:`, error);
    }

    return null;
  }

  public static async syncTopHolders(poolId: string): Promise<TopHoldersSnapshot | null> {
    const startTime = Date.now();
    
    try {
      // Get pool information
      const pool = await db.query.pools.findFirst({
        where: (pools, { eq }) => eq(pools.id, poolId),
        with: {
          network: true,
          platform: true
        }
      });

      if (!pool || !pool.poolAddress) {
        throw new Error(`Pool ${poolId} not found or missing pool address`);
      }

      const chain = pool.network.name;
      const contractAddress = pool.poolAddress;

      console.log(`🚀 Starting top holders sync for ${pool.tokenPair} on ${chain}`);
      console.log(`📍 Contract: ${contractAddress}`);

      // Load existing snapshot to determine starting block
      const existingSnapshot = await this.loadExistingSnapshot(chain, poolId);
      
      // Determine starting block
      let fromBlock: number;
      if (existingSnapshot?.metadata?.toBlock) {
        fromBlock = existingSnapshot.metadata.toBlock + 1;
        console.log(`📈 Incremental sync from block ${fromBlock}`);
      } else {
        const creationBlock = await this.getCreationBlock(contractAddress);
        if (creationBlock) {
          fromBlock = creationBlock;
          console.log(`🎯 Starting from creation block ${fromBlock}`);
        } else {
          // Default to recent block (approximately 7 days ago)
          const blocksPerDay = chain === 'ethereum' ? 7200 : 43200; // ETH: ~12s, Base: ~2s
          const currentBlock = await this.getCurrentBlockNumber(chain);
        fromBlock = Math.max(1, currentBlock - (blocksPerDay * 7));
          console.log(`📅 Starting from estimated recent block ${fromBlock}`);
        }
      }

      // Fetch transfers
      const transfers = await this.fetchTransfers(chain, contractAddress, fromBlock);
      
      // Calculate balances
      let balances: Map<string, bigint>;
      if (existingSnapshot && fromBlock > (existingSnapshot.metadata?.fromBlock || 0)) {
        // Merge with existing balances
        balances = new Map();
        for (const holder of existingSnapshot.holders) {
          balances.set(holder.address, BigInt(holder.balance));
        }
        
        // Apply new transfers
        const newBalances = this.calculateHolderBalances(transfers, contractAddress);
        for (const [address, change] of Array.from(newBalances.entries())) {
          const current = balances.get(address) || BigInt(0);
          const newBalance = current + change;
          if (newBalance > BigInt(0)) {
            balances.set(address, newBalance);
          } else {
            balances.delete(address);
          }
        }
      } else {
        // Full calculation
        balances = this.calculateHolderBalances(transfers, contractAddress);
      }

      // Get total supply for percentage calculations
      const totalSupply = await this.getCurrentTotalSupply(chain, contractAddress);

      // Sort and take top holders
      const sortedHolders = Array.from(balances.entries())
        .sort((a, b) => (a[1] > b[1] ? -1 : 1))
        .slice(0, this.MAX_HOLDERS);

      // Create holders list with percentages
      const holders: TopHolder[] = sortedHolders.map(([address, balance]) => ({
        address,
        balance: balance.toString(),
        pct: totalSupply ? Number((balance * BigInt(10000)) / totalSupply) / 100 : 0
      }));

      const currentBlock = await this.getCurrentBlockNumber(chain);
      const processingTime = Date.now() - startTime;

      const snapshot: TopHoldersSnapshot = {
        updatedAt: new Date().toISOString(),
        tokenAddress: contractAddress,
        totalSupply: totalSupply?.toString(),
        holders,
        metadata: {
          chainId: chain,
          poolId,
          transfersProcessed: transfers.length,
          fromBlock,
          toBlock: currentBlock,
          processingTimeMs: processingTime
        }
      };

      // Save snapshot
      await this.saveSnapshot(chain, poolId, snapshot);

      console.log(`✅ Top holders sync completed for ${pool.tokenPair}`);
      console.log(`📊 Found ${holders.length} holders from ${transfers.length} transfers`);
      console.log(`⏱️ Processing time: ${processingTime}ms`);

      return snapshot;
    } catch (error) {
      console.error(`❌ Top holders sync failed for pool ${poolId}:`, error);
      throw error;
    }
  }

  private static async getCurrentBlockNumber(chain: string): Promise<number> {
    const baseUrl = this.CHAIN_URLS[chain as keyof typeof this.CHAIN_URLS];
    if (!baseUrl) throw new Error(`No Alchemy URL for chain: ${chain}`);

    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: []
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return parseInt(data.result, 16);
  }

  public static async syncAllPools(): Promise<void> {
    console.log('🔄 Starting top holders sync for all pools...');
    
    const allPools = await db.query.pools.findMany({
      with: {
        network: true,
        platform: true
      }
    });

    for (const pool of allPools) {
      if (!pool.poolAddress) {
        console.log(`⏭️ Skipping ${pool.tokenPair} - no pool address`);
        continue;
      }

      try {
        await this.syncTopHolders(pool.id);
        await this.delay(this.RATE_LIMIT_MS * 2); // Extra delay between pools
      } catch (error) {
        console.error(`❌ Failed to sync top holders for ${pool.tokenPair}:`, error);
      }
    }

    console.log('✅ Completed top holders sync for all pools');
  }
}

export const topHoldersSync = TopHoldersSyncService;