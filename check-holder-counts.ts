import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function checkHolderCounts() {
  const results = await db.execute(sql`
    SELECT 
      p.token_pair,
      p.pool_address,
      c.name as chain,
      pm.holders_count
    FROM pools p
    LEFT JOIN pool_metrics_current pm ON p.id = pm.pool_id
    LEFT JOIN chains c ON p.chain_id = c.id
    WHERE p.is_active = true
    ORDER BY pm.holders_count DESC
    LIMIT 20
  `);

  console.log('Top 20 pools by holder count:');
  for (const row of results.rows) {
    const count = row.holders_count || 0;
    const indicator = count === 100 ? '⚠️ ' : '✅ ';
    console.log(`${indicator}${row.token_pair} on ${row.chain}: ${count} holders`);
  }

  const count100 = results.rows.filter(r => r.holders_count === 100).length;
  console.log(`\nPools with exactly 100 holders: ${count100}/20`);

  process.exit(0);
}

checkHolderCounts().catch(console.error);