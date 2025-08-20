import { db } from './server/db';
import { tokenHolders } from './shared/schema';
import { eq, sql } from 'drizzle-orm';
import { alchemyService } from './server/services/alchemyService';

async function continueLidoSync() {
  console.log('🚀 Continuing Lido stETH sync to reach 1000 holders...');
  const lidoPoolId = '31e292ba-a842-490b-8688-3868e18bd615';
  const lidoTokenAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
  
  try {
    // Check current holder count
    const currentCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    const existingCount = currentCount[0]?.count || 0;
    console.log(`📊 Current holder count: ${existingCount}`);
    
    if (existingCount >= 1000) {
      console.log('✅ Already have 1000+ holders!');
      process.exit(0);
    }
    
    // Fetch 1000 holders again
    console.log('🔄 Fetching 1000 holders from Alchemy...');
    const holders = await alchemyService.getTopTokenHolders(lidoTokenAddress, 1000);
    console.log(`✅ Fetched ${holders.length} holders`);
    
    // Get existing holder addresses to avoid duplicates
    const existingHolders = await db
      .select({ holderAddress: tokenHolders.holderAddress })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    const existingAddresses = new Set(existingHolders.map(h => h.holderAddress.toLowerCase()));
    console.log(`📊 Found ${existingAddresses.size} existing holders in database`);
    
    // Filter out holders we already have
    const newHolders = holders.filter(h => !existingAddresses.has(h.address.toLowerCase()));
    console.log(`📊 Found ${newHolders.length} new holders to add`);
    
    if (newHolders.length === 0) {
      console.log('✅ All holders already stored!');
      process.exit(0);
    }
    
    // Store remaining holders
    const tokenPrice = 4217.93;
    const totalSupply = holders.reduce((sum, holder) => sum + parseFloat(holder.balance), 0);
    let storedCount = 0;
    
    for (let i = 0; i < newHolders.length && (existingCount + storedCount) < 1000; i++) {
      const holder = newHolders[i];
      const balance = parseFloat(holder.balance) || 0;
      const formattedBalance = balance / Math.pow(10, 18);
      const usdValue = formattedBalance * tokenPrice;
      const poolSharePercentage = totalSupply > 0 ? (balance / totalSupply) * 100 : 0;
      
      // Find the rank for this holder
      const rank = holders.findIndex(h => h.address === holder.address) + 1;
      
      await db.insert(tokenHolders).values({
        poolId: lidoPoolId,
        tokenAddress: lidoTokenAddress,
        holderAddress: holder.address,
        tokenBalance: holder.balance,
        tokenBalanceFormatted: formattedBalance.toString(),
        usdValue: usdValue.toString(),
        walletBalanceEth: '0',
        walletBalanceUsd: usdValue.toString(),
        poolSharePercentage: poolSharePercentage.toString(),
        rank: rank,
      });
      
      storedCount++;
      if (storedCount % 100 === 0) {
        console.log(`💾 Stored ${storedCount} new holders...`);
      }
    }
    
    // Final count
    const finalCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tokenHolders)
      .where(eq(tokenHolders.poolId, lidoPoolId));
    
    console.log(`✅ Final holder count: ${finalCount[0]?.count || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

continueLidoSync();
