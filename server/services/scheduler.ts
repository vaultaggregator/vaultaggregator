import { syncData } from "./defi-llama";

import { storage } from "../storage";

let defiLlamaInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting data sync scheduler for DeFi Llama...");
  
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



  console.log("Scheduler started - DeFi Llama: 10min")
}



export function stopScheduler(): void {
  console.log("Stopping scheduler...");
  
  if (defiLlamaInterval) {
    clearInterval(defiLlamaInterval);
    defiLlamaInterval = null;
  }
  
  console.log("Scheduler stopped");
}

// Start scheduler automatically when module is imported
if (process.env.NODE_ENV !== 'test') {
  startScheduler();
}
