#!/usr/bin/env tsx

/**
 * Manual sync script to fix stETH holder count
 * stETH has hundreds of thousands of holders but was limited to 1000
 * This script fetches up to 5000 holders for proper representation
 */

import { HolderService } from './server/services/holderService.js';
import { db } from './server/db.js';
import { pools, tokenHolders } from './shared/schema.js';
import { eq, sql } from 'drizzle-orm';

const STETH_POOL_ID = '31e292ba-a842-490b-8688-3868e18bd615';
const STETH_ADDRESS = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';

async function syncStethHolders() {
  console.log('🚀 Starting manual stETH holder sync...');
  console.log(`📊 Pool ID: ${STETH_POOL_ID}`);
  console.log(`📍 Contract: ${STETH_ADDRESS}`);
  
  try {
    // Check current holder count
    const currentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, STETH_POOL_ID));
    
    console.log(`📈 Current holder count: ${currentCount[0]?.count || 0}`);
    
    // Initialize holder service
    const holderService = new HolderService();
    
    // Sync holders (will now use 5000 limit for stETH)
    console.log('🔄 Syncing holders with increased limit (5000)...');
    await holderService.syncPoolHolders(STETH_POOL_ID);
    
    // Check new holder count
    const newCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, STETH_POOL_ID));
    
    const updatedCount = newCount[0]?.count || 0;
    console.log(`✅ New holder count: ${updatedCount}`);
    console.log(`📊 Added ${updatedCount - (currentCount[0]?.count || 0)} new holders`);
    
  } catch (error) {
    console.error('❌ Error syncing stETH holders:', error);
    process.exit(1);
  }
  
  console.log('✅ stETH holder sync complete!');
  process.exit(0);
}

// Run the sync
syncStethHolders();