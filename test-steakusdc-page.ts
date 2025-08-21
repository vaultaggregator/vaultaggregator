import fetch from 'node-fetch';

async function checkSteakUSDCPage() {
  const address = '0xBEEF047a543E45807105E51A8BBEFc5950fcfBa9';
  const url = `https://etherscan.io/token/${address}`;
  
  console.log(`🔍 Fetching ${url}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Check various patterns for holder count
    const patterns = [
      /holders?[:\s]+([0-9,]+)/i,
      /([0-9,]+)\s+holders?/i,
      /total\s+holders?[:\s]+([0-9,]+)/i,
      /addresses[:\s]+([0-9,]+)/i
    ];
    
    let found = false;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`✅ Found pattern: ${pattern}`);
        console.log(`   Matched: "${match[0]}"`);
        console.log(`   Holder count: ${match[1]}`);
        found = true;
      }
    }
    
    if (!found) {
      console.log('❌ No holder count found with any pattern');
      // Check if it's a different type of page
      if (html.includes('Contract Address')) {
        console.log('📄 This appears to be a contract page');
      }
      if (html.includes('Token Tracker')) {
        console.log('📄 This appears to be a token tracker page');
      }
      
      // Save a snippet to debug
      const snippet = html.substring(0, 5000);
      console.log('\n📝 Page snippet (first 5000 chars):');
      console.log(snippet);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSteakUSDCPage();
