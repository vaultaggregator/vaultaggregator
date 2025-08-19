import { BaseScraper, ScrapedData } from './base-scraper';
import type { PoolWithRelations } from '../storage';

export class MorphoScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Morpho',
      baseUrl: 'https://api.morpho.org/graphql',
      rateLimit: 30 // 30 requests per minute
    });
  }

  async scrapePool(pool: PoolWithRelations): Promise<ScrapedData | null> {
    try {
      // Only scrape if this is a Morpho pool with a valid vault address
      if (!pool.poolAddress || pool.platform.name !== 'Morpho') {
        return null;
      }

      const response = await this.rateLimitedFetch(this.dataSource.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetVault($chainId: Int!, $address: String!) {
              vaultByAddress(chainId: $chainId, address: $address) {
                state {
                  netApy
                  totalAssetsUsd
                }
              }
            }
          `,
          variables: {
            chainId: 1, // Ethereum mainnet
            address: pool.poolAddress
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!this.validateData(data)) {
        throw new Error('Invalid response format from Morpho API');
      }

      const vaultData = data.data?.vaultByAddress?.state;
      if (!vaultData) {
        throw new Error('No vault data found in response');
      }

      const scrapedData: ScrapedData = {
        poolId: pool.id,
        apy: (parseFloat(vaultData.netApy) * 100).toFixed(2),
        tvl: vaultData.totalAssetsUsd ? vaultData.totalAssetsUsd.toString() : undefined,
        additionalData: {
          netApy: vaultData.netApy,
          source: 'morpho_api'
        },
        scrapedAt: new Date()
      };

      this.logSuccess(pool.id, scrapedData);
      return scrapedData;

    } catch (error) {
      this.logError(pool.id, error as Error);
      return null;
    }
  }

  validateData(data: any): boolean {
    return (
      data &&
      data.data &&
      typeof data.data === 'object' &&
      (!data.data.vaultByAddress || (
        data.data.vaultByAddress &&
        data.data.vaultByAddress.state &&
        typeof data.data.vaultByAddress.state.netApy === 'number'
      ))
    );
  }
}