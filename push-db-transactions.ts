import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function createTransactionsTable() {
  try {
    console.log('Creating token_transactions table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS token_transactions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pool_id VARCHAR NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
        transaction_hash TEXT NOT NULL,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        value TEXT NOT NULL,
        value_formatted TEXT,
        block_number TEXT,
        block_timestamp TIMESTAMP,
        token_address TEXT,
        token_symbol TEXT,
        token_name TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ token_transactions table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTransactionsTable();