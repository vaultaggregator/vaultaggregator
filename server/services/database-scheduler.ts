import { scraperManager } from '../scrapers/scraper-manager';

class DatabaseScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start(): void {
    console.log('🚀 Starting database-first scraper scheduler...');

    // Scrape all pools every 5 minutes (APY, TVL)
    const mainScrapeInterval = setInterval(async () => {
      console.log('🔄 Starting scheduled pool data scraping...');
      await scraperManager.scrapeAllPools();
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.set('main-scrape', mainScrapeInterval);

    // Sync holder data every 30 minutes (less frequent due to API limits)
    const holderSyncInterval = setInterval(async () => {
      try {
        console.log('👥 Starting scheduled holder data sync...');
        const { HolderDataSyncService } = await import('./holderDataSyncService');
        const holderSyncService = new HolderDataSyncService();
        await holderSyncService.syncAllHolderData();
        console.log('✅ Scheduled holder data sync completed');
      } catch (error) {
        console.error('❌ Error in scheduled holder data sync:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    this.intervals.set('holder-sync', holderSyncInterval);

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