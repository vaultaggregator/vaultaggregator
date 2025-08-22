import { db } from "./server/db";
import { poolMetricsCurrent, pools } from "./shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { EtherscanHolderScraper } from "./server/services/etherscanHolderScraper";

async function updateEthereumHolderCounts() {
  console.log("🚀 Starting Ethereum holder count update...");
  
  const scraper = new EtherscanHolderScraper();
  
  // Get all Ethereum pools where holder count is 100 (default value)
  const ethereumPools = await db.select()
    .from(pools)
    .leftJoin(poolMetricsCurrent, eq(pools.id, poolMetricsCurrent.poolId))
    .where(
      and(
        isNotNull(pools.poolAddress),
        eq(poolMetricsCurrent.holdersCount, 100)
      )
    );
  
  console.log(`📊 Found ${ethereumPools.length} Ethereum pools with default holder count (100)`);
  
  for (const result of ethereumPools) {
    const pool = result.pools;
    
    if (!pool.poolAddress) {
      console.log(`⚠️ Skipping ${pool.tokenPair} - no pool address`);
      continue;
    }
    
    try {
      console.log(`\n🔍 Fetching holder count for ${pool.tokenPair} (${pool.poolAddress})`);
      
      // Use the appropriate chain name based on chainId
      const chainName = pool.chainId === "19a7e3af-bc9b-4c6a-9df5-0b24b19934a7" ? "base" : "ethereum"; // Base : Ethereum
      
      const totalHolders = await scraper.getHolderCount(pool.poolAddress, chainName);
      
      if (totalHolders > 0) {
        // Update the holder count in pool_metrics_current
        await db.update(poolMetricsCurrent)
          .set({ 
            holdersCount: totalHolders,
            lastUpdated: new Date()
          })
          .where(eq(poolMetricsCurrent.poolId, pool.id));
        
        console.log(`✅ Updated ${pool.tokenPair}: ${totalHolders} holders`);
      } else {
        console.log(`⚠️ Could not fetch holder count for ${pool.tokenPair}`);
      }
      
      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error updating ${pool.tokenPair}:`, error);
    }
  }
  
  console.log("\n✅ Ethereum holder count update complete!");
}

updateEthereumHolderCounts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });