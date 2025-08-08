import { db } from "../db";
import { pools, tokenInfo } from "@shared/schema";
import { TokenInfoSyncService } from "../services/tokenInfoSyncService";
import { eq, and } from "drizzle-orm";

async function syncVisiblePoolTokens() {
  console.log("Syncing token info for visible pools only...");
  
  try {
    // Get only visible pools
    const visiblePools = await db
      .select()
      .from(pools)
      .where(and(eq(pools.isActive, true), eq(pools.isVisible, true)));
      
    console.log(`Found ${visiblePools.length} visible pools to sync`);
    
    const tokenInfoService = new TokenInfoSyncService();
    
    for (const pool of visiblePools) {
      try {
        console.log(`\nProcessing pool: ${pool.tokenPair} (${pool.id})`);
        
        // Get the underlying token from rawData
        const underlyingTokens = (pool.rawData as any)?.underlyingTokens || [];
        const underlyingToken = underlyingTokens[0];
        
        if (!underlyingToken) {
          console.log(`  No underlying token found`);
          continue;
        }
        
        console.log(`  Token address: ${underlyingToken}`);
        
        // Sync token info (this will automatically link it to the pool)
        await tokenInfoService.syncTokenInfo(pool.id, pool.rawData);
        
        console.log(`  ✓ Token info synced`);
      } catch (error) {
        console.error(`  Error syncing: ${error}`);
      }
    }
    
    // Verify the sync
    const poolsWithTokenInfo = await db
      .select()
      .from(pools)
      .leftJoin(tokenInfo, eq(pools.tokenInfoId, tokenInfo.id))
      .where(and(eq(pools.isActive, true), eq(pools.isVisible, true)));
      
    console.log("\n=== Sync Results ===");
    for (const result of poolsWithTokenInfo) {
      const pool = result.pools;
      const token = result.token_info;
      console.log(`${pool.tokenPair}: ${token ? `${token.holdersCount || 'N/A'} holders` : 'No token info'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Fatal error during sync:", error);
    process.exit(1);
  }
}

// Run the sync
syncVisiblePoolTokens();