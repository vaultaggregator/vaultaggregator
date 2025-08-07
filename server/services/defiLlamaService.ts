interface DefiLlamaPoolData {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  apyMean30d?: number;
  apyMean7d?: number;
  count?: number;
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  url?: string;
  poolMeta?: string;
  underlyingTokens?: string[];
  rewardTokens?: string[];
}

interface ChartDataPoint {
  timestamp: string;
  apy: number;
  tvlUsd: number;
}

export class DefiLlamaService {
  private static readonly BASE_URL = 'https://yields.llama.fi';
  private static readonly API_BASE_URL = 'https://api.llama.fi';

  static async getPoolDetails(poolId: string): Promise<DefiLlamaPoolData | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/pools`);
      if (!response.ok) {
        console.error(`Failed to fetch pool details: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const pools = data.data || [];
      
      // Find the pool by ID (DeFi Llama uses different pool identifiers)
      const pool = pools.find((p: DefiLlamaPoolData) => 
        p.pool === poolId || 
        p.pool.includes(poolId) ||
        poolId.includes(p.pool)
      );

      return pool || null;
    } catch (error) {
      console.error('Error fetching pool details from DeFi Llama:', error);
      return null;
    }
  }

  static async getPoolsByProject(projectName: string): Promise<DefiLlamaPoolData[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/pools`);
      if (!response.ok) {
        console.error(`Failed to fetch pools: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const pools = data.data || [];
      
      // Filter pools by project name (case insensitive)
      return pools.filter((pool: DefiLlamaPoolData) => 
        pool.project.toLowerCase().includes(projectName.toLowerCase())
      );
    } catch (error) {
      console.error('Error fetching pools from DeFi Llama:', error);
      return [];
    }
  }

  static async getPoolHistoricalData(poolId: string): Promise<ChartDataPoint[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/chart/${poolId}`);
      if (!response.ok) {
        console.error(`Failed to fetch historical data: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Transform the data to our chart format
      return data.data?.map((point: any) => ({
        timestamp: point.timestamp,
        apy: point.apy || 0,
        tvlUsd: point.tvlUsd || 0
      })) || [];
    } catch (error) {
      console.error('Error fetching historical data from DeFi Llama:', error);
      return [];
    }
  }

  static async getProtocolInfo(protocolName: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/protocol/${protocolName}`);
      if (!response.ok) {
        console.error(`Failed to fetch protocol info: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol info from DeFi Llama:', error);
      return null;
    }
  }

  static async searchPools(query: {
    chain?: string;
    project?: string;
    symbol?: string;
    minTvl?: number;
  }): Promise<DefiLlamaPoolData[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/pools`);
      if (!response.ok) {
        console.error(`Failed to fetch pools: ${response.status}`);
        return [];
      }

      const data = await response.json();
      let pools = data.data || [];
      
      // Apply filters
      if (query.chain) {
        pools = pools.filter((pool: DefiLlamaPoolData) => 
          pool.chain.toLowerCase() === query.chain!.toLowerCase()
        );
      }
      
      if (query.project) {
        pools = pools.filter((pool: DefiLlamaPoolData) => 
          pool.project.toLowerCase().includes(query.project!.toLowerCase())
        );
      }
      
      if (query.symbol) {
        pools = pools.filter((pool: DefiLlamaPoolData) => 
          pool.symbol.toLowerCase().includes(query.symbol!.toLowerCase())
        );
      }
      
      if (query.minTvl) {
        pools = pools.filter((pool: DefiLlamaPoolData) => 
          pool.tvlUsd >= query.minTvl!
        );
      }

      return pools;
    } catch (error) {
      console.error('Error searching pools from DeFi Llama:', error);
      return [];
    }
  }
}