import { db } from "../db";
import { pools, tokenInfo } from "@shared/schema";
import { TokenInfoSyncService } from "../services/tokenInfoSyncService";
import { eq } from "drizzle-orm";

async function syncExistingPoolTokenInfo() {
  console.log("Starting token info sync for existing pools...");
  
  try {
    // Get all pools without token info
    const poolsWithoutTokenInfo = await db
      .select()
      .from(pools)
      .where(eq(pools.isActive, true));
      
    console.log(`Found ${poolsWithoutTokenInfo.length} pools to sync`);
    
    const tokenInfoService = new TokenInfoSyncService();
    
    for (const pool of poolsWithoutTokenInfo) {
      try {
        // Get the underlying token from rawData
        const underlyingTokens = (pool.rawData as any)?.underlyingTokens || [];
        const underlyingToken = underlyingTokens[0];
        
        if (!underlyingToken) {
          console.log(`No underlying token for pool ${pool.id} (${pool.tokenPair})`);
          continue;
        }
        
        console.log(`Syncing token info for pool ${pool.tokenPair} (${pool.id}), token: ${underlyingToken}`);
        
        // Sync token info (this will automatically link it to the pool)
        await tokenInfoService.syncTokenInfo(pool.id, pool.rawData);
        
        console.log(`✓ Synced token info for ${pool.tokenPair}`);
      } catch (error) {
        console.error(`Error syncing token info for pool ${pool.id}:`, error);
      }
    }
    
    // Verify the sync
    const poolsWithTokenInfo = await db
      .select()
      .from(pools)
      .leftJoin(tokenInfo, eq(pools.tokenInfoId, tokenInfo.id))
      .where(eq(pools.isActive, true));
      
    const linkedCount = poolsWithTokenInfo.filter(p => p.token_info).length;
    console.log(`\nSync completed! ${linkedCount}/${poolsWithoutTokenInfo.length} pools now have token info`);
    
    process.exit(0);
  } catch (error) {
    console.error("Fatal error during sync:", error);
    process.exit(1);
  }
}

// Run the sync
syncExistingPoolTokenInfo();