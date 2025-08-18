import { db } from "./server/db";
import { pools } from "./shared/schema";
import { eq } from "drizzle-orm";

async function fixSteakUSDC() {
  try {
    // Find the STEAKUSDC pool
    const poolList = await db.select().from(pools).where(eq(pools.tokenPair, 'STEAKUSDC')).limit(1);
    
    if (poolList.length > 0) {
      const currentPool = poolList[0];
      console.log('Current pool ID:', currentPool.id);
      console.log('Current APY in DB:', currentPool.apy);
      console.log('Current rawData:', JSON.stringify(currentPool.rawData, null, 2));
      
      // Create completely new rawData with correct structure
      const correctRawData = {
        name: "STEAKUSDC",
        asset: {
          symbol: "STEAKUSDC",
          address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC contract
          decimals: 6  // USDC has 6 decimals
        },
        chain: {
          id: 1,
          network: "ethereum"
        },
        state: {
          apy: 3.39,     // This should be 3.39 not 0.0339
          netApy: 4.27,  // This should be 4.27 not 0.0427
          fee: 0,
          totalAssets: 314830000,
          totalAssetsUsd: 314830000
        },
        address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", // Correct vault address
        curator: {
          name: "Steakhouse Financial",
          image: "https://icons.llamao.fi/icons/protocols/morpho"
        },
        metadata: {
          riskLevel: "low",
          description: "Steakhouse USDC vault on Morpho Blue"
        },
        createdAt: currentPool.createdAt || new Date().toISOString()
      };
      
      // Update the pool with completely corrected data
      await db.update(pools)
        .set({ 
          rawData: correctRawData,
          tvl: '314830000',
          apy: '4.27',  // Store as string "4.27" not "0.0427"
          poolAddress: '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB',
          lastUpdated: new Date()
        })
        .where(eq(pools.id, currentPool.id));
      
      console.log('✅ Successfully fixed STEAKUSDC pool');
      console.log('APY should now display as: 4.27%');
      console.log('TVL should now display as: $314.83M');
      console.log('Final rawData.state:', correctRawData.state);
    } else {
      console.log('❌ STEAKUSDC pool not found');
    }
  } catch (error) {
    console.error('Error fixing pool:', error);
  } finally {
    process.exit(0);
  }
}

fixSteakUSDC();