import { db } from "./server/db";
import { pools, poolMetricsCurrent } from "./shared/schema";
import { eq, and } from "drizzle-orm";
import { etherscanHolderScraper } from "./server/services/etherscanHolderScraper";

async function updateSteakUSDCContract() {
  try {
    console.log("🔄 Updating STEAKUSDC contract address...");
    
    // Find the STEAKUSDC pool
    const steakUSDCPool = await db.select()
      .from(pools)
      .where(eq(pools.tokenPair, "Steakhouse USDC"))
      .limit(1);
    
    if (steakUSDCPool.length === 0) {
      console.error("❌ STEAKUSDC pool not found");
      return;
    }
    
    const pool = steakUSDCPool[0];
    console.log(`📊 Found pool: ${pool.tokenPair} (ID: ${pool.id})`);
    
    // Update the contract address
    const newContractAddress = "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB";
    
    await db.update(pools)
      .set({ 
        poolAddress: newContractAddress,
        lastUpdated: new Date()
      })
      .where(eq(pools.id, pool.id));
    
    console.log(`✅ Updated contract address to: ${newContractAddress}`);
    
    // Now fetch holder count from Etherscan
    console.log("🔍 Fetching holder count from Etherscan...");
    const holderCount = await etherscanHolderScraper.getHolderCount(newContractAddress);
    console.log(`📊 Holder count: ${holderCount}`);
    
    // Update or insert into pool_metrics_current
    const existingMetrics = await db.select()
      .from(poolMetricsCurrent)
      .where(eq(poolMetricsCurrent.poolId, pool.id))
      .limit(1);
    
    if (existingMetrics.length > 0) {
      // Update existing metrics
      await db.update(poolMetricsCurrent)
        .set({
          holdersCount: holderCount,
          updatedAt: new Date()
        })
        .where(eq(poolMetricsCurrent.poolId, pool.id));
      console.log("✅ Updated pool metrics with holder count");
    } else {
      // Insert new metrics
      await db.insert(poolMetricsCurrent)
        .values({
          poolId: pool.id,
          holdersCount: holderCount,
          updatedAt: new Date()
        });
      console.log("✅ Created pool metrics with holder count");
    }
    
    console.log("✅ STEAKUSDC contract address and holder count updated successfully!");
    
  } catch (error) {
    console.error("❌ Error updating STEAKUSDC contract:", error);
  } finally {
    process.exit(0);
  }
}

updateSteakUSDCContract();