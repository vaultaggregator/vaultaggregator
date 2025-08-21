import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq } from "drizzle-orm";
import { HolderService } from "./server/services/holderService";
import { DatabaseStorage } from "./server/storage";

async function syncTACPool() {
  console.log("🔄 Starting TAC USDC pool sync test...");
  
  try {
    // Find TAC USDC pool
    const [tacPool] = await db
      .select()
      .from(pools)
      .where(eq(pools.poolAddress, "0x1E2aAaDcF528b9cC08F43d4fd7db488cE89F5741"));
    
    if (!tacPool) {
      console.error("❌ TAC USDC pool not found");
      process.exit(1);
    }
    
    console.log(`✅ Found TAC USDC pool: ${tacPool.id}`);
    console.log(`📊 Pool details: ${tacPool.tokenPair} on ${tacPool.poolAddress}`);
    
    // Initialize services
    const storage = new DatabaseStorage();
    const holderService = new HolderService(storage);
    
    // Sync holders for TAC pool
    console.log("🚀 Starting holder sync...");
    await holderService.syncPoolHolders(tacPool.id);
    
    console.log("✅ TAC USDC pool sync completed successfully!");
    
  } catch (error) {
    console.error("❌ Error syncing TAC pool:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

syncTACPool();
