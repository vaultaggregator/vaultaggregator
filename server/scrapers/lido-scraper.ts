import { BaseScraper, ScrapedData } from './base-scraper';
import type { PoolWithRelations } from '@shared/schema';

export class LidoScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Lido',
      baseUrl: 'https://eth-api.lido.fi/v1',
      rateLimit: 60 // 60 requests per minute
    });
  }

  async scrapePool(pool: PoolWithRelations): Promise<ScrapedData | null> {
    try {
      // Only scrape if this is a Lido stETH pool
      if (pool.platform.name !== 'Lido' || pool.tokenPair !== 'STETH') {
        return null;
      }

      // Fetch stETH APR from Lido's official API
      const response = await this.rateLimitedFetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!this.validateData(data)) {
        throw new Error('Invalid response format from Lido API');
      }

      // Lido returns APR as a percentage in data.data.smaApr
      const apr = parseFloat(data.data.smaApr);
      const apy = apr; // For stETH, APR ≈ APY due to continuous compounding

      const scrapedData: ScrapedData = {
        poolId: pool.id,
        apy: apy.toFixed(2),
        additionalData: {
          originalApr: data.data.smaApr,
          source: 'lido_api'
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
      data.data.smaApr &&
      (typeof data.data.smaApr === 'string' || typeof data.data.smaApr === 'number') &&
      !isNaN(parseFloat(data.data.smaApr))
    );
  }
}