import { db } from "./server/db";
import { pools } from "./shared/schema";
import { HolderService } from "./server/services/holderService";
import { isNotNull } from "drizzle-orm";

async function syncAll1000Holders() {
  console.log("🚀 Starting sync for all pools with 1000 holder limit");
  
  const holderService = new HolderService();
  
  try {
    // Get all pools with contract addresses
    const allPools = await db
      .select()
      .from(pools)
      .where(isNotNull(pools.pool_address));
    
    console.log(`📊 Found ${allPools.length} pools with contract addresses`);
    
    let successCount = 0;
    let errorCount = 0;
    let totalHolders = 0;
    
    for (const pool of allPools) {
      try {
        console.log(`\n🔄 Syncing pool: ${pool.token_pair}`);
        
        // Use the holder service to sync this pool
        const result = await holderService.syncPoolHolders(pool.id);
        
        if (result.success) {
          successCount++;
          totalHolders += result.totalHolders || 0;
          console.log(`✅ Successfully synced ${result.totalHolders} holders for ${pool.token_pair}`);
        } else {
          errorCount++;
          console.log(`❌ Failed to sync ${pool.token_pair}: ${result.error}`);
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error syncing ${pool.token_pair}:`, error.message);
      }
      
      // Small delay between pools
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    console.log(`\n📊 Sync Complete!`);
    console.log(`✅ Successful: ${successCount} pools`);
    console.log(`❌ Failed: ${errorCount} pools`);
    console.log(`📈 Total holders synced: ${totalHolders}`);
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
  
  process.exit(0);
}

// Run the sync
syncAll1000Holders().catch(console.error);