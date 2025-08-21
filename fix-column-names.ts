import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fixColumnNames() {
  try {
    console.log("Fixing column names...");
    
    // Rename native_token_symbol to native_token in networks table
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN native_token_symbol TO native_token`);
    console.log("✅ Renamed native_token_symbol to native_token");
    
    // Update column names to match schema
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN website_url TO website`);
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN twitter_url TO twitter`);
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN discord_url TO discord`);
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN github_url TO github`);
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN docs_url TO docs`);
    await db.execute(sql`ALTER TABLE networks RENAME COLUMN explorer_url TO explorer`);
    console.log("✅ Fixed all URL column names");
    
    // Add color column if it doesn't exist
    await db.execute(sql`ALTER TABLE networks ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6'`);
    console.log("✅ Added color column");
    
    // Drop extra columns that are not in schema
    await db.execute(sql`ALTER TABLE networks DROP COLUMN IF EXISTS block_explorer_api`);
    await db.execute(sql`ALTER TABLE networks DROP COLUMN IF EXISTS tvl_usd`);
    await db.execute(sql`ALTER TABLE networks DROP COLUMN IF EXISTS gas_price`);
    await db.execute(sql`ALTER TABLE networks DROP COLUMN IF EXISTS block_time`);
    await db.execute(sql`ALTER TABLE networks DROP COLUMN IF EXISTS active_addresses`);
    await db.execute(sql`ALTER TABLE networks DROP COLUMN IF EXISTS transaction_count`);
    console.log("✅ Removed extra columns not in schema");
    
    console.log("✅ All column names fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing columns:", error);
    process.exit(1);
  }
}

fixColumnNames();
