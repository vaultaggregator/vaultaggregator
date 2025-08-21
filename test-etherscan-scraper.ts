/**
 * Test script for Etherscan holder count scraper
 */

import { etherscanHolderScraper } from './server/services/etherscanHolderScraper';

async function testEtherscanScraper() {
  try {
    // Test with stETH (known to have 547k+ holders)
    console.log('📊 Testing Etherscan scraper with stETH...');
    const stethAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
    const stethCount = await etherscanHolderScraper.getHolderCount(stethAddress);
    console.log(`✅ stETH holder count from Etherscan: ${stethCount.toLocaleString()}`);
    
    // Test with STEAKUSDC (smaller pool)
    console.log('\n📊 Testing with STEAKUSDC...');
    const steakAddress = '0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4';
    const steakCount = await etherscanHolderScraper.getHolderCount(steakAddress);
    console.log(`✅ STEAKUSDC holder count from Etherscan: ${steakCount.toLocaleString()}`);
    
    // Test with a Morpho vault (Gauntlet USDC Core)
    console.log('\n📊 Testing with Gauntlet USDC Core...');
    const gauntletAddress = '0x8eB67A509616cd6A7c1B3c8C21D48FF57df3d458';
    const gauntletCount = await etherscanHolderScraper.getHolderCount(gauntletAddress);
    console.log(`✅ Gauntlet USDC Core holder count from Etherscan: ${gauntletCount.toLocaleString()}`);
    
    console.log('\n✅ Etherscan scraper test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testEtherscanScraper();