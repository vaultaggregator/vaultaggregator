/**
 * Test script for simple holder count service
 */

import { simpleHolderCountService } from './server/services/simpleHolderCountService';
import { db } from './server/db';
import { pools } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testSimpleHolderCount() {
  try {
    // Test with a known pool (stETH)
    const stethPool = await db.query.pools.findFirst({
      where: eq(pools.tokenPair, 'stETH')
    });
    
    if (stethPool && stethPool.poolAddress) {
      console.log(`\n📊 Testing holder count for stETH (${stethPool.poolAddress})...`);
      const count = await simpleHolderCountService.updateHolderCount(
        stethPool.id, 
        stethPool.poolAddress
      );
      console.log(`✅ stETH holder count: ${count.toLocaleString()}`);
    }
    
    // Test with a smaller pool (STEAKUSDC)
    const steakPool = await db.query.pools.findFirst({
      where: eq(pools.tokenPair, 'STEAKUSDC')
    });
    
    if (steakPool && steakPool.poolAddress) {
      console.log(`\n📊 Testing holder count for STEAKUSDC (${steakPool.poolAddress})...`);
      const count = await simpleHolderCountService.updateHolderCount(
        steakPool.id,
        steakPool.poolAddress
      );
      console.log(`✅ STEAKUSDC holder count: ${count.toLocaleString()}`);
    }
    
    console.log('\n✅ Simple holder count service test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSimpleHolderCount();