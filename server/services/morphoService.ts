interface MorphoVault {
  id: string;
  address: string;
  name: string;
  symbol: string;
  asset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  chain: {
    id: number;
    name: string;
  };
  dailyApys: {
    apy: number;
    timestamp: number;
  }[];
  state: {
    apy: number;
    netApy: number;
    fee: number;
    timelock: number;
    totalAssets: string;
    totalAssetsUsd: number;
    curator: {
      name?: string;
    };
  };
  metadata: {
    description?: string;
    image?: string;
  };
}

interface MorphoMarket {
  id: string;
  uniqueKey: string;
  lltv: string;
  oracleAddress: string;
  irmAddress: string;
  loanAsset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  collateralAsset: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  chain: {
    id: number;
    name: string;
  };
  state: {
    supplyApy: number;
    borrowApy: number;
    netSupplyApy: number;
    netBorrowApy: number;
    fee: number;
    utilization: number;
    supplyAssets: string;
    supplyAssetsUsd: number;
    borrowAssets: string;
    borrowAssetsUsd: number;
    collateralAssets: string;
    collateralAssetsUsd: number;
  };
}

interface MorphoApiResponse<T> {
  data: T;
}

export class MorphoService {
  private static readonly BASE_URL = 'https://api.morpho.org/graphql';
  private static readonly RATE_LIMIT_DELAY = 60000; // 1 minute delay between requests to respect rate limits
  
  // GraphQL queries
  private static readonly VAULTS_QUERY = `
    query GetVaults($first: Int, $skip: Int, $chainId: Int) {
      vaults(first: $first, skip: $skip, where: { chainId: $chainId }) {
        id
        address
        name
        symbol
        asset {
          address
          symbol
          decimals
        }
        chain {
          id
          name
        }
        state {
          apy
          netApy
          fee
          timelock
          totalAssets
          totalAssetsUsd
          curator {
            name
          }
        }
        metadata {
          description
          image
        }
        dailyApys(first: 30, orderBy: timestamp, orderDirection: desc) {
          apy
          timestamp
        }
      }
    }
  `;

  private static readonly MARKETS_QUERY = `
    query GetMarkets($first: Int, $skip: Int, $chainId: Int) {
      markets(first: $first, skip: $skip, where: { chainId: $chainId }) {
        id
        uniqueKey
        lltv
        oracleAddress
        irmAddress
        loanAsset {
          address
          symbol
          name
          decimals
        }
        collateralAsset {
          address
          symbol
          name
          decimals
        }
        chain {
          id
          name
        }
        state {
          supplyApy
          borrowApy
          netSupplyApy
          netBorrowApy
          fee
          utilization
          supplyAssets
          supplyAssetsUsd
          borrowAssets
          borrowAssetsUsd
          collateralAssets
          collateralAssetsUsd
        }
      }
    }
  `;

  static async makeGraphQLRequest<T>(query: string, variables: any = {}): Promise<T | null> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        console.error(`Morpho API request failed: ${response.status}`);
        return null;
      }

      const result: MorphoApiResponse<T> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching data from Morpho API:', error);
      return null;
    }
  }

  static async getAllVaults(chainIds: number[] = [1, 42161, 8453, 137]): Promise<MorphoVault[]> {
    const allVaults: MorphoVault[] = [];
    
    for (const chainId of chainIds) {
      try {
        console.log(`Fetching Morpho vaults for chain ${chainId}...`);
        
        const response = await this.makeGraphQLRequest<{ vaults: MorphoVault[] }>(
          this.VAULTS_QUERY,
          { 
            first: 100,
            skip: 0,
            chainId 
          }
        );

        if (response?.vaults) {
          allVaults.push(...response.vaults);
          console.log(`Found ${response.vaults.length} vaults on chain ${chainId}`);
        }

        // Respect rate limits - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching vaults for chain ${chainId}:`, error);
      }
    }

    return allVaults;
  }

  static async getAllMarkets(chainIds: number[] = [1, 42161, 8453, 137]): Promise<MorphoMarket[]> {
    const allMarkets: MorphoMarket[] = [];
    
    for (const chainId of chainIds) {
      try {
        console.log(`Fetching Morpho markets for chain ${chainId}...`);
        
        const response = await this.makeGraphQLRequest<{ markets: MorphoMarket[] }>(
          this.MARKETS_QUERY,
          { 
            first: 100,
            skip: 0,
            chainId 
          }
        );

        if (response?.markets) {
          allMarkets.push(...response.markets);
          console.log(`Found ${response.markets.length} markets on chain ${chainId}`);
        }

        // Respect rate limits - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error fetching markets for chain ${chainId}:`, error);
      }
    }

    return allMarkets;
  }

  static async getVaultDetails(vaultId: string, chainId: number): Promise<MorphoVault | null> {
    const query = `
      query GetVault($id: String!, $chainId: Int!) {
        vault(id: $id, where: { chainId: $chainId }) {
          id
          address
          name
          symbol
          asset {
            address
            symbol
            decimals
          }
          chain {
            id
            name
          }
          state {
            apy
            netApy
            fee
            timelock
            totalAssets
            totalAssetsUsd
            curator {
              name
            }
          }
          metadata {
            description
            image
          }
          dailyApys(first: 90, orderBy: timestamp, orderDirection: desc) {
            apy
            timestamp
          }
        }
      }
    `;

    try {
      const response = await this.makeGraphQLRequest<{ vault: MorphoVault }>(query, {
        id: vaultId,
        chainId
      });

      return response?.vault || null;
    } catch (error) {
      console.error('Error fetching vault details from Morpho:', error);
      return null;
    }
  }

  static async getMarketDetails(marketId: string, chainId: number): Promise<MorphoMarket | null> {
    const query = `
      query GetMarket($id: String!, $chainId: Int!) {
        market(id: $id, where: { chainId: $chainId }) {
          id
          uniqueKey
          lltv
          oracleAddress
          irmAddress
          loanAsset {
            address
            symbol
            name
            decimals
          }
          collateralAsset {
            address
            symbol
            name
            decimals
          }
          chain {
            id
            name
          }
          state {
            supplyApy
            borrowApy
            netSupplyApy
            netBorrowApy
            fee
            utilization
            supplyAssets
            supplyAssetsUsd
            borrowAssets
            borrowAssetsUsd
            collateralAssets
            collateralAssetsUsd
          }
        }
      }
    `;

    try {
      const response = await this.makeGraphQLRequest<{ market: MorphoMarket }>(query, {
        id: marketId,
        chainId
      });

      return response?.market || null;
    } catch (error) {
      console.error('Error fetching market details from Morpho:', error);
      return null;
    }
  }

  // Utility method to get supported chain names
  static getChainName(chainId: number): string {
    const chainNames: { [key: number]: string } = {
      1: 'Ethereum',
      42161: 'Arbitrum',
      8453: 'Base',
      137: 'Polygon',
      747474: 'Katana',
      130: 'Unichain'
    };
    
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  // Convert Morpho vault data to our internal pool format
  static convertVaultToPool(vault: MorphoVault): any {
    return {
      poolId: vault.address,
      chain: this.getChainName(vault.chain.id),
      project: 'Morpho',
      symbol: `${vault.symbol} Vault`,
      tvlUsd: vault.state.totalAssetsUsd,
      apy: vault.state.apy * 100, // Convert to percentage
      apyBase: vault.state.netApy * 100,
      url: `https://app.morpho.org/vault?vault=${vault.address}&network=${vault.chain.id}`,
      poolMeta: vault.metadata.description || `${vault.name} Vault on ${this.getChainName(vault.chain.id)}`,
      underlyingTokens: [vault.asset.symbol],
      source: 'morpho'
    };
  }

  // Convert Morpho market data to our internal pool format  
  static convertMarketToPool(market: MorphoMarket): any {
    return {
      poolId: market.uniqueKey,
      chain: this.getChainName(market.chain.id),
      project: 'Morpho',
      symbol: `${market.loanAsset.symbol}/${market.collateralAsset.symbol}`,
      tvlUsd: market.state.supplyAssetsUsd,
      apy: market.state.supplyApy * 100, // Convert to percentage
      apyBase: market.state.netSupplyApy * 100,
      url: `https://app.morpho.org/market?id=${market.uniqueKey}&network=${market.chain.id}`,
      poolMeta: `Supply ${market.loanAsset.symbol} with ${market.collateralAsset.symbol} collateral on ${this.getChainName(market.chain.id)}`,
      underlyingTokens: [market.loanAsset.symbol],
      rewardTokens: [],
      source: 'morpho'
    };
  }
}