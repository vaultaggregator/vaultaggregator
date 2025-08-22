import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function createSwrTables() {
  console.log("Creating SWR cache tables...");
  
  try {
    // Create swr_cached_pages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS swr_cached_pages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        page_name VARCHAR(255) UNIQUE NOT NULL,
        route_pattern TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        is_enabled BOOLEAN DEFAULT true NOT NULL,
        cache_duration_ms INTEGER DEFAULT 60000 NOT NULL,
        revalidate_on_focus BOOLEAN DEFAULT true NOT NULL,
        revalidate_on_reconnect BOOLEAN DEFAULT true NOT NULL,
        persist_to_disk BOOLEAN DEFAULT true NOT NULL,
        priority INTEGER DEFAULT 1 NOT NULL,
        last_cached_at TIMESTAMP,
        cache_hit_count INTEGER DEFAULT 0 NOT NULL,
        cache_miss_count INTEGER DEFAULT 0 NOT NULL,
        avg_response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created swr_cached_pages table");
    
    // Create swr_cache_snapshots table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS swr_cache_snapshots (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id VARCHAR NOT NULL REFERENCES swr_cached_pages(id) ON DELETE CASCADE,
        cache_key TEXT NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB,
        data_size INTEGER,
        etag VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        access_count INTEGER DEFAULT 0 NOT NULL,
        last_accessed_at TIMESTAMP,
        is_stale BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Created swr_cache_snapshots table");
    
    // Add default cached pages
    await db.execute(sql`
      INSERT INTO swr_cached_pages (page_name, route_pattern, display_name, description, cache_duration_ms)
      VALUES 
        ('pools_list', '/api/pools', 'Pools List', 'Main pools listing page', 30000),
        ('chains_list', '/api/chains', 'Chains List', 'Blockchain networks listing', 60000),
        ('categories_list', '/api/categories', 'Categories List', 'Pool categories listing', 60000),
        ('stats', '/api/stats', 'Platform Stats', 'Global platform statistics', 60000)
      ON CONFLICT (page_name) DO NOTHING
    `);
    
    console.log("✅ Added default cached pages configuration");
    console.log("✅ SWR cache tables created successfully!");
    
  } catch (error) {
    console.error("Error creating SWR tables:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

createSwrTables();