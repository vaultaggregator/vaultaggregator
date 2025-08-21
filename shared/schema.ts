import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, json, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: varchar("wallet_address", { length: 100 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys table for external API access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  tier: varchar("tier", { length: 50 }).notNull().default("free"), // free, pro
  requestsPerHour: integer("requests_per_hour").notNull().default(1000),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Settings table for controlling external data sources
export const apiSettings = pgTable("api_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceName: varchar("service_name", { length: 100 }).notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  baseUrl: text("base_url"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  category: varchar("category", { length: 50 }).notNull().default("data"), // data, ai, blockchain
  priority: integer("priority").notNull().default(1), // 1=high, 2=medium, 3=low
  rateLimitRpm: integer("rate_limit_rpm"), // requests per minute
  healthStatus: varchar("health_status", { length: 50 }).notNull().default("unknown"), // healthy, degraded, down, unknown
  lastHealthCheck: timestamp("last_health_check"),
  errorCount: integer("error_count").notNull().default(0),
  lastErrorAt: timestamp("last_error_at"),
  disabledReason: text("disabled_reason"),
  disabledBy: varchar("disabled_by"), 
  disabledAt: timestamp("disabled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cache Settings table for managing cache durations
export const cacheSettings = pgTable("cache_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceName: varchar("service_name", { length: 100 }).notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  cacheDurationMs: integer("cache_duration_ms").notNull(), // Cache duration in milliseconds
  cacheType: varchar("cache_type", { length: 50 }).notNull().default("memory"), // memory, redis, database
  isEnabled: boolean("is_enabled").notNull().default(true),
  category: varchar("category", { length: 50 }).notNull().default("general"), // api, metadata, holders, pricing
  maxEntries: integer("max_entries"), // Maximum cache entries (for memory caches)
  hitCount: integer("hit_count").notNull().default(0), // Cache hit statistics
  missCount: integer("miss_count").notNull().default(0), // Cache miss statistics
  lastClearAt: timestamp("last_clear_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiKeyUsage = pgTable("api_key_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

// 🚨 Creative Error Logging System for Admin Dashboard
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // Human-readable error title
  description: text("description").notNull(), // Detailed description  
  errorType: varchar("error_type", { length: 100 }).notNull(), // API, Database, Validation, Service
  severity: varchar("severity", { length: 50 }).notNull().default("medium"), // low, medium, high, critical
  source: text("source"), // Which service/function caused the error
  stackTrace: text("stack_trace"), // Technical stack trace
  fixPrompt: text("fix_prompt").notNull(), // The AI prompt to copy for fixing
  metadata: jsonb("metadata"), // Additional context (API responses, user actions, etc.)
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"), // Admin who marked as resolved
  occurredAt: timestamp("occurred_at").defaultNow(),
  lastOccurredAt: timestamp("last_occurred_at").defaultNow(),
  count: integer("count").notNull().default(1), // How many times this error occurred
});

// Networks table (formerly chains)
export const networks = pgTable("networks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: varchar("chain_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: text("display_name").notNull(),
  logoUrl: text("logo_url"),
  nativeToken: varchar("native_token", { length: 20 }),
  website: text("website"),
  twitter: text("twitter"),
  discord: text("discord"),
  github: text("github"),
  docs: text("docs"),
  explorer: text("explorer"),
  rpcUrl: text("rpc_url"),
  color: text("color").notNull().default("#3B82F6"),
  isActive: boolean("is_active").notNull().default(true),
  isTestnet: boolean("is_testnet").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Separate chains table for token foreign key references
export const chains = pgTable("chains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  iconUrl: text("icon_url"),
});

// Protocols table (formerly platforms)
export const protocols = pgTable("protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocolId: varchar("protocol_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  displayName: text("display_name").notNull(),
  networkId: varchar("network_id").references(() => networks.id),
  chainId: varchar("chain_id", { length: 50 }).references(() => networks.chainId),
  logoUrl: text("logo_url"),
  website: text("website"),
  twitter: text("twitter"),
  discord: text("discord"),
  github: text("github"),
  docs: text("docs"),
  slug: text("slug").notNull().unique(),
  visitUrlTemplate: text("visit_url_template"),
  showUnderlyingTokens: boolean("show_underlying_tokens").default(false),
  dataRefreshIntervalMinutes: integer("data_refresh_interval_minutes").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chainId: varchar("chain_id").notNull().references(() => chains.id),
  address: varchar("address", { length: 100 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  decimals: integer("decimals").notNull().default(18),
  logoUrl: text("logo_url"),
  networkId: varchar("network_id").references(() => networks.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Keep platforms as alias for protocols for backwards compatibility
export const platforms = protocols;

// User token holdings (link between users and tokens)
export const userTokens = pgTable("user_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenId: varchar("token_id").notNull().references(() => tokens.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 30, scale: 18 }).notNull().default(sql`0`),
  usdValue: decimal("usd_value", { precision: 20, scale: 2 }).notNull().default(sql`0`),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User protocol interactions (link between users and protocols)
export const userProtocols = pgTable("user_protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  protocolId: varchar("protocol_id").notNull().references(() => protocols.id, { onDelete: "cascade" }),
  suppliedUsd: decimal("supplied_usd", { precision: 20, scale: 2 }).notNull().default(sql`0`),
  borrowedUsd: decimal("borrowed_usd", { precision: 20, scale: 2 }).notNull().default(sql`0`),
  stakedUsd: decimal("staked_usd", { precision: 20, scale: 2 }).notNull().default(sql`0`),
  lpPositionsUsd: decimal("lp_positions_usd", { precision: 20, scale: 2 }).notNull().default(sql`0`),
  rewardsEarnedUsd: decimal("rewards_earned_usd", { precision: 20, scale: 2 }).notNull().default(sql`0`),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  slug: text("slug").notNull().unique(),
  iconUrl: text("icon_url"),
  description: text("description"),
  color: text("color").notNull().default("#3B82F6"),
  parentId: varchar("parent_id"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const poolCategories = pgTable("pool_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Historical data points for charts and analytics  
export const poolHistoricalData = pgTable("pool_historical_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").references(() => pools.id, { onDelete: "cascade" }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  apy: decimal("apy", { precision: 10, scale: 4 }),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  holders: integer("holders"),
  dataSource: varchar("data_source", { length: 50 }).notNull().default("morpho_api"), // morpho_api, lido_api, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Token information table
export const tokenInfo = pgTable("token_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  name: text("name"),
  symbol: text("symbol"),
  decimals: text("decimals"),
  totalSupply: text("total_supply"),
  holdersCount: integer("holders_count"),
  contractCreator: text("contract_creator"),
  txHash: text("tx_hash"),
  isVerified: boolean("is_verified").default(false),
  priceUsd: decimal("price_usd", { precision: 20, scale: 8 }),
  marketCapUsd: decimal("market_cap_usd", { precision: 20, scale: 2 }),
  transfers24h: integer("transfers_24h"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Holder history tracking table for analytics
export const holderHistory = pgTable("holder_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenAddress: text("token_address").notNull(),
  holdersCount: integer("holders_count").notNull(),
  priceUsd: decimal("price_usd", { precision: 20, scale: 8 }),
  marketCapUsd: decimal("market_cap_usd", { precision: 20, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Individual token holders data for detailed analysis
export const tokenHolders = pgTable("token_holders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  tokenAddress: text("token_address").notNull(),
  holderAddress: text("holder_address").notNull(),
  tokenBalance: text("token_balance").notNull(), // Raw token balance (in wei)
  tokenBalanceFormatted: decimal("token_balance_formatted", { precision: 30, scale: 8 }), // Human readable balance - increased for large holders
  usdValue: decimal("usd_value", { precision: 30, scale: 2 }), // USD value of token holding - increased for whales
  walletBalanceEth: decimal("wallet_balance_eth", { precision: 30, scale: 8 }), // Total ETH balance in wallet - increased
  walletBalanceUsd: decimal("wallet_balance_usd", { precision: 30, scale: 2 }), // Total wallet value in USD - increased for whales
  poolSharePercentage: decimal("pool_share_percentage", { precision: 10, scale: 6 }), // Percentage of pool owned
  rank: integer("rank").notNull(), // Holder rank by balance
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhook configuration for automatic monitoring
export const webhookConfigs = pgTable("webhook_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").references(() => pools.id, { onDelete: "cascade" }),
  contractAddress: text("contract_address").notNull().unique(),
  network: text("network").notNull(), // ethereum, base, polygon, etc.
  eventTypes: text("event_types").array(), // ['transfer', 'approval', 'mint', 'burn']
  isActive: boolean("is_active").default(true),
  webhookUrl: text("webhook_url"), // Optional custom webhook URL
  metadata: jsonb("metadata"), // Additional configuration data
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 🎯 Standardized Pool Metrics Historical Tracking System
// Core 4 metrics: APY, DAYS, TVL, HOLDERS - collected from platform-specific APIs

export const poolMetricsHistory = pgTable("pool_metrics_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  
  // Core 4 metrics
  apy: decimal("apy", { precision: 10, scale: 4 }), // APY from platform API
  operatingDays: integer("operating_days"), // Days since contract creation (Etherscan)
  tvl: decimal("tvl", { precision: 20, scale: 2 }), // Total Value Locked from platform API
  holdersCount: integer("holders_count"), // Token holders from Etherscan
  
  // Metadata for tracking
  dataSource: text("data_source").notNull(), // "morpho", "lido", "etherscan", etc.
  collectionMethod: text("collection_method").notNull(), // "auto", "manual", "immediate"
  apiResponse: jsonb("api_response"), // Raw API response for debugging
  errorLog: text("error_log"), // Any errors during collection
  
  collectedAt: timestamp("collected_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Current pool metrics (latest values from historical tracking)
export const poolMetricsCurrent = pgTable("pool_metrics_current", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }).unique(),
  
  // Current values of core 4 metrics
  apy: decimal("apy", { precision: 10, scale: 4 }),
  operatingDays: integer("operating_days"),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  holdersCount: integer("holders_count"),
  
  // Status tracking
  apyStatus: text("apy_status").notNull().default("pending"), // "success", "error", "pending", "n/a"
  daysStatus: text("days_status").notNull().default("pending"),
  tvlStatus: text("tvl_status").notNull().default("pending"),
  holdersStatus: text("holders_status").notNull().default("pending"),
  
  // Error messages for failed collections
  apyError: text("apy_error"),
  daysError: text("days_error"),
  tvlError: text("tvl_error"),
  holdersError: text("holders_error"),
  
  lastCollectionAt: timestamp("last_collection_at"),
  lastSuccessfulCollectionAt: timestamp("last_successful_collection_at"),
  nextCollectionAt: timestamp("next_collection_at"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pools = pgTable("pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platformId: varchar("platform_id").notNull().references(() => platforms.id),
  chainId: varchar("chain_id").notNull().references(() => chains.id),
  tokenPair: text("token_pair").notNull(),
  apy: decimal("apy", { precision: 10, scale: 4 }),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  riskLevel: text("risk_level").notNull().default("medium"), // low, medium, high
  poolAddress: text("pool_address"),
  defiLlamaId: text("defi_llama_id"),
  project: text("project"), // Data source identifier (defillama, morpho, lido)
  rawData: jsonb("raw_data"),
  tokenInfoId: varchar("token_info_id").references(() => tokenInfo.id), // Link to token information
  showUsdInFlow: boolean("show_usd_in_flow").notNull().default(false), // Admin control for USD display in token flow analysis
  isVisible: boolean("is_visible").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  // Soft deletion fields for trash bin system
  deletedAt: timestamp("deleted_at"), // When the pool was soft deleted
  deletedBy: varchar("deleted_by").references(() => users.id), // Who deleted it
  permanentDeleteAt: timestamp("permanent_delete_at"), // When to permanently delete (deletedAt + 60 days)
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiOutlooks = pgTable("ai_outlooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  outlook: text("outlook").notNull(), // AI-generated prediction text
  sentiment: text("sentiment").notNull(), // "bullish", "bearish", "neutral"
  confidence: integer("confidence").notNull(), // 1-100 confidence score
  marketFactors: json("market_factors"), // JSON array of considered factors
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // When this prediction expires (2 hours)
});

// Enhanced features tables

// 1. Risk Scoring System
export const riskScores = pgTable("risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(), // 1-100 (lower = safer)
  smartContractRisk: integer("smart_contract_risk").notNull(), // 1-100
  liquidityRisk: integer("liquidity_risk").notNull(), // 1-100
  platformRisk: integer("platform_risk").notNull(), // 1-100
  marketRisk: integer("market_risk").notNull(), // 1-100
  auditStatus: text("audit_status").notNull().default("unknown"), // verified, unaudited, unknown
  tvlStability: decimal("tvl_stability", { precision: 5, scale: 2 }), // volatility score
  apyVolatility: decimal("apy_volatility", { precision: 5, scale: 2 }), // APY variance
  calculatedAt: timestamp("calculated_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Smart Alerts System
export const userAlerts = pgTable("user_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  poolId: varchar("pool_id").references(() => pools.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // yield_change, new_opportunity, risk_warning
  condition: jsonb("condition").notNull(), // Alert conditions (thresholds, etc.)
  isActive: boolean("is_active").notNull().default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alertNotifications = pgTable("alert_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").notNull().references(() => userAlerts.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"), // info, warning, critical
  isRead: boolean("is_read").notNull().default(false),
  triggeredAt: timestamp("triggered_at").defaultNow(),
});

// 3. User Reviews & Ratings System
export const poolReviews = pgTable("pool_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title").notNull(),
  content: text("content").notNull(),
  experienceLevel: text("experience_level").notNull(), // beginner, intermediate, expert
  investmentAmount: text("investment_amount"), // small, medium, large
  isVerified: boolean("is_verified").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviewVotes = pgTable("review_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => poolReviews.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteType: text("vote_type").notNull(), // upvote, downvote
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Community Insights System
export const strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // farming, staking, lending, arbitrage
  riskLevel: text("risk_level").notNull(), // conservative, moderate, aggressive
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }),
  timeHorizon: text("time_horizon").notNull(), // short, medium, long
  isPublic: boolean("is_public").notNull().default(true),
  upvotes: integer("upvotes").notNull().default(0),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const strategyPools = pgTable("strategy_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strategyId: varchar("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  allocation: decimal("allocation", { precision: 5, scale: 2 }).notNull(), // percentage
  reasoning: text("reasoning"),
});

export const discussions = pgTable("discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  poolId: varchar("pool_id").references(() => pools.id, { onDelete: "cascade" }),
  strategyId: varchar("strategy_id").references(() => strategies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // general, support, strategy, analysis
  isPinned: boolean("is_pinned").notNull().default(false),
  replyCount: integer("reply_count").notNull().default(0),
  lastReplyAt: timestamp("last_reply_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discussionReplies = pgTable("discussion_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discussionId: varchar("discussion_id").notNull().references(() => discussions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentReplyId: varchar("parent_reply_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. Custom Watchlists System
export const watchlists = pgTable("watchlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  alertsEnabled: boolean("alerts_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const watchlistPools = pgTable("watchlist_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  watchlistId: varchar("watchlist_id").notNull().references(() => watchlists.id, { onDelete: "cascade" }),
  poolId: varchar("pool_id").notNull().references(() => pools.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

// 6. API Marketplace System
export const apiEndpoints = pgTable("api_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull().default("GET"),
  category: text("category").notNull(), // pools, analytics, risk, community
  accessLevel: text("access_level").notNull().default("free"), // free, pro, enterprise
  rateLimitPerHour: integer("rate_limit_per_hour").notNull().default(1000),
  documentation: text("documentation"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const developerApplications = pgTable("developer_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  companyName: text("company_name"),
  projectDescription: text("project_description").notNull(),
  intendedUsage: text("intended_usage").notNull(),
  requestedTier: text("requested_tier").notNull().default("free"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const chainsRelations = relations(chains, ({ many }) => ({
  tokens: many(tokens),
  pools: many(pools),
}));



export const tokenInfoRelations = relations(tokenInfo, ({ many }) => ({
  pools: many(pools),
}));

export const platformsRelations = relations(platforms, ({ many }) => ({
  pools: many(pools),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  subcategories: many(categories),
  poolCategories: many(poolCategories),
}));

export const poolCategoriesRelations = relations(poolCategories, ({ one }) => ({
  pool: one(pools, {
    fields: [poolCategories.poolId],
    references: [pools.id],
  }),
  category: one(categories, {
    fields: [poolCategories.categoryId],
    references: [categories.id],
  }),
}));

// Define relations for the new tables
export const usersRelations = relations(users, ({ many }) => ({
  userTokens: many(userTokens),
  userProtocols: many(userProtocols),
  userAlerts: many(userAlerts),
  poolReviews: many(poolReviews),
  reviewVotes: many(reviewVotes),
  strategies: many(strategies),
  discussions: many(discussions),
  discussionReplies: many(discussionReplies),
  watchlists: many(watchlists),
}));

export const networksRelations = relations(networks, ({ many }) => ({
  tokens: many(tokens),
  protocols: many(protocols),
  pools: many(pools),
}));

export const protocolsRelations = relations(protocols, ({ one, many }) => ({
  network: one(networks, {
    fields: [protocols.networkId],
    references: [networks.id],
  }),
  userProtocols: many(userProtocols),
  pools: many(pools),
}));

export const tokensRelations = relations(tokens, ({ one, many }) => ({
  network: one(networks, {
    fields: [tokens.networkId],
    references: [networks.id],
  }),
  userTokens: many(userTokens),
}));

export const userTokensRelations = relations(userTokens, ({ one }) => ({
  user: one(users, {
    fields: [userTokens.userId],
    references: [users.id],
  }),
  token: one(tokens, {
    fields: [userTokens.tokenId],
    references: [tokens.id],
  }),
}));

export const userProtocolsRelations = relations(userProtocols, ({ one }) => ({
  user: one(users, {
    fields: [userProtocols.userId],
    references: [users.id],
  }),
  protocol: one(protocols, {
    fields: [userProtocols.protocolId],
    references: [protocols.id],
  }),
}));

export const poolsRelations = relations(pools, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [pools.platformId],
    references: [platforms.id],
  }),
  chain: one(chains, {
    fields: [pools.chainId],
    references: [chains.id],
  }),
  tokenInfo: one(tokenInfo, {
    fields: [pools.tokenInfoId],
    references: [tokenInfo.id],
  }),
  notes: many(notes),
  poolCategories: many(poolCategories),
  aiOutlooks: many(aiOutlooks),
  riskScores: many(riskScores),
  poolReviews: many(poolReviews),
  userAlerts: many(userAlerts),
  strategyPools: many(strategyPools),
  discussions: many(discussions),
  watchlistPools: many(watchlistPools),
  metricsHistory: many(poolMetricsHistory),
  metricsCurrent: one(poolMetricsCurrent),
  tokenHolders: many(tokenHolders),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  pool: one(pools, {
    fields: [notes.poolId],
    references: [pools.id],
  }),
}));

export const aiOutlooksRelations = relations(aiOutlooks, ({ one }) => ({
  pool: one(pools, {
    fields: [aiOutlooks.poolId],
    references: [pools.id],
  }),
}));

// Enhanced features relations
export const riskScoresRelations = relations(riskScores, ({ one }) => ({
  pool: one(pools, {
    fields: [riskScores.poolId],
    references: [pools.id],
  }),
}));

export const userAlertsRelations = relations(userAlerts, ({ one, many }) => ({
  user: one(users, {
    fields: [userAlerts.userId],
    references: [users.id],
  }),
  pool: one(pools, {
    fields: [userAlerts.poolId],
    references: [pools.id],
  }),
  notifications: many(alertNotifications),
}));

export const alertNotificationsRelations = relations(alertNotifications, ({ one }) => ({
  alert: one(userAlerts, {
    fields: [alertNotifications.alertId],
    references: [userAlerts.id],
  }),
}));

export const poolReviewsRelations = relations(poolReviews, ({ one, many }) => ({
  pool: one(pools, {
    fields: [poolReviews.poolId],
    references: [pools.id],
  }),
  user: one(users, {
    fields: [poolReviews.userId],
    references: [users.id],
  }),
  votes: many(reviewVotes),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  review: one(poolReviews, {
    fields: [reviewVotes.reviewId],
    references: [poolReviews.id],
  }),
  user: one(users, {
    fields: [reviewVotes.userId],
    references: [users.id],
  }),
}));

export const strategiesRelations = relations(strategies, ({ one, many }) => ({
  user: one(users, {
    fields: [strategies.userId],
    references: [users.id],
  }),
  strategyPools: many(strategyPools),
  discussions: many(discussions),
}));

export const strategyPoolsRelations = relations(strategyPools, ({ one }) => ({
  strategy: one(strategies, {
    fields: [strategyPools.strategyId],
    references: [strategies.id],
  }),
  pool: one(pools, {
    fields: [strategyPools.poolId],
    references: [pools.id],
  }),
}));

export const discussionsRelations = relations(discussions, ({ one, many }) => ({
  user: one(users, {
    fields: [discussions.userId],
    references: [users.id],
  }),
  pool: one(pools, {
    fields: [discussions.poolId],
    references: [pools.id],
  }),
  strategy: one(strategies, {
    fields: [discussions.strategyId],
    references: [strategies.id],
  }),
  replies: many(discussionReplies),
}));

export const discussionRepliesRelations = relations(discussionReplies, ({ one, many }) => ({
  discussion: one(discussions, {
    fields: [discussionReplies.discussionId],
    references: [discussions.id],
  }),
  user: one(users, {
    fields: [discussionReplies.userId],
    references: [users.id],
  }),
  parentReply: one(discussionReplies, {
    fields: [discussionReplies.parentReplyId],
    references: [discussionReplies.id],
  }),
  childReplies: many(discussionReplies),
}));

export const watchlistsRelations = relations(watchlists, ({ one, many }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
  watchlistPools: many(watchlistPools),
}));

export const watchlistPoolsRelations = relations(watchlistPools, ({ one }) => ({
  watchlist: one(watchlists, {
    fields: [watchlistPools.watchlistId],
    references: [watchlists.id],
  }),
  pool: one(pools, {
    fields: [watchlistPools.poolId],
    references: [pools.id],
  }),
}));

// Metrics tables relations
export const poolMetricsHistoryRelations = relations(poolMetricsHistory, ({ one }) => ({
  pool: one(pools, {
    fields: [poolMetricsHistory.poolId],
    references: [pools.id],
  }),
}));

export const poolMetricsCurrentRelations = relations(poolMetricsCurrent, ({ one }) => ({
  pool: one(pools, {
    fields: [poolMetricsCurrent.poolId],
    references: [pools.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertNetworkSchema = createInsertSchema(networks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProtocolSchema = createInsertSchema(protocols).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
});

export const insertUserTokenSchema = createInsertSchema(userTokens).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertUserProtocolSchema = createInsertSchema(userProtocols).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastInteraction: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeyUsageSchema = createInsertSchema(apiKeyUsage).omit({
  id: true,
  timestamp: true,
});

export const insertApiSettingsSchema = createInsertSchema(apiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChainSchema = createInsertSchema(chains).omit({
  id: true,
  createdAt: true,
});

export const insertTokenInfoSchema = createInsertSchema(tokenInfo).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertHolderHistorySchema = createInsertSchema(holderHistory).omit({
  id: true,
  timestamp: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
  createdAt: true,
});

export const insertPoolSchema = createInsertSchema(pools).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories)
  .omit({
    id: true,
    createdAt: true,
  })
  .partial({
    slug: true,
    sortOrder: true,
    isActive: true,
    iconUrl: true,
    description: true,
  });

export const insertPoolCategorySchema = createInsertSchema(poolCategories).omit({
  id: true,
  createdAt: true,
});

export const insertAIOutlookSchema = createInsertSchema(aiOutlooks).omit({
  id: true,
  generatedAt: true,
});

// Enhanced features insert schemas
export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({
  id: true,
  calculatedAt: true,
  updatedAt: true,
});

export const insertUserAlertSchema = createInsertSchema(userAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).omit({
  id: true,
  triggeredAt: true,
});

export const insertPoolReviewSchema = createInsertSchema(poolReviews).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({
  id: true,
  createdAt: true,
});

export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  upvotes: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStrategyPoolSchema = createInsertSchema(strategyPools).omit({
  id: true,
});

export const insertDiscussionSchema = createInsertSchema(discussions).omit({
  id: true,
  replyCount: true,
  lastReplyAt: true,
  createdAt: true,
});

export const insertDiscussionReplySchema = createInsertSchema(discussionReplies).omit({
  id: true,
  createdAt: true,
});

// Metrics tables insert schemas
export const insertPoolMetricsHistorySchema = createInsertSchema(poolMetricsHistory).omit({
  id: true,
  collectedAt: true,
  createdAt: true,
});

export const insertPoolMetricsCurrentSchema = createInsertSchema(poolMetricsCurrent).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export const insertTokenHolderSchema = createInsertSchema(tokenHolders).omit({
  id: true,
  lastUpdated: true,
  createdAt: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWatchlistPoolSchema = createInsertSchema(watchlistPools).omit({
  id: true,
  addedAt: true,
});

export const insertApiEndpointSchema = createInsertSchema(apiEndpoints).omit({
  id: true,
  createdAt: true,
});

export const insertDeveloperApplicationSchema = createInsertSchema(developerApplications).omit({
  id: true,
  status: true,
  approvedAt: true,
  createdAt: true,
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  occurredAt: true,
  lastOccurredAt: true,
  count: true,
});

export const insertCacheSettingsSchema = createInsertSchema(cacheSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  hitCount: true,
  missCount: true,
});

// Token Holders relation
export const tokenHoldersRelations = relations(tokenHolders, ({ one }) => ({
  pool: one(pools, {
    fields: [tokenHolders.poolId],
    references: [pools.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Network = typeof networks.$inferSelect;
export type InsertNetwork = z.infer<typeof insertNetworkSchema>;

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;

export type UserToken = typeof userTokens.$inferSelect;
export type InsertUserToken = z.infer<typeof insertUserTokenSchema>;

export type UserProtocol = typeof userProtocols.$inferSelect;
export type InsertUserProtocol = z.infer<typeof insertUserProtocolSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ApiKeyUsage = typeof apiKeyUsage.$inferSelect;
export type InsertApiKeyUsage = z.infer<typeof insertApiKeyUsageSchema>;

export type ApiSettings = typeof apiSettings.$inferSelect;
export type InsertApiSettings = z.infer<typeof insertApiSettingsSchema>;

export type Chain = typeof chains.$inferSelect;
export type InsertChain = z.infer<typeof insertChainSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type TokenInfo = typeof tokenInfo.$inferSelect;
export type InsertTokenInfo = typeof tokenInfo.$inferInsert;

export type HolderHistory = typeof holderHistory.$inferSelect;
export type InsertHolderHistory = z.infer<typeof insertHolderHistorySchema>;

export type TokenHolder = typeof tokenHolders.$inferSelect;
export type InsertTokenHolder = z.infer<typeof insertTokenHolderSchema>;

export type CacheSetting = typeof cacheSettings.$inferSelect;
export type InsertCacheSetting = typeof cacheSettings.$inferInsert;

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;

export type Pool = typeof pools.$inferSelect;
export type InsertPool = z.infer<typeof insertPoolSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type PoolCategory = typeof poolCategories.$inferSelect;
export type InsertPoolCategory = z.infer<typeof insertPoolCategorySchema>;

export type AIOutlook = typeof aiOutlooks.$inferSelect;
export type InsertAIOutlook = z.infer<typeof insertAIOutlookSchema>;

// Enhanced features types
export type RiskScore = typeof riskScores.$inferSelect;
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;

export type UserAlert = typeof userAlerts.$inferSelect;
export type InsertUserAlert = z.infer<typeof insertUserAlertSchema>;

export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;

export type PoolReview = typeof poolReviews.$inferSelect;
export type InsertPoolReview = z.infer<typeof insertPoolReviewSchema>;

export type ReviewVote = typeof reviewVotes.$inferSelect;
export type InsertReviewVote = z.infer<typeof insertReviewVoteSchema>;

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;

export type StrategyPool = typeof strategyPools.$inferSelect;
export type InsertStrategyPool = z.infer<typeof insertStrategyPoolSchema>;

export type Discussion = typeof discussions.$inferSelect;
export type InsertDiscussion = z.infer<typeof insertDiscussionSchema>;

export type DiscussionReply = typeof discussionReplies.$inferSelect;
export type InsertDiscussionReply = z.infer<typeof insertDiscussionReplySchema>;

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;

export type WatchlistPool = typeof watchlistPools.$inferSelect;
export type InsertWatchlistPool = z.infer<typeof insertWatchlistPoolSchema>;

export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = z.infer<typeof insertApiEndpointSchema>;

export type DeveloperApplication = typeof developerApplications.$inferSelect;
export type InsertDeveloperApplication = z.infer<typeof insertDeveloperApplicationSchema>;

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;

export type PoolMetricsHistory = typeof poolMetricsHistory.$inferSelect;
export type InsertPoolMetricsHistory = z.infer<typeof insertPoolMetricsHistorySchema>;

export type PoolMetricsCurrent = typeof poolMetricsCurrent.$inferSelect;
export type InsertPoolMetricsCurrent = z.infer<typeof insertPoolMetricsCurrentSchema>;

// Extended types for API responses
export type PoolWithRelations = Pool & {
  platform: Platform;
  chain: Chain;
  notes: Note[];
  categories?: Category[];
  riskScores?: RiskScore[];
  poolReviews?: PoolReview[];
  aiOutlooks?: AIOutlook[];
  holdersCount?: number | null;
  operatingDays?: number | null;
};

export type CategoryWithPoolCount = Category & {
  poolCount: number;
};

export type PoolReviewWithUser = PoolReview & {
  user: User;
  votes: ReviewVote[];
};

export type StrategyWithPools = Strategy & {
  user: User;
  strategyPools: (StrategyPool & { pool: Pool & { platform: Platform; chain: Chain } })[];
};

export type DiscussionWithReplies = Discussion & {
  user: User;
  pool?: Pool;
  strategy?: Strategy;
  replies: (DiscussionReply & { user: User })[];
};

export type WatchlistWithPools = Watchlist & {
  watchlistPools: (WatchlistPool & { pool: Pool & { platform: Platform; chain: Chain } })[];
};

export type UserWithAlerts = User & {
  userAlerts: (UserAlert & { notifications: AlertNotification[] })[];
};
