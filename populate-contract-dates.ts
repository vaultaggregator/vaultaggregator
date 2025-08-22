import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq } from "drizzle-orm";

async function populateContractCreatedDates() {
  console.log("🚀 Starting to populate contract creation dates for existing pools...");
  
  // For now, let's just update the Seamless USDC Vault with its known creation date
  // We can expand this later to fetch all contract creation dates
  
  const seamlessPool = await db.select()
    .from(pools)
    .where(eq(pools.poolAddress, '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738'));
  
  if (seamlessPool.length > 0 && !seamlessPool[0].contractCreatedAt) {
    console.log("🎯 Updating Seamless USDC Vault with known creation date...");
    const creationDate = new Date('2025-01-09'); // Known creation date from Basescan
    
    await db.update(pools)
      .set({ contractCreatedAt: creationDate })
      .where(eq(pools.id, seamlessPool[0].id));
    
    const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`✅ Seamless USDC Vault updated with creation date: January 9, 2025 (${daysSinceCreation} days ago)`);
  } else if (seamlessPool.length > 0 && seamlessPool[0].contractCreatedAt) {
    console.log("✅ Seamless USDC Vault already has contract creation date");
  } else {
    console.log("⚠️ Seamless USDC Vault not found");
  }
  
  process.exit(0);
}

populateContractCreatedDates().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});