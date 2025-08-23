// Complex holder analysis removed
import { ComprehensiveDataSyncService } from "./comprehensiveDataSyncService";
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

let comprehensiveDataInterval: NodeJS.Timeout | null = null;
let holderDataInterval: NodeJS.Timeout | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

export function startScheduler(): void {
  console.log("Starting comprehensive data sync scheduler...");

  // Comprehensive data sync every 10 minutes (APY, TVL, token info)
  const comprehensiveDataService = new ComprehensiveDataSyncService();
  comprehensiveDataInterval = setInterval(async () => {
    try {
      console.log("🔄 Running scheduled comprehensive data sync...");
      await comprehensiveDataService.syncAllPoolData();
      console.log("✅ Scheduled comprehensive data sync completed");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error in scheduled comprehensive data sync:", errorMsg);
      await logError(
        'Scheduled Comprehensive Data Sync Failed',
        'Scheduled comprehensive data synchronization failed. APY, TVL, and other pool metrics will not be updated.',
        errorMsg,
        'ComprehensiveDataSync',
        'high'
      );
    }
  }, 10 * 60 * 1000); // 10 minutes

  // Complex holder data sync removed - basic counts maintained through simple service

  // Clean expired outlooks and old data every hour
  cleanupInterval = setInterval(async () => {
    try {
      console.log("🗑️ Running scheduled pool cleanup...");
      const deletedCount = await storage.cleanupExpiredPools();
      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} expired pools`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Error in scheduled pool cleanup:", errorMsg);
      await logError(
        'Scheduled Pool Cleanup Failed',
        'Scheduled cleanup of expired pools failed. Trash bin may accumulate old pools.',
        errorMsg,
        'PoolCleanup',
        'low'
      );
    }
    try {
      console.log("Running data cleanup tasks...");
      

      
      // Complex holder data cleanup removed - only basic counts maintained
      console.log("Basic holder count functionality preserved");
      
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

  console.log("🚀 Scheduler started - Comprehensive data: 10min, Cleanup: 1h");

  // Initial comprehensive data sync after 2 minutes
  setTimeout(async () => {
    try {
      console.log("🔄 Running initial comprehensive data sync...");
      await comprehensiveDataService.syncAllPoolData();
      console.log("✅ Initial comprehensive data sync completed");
    } catch (error) {
      console.error("❌ Error in initial comprehensive data sync:", error);
    }
  }, 2 * 60 * 1000); // 2 minutes

  // Initial holder data sync after 5 minutes  
  setTimeout(async () => {
    try {
      console.log("👥 Running initial holder data sync...");
      await comprehensiveDataService.syncHolderDataLightweight();
      console.log("✅ Initial holder data sync completed");
    } catch (error) {
      console.error("❌ Error in initial holder data sync:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}



export function stopScheduler(): void {
  console.log("⏹️ Stopping scheduler...");
  
  if (comprehensiveDataInterval) {
    clearInterval(comprehensiveDataInterval);
    comprehensiveDataInterval = null;
  }
  
  if (holderDataInterval) {
    clearInterval(holderDataInterval);
    holderDataInterval = null;
  }
  
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  
  console.log("✅ Scheduler stopped");
}

// Auto-start disabled - using database scheduler instead for efficiency
// if (process.env.NODE_ENV !== 'test') {
//   startScheduler();
// }
