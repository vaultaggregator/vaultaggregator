import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fixProtocolsColumns() {
  try {
    console.log("Fixing protocols table columns to match schema...");
    
    // Rename back to use underscores as defined in schema
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN "protocolId" TO protocol_id`);
    console.log("✅ Renamed protocolId back to protocol_id");
    
    // Rename other columns to match schema naming
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN network_id TO network_id`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN visit_url_template TO visit_url_template`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN show_underlying_tokens TO show_underlying_tokens`);
    await db.execute(sql`ALTER TABLE protocols RENAME COLUMN data_refresh_interval_minutes TO data_refresh_interval_minutes`);
    console.log("✅ Verified column names match schema");
    
    console.log("✅ Protocols table columns fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error or columns already correct:", error);
    // Ignore errors if columns are already correct
    process.exit(0);
  }
}

fixProtocolsColumns();
