import { etherscanHolderScraper } from './server/services/etherscanHolderScraper';

async function testScraper() {
  console.log('🧪 Testing Etherscan scraper...\n');
  
  const testTokens = [
    { name: 'stETH', address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84' },
    { name: 'STEAKUSDC', address: '0xBEEF047a543E45807105E51A8BBEFc5950fcfBa9' },
  ];
  
  for (const token of testTokens) {
    console.log(`📊 Testing ${token.name} (${token.address})...`);
    try {
      const holderCount = await etherscanHolderScraper.getHolderCount(token.address);
      console.log(`✅ ${token.name}: ${holderCount.toLocaleString()} holders\n`);
    } catch (error) {
      console.error(`❌ ${token.name} failed:`, error, '\n');
    }
    
    // Wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('✅ Test complete!');
  process.exit(0);
}

testScraper().catch(console.error);
