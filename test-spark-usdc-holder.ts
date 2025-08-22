/**
 * Test holder scraping for Spark USDC Vault on BASE network
 */

import { EtherscanHolderScraper } from './server/services/etherscanHolderScraper';

async function testSparkUSDCHolder() {
  try {
    const scraper = new EtherscanHolderScraper();
    const poolAddress = '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A'; // Spark USDC Vault
    
    console.log('Testing Spark USDC Vault holder count...');
    console.log('Contract address:', poolAddress);
    console.log('');
    
    // Test with BASE network (Basescan)
    console.log('Fetching from Basescan (BASE network)...');
    try {
      const baseHolders = await scraper.getHolderCount(poolAddress, 'base');
      console.log('✅ Basescan holder count:', baseHolders.toLocaleString());
    } catch (error) {
      console.log('❌ Basescan error:', error.message);
    }
    
    console.log('');
    
    // Test with Ethereum network (Etherscan) for comparison
    console.log('Fetching from Etherscan (Ethereum network) for comparison...');
    try {
      const ethHolders = await scraper.getHolderCount(poolAddress, 'ethereum');
      console.log('✅ Etherscan holder count:', ethHolders.toLocaleString());
    } catch (error) {
      console.log('❌ Etherscan error:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testSparkUSDCHolder();