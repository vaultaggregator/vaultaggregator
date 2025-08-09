import { syncData } from "./defi-llama";
import { HolderDataSyncService } from "./holderDataSyncService";
import { storage } from "../storage";

let defiLlamaInterval: NodeJS.Timeout | null = null;
let holderDataInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting data sync scheduler for DeFi Llama and holder data...");
  
  // Initial DeFi Llama sync
  syncData().catch((error: any) => {
    console.error("DeFi Llama initial sync failed:", error);
  });

  // Schedule DeFi Llama sync every 10 minutes
  defiLlamaInterval = setInterval(async () => {
    try {
      console.log("Running scheduled DeFi Llama sync...");
      await syncData();
      console.log("Scheduled DeFi Llama sync completed");
    } catch (error) {
      console.error("Error in scheduled DeFi Llama sync:", error);
    }
  }, 10 * 60 * 1000); // 10 minutes



  // Sync holder data every 6 hours
  holderDataInterval = setInterval(async () => {
    try {
      console.log("Running scheduled holder data sync...");
      const holderSyncService = new HolderDataSyncService();
      await holderSyncService.syncAllHolderData();
      console.log("Scheduled holder data sync completed");
    } catch (error) {
      console.error("Error in scheduled holder data sync:", error);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Clean old data every hour
  cleanupInterval = setInterval(async () => {
    try {
      console.log("Running data cleanup tasks...");
      
      // Clean old holder data (keep last 90 days)
      const holderSyncService = new HolderDataSyncService();
      const deletedHolderRecords = await holderSyncService.cleanOldHolderData();
      console.log(`Cleaned ${deletedHolderRecords} old holder history records`);
      
      console.log("Data cleanup tasks completed");
    } catch (error) {
      console.error("Error in data cleanup tasks:", error);
    }
  }, 60 * 60 * 1000); // 1 hour

  console.log("Scheduler started - DeFi Llama: 10min, Holder data: 6h, Cleanup: 1h");

  // Initial holder data sync after 5 minutes (after DeFi Llama sync)
  setTimeout(async () => {
    try {
      console.log("Running initial holder data sync...");
      const holderSyncService = new HolderDataSyncService();
      await holderSyncService.syncAllHolderData();
      console.log("Initial holder data sync completed");
    } catch (error) {
      console.error("Error in initial holder data sync:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}



export function stopScheduler(): void {
  console.log("Stopping scheduler...");
  
  if (defiLlamaInterval) {
    clearInterval(defiLlamaInterval);
    defiLlamaInterval = null;
  }
  

  
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  
  console.log("Scheduler stopped");
}

// Start scheduler automatically when module is imported
if (process.env.NODE_ENV !== 'test') {
  startScheduler();
}
