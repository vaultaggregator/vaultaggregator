/**
 * Database Optimization Script
 * Creates indexes and optimizes queries for better performance
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

async function optimizeDatabase() {
  console.log('🔧 Starting database optimization...');
  
  try {
    // Create indexes for frequently queried columns
    const indexes = [
      // Pools table indexes
      'CREATE INDEX IF NOT EXISTS idx_pools_platform_id ON pools(platform_id)',
      'CREATE INDEX IF NOT EXISTS idx_pools_chain_id ON pools(chain_id)',
      'CREATE INDEX IF NOT EXISTS idx_pools_is_visible ON pools(is_visible)',
      'CREATE INDEX IF NOT EXISTS idx_pools_is_active ON pools(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_pools_tvl ON pools(tvl)',
      'CREATE INDEX IF NOT EXISTS idx_pools_apy ON pools(apy)',
      'CREATE INDEX IF NOT EXISTS idx_pools_risk_level ON pools(risk_level)',
      'CREATE INDEX IF NOT EXISTS idx_pools_last_updated ON pools(last_updated)',
      'CREATE INDEX IF NOT EXISTS idx_pools_token_info_id ON pools(token_info_id)',
      'CREATE INDEX IF NOT EXISTS idx_pools_project ON pools(project)',
      
      // Composite indexes for common queries
      'CREATE INDEX IF NOT EXISTS idx_pools_visible_active ON pools(is_visible, is_active)',
      'CREATE INDEX IF NOT EXISTS idx_pools_platform_chain ON pools(platform_id, chain_id)',
      'CREATE INDEX IF NOT EXISTS idx_pools_visible_tvl ON pools(is_visible, tvl DESC)',
      'CREATE INDEX IF NOT EXISTS idx_pools_visible_apy ON pools(is_visible, apy DESC)',
      
      // Token info indexes
      'CREATE INDEX IF NOT EXISTS idx_token_info_address ON token_info(address)',
      'CREATE INDEX IF NOT EXISTS idx_token_info_symbol ON token_info(symbol)',
      'CREATE INDEX IF NOT EXISTS idx_token_info_chain ON token_info(chain)',
      'CREATE INDEX IF NOT EXISTS idx_token_info_last_updated ON token_info(last_updated)',
      
      // Categories indexes
      'CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)',
      'CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)',
      
      // Pool categories junction table
      'CREATE INDEX IF NOT EXISTS idx_pool_categories_pool_id ON pool_categories(pool_id)',
      'CREATE INDEX IF NOT EXISTS idx_pool_categories_category_id ON pool_categories(category_id)',
      
      // Platforms indexes
      'CREATE INDEX IF NOT EXISTS idx_platforms_slug ON platforms(slug)',
      'CREATE INDEX IF NOT EXISTS idx_platforms_is_active ON platforms(is_active)',
      
      // Chains indexes
      'CREATE INDEX IF NOT EXISTS idx_chains_name ON chains(name)',
      'CREATE INDEX IF NOT EXISTS idx_chains_is_active ON chains(is_active)',
      
      // Notes indexes
      'CREATE INDEX IF NOT EXISTS idx_notes_pool_id ON notes(pool_id)',
      'CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)',
      
      // API keys indexes
      'CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)',
      
      // Sessions indexes (for performance)
      'CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire)',
      
      // Full-text search indexes for better search performance
      'CREATE INDEX IF NOT EXISTS idx_pools_token_pair_gin ON pools USING gin(to_tsvector(\'english\', token_pair))',
      'CREATE INDEX IF NOT EXISTS idx_platforms_name_gin ON platforms USING gin(to_tsvector(\'english\', display_name))',
      'CREATE INDEX IF NOT EXISTS idx_chains_name_gin ON chains USING gin(to_tsvector(\'english\', display_name))'
    ];
    
    // Execute each index creation
    for (const indexQuery of indexes) {
      try {
        await db.execute(sql.raw(indexQuery));
        console.log(`✅ Created index: ${indexQuery.match(/idx_\w+/)?.[0]}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Index already exists: ${indexQuery.match(/idx_\w+/)?.[0]}`);
        } else {
          console.error(`❌ Failed to create index: ${indexQuery.match(/idx_\w+/)?.[0]}`, error.message);
        }
      }
    }
    
    // Analyze tables for query optimization
    const tables = ['pools', 'platforms', 'chains', 'categories', 'token_info', 'notes', 'api_keys', 'users'];
    
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`ANALYZE ${table}`));
        console.log(`📊 Analyzed table: ${table}`);
      } catch (error: any) {
        console.error(`❌ Failed to analyze table ${table}:`, error.message);
      }
    }
    
    // Update table statistics
    await db.execute(sql.raw('VACUUM ANALYZE'));
    console.log('🔍 Updated database statistics');
    
    // Get database size info
    const sizeResult = await db.execute(sql.raw(`
      SELECT 
        pg_database.datname as database_name,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size
      FROM pg_database
      WHERE datname = current_database()
    `));
    
    if (sizeResult.rows.length > 0) {
      console.log(`📦 Database size: ${sizeResult.rows[0].size}`);
    }
    
    // Get index usage statistics
    const indexUsage = await db.execute(sql.raw(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 10
    `));
    
    console.log('\n📈 Top 10 most used indexes:');
    indexUsage.rows.forEach((row: any) => {
      console.log(`  - ${row.indexname}: ${row.index_scans} scans`);
    });
    
    // Get slow queries (if pg_stat_statements is available)
    try {
      const slowQueries = await db.execute(sql.raw(`
        SELECT 
          calls,
          mean_exec_time,
          total_exec_time,
          query
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT 5
      `));
      
      if (slowQueries.rows.length > 0) {
        console.log('\n🐌 Top 5 slowest queries:');
        slowQueries.rows.forEach((row: any, index: number) => {
          console.log(`  ${index + 1}. Mean time: ${row.mean_exec_time.toFixed(2)}ms, Calls: ${row.calls}`);
          console.log(`     ${row.query.substring(0, 100)}...`);
        });
      }
    } catch (error) {
      // pg_stat_statements might not be enabled
      console.log('\n📊 Query statistics not available (pg_stat_statements not enabled)');
    }
    
    console.log('\n✅ Database optimization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
optimizeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { optimizeDatabase };