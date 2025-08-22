import { db } from "../db";
import { aiOutlooks, poolHistoricalData, holderHistory, tokenHolders } from "@shared/schema";
import { lt, sql } from "drizzle-orm";

interface CleanupResult {
  expiredAiPredictions: number;
  oldHistoricalData: number;
  oldHolderHistory: number;
  staleTokenHolders: number;
  deletedRecords: number;
}

/**
 * Perform comprehensive database cleanup
 */
export async function performDatabaseCleanup(): Promise<CleanupResult> {
  console.log("🧹 Starting comprehensive database cleanup...");
  
  const results: CleanupResult = {
    expiredAiPredictions: 0,
    oldHistoricalData: 0,
    oldHolderHistory: 0,
    staleTokenHolders: 0,
    deletedRecords: 0
  };

  try {
    // Clean expired AI predictions (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deletedPredictions = await db
      .delete(aiOutlooks)
      .where(lt(aiOutlooks.createdAt, oneDayAgo))
      .returning({ id: aiOutlooks.id });
    results.expiredAiPredictions = deletedPredictions.length;
    console.log(`🔄 Cleaned ${results.expiredAiPredictions} expired AI predictions`);

    // Clean old historical data (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedHistorical = await db
      .delete(poolHistoricalData)
      .where(lt(poolHistoricalData.timestamp, thirtyDaysAgo))
      .returning({ id: poolHistoricalData.id });
    results.oldHistoricalData = deletedHistorical.length;
    console.log(`📊 Cleaned ${results.oldHistoricalData} old historical data records`);

    // Clean old holder history (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deletedHolderHistory = await db
      .delete(holderHistory)
      .where(lt(holderHistory.timestamp, sevenDaysAgo))
      .returning({ id: holderHistory.id });
    results.oldHolderHistory = deletedHolderHistory.length;
    console.log(`👥 Cleaned ${results.oldHolderHistory} old holder history records`);

    // Clean stale token holder records (older than 1 day)
    const deletedTokenHolders = await db
      .delete(tokenHolders)
      .where(lt(tokenHolders.lastUpdated, oneDayAgo))
      .returning({ id: tokenHolders.id });
    results.staleTokenHolders = deletedTokenHolders.length;
    console.log(`🗑️ Cleaned ${results.staleTokenHolders} stale token holder records`);

    // Calculate total deleted records
    results.deletedRecords = 
      results.expiredAiPredictions + 
      results.oldHistoricalData + 
      results.oldHolderHistory + 
      results.staleTokenHolders;

    console.log(`✅ Database cleanup completed: ${results.deletedRecords} total records cleaned`);
    return results;
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    throw error;
  }
}