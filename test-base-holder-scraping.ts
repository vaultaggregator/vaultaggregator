/**
 * Test script to verify Base network holder scraping via Basescan
 */

import { EtherscanHolderScraper } from './server/services/etherscanHolderScraper';
import { db } from './server/db';
import { pools, chains } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testBaseHolderScraping() {
  try {
    console.log('🔍 Testing Base network holder scraping...\n');
    
    // Get a Base network pool for testing
    const baseChain = await db.query.chains.findFirst({
      where: (chains, { eq }) => eq(chains.name, 'BASE')
    });
    
    if (!baseChain) {
      console.log('❌ Base chain not found in database');
      return;
    }
    
    // Get pools on Base network
    const basePools = await db.query.pools.findMany({
      where: (pools, { eq, and, isNotNull }) => 
        and(
          eq(pools.chainId, baseChain.id),
          isNotNull(pools.poolAddress)
        ),
      limit: 3
    });
    
    if (basePools.length === 0) {
      console.log('❌ No Base network pools found');
      return;
    }
    
    const scraper = new EtherscanHolderScraper();
    
    console.log(`Found ${basePools.length} Base pools to test:\n`);
    
    for (const pool of basePools) {
      if (pool.poolAddress) {
        console.log(`\n📊 Testing pool: ${pool.name}`);
        console.log(`   Contract: ${pool.poolAddress}`);
        
        try {
          // Test with Base network
          const baseHolderCount = await scraper.getHolderCount(pool.poolAddress, 'base');
          console.log(`   ✅ Basescan holder count: ${baseHolderCount.toLocaleString()}`);
          
          // Compare with Etherscan (should fail or return different count)
          try {
            const ethHolderCount = await scraper.getHolderCount(pool.poolAddress, 'ethereum');
            console.log(`   ℹ️  Etherscan holder count: ${ethHolderCount.toLocaleString()} (different chain)`);
          } catch (ethError) {
            console.log(`   ℹ️  Etherscan: Not found (expected - different chain)`);
          }
        } catch (error) {
          console.error(`   ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testBaseHolderScraping();