/**
 * Enhanced Transfers API Service
 * Provides 100x faster historical transaction data with internal transfers
 */

import { Alchemy, Network, AssetTransfersCategory, AssetTransfersResult } from 'alchemy-sdk';
import { db } from '../db';
import { pools, tokenHolders } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export class EnhancedTransfersService {
  private static instance: EnhancedTransfersService;
  private alchemyEth: Alchemy;
  private alchemyBase: Alchemy;
  
  private constructor() {
    // Use ALCHEMY_API_KEY from environment
    const apiKey = process.env.ALCHEMY_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Alchemy API key not found in ALCHEMY_API_KEY environment variable');
    } else {
      console.log(`✅ Alchemy API key loaded (length: ${apiKey.length})`);
    }
    
    // Initialize Alchemy SDK for Ethereum
    this.alchemyEth = new Alchemy({
      apiKey: apiKey || '',
      network: Network.ETH_MAINNET,
    });

    // Initialize Alchemy SDK for Base
    this.alchemyBase = new Alchemy({
      apiKey: apiKey || '',
      network: Network.BASE_MAINNET,
    });
  }

  static getInstance(): EnhancedTransfersService {
    if (!this.instance) {
      this.instance = new EnhancedTransfersService();
    }
    return this.instance;
  }

  /**
   * Get complete transaction history for a wallet address
   * 100x faster than traditional methods
   */
  async getWalletTransactionHistory(
    address: string, 
    network: 'ethereum' | 'base' = 'ethereum',
    pageKey?: string
  ) {
    try {
      const alchemy = network === 'base' ? this.alchemyBase : this.alchemyEth;
      
      console.log(`📜 Fetching complete transaction history for ${address.slice(0, 8)}...`);

      // Get all transfers (sent and received)
      const [sentTransfers, receivedTransfers] = await Promise.all([
        alchemy.core.getAssetTransfers({
          fromAddress: address,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.INTERNAL,
            AssetTransfersCategory.ERC20,
            AssetTransfersCategory.ERC721,
            AssetTransfersCategory.ERC1155,
          ],
          maxCount: 1000,
          pageKey,
          withMetadata: true,
        }),
        alchemy.core.getAssetTransfers({
          toAddress: address,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.INTERNAL,
            AssetTransfersCategory.ERC20,
            AssetTransfersCategory.ERC721,
            AssetTransfersCategory.ERC1155,
          ],
          maxCount: 1000,
          pageKey,
          withMetadata: true,
        })
      ]);

      // Combine and sort transfers by timestamp
      const allTransfers = [
        ...sentTransfers.transfers.map(t => ({ ...t, direction: 'sent' })),
        ...receivedTransfers.transfers.map(t => ({ ...t, direction: 'received' }))
      ].sort((a, b) => {
        const dateA = new Date(a.metadata?.blockTimestamp || 0).getTime();
        const dateB = new Date(b.metadata?.blockTimestamp || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      // Calculate yield performance
      const yieldData = await this.calculateYieldPerformance(address, allTransfers);

      return {
        address,
        network,
        totalTransactions: allTransfers.length,
        transfers: allTransfers.slice(0, 100), // Return first 100 for performance
        yieldPerformance: yieldData,
        hasMore: sentTransfers.pageKey || receivedTransfers.pageKey,
        nextPageKey: sentTransfers.pageKey || receivedTransfers.pageKey
      };
    } catch (error) {
      console.error('❌ Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a specific pool using ERC-4626 events
   */
  async getPoolTransactionHistory(poolId: string, limit: number = 15) {
    try {
      const [pool] = await db
        .select()
        .from(pools)
        .where(eq(pools.id, poolId))
        .limit(1);

      if (!pool || !pool.poolAddress) {
        throw new Error('Pool not found or has no contract address');
      }

      const network = pool.chainId === '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7' ? 'base' : 'ethereum';
      const alchemy = network === 'base' ? this.alchemyBase : this.alchemyEth;

      console.log(`📊 Fetching ERC-4626 events for pool ${pool.tokenPair} on ${network}`);

      // ERC-4626 Event Signatures (topics)
      // Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)
      const DEPOSIT_EVENT_TOPIC = '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7';
      
      // Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)
      const WITHDRAW_EVENT_TOPIC = '0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db';

      // Get recent blocks
      const latestBlock = await alchemy.core.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - 10000); // Look back ~10000 blocks
      
      // Check if this is Steakhouse USDC vault - it has a wrapper token
      const isStakehouseUSDC = pool.poolAddress.toLowerCase() === '0xbeef01735c132ada46aa9aa4c54623caa92a64cb';
      const wrapperAddress = '0x334f5d28a71432f8fc21c7b2b6f5dbbcd8b32a7b'; // mstkeUSDC wrapper
      
      // Get contract addresses to monitor
      // For Steakhouse USDC, users interact with the wrapper, not the vault directly
      const contractAddresses = isStakehouseUSDC ? [wrapperAddress] : [pool.poolAddress];
      if (isStakehouseUSDC) {
        console.log(`📊 Monitoring wrapper contract (mstkeUSDC) for user interactions...`);
      }
      
      // Fetch ERC-4626 event logs
      const eventPromises = contractAddresses.map(async (contractAddress) => {
        // Get Deposit events
        const depositLogs = await alchemy.core.getLogs({
          address: contractAddress,
          topics: [DEPOSIT_EVENT_TOPIC],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: 'latest'
        });
        
        // Get Withdraw events  
        const withdrawLogs = await alchemy.core.getLogs({
          address: contractAddress,
          topics: [WITHDRAW_EVENT_TOPIC],
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: 'latest'
        });
        
        return { deposits: depositLogs, withdrawals: withdrawLogs };
      });
      
      const eventResults = await Promise.all(eventPromises);
      const allDepositLogs = eventResults.flatMap(r => r.deposits);
      const allWithdrawLogs = eventResults.flatMap(r => r.withdrawals);

      // Process and decode event logs
      const processedTransactions = [];
      
      // Process Deposit events
      for (const log of allDepositLogs) {
        try {
          // Decode event data
          // topics[0] = event signature (already filtered)
          // topics[1] = sender (indexed)
          // topics[2] = owner (indexed)
          // data contains: assets (uint256), shares (uint256)
          
          const sender = `0x${log.topics[1]?.slice(26).toLowerCase()}`; // Remove padding
          const owner = `0x${log.topics[2]?.slice(26).toLowerCase()}`;
          
          // Decode non-indexed parameters from data
          const dataWithoutPrefix = log.data.slice(2); // Remove '0x'
          const assets = BigInt('0x' + dataWithoutPrefix.slice(0, 64));
          const shares = BigInt('0x' + dataWithoutPrefix.slice(64, 128));
          
          // Get block timestamp
          const block = await alchemy.core.getBlock(log.blockNumber);
          
          // For deposits, the sender is the user making the deposit
          processedTransactions.push({
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            timestamp: block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
            type: 'deposit' as const,
            direction: 'in',
            user: sender, // The sender who initiated the deposit
            owner: owner, // The owner who receives the shares (could be different)
            amount: Number(assets) / 1e6, // USDC has 6 decimals
            amountUSD: Number(assets) / 1e6,
            shares: Number(shares) / 1e18, // Shares typically have 18 decimals
            asset: 'USDC',
            eventType: 'Deposit'
          });
        } catch (error) {
          console.error('Error processing deposit log:', error);
        }
      }
      
      // Process Withdraw events
      for (const log of allWithdrawLogs) {
        try {
          // Decode event data
          // topics[0] = event signature (already filtered)
          // topics[1] = sender (indexed)
          // topics[2] = receiver (indexed)
          // topics[3] = owner (indexed)
          // data contains: assets (uint256), shares (uint256)
          
          const sender = `0x${log.topics[1]?.slice(26).toLowerCase()}`;
          const receiver = `0x${log.topics[2]?.slice(26).toLowerCase()}`;
          const owner = `0x${log.topics[3]?.slice(26).toLowerCase()}`;
          
          // Decode non-indexed parameters from data
          const dataWithoutPrefix = log.data.slice(2);
          const assets = BigInt('0x' + dataWithoutPrefix.slice(0, 64));
          const shares = BigInt('0x' + dataWithoutPrefix.slice(64, 128));
          
          // Get block timestamp
          const block = await alchemy.core.getBlock(log.blockNumber);
          
          // For withdrawals, the sender is usually the user initiating the withdrawal
          processedTransactions.push({
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            blockNumber: log.blockNumber,
            timestamp: block ? new Date(block.timestamp * 1000).toISOString() : new Date().toISOString(),
            type: 'withdraw' as const,
            direction: 'out',
            user: sender, // The sender who initiated the withdrawal
            receiver: receiver, // The receiver who gets the assets
            owner: owner, // The owner of the shares being redeemed
            amount: Number(assets) / 1e6, // USDC has 6 decimals
            amountUSD: Number(assets) / 1e6,
            shares: Number(shares) / 1e18,
            asset: 'USDC',
            eventType: 'Withdraw'
          });
        } catch (error) {
          console.error('Error processing withdraw log:', error);
        }
      }
      
      // Deduplicate by txHash + logIndex
      const uniqueTransactions = new Map();
      for (const tx of processedTransactions) {
        const key = `${tx.transactionHash}-${tx.logIndex}`;
        if (!uniqueTransactions.has(key)) {
          uniqueTransactions.set(key, tx);
        }
      }
      
      const validTransfers = Array.from(uniqueTransactions.values());

      // Sort by timestamp (most recent first) and take the limit
      const sortedTransfers = validTransfers
        .sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        })
        .slice(0, limit);

      // Calculate summary
      const deposits = sortedTransfers.filter(t => t.type === 'deposit');
      const withdrawals = sortedTransfers.filter(t => t.type === 'withdraw');
      const totalVolumeUSD = sortedTransfers.reduce((sum, t) => sum + t.amountUSD, 0);

      return {
        poolId,
        poolName: pool.tokenPair,
        contractAddress: pool.poolAddress,
        network,
        transactions: sortedTransfers,
        summary: {
          totalDeposits: deposits.length,
          totalWithdrawals: withdrawals.length,
          totalVolumeUSD,
          depositsVolumeUSD: deposits.reduce((sum, t) => sum + t.amountUSD, 0),
          withdrawalsVolumeUSD: withdrawals.reduce((sum, t) => sum + t.amountUSD, 0)
        },
        pagination: {
          page: 1,
          limit,
          total: sortedTransfers.length,
          totalPages: 1
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error fetching pool transaction history:', error);
      throw error;
    }
  }

  /**
   * Track internal transfers (smart contract interactions)
   */
  async trackInternalTransfers(address: string, network: 'ethereum' | 'base' = 'ethereum') {
    try {
      const alchemy = network === 'base' ? this.alchemyBase : this.alchemyEth;

      console.log(`🔍 Tracking internal transfers for ${address.slice(0, 8)}...`);

      const internalTransfers = await alchemy.core.getAssetTransfers({
        fromAddress: address,
        category: [AssetTransfersCategory.INTERNAL],
        maxCount: 1000,
        withMetadata: true,
      });

      // Group by smart contract
      const contractInteractions = new Map<string, any[]>();
      
      for (const transfer of internalTransfers.transfers) {
        const contract = transfer.to || 'unknown';
        if (!contractInteractions.has(contract)) {
          contractInteractions.set(contract, []);
        }
        contractInteractions.get(contract)?.push(transfer);
      }

      return {
        address,
        network,
        totalInternalTransfers: internalTransfers.transfers.length,
        contractInteractions: Array.from(contractInteractions.entries()).map(([contract, transfers]) => ({
          contract,
          interactionCount: transfers.length,
          lastInteraction: transfers[0]?.metadata?.blockTimestamp,
          totalValue: transfers.reduce((sum, t) => sum + (t.value || 0), 0)
        })),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error tracking internal transfers:', error);
      throw error;
    }
  }

  /**
   * Calculate historical yield performance from transfers
   */
  private async calculateYieldPerformance(address: string, transfers: any[]) {
    try {
      // Group transfers by asset
      const assetGroups = new Map<string, any[]>();
      
      for (const transfer of transfers) {
        const asset = transfer.rawContract?.address || 'ETH';
        if (!assetGroups.has(asset)) {
          assetGroups.set(asset, []);
        }
        assetGroups.get(asset)?.push(transfer);
      }

      const yieldData: any[] = [];

      // Calculate yield for each asset
      for (const [asset, assetTransfers] of assetGroups) {
        const deposits = assetTransfers
          .filter(t => t.direction === 'received')
          .reduce((sum, t) => sum + (parseFloat(t.value || '0')), 0);

        const withdrawals = assetTransfers
          .filter(t => t.direction === 'sent')
          .reduce((sum, t) => sum + (parseFloat(t.value || '0')), 0);

        const netFlow = deposits - withdrawals;
        const firstTransfer = assetTransfers[assetTransfers.length - 1];
        const lastTransfer = assetTransfers[0];

        if (firstTransfer && lastTransfer) {
          const daysHeld = this.calculateDaysBetween(
            firstTransfer.metadata?.blockTimestamp,
            lastTransfer.metadata?.blockTimestamp
          );

          yieldData.push({
            asset,
            totalDeposits: deposits,
            totalWithdrawals: withdrawals,
            netFlow,
            daysHeld,
            transactionCount: assetTransfers.length,
            firstTransaction: firstTransfer.metadata?.blockTimestamp,
            lastTransaction: lastTransfer.metadata?.blockTimestamp
          });
        }
      }

      return yieldData;
    } catch (error) {
      console.error('Error calculating yield performance:', error);
      return [];
    }
  }

  /**
   * Analyze transfer patterns for insights
   */
  private analyzeTransferPatterns(transfers: AssetTransfersResult[]) {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Count transfers by time period
    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;

    // Track unique addresses
    const uniqueAddresses = new Set<string>();
    const whaleTransfers: any[] = [];

    for (const transfer of transfers) {
      const timestamp = new Date(transfer.metadata?.blockTimestamp || 0).getTime();
      
      if (timestamp > oneDayAgo) dailyCount++;
      if (timestamp > oneWeekAgo) weeklyCount++;
      if (timestamp > oneMonthAgo) monthlyCount++;

      // Track unique addresses
      if (transfer.from) uniqueAddresses.add(transfer.from);
      if (transfer.to) uniqueAddresses.add(transfer.to);

      // Identify whale transfers (> $100k)
      const value = parseFloat(transfer.value || '0');
      if (value > 100000) {
        whaleTransfers.push({
          from: transfer.from,
          to: transfer.to,
          value,
          timestamp: transfer.metadata?.blockTimestamp,
          hash: transfer.hash
        });
      }
    }

    return {
      dailyVolume: dailyCount,
      weeklyVolume: weeklyCount,
      monthlyVolume: monthlyCount,
      uniqueAddresses: uniqueAddresses.size,
      whaleActivity: whaleTransfers.length,
      topWhaleTransfers: whaleTransfers.slice(0, 5),
      averageTransferSize: transfers.reduce((sum, t) => sum + parseFloat(t.value || '0'), 0) / transfers.length
    };
  }

  /**
   * Calculate days between two timestamps
   */
  private calculateDaysBetween(start?: string, end?: string): number {
    if (!start || !end) return 0;
    
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const diffMs = Math.abs(endDate - startDate);
    
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Get whale alerts based on recent large transfers
   */
  async getWhaleAlerts(limit: number = 10) {
    try {
      // Get all active pools only
      const allPools = await db.select().from(pools).where(eq(pools.isActive, true));
      const whaleAlerts: any[] = [];

      for (const pool of allPools.slice(0, 5)) { // Check first 5 pools for performance
        if (!pool.poolAddress) continue;

        const network = pool.chainId === '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7' ? 'base' : 'ethereum';
        const alchemy = network === 'base' ? this.alchemyBase : this.alchemyEth;

        const transfers = await alchemy.core.getAssetTransfers({
          contractAddresses: [pool.poolAddress],
          category: [AssetTransfersCategory.ERC20],
          maxCount: 100,
          withMetadata: true,
        });

        // Find large transfers
        for (const transfer of transfers.transfers) {
          const value = parseFloat(transfer.value || '0');
          if (value > 100000) { // $100k+ transfers
            whaleAlerts.push({
              poolId: pool.id,
              poolName: pool.tokenPair,
              from: transfer.from,
              to: transfer.to,
              value,
              asset: transfer.asset,
              timestamp: transfer.metadata?.blockTimestamp,
              hash: transfer.hash,
              network
            });
          }
        }
      }

      // Sort by value and return top alerts
      return whaleAlerts
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting whale alerts:', error);
      return [];
    }
  }
}

export const enhancedTransfersService = EnhancedTransfersService.getInstance();