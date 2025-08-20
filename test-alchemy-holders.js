// Test script for Alchemy holder data integration
import { AlchemyService } from './server/services/alchemyService.js';

async function testAlchemyHolders() {
  console.log('🧪 Testing Alchemy holder data integration...\n');
  
  try {
    // Initialize Alchemy service
    const alchemy = new AlchemyService();
    console.log('✅ Alchemy service initialized\n');
    
    // Test with Steakhouse USDC pool contract
    const testAddress = '0xBEeF1f5Bd88285E5B239B6AAcb991d38ccA23Ac9';
    console.log(`📊 Testing with Steakhouse USDC contract: ${testAddress}\n`);
    
    // Fetch holder data
    const holders = await alchemy.getTopTokenHolders(testAddress, 20);
    
    if (holders.length > 0) {
      console.log(`✅ Successfully fetched ${holders.length} holders!\n`);
      console.log('Top 5 holders:');
      console.log('================');
      
      for (let i = 0; i < Math.min(5, holders.length); i++) {
        const holder = holders[i];
        console.log(`#${i + 1}: ${holder.address}`);
        console.log(`    Balance: ${holder.formattedBalance.toFixed(2)} tokens\n`);
      }
    } else {
      console.log('⚠️ No holders found - checking API response...\n');
    }
    
    // Test ETH balance fetch
    if (holders.length > 0) {
      const testHolder = holders[0].address;
      const ethBalance = await alchemy.getEthBalance(testHolder);
      console.log(`\n💰 ETH Balance for top holder: ${ethBalance.toFixed(4)} ETH`);
    }
    
    // Test token price
    const price = await alchemy.getTokenPrice(testAddress);
    console.log(`\n💵 Token price: $${price}`);
    
    console.log('\n✅ Alchemy integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Alchemy integration:', error);
    console.error('\nError details:', error.message);
    console.error('\nMake sure ALCHEMY_API_KEY is properly configured');
  }
}

testAlchemyHolders();