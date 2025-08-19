import { scraperManager } from '../scrapers/scraper-manager';

class DatabaseScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start(): void {
    console.log('🚀 Starting database-first scraper scheduler...');

    // Scrape all pools every 5 minutes
    const mainScrapeInterval = setInterval(async () => {
      console.log('🔄 Starting scheduled pool data scraping...');
      await scraperManager.scrapeAllPools();
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.set('main-scrape', mainScrapeInterval);

    // Initial scrape after 10 seconds
    setTimeout(async () => {
      console.log('🚀 Performing initial pool data scraping...');
      await scraperManager.scrapeAllPools();
    }, 10000);

    console.log('✅ Database scheduler started - scraping every 5 minutes');
  }

  stop(): void {
    console.log('🛑 Stopping database scheduler...');
    
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`⏹️ Stopped ${name} interval`);
    });

    this.intervals.clear();
    console.log('✅ Database scheduler stopped');
  }

  async forceUpdate(): Promise<void> {
    console.log('🔄 Force updating all pool data...');
    await scraperManager.scrapeAllPools();
  }
}

export const databaseScheduler = new DatabaseScheduler();