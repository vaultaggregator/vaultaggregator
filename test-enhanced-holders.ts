#!/usr/bin/env tsx

/**
 * Test enhanced holder sync with Alchemy integration
 * Run with: tsx test-enhanced-holders.ts
 */

import { alchemyEnhancedHolderService } from './server/services/alchemyEnhancedHolderService';

async function testEnhancedHolders() {
  console.log('🚀 Testing enhanced holder sync with Alchemy integration...');
  
  try {
    // Test syncing all pools
    await alchemyEnhancedHolderService.syncAllPoolHolders();
    
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