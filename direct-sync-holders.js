// Direct sync script for all pools with 1000 holder limit
const { Pool } = require('@neondatabase/serverless');
const { AlchemyService } = require('./server/services/alchemyService');

async function directSyncHolders() {
  console.log("🚀 Starting direct sync for all pools with 1000 holder limit");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const alchemy = new AlchemyService();
  
  try {
    // Get all pools with contract addresses
    const poolsResult = await pool.query(`
      SELECT id, token_pair, pool_address, token_price 
      FROM pools 
      WHERE pool_address IS NOT NULL 
      AND pool_address != ''
    `);
    
    const allPools = poolsResult.rows;
    console.log(`📊 Found ${allPools.length} pools with contract addresses`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const poolData of allPools) {
      try {
        console.log(`\n🔄 Syncing: ${poolData.token_pair}`);
        console.log(`📍 Contract: ${poolData.pool_address}`);
        
        // Clear existing holders
        await pool.query('DELETE FROM token_holders WHERE pool_id = $1', [poolData.id]);
        
        // Fetch up to 1000 holders
        const holders = await alchemy.getTopTokenHolders(poolData.pool_address, 1000);
        console.log(`✅ Fetched ${holders.length} holders`);
        
        if (holders.length > 0) {
          const tokenPrice = poolData.token_price || 1;
          
          // Insert holders in batches
          const batchSize = 50;
          for (let i = 0; i < holders.length; i += batchSize) {
            const batch = holders.slice(i, i + batchSize);
            
            const values = [];
            const placeholders = [];
            
            batch.forEach((holder, index) => {
              const baseIndex = index * 9;
              placeholders.push(
                `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9})`
              );
              
              values.push(
                poolData.id,
                holder.address.toLowerCase(),
                holder.balance.toString(),
                parseFloat(holder.balance),
                i + index + 1, // rank
                holder.percentage || 0,
                parseFloat(holder.balance) * tokenPrice,
                holder.walletEthBalance || '0',
                new Date().toISOString()
              );
            });
            
            const insertQuery = `
              INSERT INTO token_holders 
              (pool_id, address, balance, balance_numeric, rank, percentage, value_usd, wallet_eth_balance, updated_at)
              VALUES ${placeholders.join(', ')}
            `;
            
            await pool.query(insertQuery, values);
          }
          
          successCount++;
          console.log(`✅ Stored ${holders.length} holders for ${poolData.token_pair}`);
        } else {
          console.log(`⚠️ No holders found for ${poolData.token_pair}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error syncing ${poolData.token_pair}:`, error.message);
      }
      
      // Small delay between pools
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Sync Complete!`);
    console.log(`✅ Successful: ${successCount} pools`);
    console.log(`❌ Failed: ${errorCount} pools`);
    
    // Show statistics
    const statsResult = await pool.query(`
      SELECT p.token_pair, COUNT(th.id) as holder_count 
      FROM pools p 
      LEFT JOIN token_holders th ON p.id = th.pool_id 
      WHERE p.pool_address IS NOT NULL 
      GROUP BY p.id, p.token_pair 
      ORDER BY holder_count DESC 
      LIMIT 10
    `);
    
    console.log(`\n📈 Top pools by holder count:`);
    statsResult.rows.forEach(row => {
      console.log(`  ${row.token_pair}: ${row.holder_count} holders`);
    });
    
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await pool.end();
  }
  
  process.exit(0);
}

// Run the sync
directSyncHolders().catch(console.error);