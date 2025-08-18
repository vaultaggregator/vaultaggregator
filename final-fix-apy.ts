import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq } from "drizzle-orm";

async function finalApyFix() {
  try {
    // Get both pools to fix APY format
    const allPools = await db.select().from(pools);
    
    for (const pool of allPools) {
      const currentRawData = pool.rawData as any || {};
      let updatedRawData = { ...currentRawData };
      
      // Fix the state APY values - ensure they are percentages not decimals
      if (currentRawData.state) {
        if (pool.tokenPair === 'STEAKUSDC') {
          // Steakhouse USDC specific values from Morpho website
          updatedRawData.state = {
            apy: 3.39,    // 3.39% not 0.0339
            netApy: 4.27, // 4.27% not 0.0427
            fee: 0,
            totalAssets: 314830000,
            totalAssetsUsd: 314830000
          };
        } else if (pool.tokenPair === 'STETH') {
          // Fix STETH pool APY too
          const currentApy = currentRawData.state.apy;
          const currentNetApy = currentRawData.state.netApy;
          
          // If values are less than 1, they're in decimal format - convert to percentage
          updatedRawData.state = {
            ...currentRawData.state,
            apy: currentApy < 1 ? currentApy * 100 : currentApy,
            netApy: currentNetApy < 1 ? currentNetApy * 100 : currentNetApy
          };
        }
      }
      
      // Update the pool
      const apyValue = pool.tokenPair === 'STEAKUSDC' ? '4.27' : 
                       updatedRawData.state?.netApy ? updatedRawData.state.netApy.toString() : pool.apy;
      
      const tvlValue = pool.tokenPair === 'STEAKUSDC' ? '314830000' : pool.tvl;
      
      await db.update(pools)
        .set({ 
          rawData: updatedRawData,
          apy: apyValue,
          tvl: tvlValue,
          lastUpdated: new Date()
        })
        .where(eq(pools.id, pool.id));
      
      console.log(`✅ Fixed ${pool.tokenPair}:`);
      console.log(`   APY: ${apyValue}%`);
      console.log(`   State APY: ${updatedRawData.state?.apy}`);
      console.log(`   State NetAPY: ${updatedRawData.state?.netApy}`);
    }
    
    console.log('\n🎉 All pools fixed! APY values are now in percentage format.');
  } catch (error) {
    console.error('Error fixing pools:', error);
  } finally {
    process.exit(0);
  }
}

finalApyFix();