/**
 * Test script to verify Morpho web scraping functionality
 */
const fetch = require('node-fetch');

async function testMorphoScraping() {
  console.log('🧪 Testing Morpho vault web scraping...');
  
  const vaultAddress = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';
  const url = `https://app.morpho.org/ethereum/vault/${vaultAddress}`;
  
  try {
    console.log(`🌐 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VaultAggregator/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`📄 Received ${html.length} characters`);
    
    // Look for TVL patterns
    const tvlPatterns = [
      /Total\s+Deposits[^$]*\$([0-9,]+(?:\.[0-9]+)?)\s*M/i,
      /\$([0-9,]+(?:\.[0-9]+)?)\s*M/g
    ];
    
    // Look for APY patterns  
    const apyPatterns = [
      /APY[^0-9]*([0-9]+(?:\.[0-9]+)?)\s*%/i,
      /([0-9]+(?:\.[0-9]+)?)\s*%[^0-9]*APY/i
    ];
    
    console.log('🔍 Searching for TVL data...');
    for (const pattern of tvlPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`💰 Found TVL match: "${matches[0]}" -> Value: ${matches[1]}`);
        const tvl = parseFloat(matches[1].replace(/,/g, '')) * 1000000; // Convert from M to actual value
        console.log(`💰 Calculated TVL: $${tvl.toLocaleString()}`);
      }
    }
    
    console.log('🔍 Searching for APY data...');
    for (const pattern of apyPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`📈 Found APY match: "${matches[0]}" -> Value: ${matches[1]}%`);
      }
    }
    
    // Check if we can find key indicators
    const indicators = [
      'Total Deposits',
      'APY',
      'Steakhouse',
      'USDC',
      '264.97M',
      '4.83'
    ];
    
    console.log('🔍 Checking for key indicators...');
    for (const indicator of indicators) {
      if (html.includes(indicator)) {
        console.log(`✅ Found indicator: "${indicator}"`);
      } else {
        console.log(`❌ Missing indicator: "${indicator}"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMorphoScraping();