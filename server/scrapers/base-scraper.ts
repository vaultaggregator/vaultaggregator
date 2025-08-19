import type { PoolWithRelations } from '../storage';

export interface ScrapedData {
  poolId: string;
  apy: string;
  tvl?: string;
  additionalData?: Record<string, any>;
  scrapedAt: Date;
}

export interface DataSource {
  name: string;
  baseUrl: string;
  rateLimit?: number; // requests per minute
}

export abstract class BaseScraper {
  protected dataSource: DataSource;
  protected lastRequest: number = 0;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  protected async rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
    if (this.dataSource.rateLimit) {
      const timeSinceLastRequest = Date.now() - this.lastRequest;
      const minInterval = (60 * 1000) / this.dataSource.rateLimit;
      
      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.lastRequest = Date.now();
    return fetch(url, options);
  }

  abstract scrapePool(pool: PoolWithRelations): Promise<ScrapedData | null>;
  abstract validateData(data: any): boolean;
  
  protected logError(poolId: string, error: Error): void {
    console.error(`[${this.dataSource.name}] Error scraping pool ${poolId}:`, error.message);
  }

  protected logSuccess(poolId: string, data: ScrapedData): void {
    console.log(`[${this.dataSource.name}] Successfully scraped pool ${poolId}: APY ${data.apy}%`);
  }
}