#!/usr/bin/env ts-node
/**
 * Pool Data Sync Service
 * Runs as a PM2 managed service for better reliability
 */

import { db } from "../../server/db";
import { pools } from "../../shared/schema";
import { eq } from "drizzle-orm";

const SERVICE_NAME = 'poolDataSync';
const INTERVAL_MINUTES = 5; // Default interval

async function syncPoolData() {
  console.log(`[${new Date().toISOString()}] Starting pool data sync...`);
  
  try {
    // Get all pools from database
    const allPools = await db.select().from(pools);
    console.log(`Found ${allPools.length} pools to sync`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const pool of allPools) {
      try {
        // Simple update simulation - in production would call actual scrapers
        const mockApy = (Math.random() * 10 + 5).toFixed(2); // 5-15% APY
        const mockTvl = Math.floor(Math.random() * 1000000000); // Up to 1B TVL
        
        await db.update(pools)
          .set({
            apy: mockApy,
            tvl: mockTvl.toString(),
            lastUpdated: new Date()
          })
          .where(eq(pools.id, pool.id));
        
        successCount++;
        console.log(`✅ Updated pool ${pool.tokenPair}: APY ${mockApy}%`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to sync pool ${pool.tokenPair}:`, error);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Sync complete: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal sync error:`, error);
  }
}

// Run the sync on interval
setInterval(syncPoolData, INTERVAL_MINUTES * 60 * 1000);

// Initial sync
syncPoolData();

console.log(`[${SERVICE_NAME}] Service started, syncing every ${INTERVAL_MINUTES} minutes`);

// Keep process alive
process.on('SIGINT', () => {
  console.log(`[${SERVICE_NAME}] Shutting down gracefully...`);
  process.exit(0);
});