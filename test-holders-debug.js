// Debug script to check holder data
import { etherscanService } from './server/services/etherscanService.js';
import { storage } from './server/storage.js';

async function debugHoldersData() {
  console.log('🔍 Debugging holders data...');
  
  try {
    // Test addresses
    const steakUSDC = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';
    const stETH = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
    
    console.log('\n📊 Testing Etherscan service directly:');
    
    // Test steakUSDC holders
    console.log(`\n🥩 steakUSDC (${steakUSDC}):`);
    try {
      const steakHolders = await etherscanService.getTokenHoldersCount(steakUSDC);
      console.log(`  Etherscan holders count: ${steakHolders}`);
      
      const steakTokenInfo = await etherscanService.getTokenInfo(steakUSDC);
      console.log(`  Token info holders: ${steakTokenInfo?.holdersCount}`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    // Test stETH holders  
    console.log(`\n🔥 stETH (${stETH}):`);
    try {
      const stethHolders = await etherscanService.getTokenHoldersCount(stETH);
      console.log(`  Etherscan holders count: ${stethHolders}`);
      
      const stethTokenInfo = await etherscanService.getTokenInfo(stETH);
      console.log(`  Token info holders: ${stethTokenInfo?.holdersCount}`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    
    console.log('\n💾 Current database pools:');
    const pools = await storage.getPools({ onlyVisible: true });
    for (const pool of pools) {
      console.log(`  ${pool.poolName}: holdersCount = ${pool.holdersCount}`);
    }
    
    console.log('\n📈 Recent holder history:');
    const steakHistory = await storage.getHolderHistory(steakUSDC, 5);
    const stethHistory = await storage.getHolderHistory(stETH, 5);
    
    console.log(`  steakUSDC recent history: ${steakHistory.length} entries`);
    steakHistory.forEach((h, i) => {
      console.log(`    ${i+1}. ${h.holdersCount} holders @ ${h.timestamp}`);
    });
    
    console.log(`  stETH recent history: ${stethHistory.length} entries`);
    stethHistory.forEach((h, i) => {
      console.log(`    ${i+1}. ${h.holdersCount} holders @ ${h.timestamp}`);
    });
    
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

debugHoldersData().then(() => {
  console.log('\n✅ Debugging complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});