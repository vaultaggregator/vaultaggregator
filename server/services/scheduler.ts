import { syncData } from "./defi-llama";
import { AIOutlookService } from "./aiOutlookService";
import { storage } from "../storage";

let defiLlamaInterval: NodeJS.Timeout | null = null;
let aiOutlookInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting data sync scheduler for DeFi Llama and AI Outlooks...");
  
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

  // Generate AI outlooks every 2 hours
  aiOutlookInterval = setInterval(async () => {
    try {
      console.log("Running scheduled AI outlook generation...");
      await generateOutlooksForActivePools();
      console.log("Scheduled AI outlook generation completed");
    } catch (error) {
      console.error("Error in scheduled AI outlook generation:", error);
    }
  }, 2 * 60 * 60 * 1000); // 2 hours

  // Clean expired outlooks every hour
  cleanupInterval = setInterval(async () => {
    try {
      console.log("Cleaning expired AI outlooks...");
      const deletedCount = await storage.deleteExpiredOutlooks();
      console.log(`Deleted ${deletedCount} expired AI outlooks`);
    } catch (error) {
      console.error("Error cleaning expired outlooks:", error);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Generate initial AI outlooks after 2 minutes (after DeFi Llama sync)
  setTimeout(async () => {
    try {
      console.log("Running initial AI outlook generation...");
      await generateOutlooksForActivePools();
      console.log("Initial AI outlook generation completed");
    } catch (error) {
      console.error("Error in initial AI outlook generation:", error);
    }
  }, 2 * 60 * 1000); // 2 minutes

  console.log("Scheduler started - syncing DeFi Llama data every 10 minutes and AI outlooks every 2 hours");
}

async function generateOutlooksForActivePools() {
  const aiOutlookService = new AIOutlookService(storage);
  
  // Get all visible pools
  const pools = await storage.getPools({ onlyVisible: true, limit: 50 });
  
  console.log(`Generating AI outlooks for ${pools.length} pools...`);
  
  for (const pool of pools) {
    try {
      // Check if this pool already has a valid outlook
      const existingOutlook = await aiOutlookService.getValidOutlook(pool.id);
      
      if (!existingOutlook) {
        console.log(`Generating outlook for pool: ${pool.tokenPair} on ${pool.platform.displayName}`);
        await aiOutlookService.generateAndSaveOutlook(pool.id);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error generating outlook for pool ${pool.id}:`, error);
      // Continue with other pools
    }
  }
}

export function stopScheduler(): void {
  console.log("Stopping scheduler...");
  
  if (defiLlamaInterval) {
    clearInterval(defiLlamaInterval);
    defiLlamaInterval = null;
  }
  
  if (aiOutlookInterval) {
    clearInterval(aiOutlookInterval);
    aiOutlookInterval = null;
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
