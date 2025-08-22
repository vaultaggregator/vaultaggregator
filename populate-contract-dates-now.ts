import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq, isNull } from "drizzle-orm";

async function populateContractDates() {
  console.log("📅 Populating contract creation dates for pools without them...");
  
  // Find pools without contract creation dates
  const poolsWithoutDates = await db
    .select()
    .from(pools)
    .where(isNull(pools.contractCreatedAt));
  
  console.log(`Found ${poolsWithoutDates.length} pools without contract creation dates`);
  
  for (const pool of poolsWithoutDates) {
    if (!pool.poolAddress) {
      console.log(`⚠️ Skipping ${pool.tokenPair} - no contract address`);
      continue;
    }
    
    console.log(`📅 Processing ${pool.tokenPair} on ${pool.chainId}...`);
    
    try {
      // Get chain info
      const { chains } = await import("./shared/schema");
      const [chainInfo] = await db
        .select()
        .from(chains)
        .where(eq(chains.id, pool.chainId));
      
      const chainName = chainInfo?.name?.toLowerCase() || 'ethereum';
      const etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
      
      if (!etherscanApiKey) {
        console.log(`⚠️ ETHERSCAN_API_KEY not configured`);
        break;
      }
      
      // Determine API URL based on network
      let apiUrl = '';
      if (chainName === 'base') {
        apiUrl = `https://api.basescan.org/api?module=contract&action=getcontractcreation&contractaddresses=${pool.poolAddress}&apikey=${etherscanApiKey}`;
      } else if (chainName === 'ethereum') {
        apiUrl = `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${pool.poolAddress}&apikey=${etherscanApiKey}`;
      } else {
        console.log(`⚠️ Unsupported network: ${chainName}`);
        continue;
      }
      
      console.log(`🔍 Fetching from ${chainName === 'base' ? 'Basescan' : 'Etherscan'}...`);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status === "1" && data.result && data.result.length > 0) {
        const txHash = data.result[0].txHash;
        
        // Get transaction details
        let txUrl = '';
        if (chainName === 'base') {
          txUrl = `https://api.basescan.org/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
        } else {
          txUrl = `https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
        }
        
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();
        
        if (txData.result && txData.result.blockNumber) {
          // Get block details for timestamp
          let blockUrl = '';
          if (chainName === 'base') {
            blockUrl = `https://api.basescan.org/api?module=proxy&action=eth_getBlockByNumber&tag=${txData.result.blockNumber}&boolean=true&apikey=${etherscanApiKey}`;
          } else {
            blockUrl = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${txData.result.blockNumber}&boolean=true&apikey=${etherscanApiKey}`;
          }
          
          const blockResponse = await fetch(blockUrl);
          const blockData = await blockResponse.json();
          
          if (blockData.result && blockData.result.timestamp) {
            const creationTimestamp = parseInt(blockData.result.timestamp, 16) * 1000;
            const creationDate = new Date(creationTimestamp);
            
            // Store the contract creation date in the database
            await db.update(pools)
              .set({ contractCreatedAt: creationDate })
              .where(eq(pools.id, pool.id));
            
            const daysDiff = Math.floor((Date.now() - creationTimestamp) / (1000 * 60 * 60 * 24));
            console.log(`✅ Stored creation date for ${pool.tokenPair}: ${daysDiff} days ago (${creationDate.toISOString().split('T')[0]})`);
            
            // Also update operating days in pool_metrics_current
            const { poolMetricsCurrent } = await import("./shared/schema");
            await db.update(poolMetricsCurrent)
              .set({ 
                operatingDays: daysDiff,
                updatedAt: new Date()
              })
              .where(eq(poolMetricsCurrent.poolId, pool.id));
            
            console.log(`📊 Updated operating days for ${pool.tokenPair}: ${daysDiff} days`);
          }
        }
      } else {
        console.log(`⚠️ No contract creation data found for ${pool.tokenPair}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error processing ${pool.tokenPair}:`, error);
    }
  }
  
  console.log("✅ Contract date population complete!");
  process.exit(0);
}

populateContractDates().catch(console.error);