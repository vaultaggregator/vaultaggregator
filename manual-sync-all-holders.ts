import { db } from "./server/db";
import { pools, tokenHolders } from "./shared/schema";
import { eq, sql } from "drizzle-orm";
import { AlchemyService } from "./server/services/alchemyService";

const HOLDER_LIMIT = 1000;

async function manualSyncAllHolders() {
  console.log("🚀 Starting manual sync for ALL pools with 1000 holder limit");
  
  const alchemy = new AlchemyService();
  
  try {
    // Get all pools with contract addresses
    const allPools = await db
      .select()
      .from(pools);
    
    const poolsWithAddress = allPools.filter(p => p.pool_address && p.pool_address !== '');
    console.log(`📊 Found ${poolsWithAddress.length} pools with contract addresses`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const pool of poolsWithAddress) {
      try {
        console.log(`\n🔄 Syncing pool: ${pool.token_pair} (${pool.id})`);
        console.log(`📍 Contract: ${pool.pool_address}`);
        
        // Clear existing holders for this pool
        await db.delete(tokenHolders).where(eq(tokenHolders.pool_id, pool.id));
        
        // Fetch up to 1000 holders
        const holders = await alchemy.getTopTokenHolders(pool.pool_address!, HOLDER_LIMIT);
        console.log(`✅ Fetched ${holders.length} holders`);
        
        if (holders.length > 0) {
          // Get token price
          const tokenPrice = pool.token_price || 1;
          
          // Prepare holder data
          const holderData = holders.map((holder, index) => ({
            pool_id: pool.id,
            address: holder.address.toLowerCase(),
            balance: holder.balance.toString(),
            balance_numeric: parseFloat(holder.balance),
            rank: index + 1,
            percentage: holder.percentage || 0,
            value_usd: parseFloat(holder.balance) * tokenPrice,
            wallet_eth_balance: holder.walletEthBalance || '0'
          }));
          
          // Insert holders in batches
          const batchSize = 100;
          for (let i = 0; i < holderData.length; i += batchSize) {
            const batch = holderData.slice(i, i + batchSize);
            await db.insert(tokenHolders).values(batch);
          }
          
          successCount++;
          console.log(`✅ Stored ${holders.length} holders for ${pool.token_pair}`);
        } else {
          console.log(`⚠️ No holders found for ${pool.token_pair}`);
        }
        
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error syncing ${pool.token_pair}:`, error.message);
      }
      
      // Small delay between pools
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Sync Complete!`);
    console.log(`✅ Successful: ${successCount} pools`);
    console.log(`❌ Failed: ${errorCount} pools`);
    
    // Show some statistics
    const stats = await db
      .select({
        pool_id: tokenHolders.pool_id,
        count: sql<number>`count(*)::int`
      })
      .from(tokenHolders)
      .groupBy(tokenHolders.pool_id);
    
    console.log(`\n📈 Holder counts per pool:`);
    for (const stat of stats.slice(0, 10)) {
      const pool = poolsWithAddress.find(p => p.id === stat.pool_id);
      if (pool) {
        console.log(`  ${pool.token_pair}: ${stat.count} holders`);
      }
    }
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
  
  process.exit(0);
}

// Run the sync
manualSyncAllHolders().catch(console.error);