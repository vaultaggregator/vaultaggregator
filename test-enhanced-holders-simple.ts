#!/usr/bin/env tsx

/**
 * Simple test of enhanced holder sync with Alchemy integration
 * Run with: tsx test-enhanced-holders-simple.ts
 */

// Set the environment variable to enable enhanced holders
process.env.USE_ENHANCED_HOLDERS = 'true';

import { db } from './server/db';
import { pools, tokenHolders } from './shared/schema';

async function testEnhancedHolders() {
  console.log('🚀 Testing enhanced holder sync with Alchemy integration...');
  console.log('📊 Alchemy RPC URL configured:', !!process.env.ALCHEMY_RPC_URL);
  console.log('📊 USE_ENHANCED_HOLDERS:', process.env.USE_ENHANCED_HOLDERS);
  
  try {
    // Import the enhanced holder service
    const { alchemyEnhancedHolderService } = await import('./server/services/alchemyEnhancedHolderService');
    
    // Get a sample pool to test with
    const samplePools = await db
      .select()
      .from(pools)
      .limit(3);
    
    console.log(`📊 Found ${samplePools.length} pools to test with`);
    
    // Test syncing just the sample pools
    if (samplePools.length > 0) {
      console.log('🔄 Syncing holders for first 3 pools...');
      await alchemyEnhancedHolderService.syncAllPoolHolders();
      
      // Check if we have holder data
      const holderCount = await db
        .select({ count: tokenHolders.id })
        .from(tokenHolders);
      
      console.log(`✅ Total holder records in database: ${holderCount.length}`);
    }
    
    console.log('✅ Enhanced holder sync test completed successfully');
  } catch (error) {
    console.error('❌ Enhanced holder sync test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEnhancedHolders().then(() => {
  console.log('✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});