import { 
  pools, platforms, chains, tokens, notes, users, categories, poolCategories, apiKeys, apiKeyUsage, aiOutlooks,
  riskScores, userAlerts, alertNotifications, poolReviews, reviewVotes, strategies, strategyPools,
  discussions, discussionReplies, watchlists, watchlistPools, apiEndpoints, developerApplications,
  type Pool, type Platform, type Chain, type Token, type Note,
  type InsertPool, type InsertPlatform, type InsertChain, type InsertToken, type InsertNote,
  type PoolWithRelations, type User, type InsertUser,
  type Category, type InsertCategory, type PoolCategory, type InsertPoolCategory,
  type CategoryWithPoolCount, type ApiKey, type InsertApiKey, type ApiKeyUsage, type InsertApiKeyUsage,
  type AIOutlook, type InsertAIOutlook, type RiskScore, type InsertRiskScore,
  type UserAlert, type InsertUserAlert, type AlertNotification, type InsertAlertNotification,
  type PoolReview, type InsertPoolReview, type PoolReviewWithUser, type ReviewVote, type InsertReviewVote,
  type Strategy, type InsertStrategy, type StrategyWithPools, type StrategyPool, type InsertStrategyPool,
  type Discussion, type InsertDiscussion, type DiscussionWithReplies, type DiscussionReply, type InsertDiscussionReply,
  type Watchlist, type InsertWatchlist, type WatchlistWithPools, type WatchlistPool, type InsertWatchlistPool,
  type ApiEndpoint, type InsertApiEndpoint, type DeveloperApplication, type InsertDeveloperApplication
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, ilike, or, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods (existing)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chain methods
  getChains(): Promise<Chain[]>;
  getActiveChains(): Promise<Chain[]>;
  getChainByName(name: string): Promise<Chain | undefined>;
  createChain(chain: InsertChain): Promise<Chain>;
  updateChain(id: string, chain: Partial<InsertChain>): Promise<Chain | undefined>;

  // Platform methods
  getPlatforms(): Promise<Platform[]>;
  getActivePlatforms(): Promise<Platform[]>;
  getPlatformByName(name: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: string, platform: Partial<InsertPlatform>): Promise<Platform | undefined>;

  // Token methods
  getTokens(): Promise<Token[]>;
  getActiveTokens(): Promise<Token[]>;
  getTokensByChain(chainId: string): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;

  // Pool methods
  getPools(options?: {
    chainId?: string;
    platformId?: string;
    search?: string;
    onlyVisible?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PoolWithRelations[]>;
  getAdminPools(options: {
    chainIds?: string[];
    platformIds?: string[];
    search?: string;
    visibilities?: string[];
    dataSources?: string[];
    limit: number;
    offset: number;
  }): Promise<{pools: PoolWithRelations[], total: number}>;
  getPoolById(id: string): Promise<PoolWithRelations | undefined>;
  getPoolByTokenAndPlatform(tokenPair: string, platformId: string): Promise<Pool | undefined>;
  createPool(pool: InsertPool): Promise<Pool>;
  updatePool(id: string, pool: Partial<InsertPool>): Promise<Pool | undefined>;
  deletePool(id: string): Promise<boolean>;
  upsertPool(defiLlamaId: string, pool: InsertPool): Promise<Pool>;

  // Note methods
  getNotesByPool(poolId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Category methods
  getAllCategories(): Promise<CategoryWithPoolCount[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  addPoolToCategory(poolId: string, categoryId: string): Promise<PoolCategory>;
  removePoolFromCategory(poolId: string, categoryId: string): Promise<boolean>;
  getPoolCategories(poolId: string): Promise<Category[]>;
  updatePoolCategories(poolId: string, categoryIds: string[]): Promise<void>;

  // Stats methods
  getStats(): Promise<{
    totalPools: number;
    activePools: number;
    hiddenPools: number;
    avgApy: number;
    totalTvl: string;
  }>;

  // API Key methods
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  getApiKeys(): Promise<ApiKey[]>;
  updateApiKey(id: string, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;
  logApiKeyUsage(usage: InsertApiKeyUsage): Promise<void>;
  getApiKeyUsage(keyId: string, hours?: number): Promise<number>;

  // AI Outlook methods
  createAIOutlook(outlook: InsertAIOutlook): Promise<AIOutlook>;
  getValidAIOutlook(poolId: string): Promise<AIOutlook | undefined>;
  deleteExpiredOutlooks(): Promise<number>;

  // 1. Risk Scoring methods
  calculateAndStoreRiskScore(poolId: string): Promise<RiskScore>;
  getRiskScore(poolId: string): Promise<RiskScore | undefined>;
  updateRiskScore(poolId: string, riskData: Partial<InsertRiskScore>): Promise<RiskScore | undefined>;
  deleteExpiredRiskScores(): Promise<number>;

  // 2. Smart Alerts methods
  createUserAlert(alert: InsertUserAlert): Promise<UserAlert>;
  getUserAlerts(userId: string, isActive?: boolean): Promise<UserAlert[]>;
  getAlertsByPool(poolId: string): Promise<UserAlert[]>;
  updateUserAlert(id: string, alert: Partial<InsertUserAlert>): Promise<UserAlert | undefined>;
  deleteUserAlert(id: string): Promise<boolean>;
  createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification>;
  getUserNotifications(userId: string, isRead?: boolean): Promise<AlertNotification[]>;
  markNotificationAsRead(id: string): Promise<boolean>;
  triggerAlert(alertId: string, message: string, severity: string): Promise<AlertNotification>;

  // 3. User Reviews & Ratings methods
  createPoolReview(review: InsertPoolReview): Promise<PoolReview>;
  getPoolReviews(poolId: string): Promise<PoolReviewWithUser[]>;
  getUserReviews(userId: string): Promise<PoolReview[]>;
  updatePoolReview(id: string, review: Partial<InsertPoolReview>): Promise<PoolReview | undefined>;
  deletePoolReview(id: string): Promise<boolean>;
  voteOnReview(vote: InsertReviewVote): Promise<ReviewVote>;
  removeReviewVote(reviewId: string, userId: string): Promise<boolean>;
  getPoolRating(poolId: string): Promise<{ averageRating: number; totalReviews: number; }>;

  // 4. Community Insights methods
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  getStrategies(options?: { userId?: string; category?: string; riskLevel?: string; isPublic?: boolean; }): Promise<StrategyWithPools[]>;
  getStrategy(id: string): Promise<StrategyWithPools | undefined>;
  updateStrategy(id: string, strategy: Partial<InsertStrategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: string): Promise<boolean>;
  addPoolToStrategy(strategyPool: InsertStrategyPool): Promise<StrategyPool>;
  removePoolFromStrategy(strategyId: string, poolId: string): Promise<boolean>;
  upvoteStrategy(strategyId: string): Promise<boolean>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussions(options?: { poolId?: string; strategyId?: string; category?: string; }): Promise<DiscussionWithReplies[]>;
  createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply>;

  // 5. Custom Watchlists methods
  createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  getUserWatchlists(userId: string): Promise<WatchlistWithPools[]>;
  getWatchlist(id: string): Promise<WatchlistWithPools | undefined>;
  updateWatchlist(id: string, watchlist: Partial<InsertWatchlist>): Promise<Watchlist | undefined>;
  deleteWatchlist(id: string): Promise<boolean>;
  addPoolToWatchlist(watchlistPool: InsertWatchlistPool): Promise<WatchlistPool>;
  removePoolFromWatchlist(watchlistId: string, poolId: string): Promise<boolean>;
  getWatchlistAlerts(userId: string): Promise<UserAlert[]>;

  // 6. API Marketplace methods
  createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint>;
  getApiEndpoints(category?: string, accessLevel?: string): Promise<ApiEndpoint[]>;
  getApiEndpoint(id: string): Promise<ApiEndpoint | undefined>;
  updateApiEndpoint(id: string, endpoint: Partial<InsertApiEndpoint>): Promise<ApiEndpoint | undefined>;
  deleteApiEndpoint(id: string): Promise<boolean>;
  createDeveloperApplication(application: InsertDeveloperApplication): Promise<DeveloperApplication>;
  getDeveloperApplications(status?: string): Promise<DeveloperApplication[]>;
  updateDeveloperApplication(id: string, status: string): Promise<DeveloperApplication | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getChains(): Promise<Chain[]> {
    return await db.select().from(chains).orderBy(chains.displayName);
  }

  async getActiveChains(): Promise<Chain[]> {
    return await db.select().from(chains).where(eq(chains.isActive, true)).orderBy(chains.displayName);
  }

  async createChain(chain: InsertChain): Promise<Chain> {
    const [newChain] = await db.insert(chains).values(chain).returning();
    return newChain;
  }

  async updateChain(id: string, chain: Partial<InsertChain>): Promise<Chain | undefined> {
    const [updatedChain] = await db.update(chains).set(chain).where(eq(chains.id, id)).returning();
    return updatedChain || undefined;
  }

  async getPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms).orderBy(platforms.displayName);
  }

  async getActivePlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms).where(eq(platforms.isActive, true)).orderBy(platforms.displayName);
  }

  async getPlatformByName(name: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.name, name));
    return platform || undefined;
  }

  async getPlatformBySlug(slug: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.slug, slug));
    return platform || undefined;
  }

  async getChainByName(name: string): Promise<Chain | undefined> {
    const [chain] = await db.select().from(chains).where(eq(chains.name, name));
    return chain || undefined;
  }

  async getPoolByTokenAndPlatform(tokenPair: string, platformId: string): Promise<Pool | undefined> {
    const [pool] = await db.select().from(pools).where(
      and(eq(pools.tokenPair, tokenPair), eq(pools.platformId, platformId))
    );
    return pool || undefined;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const platformData = {
      ...platform,
      slug: platform.slug || platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    const [newPlatform] = await db.insert(platforms).values(platformData).returning();
    return newPlatform;
  }

  async updatePlatform(id: string, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const [updatedPlatform] = await db.update(platforms).set(platform).where(eq(platforms.id, id)).returning();
    return updatedPlatform || undefined;
  }

  async getTokens(): Promise<Token[]> {
    return await db.select().from(tokens).orderBy(tokens.symbol);
  }

  async getActiveTokens(): Promise<Token[]> {
    return await db.select().from(tokens).where(eq(tokens.isActive, true)).orderBy(tokens.symbol);
  }

  async getTokensByChain(chainId: string): Promise<Token[]> {
    return await db.select().from(tokens).where(and(eq(tokens.chainId, chainId), eq(tokens.isActive, true))).orderBy(tokens.symbol);
  }

  async createToken(token: InsertToken): Promise<Token> {
    const [newToken] = await db.insert(tokens).values(token).returning();
    return newToken;
  }

  async getPools(options: {
    chainId?: string;
    platformId?: string;
    search?: string;
    onlyVisible?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<PoolWithRelations[]> {
    const { chainId, platformId, search, onlyVisible = true, limit = 50, offset = 0 } = options;

    let query = db
      .select()
      .from(pools)
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .leftJoin(notes, eq(pools.id, notes.poolId));

    const conditions = [eq(pools.isActive, true)];

    if (onlyVisible) {
      conditions.push(eq(pools.isVisible, true));
    }

    if (chainId) {
      conditions.push(eq(pools.chainId, chainId));
    }

    if (platformId) {
      conditions.push(eq(pools.platformId, platformId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(platforms.displayName, `%${search}%`),
          ilike(pools.tokenPair, `%${search}%`),
          sql`${pools.rawData}::text ILIKE ${'%' + search + '%'}`
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(pools.apy))
      .limit(limit)
      .offset(offset);

    // Group results by pool to handle multiple notes
    const poolsMap = new Map<string, PoolWithRelations>();

    for (const result of results) {
      const poolId = result.pools.id;

      if (!poolsMap.has(poolId)) {
        poolsMap.set(poolId, {
          ...result.pools,
          platform: result.platforms!,
          chain: result.chains!,
          notes: result.notes ? [result.notes] : [],
        });
      } else {
        const existingPool = poolsMap.get(poolId)!;
        if (result.notes && !existingPool.notes.find(n => n.id === result.notes!.id)) {
          existingPool.notes.push(result.notes);
        }
      }
    }

    return Array.from(poolsMap.values());
  }

  async getAdminPools(options: {
    chainIds?: string[];
    platformIds?: string[];
    search?: string;
    visibilities?: string[];
    dataSources?: string[];
    limit: number;
    offset: number;
  }): Promise<{pools: PoolWithRelations[], total: number}> {
    const { chainIds, platformIds, search, visibilities, dataSources, limit, offset } = options;

    // Build the base query
    let query = db
      .select()
      .from(pools)
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .leftJoin(notes, eq(pools.id, notes.poolId));

    let countQuery = db
      .select({ count: sql<number>`count(distinct ${pools.id})` })
      .from(pools)
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id));

    const conditions = [eq(pools.isActive, true)];

    if (chainIds && chainIds.length > 0) {
      conditions.push(inArray(pools.chainId, chainIds));
    }

    if (platformIds && platformIds.length > 0) {
      conditions.push(inArray(pools.platformId, platformIds));
    }

    if (search) {
      const searchCondition = or(
        ilike(platforms.displayName, `%${search}%`),
        ilike(pools.tokenPair, `%${search}%`),
        sql`${pools.rawData}::text ILIKE ${'%' + search + '%'}`
      )!;
      conditions.push(searchCondition);
    }

    if (visibilities && visibilities.length > 0) {
      const visibilityConditions = [];
      if (visibilities.includes('visible')) {
        visibilityConditions.push(eq(pools.isVisible, true));
      }
      if (visibilities.includes('hidden')) {
        visibilityConditions.push(eq(pools.isVisible, false));
      }
      if (visibilityConditions.length > 0) {
        conditions.push(or(...visibilityConditions)!);
      }
    }

    if (dataSources && dataSources.length > 0) {
      const dataSourceConditions = [];
      if (dataSources.includes('defillama')) {
        // All pools are now from DeFi Llama only
        dataSourceConditions.push(sql`1=1`); // Always true since we only have DeFi Llama
      }
      if (dataSourceConditions.length > 0) {
        conditions.push(or(...dataSourceConditions)!);
      }
    }

    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      query = query.where(whereCondition) as any;
      countQuery = countQuery.where(whereCondition) as any;
    }

    // Get total count first
    const [countResult] = await countQuery;
    const total = countResult.count;

    // Get paginated results
    const results = await query
      .orderBy(desc(pools.apy))
      .limit(limit)
      .offset(offset);

    // Group results by pool to handle multiple notes
    const poolsMap = new Map<string, PoolWithRelations>();

    for (const result of results) {
      const poolId = result.pools.id;

      if (!poolsMap.has(poolId)) {
        poolsMap.set(poolId, {
          ...result.pools,
          platform: result.platforms!,
          chain: result.chains!,
          notes: result.notes ? [result.notes] : [],
        });
      } else {
        const existingPool = poolsMap.get(poolId)!;
        if (result.notes && !existingPool.notes.find(n => n.id === result.notes!.id)) {
          existingPool.notes.push(result.notes);
        }
      }
    }

    return {
      pools: Array.from(poolsMap.values()),
      total
    };
  }

  async getPoolById(id: string): Promise<PoolWithRelations | undefined> {
    const results = await db
      .select()
      .from(pools)
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .leftJoin(notes, eq(pools.id, notes.poolId))
      .where(eq(pools.id, id));

    if (results.length === 0) return undefined;

    const pool = results[0].pools;
    const poolNotes = results.filter(r => r.notes).map(r => r.notes!);

    return {
      ...pool,
      platform: results[0].platforms!,
      chain: results[0].chains!,
      notes: poolNotes,
    };
  }

  async createPool(pool: InsertPool): Promise<Pool> {
    const [newPool] = await db.insert(pools).values(pool).returning();
    return newPool;
  }

  async updatePool(id: string, pool: Partial<InsertPool>): Promise<Pool | undefined> {
    const [updatedPool] = await db.update(pools).set(pool).where(eq(pools.id, id)).returning();
    return updatedPool || undefined;
  }

  async deletePool(id: string): Promise<boolean> {
    const result = await db.delete(pools).where(eq(pools.id, id));
    return (result.rowCount || 0) > 0;
  }

  async upsertPool(defiLlamaId: string, poolData: InsertPool): Promise<Pool> {
    // Try to find existing pool by defiLlamaId
    const [existingPool] = await db.select().from(pools).where(eq(pools.defiLlamaId, defiLlamaId));

    if (existingPool) {
      // Update existing pool BUT preserve admin visibility settings
      const updateData = {
        ...poolData,
        // NEVER override admin visibility decisions
        isVisible: existingPool.isVisible,
      };
      
      const [updatedPool] = await db.update(pools).set(updateData).where(eq(pools.id, existingPool.id)).returning();
      return updatedPool;
    } else {
      // Create new pool (defaults to hidden so admin can control visibility)
      const [newPool] = await db.insert(pools).values({
        ...poolData,
        defiLlamaId,
        isVisible: false, // All new pools start hidden
      }).returning();
      return newPool;
    }
  }

  async getNotesByPool(poolId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.poolId, poolId)).orderBy(desc(notes.createdAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const [updatedNote] = await db.update(notes).set({
      ...note,
      updatedAt: new Date(),
    }).where(eq(notes.id, id)).returning();
    return updatedNote || undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Category operations
  async getAllCategories(): Promise<CategoryWithPoolCount[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        displayName: categories.displayName,
        slug: categories.slug,
        iconUrl: categories.iconUrl,
        description: categories.description,
        color: categories.color,
        isActive: categories.isActive,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
        poolCount: sql<number>`count(${poolCategories.poolId})::int`,
      })
      .from(categories)
      .leftJoin(poolCategories, eq(categories.id, poolCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.sortOrder, categories.displayName);
    
    return result;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: any): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const updateData = { ...category };
    if (category.name) {
      updateData.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const [updatedCategory] = await db.update(categories).set(updateData).where(eq(categories.id, id)).returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addPoolToCategory(poolId: string, categoryId: string): Promise<PoolCategory> {
    const [poolCategory] = await db.insert(poolCategories).values({
      poolId,
      categoryId,
    }).returning();
    return poolCategory;
  }

  async removePoolFromCategory(poolId: string, categoryId: string): Promise<boolean> {
    const result = await db.delete(poolCategories).where(
      and(eq(poolCategories.poolId, poolId), eq(poolCategories.categoryId, categoryId))
    );
    return (result.rowCount || 0) > 0;
  }

  async getPoolCategories(poolId: string): Promise<Category[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        displayName: categories.displayName,
        slug: categories.slug,
        iconUrl: categories.iconUrl,
        description: categories.description,
        color: categories.color,
        isActive: categories.isActive,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
      })
      .from(categories)
      .innerJoin(poolCategories, eq(categories.id, poolCategories.categoryId))
      .where(eq(poolCategories.poolId, poolId))
      .orderBy(categories.sortOrder, categories.displayName);
    
    return result;
  }

  async updatePoolCategories(poolId: string, categoryIds: string[]): Promise<void> {
    // First, remove all existing categories for this pool
    await db.delete(poolCategories).where(eq(poolCategories.poolId, poolId));
    
    // Then add the new categories
    if (categoryIds.length > 0) {
      const insertData = categoryIds.map(categoryId => ({
        poolId,
        categoryId,
      }));
      await db.insert(poolCategories).values(insertData);
    }
  }

  async getStats(): Promise<{
    totalPools: number;
    activePools: number;
    hiddenPools: number;
    avgApy: number;
    totalTvl: string;
  }> {
    // Get stats for visible pools only
    const visibleResult = await db.execute(`
      SELECT 
        COUNT(*) as visible_pools,
        COALESCE(AVG(apy::numeric), 0) as avg_apy,
        COALESCE(SUM(tvl::numeric), 0) as total_tvl
      FROM pools
      WHERE is_visible = true AND is_active = true
    `);

    // Get total hidden pools count
    const hiddenResult = await db.execute(`
      SELECT COUNT(*) as hidden_pools
      FROM pools
      WHERE is_visible = false OR is_active = false
    `);

    const visibleStats = visibleResult.rows[0];
    const hiddenStats = hiddenResult.rows[0];

    return {
      totalPools: Number(visibleStats.visible_pools) || 0,
      activePools: Number(visibleStats.visible_pools) || 0,
      hiddenPools: Number(hiddenStats.hidden_pools) || 0,
      avgApy: Number(visibleStats.avg_apy) || 0,
      totalTvl: (Number(visibleStats.total_tvl) || 0).toLocaleString(),
    };
  }

  // API Key methods
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
    return apiKey || undefined;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async updateApiKey(id: string, apiKey: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [updatedApiKey] = await db.update(apiKeys).set({
      ...apiKey,
      updatedAt: new Date(),
    }).where(eq(apiKeys.id, id)).returning();
    return updatedApiKey || undefined;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return (result.rowCount || 0) > 0;
  }

  async logApiKeyUsage(usage: InsertApiKeyUsage): Promise<void> {
    await db.insert(apiKeyUsage).values(usage);
  }

  async getApiKeyUsage(keyId: string, hours: number = 1): Promise<number> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiKeyUsage)
      .where(
        and(
          eq(apiKeyUsage.apiKeyId, keyId),
          sql`timestamp > ${hoursAgo}`
        )
      );
    
    return Number(result[0]?.count) || 0;
  }
  
  // Removed getDataSources method since we only use DeFi Llama now

  async removeDuplicatePools(): Promise<number> {
    // Find duplicate pools based on platformId + tokenPair + chainId, keeping the one with data
    const duplicateQuery = `
      WITH ranked_pools AS (
        SELECT id, 
               ROW_NUMBER() OVER (
                 PARTITION BY platform_id, token_pair, chain_id 
                 ORDER BY 
                   CASE WHEN defi_llama_id IS NOT NULL THEN 1 ELSE 2 END,
                   CASE WHEN is_visible = true THEN 1 ELSE 2 END,
                   created_at DESC
               ) as rn
        FROM pools
      )
      SELECT id FROM ranked_pools WHERE rn > 1
    `;
    
    const duplicates = await pool.query(duplicateQuery);

    if (duplicates.rows.length > 0) {
      const idsToDelete = duplicates.rows.map((row: any) => row.id as string);
      await db.delete(pools).where(inArray(pools.id, idsToDelete));
      console.log(`Removed ${idsToDelete.length} duplicate pools`);
      return idsToDelete.length;
    }
    
    return 0;
  }

  async getVisiblePoolsForProtection(): Promise<Pool[]> {
    return await db.select().from(pools).where(eq(pools.isVisible, true));
  }

  // AI Outlook methods
  async createAIOutlook(insertOutlook: InsertAIOutlook): Promise<AIOutlook> {
    const [outlook] = await db
      .insert(aiOutlooks)
      .values(insertOutlook)
      .returning();
    return outlook;
  }

  async getValidAIOutlook(poolId: string): Promise<AIOutlook | undefined> {
    const now = new Date();
    const [outlook] = await db
      .select()
      .from(aiOutlooks)
      .where(and(
        eq(aiOutlooks.poolId, poolId),
        sql`${aiOutlooks.expiresAt} > ${now}`
      ))
      .orderBy(desc(aiOutlooks.generatedAt))
      .limit(1);
    
    return outlook || undefined;
  }

  async deleteExpiredOutlooks(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(aiOutlooks)
      .where(sql`${aiOutlooks.expiresAt} <= ${now}`);
    
    return result.rowCount || 0;
  }

  // 1. Risk Scoring implementations
  async calculateAndStoreRiskScore(poolId: string): Promise<RiskScore> {
    const pool = await this.getPoolById(poolId);
    if (!pool) throw new Error("Pool not found");

    // Calculate risk factors based on pool data
    const smartContractRisk = this.calculateSmartContractRisk(pool);
    const liquidityRisk = this.calculateLiquidityRisk(pool);
    const platformRisk = this.calculatePlatformRisk(pool);
    const marketRisk = this.calculateMarketRisk(pool);
    
    const overallScore = Math.round((smartContractRisk + liquidityRisk + platformRisk + marketRisk) / 4);
    
    const riskData: InsertRiskScore = {
      poolId,
      overallScore,
      smartContractRisk,
      liquidityRisk,
      platformRisk,
      marketRisk,
      auditStatus: this.determineAuditStatus(pool),
      tvlStability: this.calculateTvlStability(pool),
      apyVolatility: this.calculateApyVolatility(pool)
    };

    const [existing] = await db.select().from(riskScores).where(eq(riskScores.poolId, poolId));
    
    if (existing) {
      const [updated] = await db
        .update(riskScores)
        .set({ ...riskData, updatedAt: new Date() })
        .where(eq(riskScores.poolId, poolId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(riskScores).values(riskData).returning();
      return created;
    }
  }

  private calculateSmartContractRisk(pool: PoolWithRelations): number {
    let risk = 50;
    
    if (pool.platform.name.toLowerCase().includes('uniswap') || 
        pool.platform.name.toLowerCase().includes('aave') ||
        pool.platform.name.toLowerCase().includes('compound')) {
      risk -= 20;
    }
    
    if (pool.chain.name.toLowerCase() === 'ethereum') risk -= 10;
    if (pool.chain.name.toLowerCase().includes('polygon')) risk -= 5;
    
    return Math.max(1, Math.min(100, risk));
  }

  private calculateLiquidityRisk(pool: PoolWithRelations): number {
    const tvl = parseFloat(pool.tvl || "0");
    
    if (tvl > 100000000) return 10;
    if (tvl > 10000000) return 25;
    if (tvl > 1000000) return 50;
    if (tvl > 100000) return 75;
    return 90;
  }

  private calculatePlatformRisk(pool: PoolWithRelations): number {
    const knownPlatforms = ['uniswap', 'aave', 'compound', 'curve', 'balancer'];
    const platformName = pool.platform.name.toLowerCase();
    
    if (knownPlatforms.some(known => platformName.includes(known))) {
      return 20;
    }
    
    return 60;
  }

  private calculateMarketRisk(pool: PoolWithRelations): number {
    const apy = parseFloat(pool.apy || "0");
    
    if (apy > 50) return 90;
    if (apy > 20) return 60;
    if (apy > 10) return 40;
    if (apy > 5) return 25;
    return 15;
  }

  private determineAuditStatus(pool: PoolWithRelations): string {
    const knownAudited = ['uniswap', 'aave', 'compound', 'curve'];
    if (knownAudited.some(platform => pool.platform.name.toLowerCase().includes(platform))) {
      return 'verified';
    }
    return 'unknown';
  }

  private calculateTvlStability(pool: PoolWithRelations): string {
    return "50.00";
  }

  private calculateApyVolatility(pool: PoolWithRelations): string {
    return "25.00";
  }

  async getRiskScore(poolId: string): Promise<RiskScore | undefined> {
    const [risk] = await db.select().from(riskScores)
      .where(eq(riskScores.poolId, poolId))
      .orderBy(desc(riskScores.updatedAt))
      .limit(1);
    return risk;
  }

  async updateRiskScore(poolId: string, riskData: Partial<InsertRiskScore>): Promise<RiskScore | undefined> {
    const [updated] = await db
      .update(riskScores)
      .set({ ...riskData, updatedAt: new Date() })
      .where(eq(riskScores.poolId, poolId))
      .returning();
    return updated;
  }

  async deleteExpiredRiskScores(): Promise<number> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(riskScores)
      .where(sql`${riskScores.updatedAt} < ${oneWeekAgo}`);
    
    return result.rowCount || 0;
  }

  // 2. Smart Alerts implementations
  async createUserAlert(alert: InsertUserAlert): Promise<UserAlert> {
    const [created] = await db.insert(userAlerts).values(alert).returning();
    return created;
  }

  async getUserAlerts(userId: string, isActive?: boolean): Promise<UserAlert[]> {
    let query = db.select().from(userAlerts).where(eq(userAlerts.userId, userId));
    
    if (isActive !== undefined) {
      query = query.where(eq(userAlerts.isActive, isActive));
    }
    
    return await query;
  }

  async getAlertsByPool(poolId: string): Promise<UserAlert[]> {
    return await db.select().from(userAlerts).where(eq(userAlerts.poolId, poolId));
  }

  async updateUserAlert(id: string, alert: Partial<InsertUserAlert>): Promise<UserAlert | undefined> {
    const [updated] = await db
      .update(userAlerts)
      .set(alert)
      .where(eq(userAlerts.id, id))
      .returning();
    return updated;
  }

  async deleteUserAlert(id: string): Promise<boolean> {
    const result = await db.delete(userAlerts).where(eq(userAlerts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification> {
    const [created] = await db.insert(alertNotifications).values(notification).returning();
    return created;
  }

  async getUserNotifications(userId: string, isRead?: boolean): Promise<AlertNotification[]> {
    let query = db.select().from(alertNotifications)
      .innerJoin(userAlerts, eq(alertNotifications.alertId, userAlerts.id))
      .where(eq(userAlerts.userId, userId));
    
    if (isRead !== undefined) {
      query = query.where(eq(alertNotifications.isRead, isRead));
    }
    
    const results = await query;
    return results.map(r => r.alert_notifications);
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(alertNotifications)
      .set({ isRead: true })
      .where(eq(alertNotifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  async triggerAlert(alertId: string, message: string, severity: string): Promise<AlertNotification> {
    const notification = await this.createAlertNotification({
      alertId,
      message,
      severity
    });
    
    await db
      .update(userAlerts)
      .set({ lastTriggered: new Date() })
      .where(eq(userAlerts.id, alertId));
    
    return notification;
  }

  // 3. User Reviews & Ratings implementations
  async createPoolReview(review: InsertPoolReview): Promise<PoolReview> {
    const [created] = await db.insert(poolReviews).values(review).returning();
    return created;
  }

  async getPoolReviews(poolId: string): Promise<PoolReviewWithUser[]> {
    const results = await db.select()
      .from(poolReviews)
      .innerJoin(users, eq(poolReviews.userId, users.id))
      .leftJoin(reviewVotes, eq(poolReviews.id, reviewVotes.reviewId))
      .where(eq(poolReviews.poolId, poolId))
      .orderBy(desc(poolReviews.createdAt));
    
    const reviewsMap = new Map();
    results.forEach(result => {
      const review = result.pool_reviews;
      if (!reviewsMap.has(review.id)) {
        reviewsMap.set(review.id, {
          ...review,
          user: result.users,
          votes: []
        });
      }
      if (result.review_votes) {
        reviewsMap.get(review.id).votes.push(result.review_votes);
      }
    });
    
    return Array.from(reviewsMap.values());
  }

  async getUserReviews(userId: string): Promise<PoolReview[]> {
    return await db.select().from(poolReviews)
      .where(eq(poolReviews.userId, userId))
      .orderBy(desc(poolReviews.createdAt));
  }

  async updatePoolReview(id: string, review: Partial<InsertPoolReview>): Promise<PoolReview | undefined> {
    const [updated] = await db
      .update(poolReviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(poolReviews.id, id))
      .returning();
    return updated;
  }

  async deletePoolReview(id: string): Promise<boolean> {
    const result = await db.delete(poolReviews).where(eq(poolReviews.id, id));
    return (result.rowCount || 0) > 0;
  }

  async voteOnReview(vote: InsertReviewVote): Promise<ReviewVote> {
    await db.delete(reviewVotes)
      .where(and(
        eq(reviewVotes.reviewId, vote.reviewId),
        eq(reviewVotes.userId, vote.userId)
      ));
    
    const [created] = await db.insert(reviewVotes).values(vote).returning();
    await this.updateReviewVoteCounts(vote.reviewId);
    
    return created;
  }

  async removeReviewVote(reviewId: string, userId: string): Promise<boolean> {
    const result = await db.delete(reviewVotes)
      .where(and(
        eq(reviewVotes.reviewId, reviewId),
        eq(reviewVotes.userId, userId)
      ));
    
    await this.updateReviewVoteCounts(reviewId);
    return (result.rowCount || 0) > 0;
  }

  private async updateReviewVoteCounts(reviewId: string): Promise<void> {
    const votes = await db.select().from(reviewVotes).where(eq(reviewVotes.reviewId, reviewId));
    
    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;
    
    await db
      .update(poolReviews)
      .set({ upvotes, downvotes })
      .where(eq(poolReviews.id, reviewId));
  }

  async getPoolRating(poolId: string): Promise<{ averageRating: number; totalReviews: number; }> {
    const result = await db.select({
      averageRating: sql<number>`AVG(${poolReviews.rating})`,
      totalReviews: sql<number>`COUNT(*)`
    }).from(poolReviews).where(eq(poolReviews.poolId, poolId));
    
    return {
      averageRating: result[0]?.averageRating || 0,
      totalReviews: result[0]?.totalReviews || 0
    };
  }

  // 4. Community Insights implementations
  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [created] = await db.insert(strategies).values(strategy).returning();
    return created;
  }

  async getStrategies(options?: { userId?: string; category?: string; riskLevel?: string; isPublic?: boolean; }): Promise<StrategyWithPools[]> {
    let query = db.select()
      .from(strategies)
      .innerJoin(users, eq(strategies.userId, users.id))
      .leftJoin(strategyPools, eq(strategies.id, strategyPools.strategyId))
      .leftJoin(pools, eq(strategyPools.poolId, pools.id))
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id));

    const conditions = [];
    if (options?.userId) conditions.push(eq(strategies.userId, options.userId));
    if (options?.category) conditions.push(eq(strategies.category, options.category));
    if (options?.riskLevel) conditions.push(eq(strategies.riskLevel, options.riskLevel));
    if (options?.isPublic !== undefined) conditions.push(eq(strategies.isPublic, options.isPublic));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(strategies.createdAt));

    const strategiesMap = new Map();
    results.forEach(result => {
      const strategy = result.strategies;
      if (!strategiesMap.has(strategy.id)) {
        strategiesMap.set(strategy.id, {
          ...strategy,
          user: result.users,
          strategyPools: []
        });
      }
      if (result.strategy_pools && result.pools) {
        strategiesMap.get(strategy.id).strategyPools.push({
          ...result.strategy_pools,
          pool: {
            ...result.pools,
            platform: result.platforms,
            chain: result.chains
          }
        });
      }
    });

    return Array.from(strategiesMap.values());
  }

  async getStrategy(id: string): Promise<StrategyWithPools | undefined> {
    const results = await db.select()
      .from(strategies)
      .innerJoin(users, eq(strategies.userId, users.id))
      .leftJoin(strategyPools, eq(strategies.id, strategyPools.strategyId))
      .leftJoin(pools, eq(strategyPools.poolId, pools.id))
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .where(eq(strategies.id, id));

    if (results.length === 0) return undefined;

    const strategy = results[0].strategies;
    const user = results[0].users;
    const strategyPools = results
      .filter(r => r.strategy_pools && r.pools)
      .map(r => ({
        ...r.strategy_pools!,
        pool: {
          ...r.pools!,
          platform: r.platforms!,
          chain: r.chains!
        }
      }));

    return {
      ...strategy,
      user,
      strategyPools
    };
  }

  async updateStrategy(id: string, strategy: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const [updated] = await db
      .update(strategies)
      .set({ ...strategy, updatedAt: new Date() })
      .where(eq(strategies.id, id))
      .returning();
    return updated;
  }

  async deleteStrategy(id: string): Promise<boolean> {
    const result = await db.delete(strategies).where(eq(strategies.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addPoolToStrategy(strategyPool: InsertStrategyPool): Promise<StrategyPool> {
    const [created] = await db.insert(strategyPools).values(strategyPool).returning();
    return created;
  }

  async removePoolFromStrategy(strategyId: string, poolId: string): Promise<boolean> {
    const result = await db.delete(strategyPools)
      .where(and(
        eq(strategyPools.strategyId, strategyId),
        eq(strategyPools.poolId, poolId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async upvoteStrategy(strategyId: string): Promise<boolean> {
    await db
      .update(strategies)
      .set({ upvotes: sql`${strategies.upvotes} + 1` })
      .where(eq(strategies.id, strategyId));
    return true;
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [created] = await db.insert(discussions).values(discussion).returning();
    return created;
  }

  async getDiscussions(options?: { poolId?: string; strategyId?: string; category?: string; }): Promise<DiscussionWithReplies[]> {
    let query = db.select()
      .from(discussions)
      .innerJoin(users, eq(discussions.userId, users.id))
      .leftJoin(pools, eq(discussions.poolId, pools.id))
      .leftJoin(strategies, eq(discussions.strategyId, strategies.id))
      .leftJoin(discussionReplies, eq(discussions.id, discussionReplies.discussionId));

    const conditions = [];
    if (options?.poolId) conditions.push(eq(discussions.poolId, options.poolId));
    if (options?.strategyId) conditions.push(eq(discussions.strategyId, options.strategyId));
    if (options?.category) conditions.push(eq(discussions.category, options.category));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(discussions.createdAt));

    const discussionsMap = new Map();
    results.forEach(result => {
      const discussion = result.discussions;
      if (!discussionsMap.has(discussion.id)) {
        discussionsMap.set(discussion.id, {
          ...discussion,
          user: result.users,
          pool: result.pools || undefined,
          strategy: result.strategies || undefined,
          replies: []
        });
      }
      if (result.discussion_replies) {
        discussionsMap.get(discussion.id).replies.push({
          ...result.discussion_replies,
          user: result.users
        });
      }
    });

    return Array.from(discussionsMap.values());
  }

  async createDiscussionReply(reply: InsertDiscussionReply): Promise<DiscussionReply> {
    const [created] = await db.insert(discussionReplies).values(reply).returning();
    
    await db
      .update(discussions)
      .set({ 
        replyCount: sql`${discussions.replyCount} + 1`,
        lastReplyAt: new Date()
      })
      .where(eq(discussions.id, reply.discussionId));
    
    return created;
  }

  // 5. Custom Watchlists implementations
  async createWatchlist(watchlist: InsertWatchlist): Promise<Watchlist> {
    const [created] = await db.insert(watchlists).values(watchlist).returning();
    return created;
  }

  async getUserWatchlists(userId: string): Promise<WatchlistWithPools[]> {
    const results = await db.select()
      .from(watchlists)
      .leftJoin(watchlistPools, eq(watchlists.id, watchlistPools.watchlistId))
      .leftJoin(pools, eq(watchlistPools.poolId, pools.id))
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .where(eq(watchlists.userId, userId))
      .orderBy(desc(watchlists.createdAt));

    const watchlistsMap = new Map();
    results.forEach(result => {
      const watchlist = result.watchlists;
      if (!watchlistsMap.has(watchlist.id)) {
        watchlistsMap.set(watchlist.id, {
          ...watchlist,
          watchlistPools: []
        });
      }
      if (result.watchlist_pools && result.pools) {
        watchlistsMap.get(watchlist.id).watchlistPools.push({
          ...result.watchlist_pools,
          pool: {
            ...result.pools,
            platform: result.platforms,
            chain: result.chains
          }
        });
      }
    });

    return Array.from(watchlistsMap.values());
  }

  async getWatchlist(id: string): Promise<WatchlistWithPools | undefined> {
    const results = await db.select()
      .from(watchlists)
      .leftJoin(watchlistPools, eq(watchlists.id, watchlistPools.watchlistId))
      .leftJoin(pools, eq(watchlistPools.poolId, pools.id))
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .where(eq(watchlists.id, id));

    if (results.length === 0) return undefined;

    const watchlist = results[0].watchlists;
    const watchlistPools = results
      .filter(r => r.watchlist_pools && r.pools)
      .map(r => ({
        ...r.watchlist_pools!,
        pool: {
          ...r.pools!,
          platform: r.platforms!,
          chain: r.chains!
        }
      }));

    return {
      ...watchlist,
      watchlistPools
    };
  }

  async updateWatchlist(id: string, watchlist: Partial<InsertWatchlist>): Promise<Watchlist | undefined> {
    const [updated] = await db
      .update(watchlists)
      .set({ ...watchlist, updatedAt: new Date() })
      .where(eq(watchlists.id, id))
      .returning();
    return updated;
  }

  async deleteWatchlist(id: string): Promise<boolean> {
    const result = await db.delete(watchlists).where(eq(watchlists.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addPoolToWatchlist(watchlistPool: InsertWatchlistPool): Promise<WatchlistPool> {
    const [created] = await db.insert(watchlistPools).values(watchlistPool).returning();
    return created;
  }

  async removePoolFromWatchlist(watchlistId: string, poolId: string): Promise<boolean> {
    const result = await db.delete(watchlistPools)
      .where(and(
        eq(watchlistPools.watchlistId, watchlistId),
        eq(watchlistPools.poolId, poolId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async getWatchlistAlerts(userId: string): Promise<UserAlert[]> {
    return await db.select().from(userAlerts)
      .where(and(
        eq(userAlerts.userId, userId),
        eq(userAlerts.alertType, 'watchlist_change')
      ));
  }

  // 6. API Marketplace implementations
  async createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint> {
    const [created] = await db.insert(apiEndpoints).values(endpoint).returning();
    return created;
  }

  async getApiEndpoints(category?: string, accessLevel?: string): Promise<ApiEndpoint[]> {
    let query = db.select().from(apiEndpoints).where(eq(apiEndpoints.isActive, true));
    
    if (category) {
      query = query.where(eq(apiEndpoints.category, category));
    }
    
    if (accessLevel) {
      query = query.where(eq(apiEndpoints.accessLevel, accessLevel));
    }
    
    return await query;
  }

  async getApiEndpoint(id: string): Promise<ApiEndpoint | undefined> {
    const [endpoint] = await db.select().from(apiEndpoints).where(eq(apiEndpoints.id, id));
    return endpoint;
  }

  async updateApiEndpoint(id: string, endpoint: Partial<InsertApiEndpoint>): Promise<ApiEndpoint | undefined> {
    const [updated] = await db
      .update(apiEndpoints)
      .set(endpoint)
      .where(eq(apiEndpoints.id, id))
      .returning();
    return updated;
  }

  async deleteApiEndpoint(id: string): Promise<boolean> {
    const result = await db.delete(apiEndpoints).where(eq(apiEndpoints.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createDeveloperApplication(application: InsertDeveloperApplication): Promise<DeveloperApplication> {
    const [created] = await db.insert(developerApplications).values(application).returning();
    return created;
  }

  async getDeveloperApplications(status?: string): Promise<DeveloperApplication[]> {
    let query = db.select().from(developerApplications);
    
    if (status) {
      query = query.where(eq(developerApplications.status, status));
    }
    
    return await query.orderBy(desc(developerApplications.createdAt));
  }

  async updateDeveloperApplication(id: string, status: string): Promise<DeveloperApplication | undefined> {
    const updates: any = { status };
    if (status === 'approved') {
      updates.approvedAt = new Date();
    }
    
    const [updated] = await db
      .update(developerApplications)
      .set(updates)
      .where(eq(developerApplications.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
