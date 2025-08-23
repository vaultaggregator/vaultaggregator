import { etherscanWebScraper } from './server/services/etherscanWebScraper.js';

async function testScraper() {
  console.log('🧪 Testing web scraper with Base network...');
  
  // Test with Steakhouse USDC on Base
  const baseContract = '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183';
  const ethereumContract = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'; // STETH
  
  console.log('\n--- Testing Base Network (Basescan) ---');
  const baseHolders = await etherscanWebScraper.getEnrichedTopHolders(baseContract, 'base', 10);
  console.log(`Results: ${baseHolders.length} holders found`);
  if (baseHolders.length > 0) {
    console.log('Sample holder:', baseHolders[0]);
  }
  
  console.log('\n--- Testing Ethereum Network (Etherscan) ---');
  const ethHolders = await etherscanWebScraper.getEnrichedTopHolders(ethereumContract, 'ethereum', 10);
  console.log(`Results: ${ethHolders.length} holders found`);
  if (ethHolders.length > 0) {
    console.log('Sample holder:', ethHolders[0]);
  }
}

testScraper().catch(console.error);