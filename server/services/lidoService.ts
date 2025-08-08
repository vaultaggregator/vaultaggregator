import { storage } from "../storage";

export interface LidoAPRResponse {
  data: {
    aprs: Array<{
      timeUnix: number;
      apr: number;
    }>;
    smaApr: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}

export interface LastAPRResponse {
  data: {
    apr: number;
    timeUnix: number;
  };
}

export interface WithdrawalTimeResponse {
  requestInfo: {
    finalizationIn: number;
    finalizationAt: string;
    type: string;
  };
  status: string;
  nextCalculationAt: string;
}

export interface LidoRewardHistoryResponse {
  data: {
    totals: {
      address: string;
      ethValue: number;
      currencyValue: number;
      currency: string;
      sumRewards: number;
      sumSentTransfers: number;
      sumReceivedTransfers: number;
    };
    events: Array<{
      type: string;
      blockTime: number;
      blockNumber: number;
      transactionHash: string;
      tokenAmount: string;
      currencyAmount: number;
      apr: number;
    }>;
  };
}

export class LidoService {
  private readonly baseUrl = 'https://eth-api.lido.fi/v1';
  private readonly withdrawalApiUrl = 'https://wq-api.lido.fi/v2';
  private readonly rewardHistoryUrl = 'https://reward-history-backend.lido.fi';

  async fetchSMAAPR(): Promise<LidoAPRResponse> {
    const response = await fetch(`${this.baseUrl}/protocol/steth/apr/sma`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lido SMA APR: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchLastAPR(): Promise<LastAPRResponse> {
    const response = await fetch(`${this.baseUrl}/protocol/steth/apr/last`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Lido Last APR: ${response.statusText}`);
    }
    return response.json();
  }

  async fetchWithdrawalQueueTime(): Promise<WithdrawalTimeResponse | null> {
    try {
      const response = await fetch(`${this.withdrawalApiUrl}/request-time/calculate`);
      if (!response.ok) {
        console.warn(`Withdrawal queue API returned ${response.status}: ${response.statusText}`);
        return null;
      }
      return response.json();
    } catch (error) {
      console.warn('Failed to fetch withdrawal queue data:', error);
      return null;
    }
  }

  async fetchProtocolTVL(): Promise<number | null> {
    try {
      // Using DeFiLlama API to get Lido TVL since it's not available in Lido's direct API
      const response = await fetch('https://api.llama.fi/protocol/lido');
      if (!response.ok) {
        console.warn(`TVL API returned ${response.status}: ${response.statusText}`);
        return null;
      }
      const data = await response.json();
      // Get the latest TVL value
      const latestTVL = data.currentChainTvls?.Ethereum || data.tvl?.[data.tvl?.length - 1]?.totalLiquidityUSD;
      return latestTVL || null;
    } catch (error) {
      console.warn('Failed to fetch protocol TVL:', error);
      return null;
    }
  }

  async fetchRewardHistory(address: string = '0x0000000000000000000000000000000000000000', limit: number = 10): Promise<LidoRewardHistoryResponse | null> {
    try {
      const response = await fetch(`${this.rewardHistoryUrl}/?address=${address}&limit=${limit}&onlyRewards=true`);
      if (!response.ok) {
        console.warn(`Reward history API returned ${response.status}: ${response.statusText}`);
        return null;
      }
      return response.json();
    } catch (error) {
      console.warn('Failed to fetch reward history:', error);
      return null;
    }
  }

  async syncData(): Promise<void> {
    console.log('Starting comprehensive Lido data synchronization...');
    
    try {
      // Fetch all available data sources in parallel for efficiency
      const [smaData, lastData, withdrawalData, tvlData] = await Promise.all([
        this.fetchSMAAPR(),
        this.fetchLastAPR(),
        this.fetchWithdrawalQueueTime(),
        this.fetchProtocolTVL()
      ]);

      console.log('Fetched Lido data:', {
        smaApr: smaData.data.smaApr,
        lastApr: lastData.data.apr,
        tvl: tvlData ? `$${(tvlData / 1e9).toFixed(2)}B` : 'N/A',
        withdrawalQueue: withdrawalData?.requestInfo ? `${withdrawalData.requestInfo.finalizationIn / 86400} days` : 'N/A'
      });

      // Create or update Lido platform
      let lidoPlatform = await storage.getPlatformByName('lido');
      if (!lidoPlatform) {
        try {
          lidoPlatform = await storage.createPlatform({
            name: 'lido',
            displayName: 'Lido',
            slug: 'lido',
            logoUrl: 'https://lido.fi/static/images/lido-logo.svg',
            website: 'https://lido.fi',
            isActive: true
          });
        } catch (error) {
          console.log('Platform already exists, fetching existing Lido platform...');
          lidoPlatform = await storage.getPlatformBySlug('lido');
          if (!lidoPlatform) {
            throw error;
          }
        }
      }

      // Get or create Ethereum chain
      let ethereumChain = await storage.getChainByName('ethereum');
      if (!ethereumChain) {
        ethereumChain = await storage.createChain({
          name: 'ethereum',
          displayName: 'Ethereum',
          isActive: true
        });
      }

      // Build comprehensive rawData with all available information
      const comprehensiveRawData = {
        source: 'lido',
        // APR Data
        smaApr: smaData.data.smaApr,
        lastApr: lastData.data.apr,
        smaTimestamp: smaData.data.timeUnix,
        lastTimestamp: lastData.data.timeUnix,
        // Historical APR data (7-day trend)
        historicalAprs: smaData.data.aprs,
        // TVL Data
        tvlUsd: tvlData,
        // Withdrawal Queue Data
        withdrawalQueue: withdrawalData ? {
          finalizationIn: withdrawalData.requestInfo.finalizationIn,
          finalizationAt: withdrawalData.requestInfo.finalizationAt,
          finalizationInDays: Math.round(withdrawalData.requestInfo.finalizationIn / 86400 * 100) / 100,
          status: withdrawalData.status,
          nextCalculationAt: withdrawalData.nextCalculationAt,
          type: withdrawalData.requestInfo.type
        } : null,
        // Protocol Information
        protocol: {
          name: 'Lido Finance',
          type: 'Liquid Staking',
          network: 'Ethereum',
          token: 'stETH',
          riskFactors: [
            'Smart contract risk',
            'Validator slashing risk',
            'Ethereum consensus risk'
          ]
        },
        // Metadata
        updatedAt: new Date().toISOString(),
        apiEndpoints: {
          smaApr: `${this.baseUrl}/protocol/steth/apr/sma`,
          lastApr: `${this.baseUrl}/protocol/steth/apr/last`,
          withdrawalQueue: `${this.withdrawalApiUrl}/request-time/calculate`,
          tvl: 'https://api.llama.fi/protocol/lido'
        }
      };

      // Create pool data with proper TVL formatting
      const poolData = {
        tokenPair: 'stETH',
        platformId: lidoPlatform.id,
        chainId: ethereumChain.id,
        apy: smaData.data.smaApr.toString(),
        tvl: tvlData ? tvlData.toString() : '35000000000', // Fallback to known approximate value
        riskLevel: 'low' as const, // Lido is considered lower risk due to its size and track record
        defiLlamaId: 'lido-steth', // Use consistent ID for Lido
        project: 'lido',
        isVisible: false,
        isActive: true,
        rawData: comprehensiveRawData
      };

      // Check if pool already exists
      const existingPool = await storage.getPoolByTokenAndPlatform('stETH', lidoPlatform.id);
      
      if (existingPool) {
        // Update existing pool with comprehensive data
        await storage.updatePool(existingPool.id, {
          apy: poolData.apy,
          tvl: poolData.tvl,
          project: poolData.project,
          rawData: poolData.rawData
        });
        console.log(`Updated Lido stETH pool with comprehensive data - APY: ${smaData.data.smaApr}%, TVL: $${tvlData ? (tvlData / 1e9).toFixed(2) + 'B' : 'N/A'}`);
      } else {
        // Create new pool
        await storage.createPool(poolData);
        console.log(`Created Lido stETH pool with comprehensive data - APY: ${smaData.data.smaApr}%, TVL: $${tvlData ? (tvlData / 1e9).toFixed(2) + 'B' : 'N/A'}`);
      }

      console.log('Comprehensive Lido data synchronization completed successfully');
      
    } catch (error) {
      console.error('Error syncing Lido data:', error);
      throw error;
    }
  }
}

export const lidoService = new LidoService();