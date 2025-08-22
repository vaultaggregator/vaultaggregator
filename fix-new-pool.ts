import { db } from "./server/db";
import { pools, poolMetricsCurrent } from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixNewPool() {
  console.log("🔧 Fixing the newly added pool (0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca)...\n");
  
  const poolAddress = '0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca';
  
  // Step 1: Update the platform_pool_id to match the contract address
  // Morpho uses the vault address as the ID
  console.log("1️⃣ Setting platform_pool_id...");
  await db.update(pools)
    .set({ 
      platformPoolId: poolAddress 
    })
    .where(eq(pools.poolAddress, poolAddress));
  
  // Step 2: Fetch the proper name from Morpho API
  console.log("2️⃣ Fetching vault details from Morpho API...");
  try {
    const response = await fetch(`https://api.morpho.org/vaults/${poolAddress}`);
    const data = await response.json();
    
    if (data && data.name) {
      console.log(`   Found vault name: ${data.name}`);
      console.log(`   Symbol: ${data.symbol}`);
      
      // Update the pool with the correct name and raw data
      await db.update(pools)
        .set({ 
          tokenPair: data.name,
          rawData: data as any
        })
        .where(eq(pools.poolAddress, poolAddress));
      
      console.log("   ✅ Updated pool name and raw data");
    } else {
      console.log("   ⚠️ Could not fetch vault details from Morpho");
    }
  } catch (error) {
    console.error("   ❌ Error fetching from Morpho:", error);
  }
  
  // Step 3: Fetch the contract creation date from Basescan
  console.log("3️⃣ Fetching contract creation date from Basescan...");
  try {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
    
    // Use Etherscan V2 API with chain ID 8453 for Base
    const apiUrl = `https://api.etherscan.io/v2/api?chainid=8453&module=contract&action=getcontractcreation&contractaddresses=${poolAddress}&apikey=${etherscanApiKey}`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.status === "1" && data.result && data.result.length > 0) {
      const txHash = data.result[0].txHash;
      console.log(`   Found creation transaction: ${txHash}`);
      
      // Get transaction details to find block timestamp
      const txUrl = `https://api.etherscan.io/v2/api?chainid=8453&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
      
      const txResponse = await fetch(txUrl);
      const txData = await txResponse.json();
      
      if (txData.result && txData.result.blockNumber) {
        // Get block details for timestamp
        const blockNumber = parseInt(txData.result.blockNumber, 16);
        const blockUrl = `https://api.etherscan.io/v2/api?chainid=8453&module=block&action=getblockreward&blockno=${blockNumber}&apikey=${etherscanApiKey}`;
        
        const blockResponse = await fetch(blockUrl);
        const blockData = await blockResponse.json();
        
        if (blockData.result && blockData.result.timeStamp) {
          const creationDate = new Date(parseInt(blockData.result.timeStamp) * 1000);
          const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`   Contract created on: ${creationDate.toISOString().split('T')[0]}`);
          console.log(`   Operating for: ${daysSinceCreation} days`);
          
          // Update the pool with the contract creation date
          const [currentPool] = await db.select().from(pools).where(eq(pools.poolAddress, poolAddress));
          const updatedRawData = { ...(currentPool?.rawData as any || {}), count: daysSinceCreation };
          
          await db.update(pools)
            .set({ 
              contractCreatedAt: creationDate,
              rawData: updatedRawData
            })
            .where(eq(pools.poolAddress, poolAddress));
          
          // Update pool metrics
          await db.update(poolMetricsCurrent)
            .set({
              operatingDays: daysSinceCreation,
              daysStatus: 'success',
              daysError: null
            })
            .where(eq(poolMetricsCurrent.poolId, 'dac2d8de-387b-4e19-ab7d-a78e859c1569'));
          
          console.log("   ✅ Updated contract creation date and operating days");
        }
      }
    } else {
      console.log("   ⚠️ Could not fetch contract creation date from Basescan");
      console.log("   Response:", data);
    }
  } catch (error) {
    console.error("   ❌ Error fetching from Basescan:", error);
  }
  
  // Step 4: Display final status
  console.log("4️⃣ Final pool status:");
  const [finalPool] = await db.select().from(pools).where(eq(pools.poolAddress, poolAddress));
  
  if (finalPool) {
    console.log(`   Name: ${finalPool.tokenPair}`);
    console.log(`   Contract Created: ${finalPool.contractCreatedAt ? new Date(finalPool.contractCreatedAt).toISOString().split('T')[0] : 'Not set'}`);
    console.log(`   Operating Days: ${(finalPool.rawData as any)?.count || 'Not set'}`);
    console.log("   The pool will sync automatically in the next collection cycle");
  }
  
  console.log("\n✅ Pool fix complete!");
  process.exit(0);
}

fixNewPool().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});