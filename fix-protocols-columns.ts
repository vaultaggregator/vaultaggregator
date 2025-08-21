import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fixProtocolsColumns() {
  try {
    console.log("Fixing protocols table columns...");
    
    // Rename protocol_id to protocolId
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN protocol_id TO "protocolId"`);
    console.log("✅ Renamed protocol_id to protocolId");
    
    // Add chain_id column reference
    await db.execute(sql`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS chain_id VARCHAR(50)`);
    console.log("✅ Added chain_id column");
    
    // Rename URL columns
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN website_url TO website`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN twitter_url TO twitter`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN discord_url TO discord`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN github_url TO github`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN docs_url TO docs`);
    console.log("✅ Fixed URL column names");
    
    // Add missing columns from schema
    await db.execute(sql`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS visit_url_template TEXT`);
    await db.execute(sql`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS show_underlying_tokens BOOLEAN DEFAULT false`);
    await db.execute(sql`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS data_refresh_interval_minutes INTEGER DEFAULT 10`);
    console.log("✅ Added missing columns");
    
    // Drop extra columns not in schema
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS telegram_url`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS category`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS tvl_usd`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS volume_24h`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS fees_24h`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS revenue_24h`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS chains`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS audit_links`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS oracle_provider`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS listed_at`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS is_audited`);
    await db.execute(sql`ALTER TABLE protocols DROP COLUMN IF EXISTS risk_level`);
    console.log("✅ Removed extra columns not in schema");
    
    console.log("✅ Protocols table columns fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing protocols columns:", error);
    process.exit(1);
  }
}

fixProtocolsColumns();
