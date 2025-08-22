import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function checkHolders() {
  try {
    // Direct SQL query to check Spark USDC Vault
    const result = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.pool_address,
        p.chain_id,
        pm.holders_count,
        pm.holders_status,
        pm.updated_at
      FROM pools p
      LEFT JOIN pool_metrics_current pm ON p.id = pm.pool_id
      WHERE p.name = 'Spark USDC Vault'
    `);
    
    console.log('✅ Spark USDC Vault query result:');
    if (result.rows && result.rows.length > 0) {
      const pool = result.rows[0];
      console.log('  - Pool ID:', pool.id);
      console.log('  - Contract:', pool.pool_address);
      console.log('  - Chain ID:', pool.chain_id);
      console.log('  - Holder Count:', pool.holders_count || 'Not set');
      console.log('  - Holder Status:', pool.holders_status || 'Not set');
      console.log('  - Last Updated:', pool.updated_at);
    } else {
      console.log('  - Pool not found');
    }
    
    // Check all pools with holder counts
    const allPools = await db.execute(sql`
      SELECT 
        p.name,
        p.pool_address,
        pm.holders_count
      FROM pools p
      LEFT JOIN pool_metrics_current pm ON p.id = pm.pool_id
      WHERE pm.holders_count IS NOT NULL
      ORDER BY pm.holders_count DESC
      LIMIT 10
    `);
    
    console.log('\n📊 Top 10 pools by holder count:');
    if (allPools.rows) {
      allPools.rows.forEach((row: any) => {
        console.log(`  - ${row.name}: ${row.holders_count} holders`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkHolders();