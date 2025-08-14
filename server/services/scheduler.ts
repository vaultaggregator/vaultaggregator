import { HolderDataSyncService } from "./holderDataSyncService";
import { storage } from "../storage";

async function logError(title: string, description: string, error: string, service: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  try {
    const { errorLogger } = await import('./errorLogger.js');
    await errorLogger.logError({
      title,
      description,
      errorType: 'Service',
      severity,
      source: 'Scheduler',
      stackTrace: error,
      fixPrompt: `Scheduled task failure detected. Check if all services are properly configured, verify database connectivity, and ensure proper error handling. This affects automated data synchronization and background tasks.`,
      metadata: {
        error,
        service,
        timestamp: new Date().toISOString(),
        operation: 'ScheduledTask'
      }
    });
  } catch (logError) {
    console.error('Failed to log Scheduler error:', logError);
  }
}

let holderDataInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting data sync scheduler for holder data...");

  // Sync holder data every 6 hours
  holderDataInterval = setInterval(async () => {
    try {
      console.log("Running scheduled holder data sync...");
      const holderSyncService = new HolderDataSyncService();
      await holderSyncService.syncAllHolderData();
      console.log("Scheduled holder data sync completed");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error in scheduled holder data sync:", errorMsg);
      await logError(
        'Scheduled Holder Data Sync Failed',
        'Scheduled holder data synchronization failed. Holder analytics and growth statistics will not be updated.',
        errorMsg,
        'HolderDataSync',
        'medium'
      );
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Clean expired outlooks and old data every hour
  cleanupInterval = setInterval(async () => {
    try {
      console.log("Running data cleanup tasks...");
      

      
      // Clean old holder data (keep last 90 days)
      const holderSyncService = new HolderDataSyncService();
      const deletedHolderRecords = await holderSyncService.cleanOldHolderData();
      console.log(`Cleaned ${deletedHolderRecords} old holder history records`);
      
      console.log("Data cleanup tasks completed");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error in data cleanup tasks:", errorMsg);
      await logError(
        'Data Cleanup Tasks Failed',
        'Scheduled data cleanup tasks failed. Old data may accumulate and affect database performance.',
        errorMsg,
        'DataCleanup',
        'low'
      );
    }
  }, 60 * 60 * 1000); // 1 hour

  console.log("Scheduler started - Holder data: 6h, Cleanup: 1h");

  // Initial holder data sync after 5 minutes
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
  
  if (holderDataInterval) {
    clearInterval(holderDataInterval);
    holderDataInterval = null;
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
