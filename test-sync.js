import { holderService } from './server/services/holderService.js';

async function testSync() {
  console.log('🔄 Triggering holder sync for Steakhouse infiniFi USDC...\n');
  
  const poolId = 'cc3590bb-9404-4829-a3c2-384aa8753daa';
  
  try {
    await holderService.syncPoolHolders(poolId);
    
    console.log('\n📊 Checking synced data...');
    const result = await holderService.getPoolHolders(poolId, 1, 50);
    
    console.log(`✅ Total holders in database: ${result.total}`);
    console.log(`📌 Etherscan shows: 48 holders`);
    
    if (result.total < 48) {
      console.log(`\n⚠️ Still missing ${48 - result.total} holders`);
      console.log('This may be due to API limitations. Working on fetching more...');
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

testSync();
