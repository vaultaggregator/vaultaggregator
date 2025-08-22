import { db } from './server/db';
import { pools } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function fetchContractCreationDate(contractAddress: string, chainId: number): Promise<Date | null> {
  try {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    
    if (!etherscanApiKey) {
      console.error('❌ ETHERSCAN_API_KEY not found in environment variables');
      return null;
    }

    console.log(`📡 Fetching contract creation for ${contractAddress} on chain ${chainId}`);

    // Etherscan V2 API supports multiple chains with the same API key
    const apiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${etherscanApiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.status === "1" && data.result && data.result.length > 0) {
      const txHash = data.result[0].txHash;
      console.log(`   Found creation tx: ${txHash}`);
      
      // Get transaction details
      const txUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
      const txResponse = await fetch(txUrl);
      const txData = await txResponse.json();
      
      if (txData.result && txData.result.blockNumber) {
        // Get block details for timestamp
        const blockNumber = parseInt(txData.result.blockNumber, 16);
        const blockUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getBlockByNumber&tag=${txData.result.blockNumber}&boolean=false&apikey=${etherscanApiKey}`;
        
        const blockResponse = await fetch(blockUrl);
        const blockData = await blockResponse.json();
        
        if (blockData.result && blockData.result.timestamp) {
          const timestamp = parseInt(blockData.result.timestamp, 16);
          const creationDate = new Date(timestamp * 1000);
          console.log(`   ✅ Contract created: ${creationDate.toISOString()}`);
          return creationDate;
        }
      }
    }
    
    console.log(`   ⚠️ Could not fetch creation date from Etherscan V2 API`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching contract creation date:`, error);
    return null;
  }
}

async function fixBaseContractDates() {
  console.log('🔧 Fixing contract creation dates for Base network pools...\n');

  // Get all Base network pools
  const basePoolsQuery = await db.execute(`
    SELECT 
      p.id,
      p.token_pair,
      p.pool_address,
      p.contract_created_at,
      n.name as network_name
    FROM pools p
    JOIN networks n ON p.chain_id = n.id
    WHERE n.name = 'base'
  `);

  const basePools = basePoolsQuery.rows;
  console.log(`📊 Found ${basePools.length} Base network pools\n`);

  let fixedCount = 0;
  
  for (const pool of basePools) {
    console.log(`Processing: ${pool.token_pair}`);
    console.log(`  Address: ${pool.pool_address}`);
    
    // Only fix if contract_created_at is not set
    if (!pool.contract_created_at) {
      console.log(`  Status: Missing creation date, fetching...`);
      
      // Base network chain ID is 8453
      const creationDate = await fetchContractCreationDate(pool.pool_address, 8453);
      
      if (creationDate) {
        // Update the pool with the contract creation date
        await db.update(pools)
          .set({ 
            contractCreatedAt: creationDate
          })
          .where(eq(pools.id, pool.id));
        
        const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  ✅ Updated: Created ${daysSinceCreation} days ago`);
        fixedCount++;
      } else {
        console.log(`  ❌ Failed to fetch creation date`);
      }
    } else {
      const existingDate = new Date(pool.contract_created_at);
      const daysSinceCreation = Math.floor((Date.now() - existingDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`  ✓ Already set: Created ${daysSinceCreation} days ago`);
    }
    
    console.log('');
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Fixed ${fixedCount} Base network pools`);
  
  // Show final status
  const updatedPoolsQuery = await db.execute(`
    SELECT 
      p.token_pair,
      p.contract_created_at,
      CASE 
        WHEN p.contract_created_at IS NOT NULL 
        THEN EXTRACT(DAY FROM NOW() - p.contract_created_at)::INTEGER
        ELSE NULL
      END as operating_days
    FROM pools p
    JOIN networks n ON p.chain_id = n.id
    WHERE n.name = 'base'
    ORDER BY p.token_pair
  `);

  console.log('\n📊 Final Status of Base Network Pools:');
  console.log('=========================================');
  for (const pool of updatedPoolsQuery.rows) {
    const status = pool.contract_created_at 
      ? `${pool.operating_days} days (since ${new Date(pool.contract_created_at).toISOString().split('T')[0]})`
      : 'NOT SET';
    console.log(`${pool.token_pair}: ${status}`);
  }
}

// Run the fix
fixBaseContractDates()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });