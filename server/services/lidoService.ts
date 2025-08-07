import { storage } from "../storage";

export interface LidoAPRResponse {
  data: {
    smaApr: number;
    timeUnix: number;
  };
}

export interface LastAPRResponse {
  data: {
    apr: number;
    timeUnix: number;
  };
}

export class LidoService {
  private readonly baseUrl = 'https://eth-api.lido.fi/v1';

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

  async syncLidoData(): Promise<void> {
    console.log('Starting Lido data synchronization...');
    
    try {
      // Get both SMA (7-day average) and latest APR
      const [smaData, lastData] = await Promise.all([
        this.fetchSMAAPR(),
        this.fetchLastAPR()
      ]);

      // Create or update Lido platform
      let lidoPlatform = await storage.getPlatformByName('lido');
      if (!lidoPlatform) {
        lidoPlatform = await storage.createPlatform({
          name: 'lido',
          displayName: 'Lido',
          slug: 'lido',
          logoUrl: 'https://lido.fi/static/images/lido-logo.svg',
          website: 'https://lido.fi',
          isActive: true
        });
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

      // Create stETH pool using SMA APR (more stable)
      const poolData = {
        tokenPair: 'stETH',
        platformId: lidoPlatform.id,
        chainId: ethereumChain.id,
        apy: smaData.data.smaApr.toString(),
        tvl: '0', // TVL is not provided by Lido API, but we could fetch from other sources
        visibility: 'visible' as const,
        riskLevel: 'medium' as const,
        defiLlamaId: `lido-steth-${Date.now()}`, // Custom ID for Lido pools
        project: 'lido', // Data source identifier
        isActive: true,
        rawData: {
          source: 'lido',
          smaApr: smaData.data.smaApr,
          lastApr: lastData.data.apr,
          smaTimestamp: smaData.data.timeUnix,
          lastTimestamp: lastData.data.timeUnix,
          updatedAt: new Date().toISOString()
        }
      };

      // Check if pool already exists
      const existingPool = await storage.getPoolByTokenAndPlatform('stETH', lidoPlatform.id);
      
      if (existingPool) {
        // Update existing pool
        await storage.updatePool(existingPool.id, {
          apy: poolData.apy,
          project: poolData.project,
          rawData: poolData.rawData
        });
        console.log(`Updated Lido stETH pool with APY: ${smaData.data.smaApr}%`);
      } else {
        // Create new pool
        await storage.createPool(poolData);
        console.log(`Created Lido stETH pool with APY: ${smaData.data.smaApr}%`);
      }

      console.log('Lido data synchronization completed successfully');
      
    } catch (error) {
      console.error('Error syncing Lido data:', error);
      throw error;
    }
  }
}

export const lidoService = new LidoService();