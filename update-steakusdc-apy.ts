import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq } from "drizzle-orm";

async function updateSteakUSDC() {
  try {
    // Find the STEAKUSDC pool
    const poolList = await db.select().from(pools).where(eq(pools.tokenPair, 'STEAKUSDC')).limit(1);
    
    if (poolList.length > 0) {
      const currentPool = poolList[0];
      console.log('Current pool APY:', currentPool.apy);
      console.log('Current rawData state:', (currentPool.rawData as any)?.state);
      
      // Update the rawData with correct APY values (as percentages, not decimals)
      const updatedRawData = {
        ...(currentPool.rawData as any),
        state: {
          apy: 3.39,  // Native APY as percentage (3.39%)
          netApy: 4.27,  // Net APY with MORPHO rewards as percentage (4.27%)
          fee: 0,
          totalAssets: 314830000,
          totalAssetsUsd: 314830000
        },
        address: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB'
      };
      
      // Update the pool
      await db.update(pools)
        .set({ 
          rawData: updatedRawData,
          tvl: '314830000',
          apy: '4.27',
          poolAddress: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB',
          lastUpdated: new Date()
        })
        .where(eq(pools.id, currentPool.id));
      
      console.log('✅ Updated STEAKUSDC pool with correct APY values');
      console.log('New APY:', '4.27%');
      console.log('New TVL:', '$314.83M');
      console.log('New state:', updatedRawData.state);
    } else {
      console.log('❌ STEAKUSDC pool not found');
    }
  } catch (error) {
    console.error('Error updating pool:', error);
  } finally {
    process.exit(0);
  }
}

updateSteakUSDC();