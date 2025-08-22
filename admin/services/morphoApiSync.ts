#!/usr/bin/env ts-node
/**
 * Morpho API Sync Service
 * Fast sync for Morpho protocol data
 */

import { morphoApiSync } from "../../server/services/morphoApiSync";

const SERVICE_NAME = 'morphoApiSync';
const INTERVAL_MINUTES = 3;

async function runSync() {
  console.log(`[${new Date().toISOString()}] [${SERVICE_NAME}] Starting Morpho API sync...`);
  
  try {
    await morphoApiSync.syncPoolData();
    console.log(`[${new Date().toISOString()}] [${SERVICE_NAME}] Sync completed successfully`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [${SERVICE_NAME}] Sync error:`, error);
  }
}

// Run on interval
setInterval(runSync, INTERVAL_MINUTES * 60 * 1000);

// Initial run
runSync();

console.log(`[${SERVICE_NAME}] Service started, syncing every ${INTERVAL_MINUTES} minutes`);

// Keep process alive
process.on('SIGINT', () => {
  console.log(`[${SERVICE_NAME}] Shutting down gracefully...`);
  process.exit(0);
});