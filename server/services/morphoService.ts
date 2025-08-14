import { getSelfHealingService } from './selfHealingService';

// Simple in-memory cache for Morpho data
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

export interface MorphoMarket {
  uniqueKey: string;
  collateralAsset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  borrowAsset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  state: {
    borrowApy: number;
    supplyApy: number;
    utilization: number;
    totalBorrowUsd: number;
    totalSupplyUsd: number;
  };
  lltv: string;
  chain: {
    id: number;
    network: string;
  };
}

export interface MorphoVault {
  address: string;
  symbol: string;
  name: string;
  asset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  state: {
    apy: number;
    netApy: number;
    totalAssetsUsd: number;
    totalSupplyUsd: number;
    fee: number;
  };
  chain: {
    id: number;
    network: string;
  };
  curator: {
    name: string;
    image: string;
  };
}

export class MorphoService {
  private static readonly MORPHO_API_ENDPOINT = 'https://api.morpho.org/graphql';
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private cache: SimpleCache;

  constructor() {
    this.cache = new SimpleCache();
  }

  /**
   * Execute a GraphQL query against the Morpho API with self-healing
   */
  private async executeQuery(query: string, variables: any = {}): Promise<any> {
    const selfHealing = getSelfHealingService();
    
    return selfHealing.executeWithHealing(
      'morpho',
      async () => {
        console.log('🔵 Morpho API: Executing GraphQL query');
        
        const response = await fetch(MorphoService.MORPHO_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'VaultAggregator/1.0'
          },
          body: JSON.stringify({
            query: query.trim(),
            variables
          }),
          signal: AbortSignal.timeout(MorphoService.REQUEST_TIMEOUT)
        });

        if (!response.ok) {
          throw new Error(`Morpho API responded with ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error('🔴 Morpho API GraphQL errors:', data.errors);
          throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
        }

        console.log('✅ Morpho API: Query executed successfully');
        return data.data;
      },
      {
        maxRetries: 3,
        retryDelay: 2000,
        exponentialBackoff: true
      }
    );
  }

  /**
   * Fetch all Morpho vaults with their current state
   */
  async getAllVaults(chainId: number = 1): Promise<MorphoVault[]> {
    const cacheKey = `morpho_vaults_${chainId}`;
    const cachedData = this.cache.get<MorphoVault[]>(cacheKey);
    
    if (cachedData) {
      console.log('📦 Using cached Morpho vaults data');
      return cachedData;
    }

    const query = `
      query {
        vaults(first: 50, where: { chainId: ${chainId} }) {
        vaults(
          where: { chainId: $chainId }
          first: 1000
        ) {
          items {
            address
            symbol
            name
            asset {
              address
              symbol
              name
              decimals
            }
            state {
              apy
              netApy
              totalAssetsUsd
              totalSupplyUsd
              fee
            }
            chain {
              id
              network
            }
            curator {
              name
              image
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query, { chainId });
      const vaults = data.vaults?.items || [];
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, vaults, 5 * 60 * 1000);
      
      console.log(`📊 Fetched ${vaults.length} Morpho vaults from API`);
      return vaults;
    } catch (error) {
      console.error('🔴 Failed to fetch Morpho vaults:', error);
      return [];
    }
  }

  /**
   * Fetch all Morpho markets with their current state
   */
  async getAllMarkets(chainId: number = 1): Promise<MorphoMarket[]> {
    const cacheKey = `morpho_markets_${chainId}`;
    const cachedData = this.cache.get<MorphoMarket[]>(cacheKey);
    
    if (cachedData) {
      console.log('📦 Using cached Morpho markets data');
      return cachedData;
    }

    const query = `
      query GetMorphoMarkets($chainId: Int!) {
        markets(
          where: { chainId: $chainId }
          first: 1000
        ) {
          items {
            uniqueKey
            collateralAsset {
              address
              symbol
              name
              decimals
            }
            borrowAsset {
              address
              symbol
              name
              decimals
            }
            state {
              borrowApy
              supplyApy
              utilization
              totalBorrowUsd
              totalSupplyUsd
            }
            lltv
            chain {
              id
              network
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query, { chainId });
      const markets = data.markets?.items || [];
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, markets, 5 * 60 * 1000);
      
      console.log(`📊 Fetched ${markets.length} Morpho markets from API`);
      return markets;
    } catch (error) {
      console.error('🔴 Failed to fetch Morpho markets:', error);
      return [];
    }
  }

  /**
   * Get specific vault details by address
   */
  async getVaultByAddress(address: string, chainId: number = 1): Promise<MorphoVault | null> {
    const query = `
      query GetVault($address: Address!, $chainId: Int!) {
        vaultByAddress(address: $address, chainId: $chainId) {
          address
          symbol
          name
          asset {
            address
            symbol
            name
            decimals
          }
          state {
            apy
            netApy
            totalAssetsUsd
            totalSupplyUsd
            fee
          }
          chain {
            id
            network
          }
          curator {
            name
            image
          }
          allocations {
            supplyAssetsUsd
            market {
              uniqueKey
              collateralAsset {
                symbol
              }
              borrowAsset {
                symbol
              }
              state {
                borrowApy
                supplyApy
                utilization
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query, { address, chainId });
      const vault = data.vaultByAddress;
      
      if (vault) {
        console.log(`📊 Fetched Morpho vault details for ${address}`);
      }
      
      return vault || null;
    } catch (error) {
      console.error('🔴 Failed to fetch Morpho vault details:', error);
      return null;
    }
  }

  /**
   * Get historical APY data for a vault
   */
  async getVaultHistoricalData(
    address: string, 
    chainId: number = 1,
    days: number = 30
  ): Promise<Array<{ timestamp: string; apy: number; netApy: number }>> {
    const startTimestamp = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    
    const query = `
      query GetVaultHistory($address: Address!, $chainId: Int!, $startTimestamp: Int!) {
        vaultByAddress(address: $address, chainId: $chainId) {
          historicalState(
            where: { timestamp_gte: $startTimestamp }
            orderBy: { timestamp: ASC }
            first: 1000
          ) {
            items {
              timestamp
              apy
              netApy
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query, { address, chainId, startTimestamp });
      const historicalData = data.vaultByAddress?.historicalState?.items || [];
      
      console.log(`📊 Fetched ${historicalData.length} historical data points for vault ${address}`);
      return historicalData.map((item: any) => ({
        timestamp: new Date(item.timestamp * 1000).toISOString(),
        apy: item.apy,
        netApy: item.netApy
      }));
    } catch (error) {
      console.error('🔴 Failed to fetch Morpho vault historical data:', error);
      return [];
    }
  }

  /**
   * Get user positions across all Morpho markets and vaults
   */
  async getUserPositions(userAddress: string, chainId: number = 1): Promise<any> {
    const query = `
      query GetUserPositions($userAddress: Address!, $chainId: Int!) {
        user(address: $userAddress, chainId: $chainId) {
          morphoPositions {
            supplyShares
            borrowShares
            collateral
            supplyAssetsUsd
            borrowAssetsUsd
            market {
              uniqueKey
              collateralAsset {
                symbol
              }
              borrowAsset {
                symbol
              }
              state {
                supplyApy
                borrowApy
              }
            }
          }
          vaultPositions {
            supplyShares
            supplyAssetsUsd
            vault {
              address
              symbol
              state {
                apy
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query, { userAddress, chainId });
      const user = data.user;
      
      if (user) {
        console.log(`📊 Fetched Morpho positions for user ${userAddress}`);
      }
      
      return user;
    } catch (error) {
      console.error('🔴 Failed to fetch Morpho user positions:', error);
      return null;
    }
  }

  /**
   * Test connection to Morpho API
   */
  async testConnection(): Promise<boolean> {
    // Simple test query for Morpho API
    const query = `
      query {
        vaults(first: 1) {
          items {
            address
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query);
      console.log('✅ Morpho API connection test successful');
      console.log(`🔗 Found ${data.vaults?.items?.length || 0} vaults`);
      return true;
    } catch (error) {
      console.error('🔴 Morpho API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current vault metrics (TVL, holders, creation date)
   */
  async getCurrentVaultMetrics(vaultAddress: string, chainId: number = 1): Promise<{
    tvl: number;
    holders: number;
    createdAt: string;
    totalAssets: number;
  } | null> {
    const cacheKey = `vault_metrics_${vaultAddress}_${chainId}`;
    const cachedData = this.cache.get<{
      tvl: number;
      holders: number;
      createdAt: string;
      totalAssets: number;
    }>(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Using cached vault metrics for ${vaultAddress}`);
      return cachedData;
    }

    const query = `
      query GetVaultMetrics($vaultAddress: String!, $chainId: Int!) {
        vaultByAddress(address: $vaultAddress, chainId: $chainId) {
          address
          name
          symbol
          createdAt
          state {
            totalAssetsUsd
            totalSupplyUsd
            totalAssets
          }
          whitelisted
          publicAllocatorConfig {
            admin
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery(query, { vaultAddress, chainId });
      const vault = data.vaultByAddress;
      
      if (!vault) {
        console.log(`⚠️ No vault found for metrics ${vaultAddress}`);
        return null;
      }

      const result = {
        tvl: vault.state.totalAssetsUsd || vault.state.totalSupplyUsd || 0,
        holders: 0, // Placeholder - will implement proper holder count later
        createdAt: vault.createdAt || '',
        totalAssets: vault.state.totalAssets || 0
      };

      // Cache for 5 minutes
      this.cache.set(cacheKey, result, 5 * 60 * 1000);
      console.log(`📊 Fetched vault metrics for ${vaultAddress}: TVL $${result.tvl.toLocaleString()}, Holders ${result.holders}`);
      
      return result;
    } catch (error) {
      console.error(`🔴 Failed to fetch vault metrics for ${vaultAddress}:`, error);
      return null;
    }
  }

  /**
   * Get historical APY data for a vault (7d, 30d, 90d)
   */
  async getVaultHistoricalApy(vaultAddress: string, chainId: number = 1): Promise<{
    current: number;
    daily: number;
    weekly: number;
    monthly: number;
    historical7d?: Array<{x: number, y: number}>;
    historical30d?: Array<{x: number, y: number}>;
    historical90d?: Array<{x: number, y: number}>;
    historicalAllTime?: Array<{x: number, y: number}>;
  } | null> {
    const cacheKey = `vault_apy_${vaultAddress}_${chainId}`;
    const cachedData = this.cache.get<{
      current: number;
      daily: number;
      weekly: number;
      monthly: number;
      historical7d?: Array<{x: number, y: number}>;
      historical30d?: Array<{x: number, y: number}>;
      historical90d?: Array<{x: number, y: number}>;
      historicalAllTime?: Array<{x: number, y: number}>;
    }>(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Using cached APY data for vault ${vaultAddress}`);
      return cachedData;
    }

    const query = `
      query GetVaultApyData($vaultAddress: String!, $chainId: Int!, $options7d: TimeseriesOptions, $options30d: TimeseriesOptions, $options90d: TimeseriesOptions, $optionsAllTime: TimeseriesOptions) {
        vaultByAddress(address: $vaultAddress, chainId: $chainId) {
          address
          state {
            apy
            netApy
            dailyApy
            dailyNetApy
            weeklyApy
            weeklyNetApy
            monthlyApy
            monthlyNetApy
          }
          historicalState {
            apy7d: apy(options: $options7d) {
              x
              y
            }
            apy30d: apy(options: $options30d) {
              x
              y
            }
            apy90d: apy(options: $options90d) {
              x
              y
            }
            apyAllTime: apy(options: $optionsAllTime) {
              x
              y
            }
          }
        }
      }
    `;

    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60);
    const allTimeAgo = now - (500 * 24 * 60 * 60); // 500 days for all-time data

    const variables = {
      vaultAddress,
      chainId,
      options7d: {
        startTimestamp: sevenDaysAgo,
        endTimestamp: now,
        interval: "DAY"
      },
      options30d: {
        startTimestamp: thirtyDaysAgo,
        endTimestamp: now,
        interval: "DAY"
      },
      options90d: {
        startTimestamp: ninetyDaysAgo,
        endTimestamp: now,
        interval: "DAY"
      },
      optionsAllTime: {
        startTimestamp: allTimeAgo,
        endTimestamp: now,
        interval: "WEEK" // Use weekly intervals for all-time to reduce data points
      }
    };

    try {
      const data = await this.executeQuery(query, variables);
      const vault = data.vaultByAddress;
      
      if (!vault) {
        console.log(`⚠️ No vault found for address ${vaultAddress}`);
        return null;
      }

      // Use netApy (includes MORPHO rewards) to match what Morpho website displays
      const result = {
        current: vault.state.netApy || vault.state.apy || 0,
        daily: vault.state.dailyNetApy || vault.state.dailyApy || vault.state.netApy || vault.state.apy || 0,
        weekly: vault.state.weeklyNetApy || vault.state.weeklyApy || vault.state.netApy || vault.state.apy || 0,
        monthly: vault.state.monthlyNetApy || vault.state.monthlyApy || vault.state.netApy || vault.state.apy || 0,
        historical7d: vault.historicalState?.apy7d || [],
        historical30d: vault.historicalState?.apy30d || [],
        historical90d: vault.historicalState?.apy90d || [],
        historicalAllTime: vault.historicalState?.apyAllTime || []
      };

      // Cache for 10 minutes  
      this.cache.set(cacheKey, result, 10 * 60 * 1000);
      console.log(`📊 Fetched APY data for vault ${vaultAddress}: Current ${(result.current * 100).toFixed(2)}%, Weekly ${(result.weekly * 100).toFixed(2)}%`);
      
      return result;
    } catch (error) {
      console.error(`🔴 Failed to fetch APY data for vault ${vaultAddress}:`, error);
      return null;
    }
  }
}

export const morphoService = new MorphoService();