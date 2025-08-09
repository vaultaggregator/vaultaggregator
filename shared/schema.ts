import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, json, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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

export const apiKeyUsage = pgTable("api_key_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

export const chains = pgTable("chains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tokens = pgTable("tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  chainId: varchar("chain_id").references(() => chains.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platforms = pgTable("platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  visitUrlTemplate: text("visit_url_template"), // Custom URL template with variables
  showUnderlyingTokens: boolean("show_underlying_tokens").default(false), // Display underlying tokens on pool detail page
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
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

  isVisible: boolean("is_visible").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
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

export const tokensRelations = relations(tokens, ({ one }) => ({
  chain: one(chains, {
    fields: [tokens.chainId],
    references: [chains.id],
  }),
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

export const poolsRelations = relations(pools, ({ one, many }) => ({
  platform: one(platforms, {
    fields: [pools.platformId],
    references: [platforms.id],
  }),
  chain: one(chains, {
    fields: [pools.chainId],
    references: [chains.id],
  }),

  notes: many(notes),
  poolCategories: many(poolCategories),

  riskScores: many(riskScores),
  poolReviews: many(poolReviews),
  userAlerts: many(userAlerts),
  strategyPools: many(strategyPools),
  discussions: many(discussions),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  pool: one(pools, {
    fields: [notes.poolId],
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



// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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

export const insertChainSchema = createInsertSchema(chains).omit({
  id: true,
  createdAt: true,
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
  createdAt: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ApiKeyUsage = typeof apiKeyUsage.$inferSelect;
export type InsertApiKeyUsage = z.infer<typeof insertApiKeyUsageSchema>;

export type Chain = typeof chains.$inferSelect;
export type InsertChain = z.infer<typeof insertChainSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;



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



export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = z.infer<typeof insertApiEndpointSchema>;

export type DeveloperApplication = typeof developerApplications.$inferSelect;
export type InsertDeveloperApplication = z.infer<typeof insertDeveloperApplicationSchema>;

// Extended types for API responses
export type PoolWithRelations = Pool & {
  platform: Platform;
  chain: Chain;
  notes: Note[];
  categories?: Category[];
  riskScores?: RiskScore[];
  poolReviews?: PoolReview[];

  holdersCount?: number | null;
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



export type UserWithAlerts = User & {
  userAlerts: (UserAlert & { notifications: AlertNotification[] })[];
};
