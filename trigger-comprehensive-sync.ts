import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq } from "drizzle-orm";
import { HolderService } from "./server/services/holderService";

async function syncAllPoolsWithNewLimit() {
  console.log("🚀 Starting comprehensive holder sync for all pools with 1000 holder limit");
  
  try {
    // Get all pools with contract addresses
    const allPools = await db
      .select()
      .from(pools);
    
    const poolsWithAddress = allPools.filter(p => p.pool_address);
    console.log(`📊 Found ${poolsWithAddress.length} pools with contract addresses`);
    
    const holderService = new HolderService();
    let successCount = 0;
    let errorCount = 0;
    
    // Process each pool
    for (const pool of poolsWithAddress) {
      try {
        console.log(`\n🔄 Syncing pool ${pool.token_pair} (${pool.id})`);
        const result = await holderService.syncPoolHolders(pool.id);
        
        if (result.success) {
          successCount++;
          console.log(`✅ Successfully synced ${result.totalHolders} holders for ${pool.token_pair}`);
        } else {
          errorCount++;
          console.log(`❌ Failed to sync ${pool.token_pair}: ${result.error}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error syncing ${pool.token_pair}:`, error.message);
      }
      
      // Add a small delay between pools to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n📊 Sync Complete!`);
    console.log(`✅ Successful: ${successCount} pools`);
    console.log(`❌ Failed: ${errorCount} pools`);
    console.log(`📈 Total processed: ${poolsWithAddress.length} pools`);
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
  
  process.exit(0);
}

// Run the sync
syncAllPoolsWithNewLimit().catch(console.error);