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
  
  // Import cache service
  private static cacheService = (() => {
    try {
      const { cacheService } = require('./cacheService');
      return cacheService;
    } catch {
      return null;
    }
  })();

  private static async logError(title: string, description: string, error: string, endpoint: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    try {
      const { errorLogger } = await import('./errorLogger.js');
      await errorLogger.logError({
        title,
        description,
        errorType: 'API',
        severity,
        source: 'DefiLlamaService',
        stackTrace: error,
        fixPrompt: `DeFi Llama API issue detected. Check if the DeFi Llama service is operational, verify network connectivity, and consider implementing retry logic. This affects pool data, APY rates, and TVL information. Endpoint: ${endpoint}`,
        metadata: {
          endpoint,
          error,
          timestamp: new Date().toISOString(),
          service: 'DeFi Llama'
        }
      });
    } catch (logError) {
      console.error('Failed to log DeFi Llama error:', logError);
    }
  }

  static async getPoolDetails(poolId: string): Promise<DefiLlamaPoolData | null> {
    const cacheKey = `defi-llama:pool-details:${poolId}`;
    
    try {
      // Try cache first
      if (this.cacheService) {
        const cached = this.cacheService.get<DefiLlamaPoolData>(cacheKey);
        if (cached) {
          console.log(`Pool details for ${poolId} served from cache`);
          return cached;
        }
      }

      const response = await fetch(`${this.BASE_URL}/pools`);
      if (!response.ok) {
        const errorMsg = `Failed to fetch pool details: ${response.status}`;
        console.error(errorMsg);
        
        await this.logError(
          'DeFi Llama Pool Details API Error',
          `Failed to fetch pool details from DeFi Llama API with status ${response.status}. This affects individual pool information display and data accuracy.`,
          errorMsg,
          `${this.BASE_URL}/pools`,
          response.status >= 500 ? 'high' : 'medium'
        );
        
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

      // Cache the result if found
      if (pool && this.cacheService) {
        this.cacheService.set(cacheKey, pool, 'DefiLlama', 10 * 60 * 1000);
        console.log(`Cached pool details for ${poolId}`);
      }

      return pool || null;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error fetching pool details from DeFi Llama:', errorMsg);
      
      await this.logError(
        'DeFi Llama Pool Details Network Error',
        `Network error while fetching pool details from DeFi Llama. This may be due to connectivity issues, server downtime, or DNS problems. Pool detail pages will show cached or incomplete data.`,
        errorMsg,
        `${this.BASE_URL}/pools`,
        'high'
      );
      
      return null;
    }
  }

  static async getPoolsByProject(projectName: string): Promise<DefiLlamaPoolData[]> {
    const cacheKey = `defi-llama:pools-by-project:${projectName.toLowerCase()}`;
    
    try {
      // Try cache first
      if (this.cacheService) {
        const cached = this.cacheService.get<DefiLlamaPoolData[]>(cacheKey);
        if (cached) {
          console.log(`Pools for project ${projectName} served from cache (${cached.length} pools)`);
          return cached;
        }
      }

      const response = await fetch(`${this.BASE_URL}/pools`);
      if (!response.ok) {
        const errorMsg = `Failed to fetch pools: ${response.status}`;
        console.error(errorMsg);
        
        await this.logError(
          'DeFi Llama Pools by Project API Error',
          `Failed to fetch pools for project "${projectName}" from DeFi Llama API with status ${response.status}. This affects project-specific pool listings and filtering.`,
          errorMsg,
          `${this.BASE_URL}/pools`,
          response.status >= 500 ? 'high' : 'medium'
        );
        
        return [];
      }

      const data = await response.json();
      const pools = data.data || [];
      
      // Filter pools by project name (case insensitive)
      const filtered = pools.filter((pool: DefiLlamaPoolData) => 
        pool.project.toLowerCase().includes(projectName.toLowerCase())
      );

      // Cache the filtered results
      if (this.cacheService && filtered.length > 0) {
        this.cacheService.set(cacheKey, filtered, 'DefiLlama', 10 * 60 * 1000);
        console.log(`Cached ${filtered.length} pools for project ${projectName}`);
      }
      
      return filtered;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error fetching pools from DeFi Llama:', errorMsg);
      
      await this.logError(
        'DeFi Llama Pools by Project Network Error',
        `Network error while fetching pools for project "${projectName}" from DeFi Llama. This may be due to connectivity issues or server problems. Project filtering will show incomplete results.`,
        errorMsg,
        `${this.BASE_URL}/pools`,
        'high'
      );
      
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