import { db } from './server/db';
import { pools, tokenHolders } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Alchemy, Network } from 'alchemy-sdk';

async function urgentMEVSync() {
  console.log('🚨 URGENT: Syncing MEV Capital USDC holders...');
  
  const [pool] = await db.select().from(pools).where(eq(pools.tokenPair, 'MEV Capital USDC'));
  if (!pool) {
    console.error('Pool not found');
    process.exit(1);
  }
  
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
  });
  
  console.log('📊 Fetching all MEV Capital holders...');
  
  // Get token metadata
  const metadata = await alchemy.core.getTokenMetadata(pool.poolAddress!);
  const decimals = metadata.decimals || 18;
  
  // Fetch holders using comprehensive approach
  const holders = [];
  const uniqueAddresses = new Set<string>();
  let pageKey: string | undefined;
  
  // Get all transfer events
  for (let i = 0; i < 100; i++) {
    const transfers = await alchemy.core.getAssetTransfers({
      fromBlock: '0x0',
      toBlock: 'latest',
      contractAddresses: [pool.poolAddress!],
      category: ['erc20'],
      maxCount: 1000,
      excludeZeroValue: false,
      pageKey
    });
    
    for (const transfer of transfers.transfers) {
      if (transfer.to) uniqueAddresses.add(transfer.to.toLowerCase());
      if (transfer.from) uniqueAddresses.add(transfer.from.toLowerCase());
    }
    
    console.log(`Iteration ${i + 1}: ${uniqueAddresses.size} addresses`);
    pageKey = transfers.pageKey;
    
    if (!pageKey || uniqueAddresses.size > 3000) break;
  }
  
  console.log(`📊 Checking balances for ${uniqueAddresses.size} addresses...`);
  
  // Check balances in batches
  const addresses = Array.from(uniqueAddresses);
  for (let i = 0; i < addresses.length; i += 50) {
    const batch = addresses.slice(i, Math.min(i + 50, addresses.length));
    
    for (const address of batch) {
      try {
        const balance = await alchemy.core.getTokenBalances(address, [pool.poolAddress!]);
        const rawBalance = balance.tokenBalances[0]?.tokenBalance;
        
        if (rawBalance && rawBalance !== '0x0') {
          const balanceBigInt = BigInt(rawBalance);
          const formattedBalance = Number(balanceBigInt) / Math.pow(10, decimals);
          
          if (formattedBalance > 0.001) { // Filter dust amounts
            holders.push({
              address,
              balance: balanceBigInt.toString(),
              formattedBalance
            });
          }
        }
      } catch (error) {
        // Skip errors
      }
    }
    
    if (holders.length % 100 === 0) {
      console.log(`✅ Found ${holders.length} holders so far...`);
    }
    
    if (holders.length >= 1700) break; // We know there are ~1665 holders
  }
  
  console.log(`\n✅ Found ${holders.length} holders with non-zero balances`);
  
  // Insert into database
  if (holders.length > 1000) {
    // Clear old data
    await db.delete(tokenHolders).where(eq(tokenHolders.poolId, pool.id));
    
    // Insert new holders
    const batchSize = 100;
    for (let i = 0; i < holders.length; i += batchSize) {
      const batch = holders.slice(i, Math.min(i + batchSize, holders.length));
      
      const records = batch.map((h, idx) => ({
        poolId: pool.id,
        tokenAddress: pool.poolAddress!,
        holderAddress: h.address,
        tokenBalance: h.balance,
        tokenBalanceFormatted: h.formattedBalance,
        usdValue: h.formattedBalance, // USDC is $1
        poolSharePercentage: 0,
        rank: i + idx + 1
      }));
      
      await db.insert(tokenHolders).values(records);
      console.log(`💾 Inserted ${Math.min(i + batchSize, holders.length)}/${holders.length} holders`);
    }
    
    console.log(`\n🎉 SUCCESS! MEV Capital USDC now has ${holders.length} holders`);
  }
  
  process.exit(0);
}

urgentMEVSync().catch(console.error);
