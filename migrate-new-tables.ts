import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function createNewTables() {
  try {
    console.log("Creating new tables...");
    
    // Create networks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS networks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        chain_id VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        display_name VARCHAR NOT NULL,
        native_token_symbol VARCHAR,
        logo_url TEXT,
        explorer_url TEXT,
        website_url TEXT,
        twitter_url TEXT,
        discord_url TEXT,
        github_url TEXT,
        docs_url TEXT,
        block_explorer_api TEXT,
        rpc_url TEXT,
        is_testnet BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        tvl_usd DECIMAL(20, 2),
        gas_price TEXT,
        block_time DECIMAL(10, 2),
        active_addresses INTEGER,
        transaction_count INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Created networks table");

    // Create protocols table  
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS protocols (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        network_id VARCHAR REFERENCES networks(id) ON DELETE CASCADE,
        protocol_id VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        display_name VARCHAR NOT NULL,
        slug VARCHAR UNIQUE,
        description TEXT,
        logo_url TEXT,
        website_url TEXT,
        twitter_url TEXT,
        discord_url TEXT,
        telegram_url TEXT,
        github_url TEXT,
        docs_url TEXT,
        category VARCHAR,
        tvl_usd DECIMAL(20, 2),
        volume_24h DECIMAL(20, 2),
        fees_24h DECIMAL(20, 2),
        revenue_24h DECIMAL(20, 2),
        chains TEXT ARRAY,
        audit_links TEXT ARRAY,
        oracle_provider VARCHAR,
        listed_at TIMESTAMP,
        is_audited BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        risk_level VARCHAR DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Created protocols table");

    // Create tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        network_id VARCHAR REFERENCES networks(id) ON DELETE CASCADE,
        address VARCHAR NOT NULL,
        symbol VARCHAR NOT NULL,
        name VARCHAR,
        decimals INTEGER,
        logo_url TEXT,
        coingecko_id VARCHAR,
        price_usd DECIMAL(20, 8),
        price_change_24h DECIMAL(10, 2),
        market_cap DECIMAL(20, 2),
        volume_24h DECIMAL(20, 2),
        total_supply TEXT,
        circulating_supply TEXT,
        holders_count INTEGER,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(network_id, address)
      )
    `);
    console.log("✅ Created tokens table");

    // Create user_tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        token_id VARCHAR REFERENCES tokens(id) ON DELETE CASCADE,
        balance DECIMAL(30, 18) NOT NULL DEFAULT 0,
        balance_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
        average_buy_price DECIMAL(20, 8),
        total_invested_usd DECIMAL(20, 2) DEFAULT 0,
        realized_pnl DECIMAL(20, 2) DEFAULT 0,
        unrealized_pnl DECIMAL(20, 2) DEFAULT 0,
        is_tracked BOOLEAN DEFAULT true,
        notes TEXT,
        last_updated TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, token_id)
      )
    `);
    console.log("✅ Created user_tokens table");

    // Create user_protocols table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_protocols (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
        protocol_id VARCHAR REFERENCES protocols(id) ON DELETE CASCADE,
        position_value_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
        total_deposited_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
        total_withdrawn_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
        rewards_earned_usd DECIMAL(20, 2) NOT NULL DEFAULT 0,
        last_interaction TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, protocol_id)
      )
    `);
    console.log("✅ Created user_protocols table");

    // Add indexes - skip if columns don't exist
    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_networks_chain_id ON networks(chain_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_protocols_network_id ON protocols(network_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tokens_network_id ON tokens(network_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_protocols_user_id ON user_protocols(user_id)`);
      console.log("✅ Created indexes");
    } catch (indexError) {
      console.log("⚠️ Some indexes may have failed, but tables were created successfully");
    }

    console.log("✅ All new tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

createNewTables();