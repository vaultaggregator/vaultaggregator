#!/usr/bin/env tsx

// Direct approach to fix Base chain operating days using Basescan API
async function fixBaseChainOperatingDays() {
  console.log('🔧 Fixing Operating Days for Seamless USDC Vault using direct Basescan API...');
  
  const poolId = '883cad38-7b18-45af-8fc5-4a50400cd6fe';
  const contractAddress = '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738';
  const chainId = 8453; // Base chain
  
  try {
    // Check if we have ETHERSCAN_API_KEY
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      console.log('⚠️ ETHERSCAN_API_KEY not found, trying fallback method...');
      
      // Fallback: Use public API to get first transaction
      const fallbackUrl = `https://api.basescan.org/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=demo`;
      
      console.log('🔍 Querying Basescan for first transaction...');
      const response = await fetch(fallbackUrl);
      
      if (!response.ok) {
        throw new Error(`Basescan API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Basescan response status:', data.status);
      
      if (data.status === "1" && data.result && data.result.length > 0) {
        const firstTx = data.result[0];
        const creationTimestamp = parseInt(firstTx.timeStamp) * 1000;
        const creationDate = new Date(creationTimestamp);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`📅 Contract creation date: ${creationDate.toDateString()}`);
        console.log(`📊 Contract has been operating for ${daysDiff} days`);
        
        // Update the pool metrics in database
        const { db } = await import('./server/db');
        const { poolMetricsCurrent } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        // Update or insert the days metric
        await db.insert(poolMetricsCurrent).values({
          poolId,
          metricType: 'days',
          status: 'success',
          value: daysDiff.toString(),
          error: null,
          lastUpdated: new Date()
        }).onConflictDoUpdate({
          target: [poolMetricsCurrent.poolId, poolMetricsCurrent.metricType],
          set: {
            status: 'success',
            value: daysDiff.toString(),
            error: null,
            lastUpdated: new Date()
          }
        });
        
        console.log('✅ Successfully updated operating days in database!');
        console.log(`🎯 Pool now shows ${daysDiff} operating days instead of the hardcoded 30.`);
        
      } else {
        console.log('❌ No transactions found for this contract address');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
      
    } else {
      console.log('🔑 Using authenticated Etherscan V2 API...');
      // Use Etherscan V2 unified API with chain ID for Base
      const apiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${etherscanApiKey}`;
      
      console.log('🔍 Querying Etherscan V2 for contract creation...');
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === "1" && data.result && data.result.length > 0) {
        const txHash = data.result[0].txHash;
        console.log(`📋 Found creation transaction: ${txHash}`);
        
        // Get transaction details to find block timestamp
        const txUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
        
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();
        
        if (txData.result && txData.result.blockNumber) {
          console.log(`📦 Found block number: ${parseInt(txData.result.blockNumber, 16)}`);
          
          // Get block details for timestamp
          const blockUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=block&action=getblockreward&blockno=${parseInt(txData.result.blockNumber, 16)}&apikey=${etherscanApiKey}`;
          
          const blockResponse = await fetch(blockUrl);
          const blockData = await blockResponse.json();
          
          if (blockData.result && blockData.result.timeStamp) {
            const creationDate = new Date(parseInt(blockData.result.timeStamp) * 1000);
            const currentDate = new Date();
            const daysDiff = Math.floor((currentDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log(`📅 Contract creation date: ${creationDate.toDateString()}`);
            console.log(`📊 Contract has been operating for ${daysDiff} days`);
            
            // Update the pool metrics in database
            const { db } = await import('./server/db');
            const { poolMetricsCurrent } = await import('@shared/schema');
            
            // Update or insert the days metric
            await db.insert(poolMetricsCurrent).values({
              poolId,
              metricType: 'days',
              status: 'success',
              value: daysDiff.toString(),
              error: null,
              lastUpdated: new Date()
            }).onConflictDoUpdate({
              target: [poolMetricsCurrent.poolId, poolMetricsCurrent.metricType],
              set: {
                status: 'success',
                value: daysDiff.toString(),
                error: null,
                lastUpdated: new Date()
              }
            });
            
            console.log('✅ Successfully updated operating days in database!');
            console.log(`🎯 Pool now shows ${daysDiff} operating days instead of the hardcoded 30.`);
          } else {
            console.log('❌ Could not get block timestamp');
          }
        } else {
          console.log('❌ Could not get transaction block number');
        }
        
      } else {
        console.log('❌ Contract creation data not found via authenticated API');
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing operating days:', error);
    process.exit(1);
  }
}

fixBaseChainOperatingDays().then(() => {
  console.log('🎉 Base chain operating days fix completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});