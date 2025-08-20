import { db } from './server/db';
import { tokenHolders, pools } from './shared/schema';
import { eq, sql } from 'drizzle-orm';
import { alchemyService } from './server/services/alchemyService';

async function syncLido1000Holders() {
  console.log('🚀 Starting focused sync for Lido stETH pool to fetch 1000 holders...');
  const lidoPoolId = '31e292ba-a842-490b-8688-3868e18bd615';
  const lidoTokenAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
  
  try {
    // Check current holder count
    const currentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    console.log(`📊 Current holder count for Lido stETH: ${currentCount[0]?.count || 0}`);
    
    // Fetch 1000 holders directly from Alchemy
    console.log('🔄 Fetching 1000 holders from Alchemy...');
    const holders = await alchemyService.getTopTokenHolders(lidoTokenAddress, 1000);
    console.log(`✅ Fetched ${holders.length} holders from Alchemy`);
    
    if (holders.length === 0) {
      console.error('❌ No holders fetched from Alchemy');
      return;
    }
    
    // Clear existing holders for this pool
    console.log('🧹 Clearing existing holders...');
    await db.delete(tokenHolders).where(eq(tokenHolders.poolId, lidoPoolId));
    
    // Get token price for stETH
    const tokenPrice = 4217.93; // Current stETH price from logs
    console.log(`💰 Using stETH price: $${tokenPrice}`);
    
    // Calculate total supply for percentage calculations
    const totalSupply = holders.reduce((sum, holder) => sum + parseFloat(holder.balance), 0);
    
    // Store all holders
    console.log(`💾 Storing ${holders.length} holders in database...`);
    let storedCount = 0;
    
    for (let i = 0; i < holders.length; i++) {
      const holder = holders[i];
      const balance = parseFloat(holder.balance) || 0;
      const formattedBalance = balance / Math.pow(10, 18); // stETH has 18 decimals
      const usdValue = formattedBalance * tokenPrice;
      const poolSharePercentage = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;
      
      // Get wallet portfolio value (simplified for this sync)
      let walletBalanceUsd = usdValue; // Default to pool token value
      try {
        walletBalanceUsd = await alchemyService.getTotalPortfolioValue(holder.address);
        if (walletBalanceUsd < usdValue) {
          walletBalanceUsd = usdValue; // Portfolio should at least include the pool token value
        }
      } catch (error) {
        // Use pool token value as fallback
      }
      
      // Insert holder
      await db.insert(tokenHolders).values({
        poolId: lidoPoolId,
        tokenAddress: lidoTokenAddress,
        holderAddress: holder.address,
        tokenBalance: holder.balance,
        tokenBalanceFormatted: formattedBalance.toString(),
        usdValue: usdValue.toString(),
        walletBalanceEth: '0', // Simplified for this sync
        walletBalanceUsd: walletBalanceUsd.toString(),
        poolSharePercentage: poolSharePercentage.toString(),
        rank: i + 1,
      });
      
      storedCount++;
      
      if (storedCount % 100 === 0) {
        console.log(`💾 Stored ${storedCount}/${holders.length} holders...`);
      }
    }
    
    // Verify final count
    const finalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    console.log(`✅ Successfully stored ${finalCount[0]?.count || 0} holders for Lido stETH`);
    
    if ((finalCount[0]?.count || 0) >= 1000) {
      console.log('🎉 Successfully increased Lido holder count to 1000!');
    } else {
      console.log(`⚠️ Only stored ${finalCount[0]?.count || 0} holders, expected 1000`);
    }
    
  } catch (error) {
    console.error('❌ Error syncing Lido holders:', error);
  }
  
  process.exit(0);
}

syncLido1000Holders();