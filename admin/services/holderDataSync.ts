#!/usr/bin/env ts-node
/**
 * Holder Data Sync Service
 * Updates token holder counts
 */

import { simpleHolderCountService } from "../../server/services/simpleHolderCountService";

const SERVICE_NAME = 'holderDataSync';
const INTERVAL_MINUTES = 30;

async function syncHolderData() {
  console.log(`[${new Date().toISOString()}] [${SERVICE_NAME}] Starting holder count update...`);
  
  try {
    await simpleHolderCountService.updateAllPoolHolderCounts();
    console.log(`[${new Date().toISOString()}] [${SERVICE_NAME}] Holder counts updated successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${SERVICE_NAME}] Update error:`, error);
  }
}

// Run on interval
setInterval(syncHolderData, INTERVAL_MINUTES * 60 * 1000);

// Initial run
syncHolderData();

console.log(`[${SERVICE_NAME}] Service started, updating every ${INTERVAL_MINUTES} minutes`);

// Keep process alive
process.on('SIGINT', () => {
  console.log(`[${SERVICE_NAME}] Shutting down gracefully...`);
  process.exit(0);
});