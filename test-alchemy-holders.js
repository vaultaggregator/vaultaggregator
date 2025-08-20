import { AlchemyService } from './server/services/alchemyService.js';

async function testAlchemyHolders() {
  console.log('Testing Alchemy holder fetching...\n');
  
  const alchemy = new AlchemyService();
  const tokenAddress = '0xBEeF1f5Bd88285E5B239B6AAcb991d38ccA23Ac9'; // Steakhouse infiniFi USDC
  
  console.log(`Fetching holders for token: ${tokenAddress}`);
  
  // Try to get more holders
  const holders = await alchemy.getTopTokenHolders(tokenAddress, 100);
  
  console.log(`\nFound ${holders.length} holders`);
  
  if (holders.length > 0) {
    console.log('\nFirst 5 holders:');
    for (let i = 0; i < Math.min(5, holders.length); i++) {
      console.log(`${i + 1}. ${holders[i].address}: ${holders[i].formattedBalance} tokens`);
    }
  }
  
  // Check if there's a way to get more holders
  console.log('\n⚠️ Note: Alchemy API might have pagination limits');
  console.log('Etherscan shows 48 holders for this token');
}

testAlchemyHolders();
