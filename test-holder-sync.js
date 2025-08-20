// Test holder sync for Steakhouse USDC pool
import { holderService } from './server/services/holderService.js';

async function testHolderSync() {
  console.log('🔄 Starting holder sync test for Steakhouse USDC pool...\n');
  
  try {
    const poolId = 'cc3590bb-9404-4829-a3c2-384aa8753daa'; // Steakhouse USDC
    
    console.log(`📊 Syncing holders for pool ${poolId}...`);
    await holderService.syncPoolHolders(poolId);
    
    console.log('\n✅ Sync completed! Checking database...');
    
    // Get holders from database
    const result = await holderService.getPoolHolders(poolId, 1, 20);
    console.log(`\n📈 Found ${result.total} holders in database`);
    
    if (result.holders.length > 0) {
      console.log('\nTop 3 holders:');
      for (let i = 0; i < Math.min(3, result.holders.length); i++) {
        const holder = result.holders[i];
        console.log(`#${holder.rank}: ${holder.holderAddress.slice(0, 10)}...`);
        console.log(`   Balance: ${parseFloat(holder.tokenBalanceFormatted).toFixed(2)} tokens`);
        console.log(`   USD Value: $${parseFloat(holder.usdValue).toFixed(2)}`);
        console.log(`   Pool Share: ${parseFloat(holder.poolSharePercentage).toFixed(2)}%\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  }
}

testHolderSync();
