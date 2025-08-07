import { syncData } from "./defi-llama";
import { syncMorphoData } from "./morpho-data";

let syncInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting data sync scheduler for DeFi Llama and Morpho...");
  
  // Initial sync
  Promise.all([
    syncData().catch(error => {
      console.error("DeFi Llama initial sync failed:", error);
    }),
    syncMorphoData().catch(error => {
      console.error("Morpho initial sync failed:", error);
    })
  ]);

  // Schedule sync every 10 minutes (600,000 ms)
  syncInterval = setInterval(async () => {
    try {
      console.log("Running scheduled sync for DeFi Llama and Morpho...");
      // Run both syncs in parallel
      await Promise.all([
        syncData().catch(error => {
          console.error("Scheduled DeFi Llama sync failed:", error);
        }),
        syncMorphoData().catch(error => {
          console.error("Scheduled Morpho sync failed:", error);
        })
      ]);
    } catch (error) {
      console.error("Scheduled sync failed:", error);
    }
  }, 10 * 60 * 1000);

  console.log("Scheduler started - syncing DeFi Llama and Morpho data every 10 minutes");
}

export function stopScheduler(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("Scheduler stopped");
  }
}

// Start scheduler automatically when module is imported
if (process.env.NODE_ENV !== 'test') {
  startScheduler();
}
