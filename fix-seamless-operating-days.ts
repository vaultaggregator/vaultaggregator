#!/usr/bin/env tsx

import { StandardizedMetricsService } from './server/services/standardizedMetricsService';
import { DatabaseStorage } from './server/storage';

async function fixSeamlessOperatingDays() {
  console.log('🔧 Fixing Operating Days for Seamless USDC Vault on Base...');
  
  const poolId = '883cad38-7b18-45af-8fc5-4a50400cd6fe';
  
  try {
    const storage = new DatabaseStorage();
    const metricsService = new StandardizedMetricsService(storage);
    
    // Get pool data first
    const pool = await storage.getPoolById(poolId);
    if (!pool) {
      throw new Error(`Pool ${poolId} not found`);
    }
    
    console.log(`📋 Pool: ${pool.tokenPair}`);
    console.log(`🏦 Contract: ${pool.poolAddress}`);
    console.log(`🌐 Chain: Base (chainId: 8453)`);
    console.log(`🏛️ Platform: ${pool.platform?.slug}`);
    
    // Trigger days collection specifically 
    console.log('🔄 Triggering authentic operating days collection from Basescan...');
    await metricsService.collectAllMetricsForPool(poolId, "manual");
    
    console.log('✅ Operating days collection completed!');
    console.log('🎯 The pool should now show the correct operating days instead of 30.');
    
  } catch (error) {
    console.error('❌ Error fixing operating days:', error);
    process.exit(1);
  }
}

fixSeamlessOperatingDays().then(() => {
  console.log('🎉 Seamless USDC Vault operating days fix completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});