import { db } from './server/db';
import { tokenHolders } from './shared/schema';
import { eq } from 'drizzle-orm';
import { alchemyService } from './server/services/alchemyService';

async function syncBaseSparkHolders() {
  console.log('🚀 Syncing holders for Spark USDC Vault on Base...');
  const poolId = '8dac7eb9-9f09-4a84-b9c0-44c9eb5b7d1c';
  const poolAddress = '0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A';
  
  try {
    // Clear existing holders
    await db.delete(tokenHolders).where(eq(tokenHolders.poolId, poolId));
    
    // Fetch holders - Note: Base network is supported by Alchemy
    console.log('🔍 Fetching holders from Alchemy...');
    const holders = await alchemyService.getTopTokenHolders(poolAddress, 100);
    console.log(`✅ Found ${holders.length} holders`);
    
    if (holders.length === 0) {
      console.log('⚠️ No holders found - this may be a new pool or require different fetching method');
      process.exit(0);
    }
    
    // Store holders
    const tokenPrice = 1; // USDC-based vault, $1 per share initially
    for (let i = 0; i < holders.length; i++) {
      const holder = holders[i];
      const balance = parseFloat(holder.balance) || 0;
      const formattedBalance = balance / Math.pow(10, 18);
      const usdValue = formattedBalance * tokenPrice;
      
      await db.insert(tokenHolders).values({
        poolId,
        tokenAddress: poolAddress,
        holderAddress: holder.address,
        tokenBalance: holder.balance,
        tokenBalanceFormatted: formattedBalance.toString(),
        usdValue: usdValue.toString(),
        walletBalanceEth: '0',
        walletBalanceUsd: usdValue.toString(),
        poolSharePercentage: '0',
        rank: i + 1,
      });
    }
    
    console.log(`✅ Stored ${holders.length} holders for Spark USDC Vault`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

syncBaseSparkHolders();
