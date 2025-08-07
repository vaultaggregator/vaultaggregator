import { syncData } from "./defi-llama";

let syncInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting DeFi Llama data sync scheduler...");
  
  // Initial sync
  syncData().catch(error => {
    console.error("Initial sync failed:", error);
  });

  // Schedule sync every 10 minutes (600,000 ms)
  syncInterval = setInterval(async () => {
    try {
      console.log("Running scheduled DeFi Llama sync...");
      await syncData();
    } catch (error) {
      console.error("Scheduled sync failed:", error);
    }
  }, 10 * 60 * 1000);

  console.log("Scheduler started - syncing every 10 minutes");
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
