import { scraperManager } from '../scrapers/scraper-manager';
import { serviceConfigs } from './systemMonitorService';

class DatabaseScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start(): void {
    console.log('🚀 Starting database-first scraper scheduler...');
    
    // Clear any existing intervals first
    this.stopAllServices();
    
    this.startScheduledServices();

    // Initial scrape after 10 seconds
    setTimeout(async () => {
      console.log('🚀 Performing initial pool data scraping...');
      await scraperManager.scrapeAllPools();
    }, 10000);

    console.log('✅ Database scheduler started with configurable intervals');
  }

  private startScheduledServices(): void {
    // Pool Data Sync - uses configurable interval
    this.scheduleService('poolDataSync', async () => {
      console.log('🔄 Starting scheduled pool data scraping...');
      await scraperManager.scrapeAllPools();
    });


    // Cleanup Service - disabled by default due to SQL issues
    // this.scheduleService('cleanup', async () => {
    //   try {
    //     console.log('🧹 Starting scheduled cleanup...');
    //     const { performDatabaseCleanup } = await import('./cleanupService');
    //     await performDatabaseCleanup();
    //     console.log('✅ Scheduled cleanup completed');
    //   } catch (error) {
    //     console.error('❌ Error in scheduled cleanup:', error);
    //   }
    // });

    // Morpho API Sync - uses configurable interval (optimized to reduce API calls)
    this.scheduleService('morphoApiSync', async () => {
      try {
        console.log('🔶 Starting optimized Morpho API sync...');
        const { optimizedMorphoSync } = await import('./optimized-morpho-sync');
        await optimizedMorphoSync.syncMorphoPools();
        console.log('✅ Optimized Morpho API sync completed');
      } catch (error) {
        console.error('❌ Error in Morpho API sync:', error);
      }
    });

    // Wallet Holders Sync - individual holder addresses and balances from Moralis/Alchemy
    this.scheduleService('walletHoldersSync', async () => {
      try {
        console.log('🔍 Starting scheduled wallet holders sync...');
        const { PoolHoldersService } = await import('./pool-holders-service');
        await PoolHoldersService.syncAllPoolHolders();
        console.log('✅ Scheduled wallet holders sync completed');
      } catch (error) {
        console.error('❌ Error in scheduled wallet holders sync:', error);
      }
    });

    // Holder Count Scraper - total holder counts from Etherscan/Basescan
    this.scheduleService('holderCountScraper', async () => {
      try {
        console.log('🔍 Starting scheduled holder count scraping...');
        const { EtherscanHolderScraper } = await import('./etherscan-holder-scraper');
        await EtherscanHolderScraper.scrapeAllPoolHolderCounts();
        console.log('✅ Scheduled holder count scraping completed');
      } catch (error) {
        console.error('❌ Error in scheduled holder count scraping:', error);
      }
    });

  }

  private scheduleService(serviceName: string, task: () => Promise<void>): void {
    const config = serviceConfigs[serviceName];
    if (!config || !config.enabled) {
      console.log(`⏸️ Service ${serviceName} is disabled, skipping`);
      return;
    }

    const intervalMs = config.interval * 60 * 1000; // Convert minutes to milliseconds
    console.log(`⏰ Scheduling ${serviceName} every ${config.interval} minutes`);

    const interval = setInterval(task, intervalMs);
    this.intervals.set(serviceName, interval);
  }

  updateServiceInterval(serviceName: string): void {
    console.log(`🔄 Updating interval for ${serviceName}`);
    
    // Clear existing interval
    const existingInterval = this.intervals.get(serviceName);
    if (existingInterval) {
      clearInterval(existingInterval);
      this.intervals.delete(serviceName);
      console.log(`⏹️ Stopped existing ${serviceName} interval`);
    }

    // Restart service with new configuration
    const config = serviceConfigs[serviceName];
    if (!config || !config.enabled) {
      console.log(`⏸️ Service ${serviceName} is disabled`);
      return;
    }

    // Get the appropriate task function
    let task: () => Promise<void>;
    switch (serviceName) {
      case 'poolDataSync':
        task = async () => {
          console.log('🔄 Starting scheduled pool data scraping...');
          await scraperManager.scrapeAllPools();
        };
        break;
      case 'cleanup':
        console.log('⚠️ Cleanup service is disabled due to SQL syntax issues');
        return;
      case 'morphoApiSync':
        task = async () => {
          try {
            console.log('🔶 Starting Morpho API sync...');
            await scraperManager.scrapeAllPools();
            console.log('✅ Morpho API sync completed');
          } catch (error) {
            console.error('❌ Error in Morpho API sync:', error);
          }
        };
        break;
      case 'walletHoldersSync':
        task = async () => {
          try {
            console.log('🔍 Starting scheduled wallet holders sync...');
            const { PoolHoldersService } = await import('./pool-holders-service');
            await PoolHoldersService.syncAllPoolHolders();
            console.log('✅ Scheduled wallet holders sync completed');
          } catch (error) {
            console.error('❌ Error in scheduled wallet holders sync:', error);
          }
        };
        break;
      case 'holderCountScraper':
        task = async () => {
          try {
            console.log('🔍 Starting scheduled holder count scraping...');
            const { EtherscanHolderScraper } = await import('./etherscan-holder-scraper');
            await EtherscanHolderScraper.scrapeAllPoolHolderCounts();
            console.log('✅ Scheduled holder count scraping completed');
          } catch (error) {
            console.error('❌ Error in scheduled holder count scraping:', error);
          }
        };
        break;
      default:
        console.log(`❌ Unknown service: ${serviceName}`);
        return;
    }

    this.scheduleService(serviceName, task);
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

  stopAllServices(): void {
    console.log('🛑 Emergency stop - clearing all running intervals...');
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`🚫 Force stopped ${name}`);
    });
    this.intervals.clear();
  }

  async forceUpdate(): Promise<void> {
    console.log('🔄 Force updating all pool data...');
    await scraperManager.scrapeAllPools();
  }
}

export const databaseScheduler = new DatabaseScheduler();

// Export function for immediate data collection when pools are created
export async function startPoolDataScraping(): Promise<void> {
  console.log('🚀 Starting immediate pool data scraping...');
  await scraperManager.scrapeAllPools();
}