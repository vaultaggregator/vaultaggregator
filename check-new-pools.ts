#!/usr/bin/env tsx
/**
 * Script to check and initialize any new pools that were added
 * Run this after adding new pools to ensure they're properly configured
 */

import { db } from "./server/db";
import { pools, poolMetricsCurrent } from "./shared/schema";
import { eq, isNull, or, like, sql } from "drizzle-orm";

async function checkNewPools() {
  console.log("🔍 Checking for pools that need attention...\n");
  
  // 1. Check for pools without contract creation dates
  const poolsWithoutDates = await db.select()
    .from(pools)
    .where(isNull(pools.contractCreatedAt));
  
  if (poolsWithoutDates.length > 0) {
    console.log("⚠️ Pools without contract creation dates:");
    for (const pool of poolsWithoutDates) {
      console.log(`   - ${pool.tokenPair} (${pool.poolAddress})`);
    }
    console.log("");
  }
  
  // 2. Check for pools with generic names
  const poolsWithGenericNames = await db.select()
    .from(pools)
    .where(like(pools.tokenPair, 'Token 0x%'));
  
  if (poolsWithGenericNames.length > 0) {
    console.log("⚠️ Pools with generic names that need proper naming:");
    for (const pool of poolsWithGenericNames) {
      console.log(`   - ${pool.tokenPair} (${pool.poolAddress})`);
    }
    console.log("");
  }
  
  // 3. Check for pools without platform_pool_id
  const poolsWithoutPlatformId = await db.select()
    .from(pools)
    .where(isNull(pools.platformPoolId));
  
  if (poolsWithoutPlatformId.length > 0) {
    console.log("⚠️ Pools without platform_pool_id:");
    for (const pool of poolsWithoutPlatformId) {
      console.log(`   - ${pool.tokenPair} (${pool.poolAddress})`);
    }
    console.log("");
  }
  
  // 4. Check for pools without metrics
  const poolsWithoutMetrics = await db.raw(`
    SELECT p.token_pair, p.pool_address 
    FROM pools p
    LEFT JOIN pool_metrics_current pm ON p.id = pm.pool_id
    WHERE pm.pool_id IS NULL
  `);
  
  if (poolsWithoutMetrics.length > 0) {
    console.log("⚠️ Pools without metrics entries:");
    for (const pool of poolsWithoutMetrics) {
      console.log(`   - ${pool.token_pair} (${pool.pool_address})`);
    }
    console.log("");
  }
  
  // 5. Check pools with zero APY (might not be syncing)
  const poolsWithZeroApy = await db.raw(`
    SELECT p.token_pair, p.pool_address, pm.apy, pm.apy_status
    FROM pools p
    JOIN pool_metrics_current pm ON p.id = pm.pool_id
    WHERE pm.apy = 0 AND p.platform_id = (SELECT id FROM platforms WHERE name = 'Morpho')
  `);
  
  if (poolsWithZeroApy.length > 0) {
    console.log("⚠️ Morpho pools with 0% APY (might not be syncing):");
    for (const pool of poolsWithZeroApy) {
      console.log(`   - ${pool.token_pair}: APY ${pool.apy}%, Status: ${pool.apy_status}`);
    }
    console.log("");
  }
  
  // Summary
  const totalIssues = poolsWithoutDates.length + 
                     poolsWithGenericNames.length + 
                     poolsWithoutPlatformId.length + 
                     poolsWithoutMetrics.length +
                     poolsWithZeroApy.length;
  
  if (totalIssues === 0) {
    console.log("✅ All pools are properly configured!");
  } else {
    console.log(`📊 Total issues found: ${totalIssues}`);
    console.log("\nTo fix these issues, run: npx tsx fix-new-pool.ts");
  }
  
  process.exit(0);
}

checkNewPools().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});