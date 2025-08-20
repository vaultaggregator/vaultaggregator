import { Alchemy, Network } from 'alchemy-sdk';
import { Pool } from '@neondatabase/serverless';

async function urgentMEVSync() {
  console.log('🚨 URGENT: Direct MEV Capital USDC sync');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
  });
  
  const CONTRACT_ADDRESS = '0xd63070114470f685b75B74D60EEc7c1113d33a3D';
  const POOL_ID = '8e5b0ab7-4327-4912-a510-ca7e691bfe6a';
  
  try {
    // Clear old data
    await pool.query('DELETE FROM token_holders WHERE pool_id = $1', [POOL_ID]);
    console.log('🗑️ Cleared old data');
    
    // Get metadata
    const metadata = await alchemy.core.getTokenMetadata(CONTRACT_ADDRESS);
    const decimals = metadata.decimals || 18;
    console.log(`📊 Token: ${metadata.name} (${metadata.symbol}), Decimals: ${decimals}`);
    
    // Fetch all holders
    const holders = [];
    const uniqueAddresses = new Set<string>();
    let pageKey: string | undefined;
    
    console.log('🔄 Fetching transfer events...');
    for (let i = 0; i < 50; i++) {
      const transfers = await alchemy.core.getAssetTransfers({
        fromBlock: '0x0',
        toBlock: 'latest',
        contractAddresses: [CONTRACT_ADDRESS],
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
      
      if (!pageKey || uniqueAddresses.size > 2000) break;
    }
    
    console.log(`📊 Checking balances for ${uniqueAddresses.size} addresses...`);
    
    // Check balances
    const addresses = Array.from(uniqueAddresses);
    for (let i = 0; i < addresses.length; i += 50) {
      const batch = addresses.slice(i, Math.min(i + 50, addresses.length));
      
      for (const address of batch) {
        try {
          const balance = await alchemy.core.getTokenBalances(address, [CONTRACT_ADDRESS]);
          const rawBalance = balance.tokenBalances[0]?.tokenBalance;
          
          if (rawBalance && rawBalance !== '0x0') {
            const balanceBigInt = BigInt(rawBalance);
            const formattedBalance = Number(balanceBigInt) / Math.pow(10, decimals);
            
            if (formattedBalance > 0.001) {
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
      
      if (holders.length % 100 === 0 && holders.length > 0) {
        console.log(`✅ Found ${holders.length} holders...`);
      }
      
      if (holders.length >= 1700) break;
    }
    
    console.log(`\n📊 Found ${holders.length} holders with non-zero balances`);
    
    // Insert directly into database
    if (holders.length > 0) {
      console.log('💾 Inserting holders into database...');
      
      const batchSize = 50;
      for (let i = 0; i < holders.length; i += batchSize) {
        const batch = holders.slice(i, Math.min(i + batchSize, holders.length));
        
        const values = batch.map((h, idx) => 
          `(gen_random_uuid(), '${POOL_ID}', '${CONTRACT_ADDRESS}', '${h.address}', '${h.balance}', ${h.formattedBalance}, ${h.formattedBalance}, 0, 0, 0, ${i + idx + 1})`
        ).join(',');
        
        await pool.query(`
          INSERT INTO token_holders (
            id, pool_id, token_address, holder_address, token_balance, 
            token_balance_formatted, usd_value, wallet_balance_eth, 
            wallet_balance_usd, pool_share_percentage, rank
          ) VALUES ${values}
        `);
        
        console.log(`💾 Inserted ${Math.min(i + batchSize, holders.length)}/${holders.length} holders`);
      }
      
      const result = await pool.query('SELECT COUNT(*) FROM token_holders WHERE pool_id = $1', [POOL_ID]);
      console.log(`\n🎉 SUCCESS! MEV Capital USDC now has ${result.rows[0].count} holders!`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
  
  process.exit(0);
}

urgentMEVSync().catch(console.error);