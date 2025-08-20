async function testEtherscan() {
  const tokenAddress = '0xBEeF1f5Bd88285E5B239B6AAcb991d38ccA23Ac9';
  const apiKey = process.env.ETHERSCAN_API_KEY || '';
  
  if (!apiKey) {
    console.log('❌ ETHERSCAN_API_KEY not found');
    return;
  }
  
  console.log('Testing direct Etherscan API call for token holders...\n');
  
  // Try to get token holder list
  const url = `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=100&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Response status:', data.status);
    console.log('Response message:', data.message);
    
    if (data.result && Array.isArray(data.result)) {
      console.log(`\n✅ Found ${data.result.length} holders`);
      console.log('\nFirst 5 holders:');
      for (let i = 0; i < Math.min(5, data.result.length); i++) {
        const holder = data.result[i];
        const balance = parseFloat(holder.TokenHolderQuantity) / 1e18;
        console.log(`${i + 1}. ${holder.TokenHolderAddress}: ${balance.toFixed(4)} tokens`);
      }
    } else {
      console.log('❌ No holder data in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testEtherscan();
