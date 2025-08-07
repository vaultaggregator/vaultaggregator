import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
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

export const categoriesRelations = relations(categories, ({ many }) => ({
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
}));

export const notesRelations = relations(notes, ({ one }) => ({
  pool: one(pools, {
    fields: [notes.poolId],
    references: [pools.id],
  }),
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

// Extended types for API responses
export type PoolWithRelations = Pool & {
  platform: Platform;
  chain: Chain;
  notes: Note[];
  categories?: Category[];
};

export type CategoryWithPoolCount = Category & {
  poolCount: number;
};
