// Test Etherscan data directly
import fetch from 'node-fetch';

async function testEtherscanDirect() {
  console.log('Testing Etherscan web scraping directly...');
  
  const steakUSDC = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';
  const etherscanUrl = `https://etherscan.io/token/${steakUSDC}`;
  
  try {
    const response = await fetch(etherscanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP ${response.status}: ${response.statusText}`);
      return;
    }
    
    const html = await response.text();
    
    // Extract holders count from HTML
    const holdersMatch = html.match(/Holders[^>]*?(\d{1,3}(?:,\d{3})*)/);
    if (holdersMatch) {
      const holdersCount = parseInt(holdersMatch[1].replace(/,/g, ''));
      console.log(`🥩 steakUSDC current Etherscan holders: ${holdersCount}`);
    } else {
      console.log('❌ Could not extract holders count from Etherscan page');
      
      // Debug: Look for holders pattern
      const holdersPatterns = [
        /Holders[^>]*?(\d{1,3}(?:,\d{3})*)/,
        /"holders"[^>]*?(\d{1,3}(?:,\d{3})*)/i,
        /token holder[s]?[^>]*?(\d{1,3}(?:,\d{3})*)/i
      ];
      
      for (let i = 0; i < holdersPatterns.length; i++) {
        const match = html.match(holdersPatterns[i]);
        if (match) {
          console.log(`Pattern ${i+1} match: ${match[1]}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEtherscanDirect();