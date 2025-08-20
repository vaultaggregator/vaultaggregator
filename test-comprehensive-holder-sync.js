// Comprehensive test for holder sync
import { holderService } from './server/services/holderService.js';
import { AlchemyService } from './server/services/alchemyService.js';

async function testComprehensiveSync() {
  console.log('🔬 Starting comprehensive holder sync test...\n');
  
  try {
    const poolId = 'cc3590bb-9404-4829-a3c2-384aa8753daa'; // Steakhouse infinifi USDC
    const tokenAddress = '0xBEeF1f5Bd88285E5B239B6AAcb991d38ccA23Ac9';
    
    // Step 1: Test Alchemy directly
    console.log('Step 1: Testing Alchemy API directly...');
    const alchemy = new AlchemyService();
    const alchemyHolders = await alchemy.getTopTokenHolders(tokenAddress, 20);
    console.log(`✅ Alchemy returned ${alchemyHolders.length} holders`);
    
    if (alchemyHolders.length > 0) {
      console.log('\nSample Alchemy data:');
      const sample = alchemyHolders[0];
      console.log(`  Address: ${sample.address}`);
      console.log(`  Balance: ${sample.balance}`);
      console.log(`  Formatted: ${sample.formattedBalance} tokens`);
    }
    
    // Step 2: Sync to database
    console.log('\n\nStep 2: Syncing to database...');
    await holderService.syncPoolHolders(poolId);
    console.log('✅ Sync completed');
    
    // Step 3: Verify database data
    console.log('\nStep 3: Verifying database data...');
    const dbResult = await holderService.getPoolHolders(poolId, 1, 20);
    console.log(`📊 Database has ${dbResult.total} holders`);
    
    if (dbResult.holders.length > 0) {
      console.log('\nDatabase holders (top 3):');
      for (let i = 0; i < Math.min(3, dbResult.holders.length); i++) {
        const holder = dbResult.holders[i];
        console.log(`\n#${holder.rank}: ${holder.holderAddress}`);
        console.log(`  Token Balance: ${holder.tokenBalanceFormatted}`);
        console.log(`  USD Value: $${holder.usdValue}`);
        console.log(`  ETH Balance: ${holder.walletBalanceEth} ETH`);
        console.log(`  Pool Share: ${holder.poolSharePercentage}%`);
      }
    }
    
    // Step 4: Check API response
    console.log('\n\nStep 4: Testing API endpoint...');
    const apiResponse = await fetch(`http://localhost:5000/api/pools/${poolId}/holders?page=1&limit=5`);
    const apiData = await apiResponse.json();
    
    if (apiData.holders && apiData.holders.length > 0) {
      console.log(`✅ API returned ${apiData.holders.length} holders`);
      console.log('\nFirst holder from API:');
      const first = apiData.holders[0];
      console.log(`  Address: ${first.address}`);
      console.log(`  Token Balance: ${first.tokenBalance}`);
      console.log(`  USD Value: ${first.usdValue}`);
      console.log(`  Pool Share: ${first.poolSharePercentage}%`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testComprehensiveSync();
