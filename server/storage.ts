import { 
  pools, protocols, networks, chains, tokens, tokenInfo, notes, users, categories, poolCategories, apiKeys, apiKeyUsage,
  riskScores, userAlerts, alertNotifications, poolReviews, reviewVotes, strategies, strategyPools,
  discussions, discussionReplies, watchlists, watchlistPools, apiEndpoints, developerApplications, holderHistory,
  poolMetricsHistory, poolMetricsCurrent, aiOutlooks, poolHistoricalData, webhookConfigs, tokenTransactions,
  type Pool, type Protocol, type Network, type Chain, type Token, type TokenInfo, type Note,
  type InsertPool, type InsertProtocol, type InsertNetwork, type InsertChain, type InsertToken, type InsertTokenInfo, type InsertNote,
  type PoolWithRelations, type User, type InsertUser,
  type Category, type InsertCategory, type PoolCategory, type InsertPoolCategory,
  type CategoryWithPoolCount, type ApiKey, type InsertApiKey, type ApiKeyUsage, type InsertApiKeyUsage,
  type RiskScore, type InsertRiskScore,
  type UserAlert, type InsertUserAlert, type AlertNotification, type InsertAlertNotification,
  type PoolReview, type InsertPoolReview, type PoolReviewWithUser, type ReviewVote, type InsertReviewVote,
  type Strategy, type InsertStrategy, type StrategyWithPools, type StrategyPool, type InsertStrategyPool,
  type Discussion, type InsertDiscussion, type DiscussionWithReplies, type DiscussionReply, type InsertDiscussionReply,
  type Watchlist, type InsertWatchlist, type WatchlistWithPools, type WatchlistPool, type InsertWatchlistPool,
  type ApiEndpoint, type InsertApiEndpoint, type DeveloperApplication, type InsertDeveloperApplication,
  type HolderHistory, type InsertHolderHistory,
  type PoolMetricsHistory, type InsertPoolMetricsHistory, type PoolMetricsCurrent, type InsertPoolMetricsCurrent,
  swrCachedPages, swrCacheSnapshots, type SwrCachedPage, type SwrCacheSnapshot, type InsertSwrCachedPage, type InsertSwrCacheSnapshot
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and, ilike, or, sql, inArray, isNotNull, isNull, asc, lte } from "drizzle-orm";

// Re-export types that scrapers need
export type { PoolWithRelations };

export interface IStorage {
  // User methods (existing)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Network methods (was Chain)
  getNetworks(): Promise<Network[]>;
  getActiveNetworks(): Promise<Network[]>;
  getNetworkByName(name: string): Promise<Network | undefined>;
  getNetworkById(id: string): Promise<Network | undefined>;
  createNetwork(network: InsertNetwork): Promise<Network>;
  updateNetwork(id: string, network: Partial<InsertNetwork>): Promise<Network | undefined>;
  deleteNetwork(id: string): Promise<boolean>;

  // Protocol methods (was Platform)
  getProtocols(): Promise<Protocol[]>;
  getActiveProtocols(): Promise<Protocol[]>;
  getProtocolsWithVisibility(): Promise<(Protocol & { hasVisiblePools: boolean })[]>;
  getProtocolByName(name: string): Promise<Protocol | undefined>;
  getProtocolById(id: string): Promise<Protocol | undefined>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: string, protocol: Partial<InsertProtocol>): Promise<Protocol | undefined>;
  deleteProtocol(id: string): Promise<boolean>;

  // Token methods
  getTokens(): Promise<Token[]>;
  getAllTokens(): Promise<Token[]>;
  getActiveTokens(): Promise<Token[]>;
  getTokensByChain(chainId: string): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  updateToken(id: string, token: Partial<InsertToken>): Promise<Token | undefined>;

  // Token Info methods
  getTokenInfoByAddress(address: string): Promise<TokenInfo | undefined>;
  getAllTokenInfo(): Promise<TokenInfo[]>;
  createTokenInfo(tokenInfo: InsertTokenInfo): Promise<TokenInfo>;
  updateTokenInfo(address: string, tokenInfo: Partial<InsertTokenInfo>): Promise<TokenInfo | undefined>;
  upsertTokenInfo(address: string, tokenInfo: InsertTokenInfo): Promise<TokenInfo>;

  // Holder History methods
  storeHolderHistory(holderData: InsertHolderHistory): Promise<HolderHistory>;
  getHolderHistory(tokenAddress: string, days?: number): Promise<HolderHistory[]>;
  getHolderAnalytics(tokenAddress: string): Promise<{
    current: number;
    change7d: { value: number; percentage: number } | null;
    change30d: { value: number; percentage: number } | null;
    changeAllTime: { value: number; percentage: number } | null;
    firstRecordDate: Date | null;
  }>;
  getLatestHolderHistory(tokenAddress: string): Promise<HolderHistory | undefined>;

  // Pool methods (general)
  getActivePools(): Promise<Pool[]>;

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
  getAllPoolsWithRelations(): Promise<PoolWithRelations[]>;
  getPoolById(id: string): Promise<PoolWithRelations | undefined>;
  getPoolByPlatformPoolId(platformPoolId: string): Promise<Pool | undefined>;
  getPoolByAddress(address: string): Promise<Pool | undefined>;
  getPoolByTokenAndPlatform(tokenPair: string, platformId: string): Promise<Pool | undefined>;
  createPool(pool: InsertPool): Promise<Pool>;
  updatePool(id: string, pool: Partial<InsertPool>): Promise<Pool | undefined>;
  deletePool(id: string): Promise<boolean>;
  upsertPool(platformPoolId: string, pool: InsertPool): Promise<Pool>;
  
  // Trash bin methods
  softDeletePool(id: string, deletedBy: string | null): Promise<boolean>;
  getTrashedPools(): Promise<PoolWithRelations[]>;
  restorePool(id: string): Promise<boolean>;
  permanentlyDeletePool(id: string): Promise<boolean>;
  cleanupExpiredPools(): Promise<number>;

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

  // 🎯 Standardized Pool Metrics Methods
  // Core 4 metrics: APY, DAYS, TVL, HOLDERS - collected from platform-specific APIs
  
  // Current metrics (latest values)
  getPoolMetricsCurrent(poolId: string): Promise<PoolMetricsCurrent | undefined>;
  upsertPoolMetricsCurrent(poolId: string, metrics: Partial<InsertPoolMetricsCurrent>): Promise<PoolMetricsCurrent>;
  updatePoolMetricCurrentStatus(poolId: string, metric: 'apy' | 'days' | 'tvl' | 'holders', status: 'success' | 'error' | 'pending' | 'n/a', value?: any, error?: string): Promise<void>;
  
  // Historical metrics tracking
  storePoolMetricsHistory(metrics: InsertPoolMetricsHistory): Promise<PoolMetricsHistory>;
  getPoolMetricsHistory(poolId: string, days?: number): Promise<PoolMetricsHistory[]>;
  
  // Metrics collection management
  triggerImmediateMetricsCollection(poolId: string): Promise<void>;
  getPoolsNeedingMetricsCollection(): Promise<Pool[]>;
  scheduleNextMetricsCollection(poolId: string, platformRefreshInterval: number): Promise<void>;



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

  // Admin methods
  getAllPoolsForAdmin(): Promise<any[]>;
  updatePool(id: string, updates: Partial<InsertPool>): Promise<Pool | undefined>;
  getAllChainsFromChainsTable(): Promise<Chain[]>;

  // SWR Cache methods
  getSwrCachedPages(): Promise<SwrCachedPage[]>;
  getSwrCachedPage(id: string): Promise<SwrCachedPage | undefined>;
  createSwrCachedPage(page: InsertSwrCachedPage): Promise<SwrCachedPage>;
  updateSwrCachedPage(id: string, updates: Partial<InsertSwrCachedPage>): Promise<SwrCachedPage | undefined>;
  deleteSwrCachedPage(id: string): Promise<boolean>;
  getSwrCacheSnapshots(pageId?: string): Promise<SwrCacheSnapshot[]>;
  clearSwrCacheSnapshots(pageId?: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {

  constructor() {
  }
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

  async getNetworks(): Promise<Network[]> {
    return await db.select().from(networks).orderBy(networks.displayName);
  }

  async getActiveNetworks(): Promise<Network[]> {
    return await db.select().from(networks).where(eq(networks.isActive, true)).orderBy(networks.displayName);
  }

  async createChain(chain: InsertNetwork): Promise<Network> {
    const [newChain] = await db.insert(networks).values(chain).returning();
    return newChain;
  }

  async updateChain(id: string, chain: Partial<InsertNetwork>): Promise<Network | undefined> {
    const [updatedChain] = await db.update(networks).set(chain).where(eq(networks.id, id)).returning();
    return updatedChain || undefined;
  }

  async deleteChain(id: string): Promise<boolean> {
    const result = await db.delete(networks).where(eq(networks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Add missing getChains method for compatibility  
  async getChains(): Promise<Network[]> {
    return await this.getNetworks();
  }

  // Get chains from the actual chains table for token creation
  async getAllChainsFromChainsTable(): Promise<Chain[]> {
    return await db.select().from(chains).where(eq(chains.isActive, true)).orderBy(chains.displayName);
  }

  // Alias method for backward compatibility
  async getPlatforms(): Promise<Protocol[]> {
    return await this.getProtocols();
  }

  async getProtocols(): Promise<Protocol[]> {
    return await db.select().from(protocols).orderBy(protocols.displayName);
  }

  async getActiveProtocols(): Promise<Protocol[]> {
    return await db.select().from(protocols).where(eq(protocols.isActive, true)).orderBy(protocols.displayName);
  }

  async getPlatformsWithVisibility(): Promise<(Protocol & { hasVisiblePools: boolean })[]> {
    const result = await db
      .select({
        id: protocols.id,
        protocolId: protocols.protocolId,
        name: protocols.name,
        displayName: protocols.displayName,
        networkId: protocols.networkId,
        chainId: protocols.chainId,
        logoUrl: protocols.logoUrl,
        website: protocols.website,
        twitter: protocols.twitter,
        discord: protocols.discord,
        github: protocols.github,
        docs: protocols.docs,
        slug: protocols.slug,
        visitUrlTemplate: protocols.visitUrlTemplate,
        showUnderlyingTokens: protocols.showUnderlyingTokens,
        dataRefreshIntervalMinutes: protocols.dataRefreshIntervalMinutes,
        isActive: protocols.isActive,
        createdAt: protocols.createdAt,
        updatedAt: protocols.updatedAt,
        hasVisiblePools: sql`CASE WHEN COUNT(${pools.id}) > 0 THEN true ELSE false END`.as('hasVisiblePools')
      })
      .from(protocols)
      .leftJoin(pools, and(
        eq(protocols.id, pools.platformId),
        eq(pools.isVisible, true)
      ))
      .where(eq(protocols.isActive, true))
      .groupBy(protocols.id)
      .orderBy(
        sql`CASE WHEN COUNT(${pools.id}) > 0 THEN 0 ELSE 1 END`, // Protocols with visible pools first
        protocols.displayName
      );

    return result.map(platform => ({
      ...platform,
      hasVisiblePools: platform.hasVisiblePools as boolean
    }));
  }

  async getPlatformByName(name: string): Promise<Protocol | undefined> {
    const [platform] = await db.select().from(protocols).where(eq(protocols.name, name));
    return platform || undefined;
  }

  async getPlatformById(id: string): Promise<Protocol | undefined> {
    const [platform] = await db.select().from(protocols).where(eq(protocols.id, id));
    return platform || undefined;
  }

  async getPlatformBySlug(slug: string): Promise<Protocol | undefined> {
    const [platform] = await db.select().from(protocols).where(eq(protocols.slug, slug));
    return platform || undefined;
  }

  async getChainByName(name: string): Promise<Network | undefined> {
    const [chain] = await db.select().from(chains).where(eq(chains.name, name));
    return chain || undefined;
  }

  async getChainById(id: string): Promise<Network | undefined> {
    const [chain] = await db.select().from(chains).where(eq(chains.id, id));
    return chain || undefined;
  }

  async getPoolByTokenAndPlatform(tokenPair: string, platformId: string): Promise<Pool | undefined> {
    const [pool] = await db.select().from(pools).where(
      and(eq(pools.tokenPair, tokenPair), eq(pools.platformId, platformId))
    );
    return pool || undefined;
  }

  async getPoolByPlatformPoolId(platformPoolId: string): Promise<Pool | undefined> {
    const [pool] = await db.select().from(pools).where(eq(pools.platform_pool_id, platformPoolId));
    return pool || undefined;
  }

  async getPoolByAddress(address: string): Promise<Pool | undefined> {
    const [pool] = await db.select().from(pools).where(eq(pools.poolAddress, address));
    return pool || undefined;
  }

  async createPlatform(platform: InsertProtocol): Promise<Protocol> {
    const platformData = {
      ...platform,
      slug: platform.slug || platform.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    };
    const [newPlatform] = await db.insert(protocols).values(platformData).returning();
    return newPlatform;
  }

  async updatePlatform(id: string, platform: Partial<InsertProtocol>): Promise<Protocol | undefined> {
    const [updatedPlatform] = await db.update(protocols).set(platform).where(eq(protocols.id, id)).returning();
    return updatedPlatform || undefined;
  }

  async deletePlatform(id: string): Promise<boolean> {
    const result = await db.delete(protocols).where(eq(protocols.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTokens(): Promise<Token[]> {
    // Select specific columns to avoid logoUrl column error
    return await db.select({
      id: tokens.id,
      chainId: tokens.chainId,
      address: tokens.address,
      name: tokens.name,
      symbol: tokens.symbol,
      decimals: tokens.decimals,
      isActive: tokens.isActive,
      createdAt: tokens.createdAt
    }).from(tokens).orderBy(tokens.symbol);
  }

  async getActiveTokens(): Promise<Token[]> {
    // Select specific columns to avoid logoUrl column error
    return await db.select({
      id: tokens.id,
      chainId: tokens.chainId,
      address: tokens.address,
      name: tokens.name,
      symbol: tokens.symbol,
      decimals: tokens.decimals,
      isActive: tokens.isActive,
      createdAt: tokens.createdAt
    }).from(tokens).where(eq(tokens.isActive, true)).orderBy(tokens.symbol);
  }

  async getTokensByChain(chainId: string): Promise<Token[]> {
    // Select specific columns to avoid logoUrl column error
    return await db.select({
      id: tokens.id,
      chainId: tokens.chainId,
      address: tokens.address,
      name: tokens.name,
      symbol: tokens.symbol,
      decimals: tokens.decimals,
      isActive: tokens.isActive,
      createdAt: tokens.createdAt
    }).from(tokens).where(and(eq(tokens.chainId, chainId), eq(tokens.isActive, true))).orderBy(tokens.symbol);
  }

  async createToken(token: InsertToken): Promise<Token> {
    const [newToken] = await db.insert(tokens).values(token).returning();
    return newToken;
  }

  async getAllTokens(): Promise<Token[]> {
    // Select specific columns to avoid logoUrl column error
    return await db.select({
      id: tokens.id,
      chainId: tokens.chainId,
      address: tokens.address,
      name: tokens.name,
      symbol: tokens.symbol,
      decimals: tokens.decimals,
      isActive: tokens.isActive,
      createdAt: tokens.createdAt
    }).from(tokens).orderBy(tokens.symbol);
  }

  async updateToken(id: string, tokenData: Partial<InsertToken>): Promise<Token | undefined> {
    const [updatedToken] = await db.update(tokens).set(tokenData).where(eq(tokens.id, id)).returning();
    return updatedToken || undefined;
  }

  // Token Info methods
  async getTokenInfoByAddress(address: string): Promise<TokenInfo | undefined> {
    const [tokenInfoRecord] = await db.select().from(tokenInfo).where(eq(tokenInfo.address, address));
    return tokenInfoRecord || undefined;
  }

  async createTokenInfo(tokenInfoData: InsertTokenInfo): Promise<TokenInfo> {
    const [newTokenInfo] = await db.insert(tokenInfo).values(tokenInfoData).returning();
    return newTokenInfo;
  }

  async updateTokenInfo(address: string, tokenInfoData: Partial<InsertTokenInfo>): Promise<TokenInfo | undefined> {
    const [updatedTokenInfo] = await db.update(tokenInfo).set({
      ...tokenInfoData,
      lastUpdated: new Date()
    }).where(eq(tokenInfo.address, address)).returning();
    return updatedTokenInfo || undefined;
  }

  async getAllTokenInfo(): Promise<TokenInfo[]> {
    return await db.select().from(tokenInfo).orderBy(tokenInfo.symbol);
  }

  async upsertTokenInfo(address: string, tokenInfoData: InsertTokenInfo): Promise<TokenInfo> {
    const existing = await this.getTokenInfoByAddress(address);
    if (existing) {
      return await this.updateTokenInfo(address, tokenInfoData) || existing;
    } else {
      return await this.createTokenInfo(tokenInfoData);
    }
  }

  // Holder History methods
  async storeHolderHistory(holderData: InsertHolderHistory): Promise<HolderHistory> {
    const [newHolderHistory] = await db.insert(holderHistory).values(holderData).returning();
    return newHolderHistory;
  }

  async getHolderHistory(tokenAddress: string, days?: number): Promise<HolderHistory[]> {
    let conditions = [eq(holderHistory.tokenAddress, tokenAddress)];
    
    if (days) {
      const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      conditions.push(sql`${holderHistory.timestamp} >= ${dateFilter}`);
    }
    
    return await db.select().from(holderHistory)
      .where(and(...conditions))
      .orderBy(desc(holderHistory.timestamp));
  }

  async getHolderAnalytics(tokenAddress: string): Promise<{
    current: number;
    change7d: { value: number; percentage: number } | null;
    change30d: { value: number; percentage: number } | null;
    changeAllTime: { value: number; percentage: number } | null;
    firstRecordDate: Date | null;
  }> {

    // Fallback to database records if transfer analysis fails
    
    // Get the most recent record
    const [latestRecord] = await db
      .select()
      .from(holderHistory)
      .where(eq(holderHistory.tokenAddress, tokenAddress))
      .orderBy(desc(holderHistory.timestamp))
      .limit(1);

    if (!latestRecord) {
      return {
        current: 0,
        change7d: null,
        change30d: null,
        changeAllTime: null,
        firstRecordDate: null,
      };
    }

    const current = latestRecord.holdersCount;

    // Get records for 7 days ago and 30 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [record7d] = await db
      .select()
      .from(holderHistory)
      .where(and(
        eq(holderHistory.tokenAddress, tokenAddress),
        sql`${holderHistory.timestamp} <= ${sevenDaysAgo}`
      ))
      .orderBy(desc(holderHistory.timestamp))
      .limit(1);

    const [record30d] = await db
      .select()
      .from(holderHistory)
      .where(and(
        eq(holderHistory.tokenAddress, tokenAddress),
        sql`${holderHistory.timestamp} <= ${thirtyDaysAgo}`
      ))
      .orderBy(desc(holderHistory.timestamp))
      .limit(1);

    // Get the earliest record (all-time)
    const [firstRecord] = await db
      .select()
      .from(holderHistory)
      .where(eq(holderHistory.tokenAddress, tokenAddress))
      .orderBy(holderHistory.timestamp)
      .limit(1);

    // Calculate changes
    const calculateChange = (oldValue: number, newValue: number) => {
      const value = newValue - oldValue;
      const percentage = oldValue > 0 ? (value / oldValue) * 100 : 0;
      return { value, percentage };
    };

    const change7d = record7d ? calculateChange(record7d.holdersCount, current) : null;
    const change30d = record30d ? calculateChange(record30d.holdersCount, current) : null;

    return {
      current,
      change7d,
      change30d,
      changeAllTime: firstRecord ? calculateChange(firstRecord.holdersCount, current) : null,
      firstRecordDate: firstRecord?.timestamp || null,
    };
  }

  async getLatestHolderHistory(tokenAddress: string): Promise<HolderHistory | undefined> {
    const [latestRecord] = await db
      .select()
      .from(holderHistory)
      .where(eq(holderHistory.tokenAddress, tokenAddress))
      .orderBy(desc(holderHistory.timestamp))
      .limit(1);
    return latestRecord || undefined;
  }

  async getPools(options: {
    chainId?: string;
    platformId?: string;
    categoryId?: string;
    search?: string;
    onlyVisible?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<PoolWithRelations[]> {
    const { chainId, platformId, categoryId, search, onlyVisible = true, limit = 50, offset = 0 } = options;

    // Use very basic approach without complex conditions
    const results = await db
      .select()
      .from(pools)
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .leftJoin(poolMetricsCurrent, eq(pools.id, poolMetricsCurrent.poolId))
      .where(
        and(
          eq(pools.isActive, true),
          eq(pools.isVisible, true),
          isNull(pools.deletedAt)
        )
      )
      .orderBy(desc(pools.apy))
      .limit(limit)
      .offset(offset);

    // Convert to PoolWithRelations format
    const poolsWithRelations: PoolWithRelations[] = results.map(result => ({
      ...result.pools,
      platform: result.protocols!,
      chain: result.networks!,
      notes: [],
      categories: [],
      holdersCount: result.pool_metrics_current?.holdersCount || null,
      operatingDays: result.pool_metrics_current?.operatingDays || null,
    }));

    return poolsWithRelations;
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
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .leftJoin(notes, eq(pools.id, notes.poolId));

    let countQuery = db
      .select({ count: sql<number>`count(distinct ${pools.id})` })
      .from(pools)
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id));

    const conditions = [eq(pools.isActive, true), isNull(pools.deletedAt)];

    if (chainIds && chainIds.length > 0) {
      conditions.push(inArray(pools.chainId, chainIds));
    }

    if (platformIds && platformIds.length > 0) {
      conditions.push(inArray(pools.platformId, platformIds));
    }

    if (search) {
      const searchCondition = or(
        ilike(protocols.displayName, `%${search}%`),
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
      if (dataSources.includes('platform')) {
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

    // Get paginated results - prioritize visible pools first (true before false), then order by APY
    const results = await query
      .orderBy(desc(pools.isVisible), desc(pools.apy))
      .limit(limit)
      .offset(offset);

    // Group results by pool to handle multiple notes
    const poolsMap = new Map<string, PoolWithRelations>();

    for (const result of results) {
      const poolId = result.pools.id;

      if (!poolsMap.has(poolId)) {
        poolsMap.set(poolId, {
          ...result.pools,
          platform: result.protocols!,
          chain: result.networks!,
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

  async getAllPoolsWithRelations(): Promise<PoolWithRelations[]> {
    const results = await db
      .select()
      .from(pools)
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .leftJoin(notes, eq(pools.id, notes.poolId))
      .leftJoin(poolCategories, eq(pools.id, poolCategories.poolId))
      .leftJoin(categories, eq(poolCategories.categoryId, categories.id))
      .leftJoin(tokenInfo, eq(pools.tokenInfoId, tokenInfo.id))
      .orderBy(desc(pools.isActive), desc(pools.isVisible), desc(pools.apy));

    // Group results by pool to handle multiple notes and categories
    const poolsMap = new Map<string, PoolWithRelations>();

    for (const result of results) {
      const poolId = result.pools.id;

      if (!poolsMap.has(poolId)) {
        poolsMap.set(poolId, {
          ...result.pools,
          platform: result.protocols!,
          chain: result.networks!,
          notes: result.notes ? [result.notes] : [],
          categories: result.categories ? [result.categories] : [],
          holdersCount: result.token_info?.holdersCount || null,
        });
      } else {
        const existingPool = poolsMap.get(poolId)!;
        if (result.notes && !existingPool.notes.find(n => n.id === result.notes!.id)) {
          existingPool.notes.push(result.notes);
        }
        if (result.categories && !existingPool.categories?.find(c => c.id === result.categories!.id)) {
          existingPool.categories = existingPool.categories || [];
          existingPool.categories.push(result.categories);
        }
      }
    }

    return Array.from(poolsMap.values());
  }

  async getPoolById(id: string): Promise<PoolWithRelations | undefined> {
    const results = await db
      .select()
      .from(pools)
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .leftJoin(notes, eq(pools.id, notes.poolId))
      .leftJoin(tokenInfo, eq(pools.tokenInfoId, tokenInfo.id))
      .leftJoin(poolMetricsCurrent, eq(pools.id, poolMetricsCurrent.poolId))
      .where(eq(pools.id, id));

    if (results.length === 0) return undefined;

    const pool = results[0].pools;
    const poolNotes = results.filter(r => r.notes).map(r => r.notes!);

    return {
      ...pool,
      platform: results[0].protocols!,
      chain: results[0].networks!,
      notes: poolNotes,
      holdersCount: results[0].pool_metrics_current?.holdersCount || null,
      operatingDays: results[0].pool_metrics_current?.operatingDays || null,
    };
  }

  async createPool(pool: InsertPool): Promise<Pool> {
    // Set default values for new pools
    const poolWithDefaults = {
      ...pool,
      rawData: pool.rawData || { count: 30 }, // Default operating days
      lastUpdated: new Date()
    };
    
    const [newPool] = await db.insert(pools).values(poolWithDefaults).returning();
    
    // Automatically create pool_metrics_current record for new pool
    try {
      await db.insert(poolMetricsCurrent).values({
        poolId: newPool.id,
        apy: newPool.apy || '0.00',
        tvl: newPool.tvl || '0',
        operatingDays: 30, // Default operating days
        holdersCount: 0, // Will be updated by holder sync service
        apyStatus: 'pending',
        tvlStatus: 'pending',
        daysStatus: 'success',
        holdersStatus: 'pending',
        lastCollectionAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Created pool_metrics_current record for pool ${newPool.id}`);
    } catch (error) {
      console.error(`⚠️ Failed to create pool_metrics_current for pool ${newPool.id}:`, error);
      // Don't fail the pool creation if metrics creation fails
    }
    
    // Auto-assign categories based on token pair name
    try {
      const tokenPair = newPool.tokenPair?.toLowerCase() || '';
      let categoryName: string | null = null;
      
      if (tokenPair.includes('usdc')) {
        categoryName = 'USDC';
      } else if (tokenPair.includes('usdt')) {
        categoryName = 'USDT';
      } else if (tokenPair.includes('steth')) {
        categoryName = 'stETH';
      } else if (tokenPair.includes('weth') || tokenPair.includes('eth')) {
        categoryName = 'ETH';
      } else if (tokenPair.includes('wbtc') || tokenPair.includes('btc')) {
        categoryName = 'BTC';
      }
      
      if (categoryName) {
        // Find the category ID
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.name, categoryName))
          .limit(1);
        
        if (category) {
          await db.insert(poolCategories).values({
            poolId: newPool.id,
            categoryId: category.id
          });
          console.log(`✅ Auto-assigned ${categoryName} category to pool ${newPool.id}`);
        }
      }
    } catch (error) {
      console.error(`⚠️ Failed to auto-assign category for pool ${newPool.id}:`, error);
      // Don't fail the pool creation if category assignment fails
    }
    
    // Trigger initial data scrape for the new pool
    setTimeout(async () => {
      try {
        const scraperManager = (await import('./scrapers/scraper-manager')).scraperManager;
        scraperManager.scrapeSpecificPool(newPool.id);
        console.log(`🔄 Triggered initial scrape for new pool ${newPool.id}`);
      } catch (error) {
        console.error(`⚠️ Failed to trigger initial scrape for pool ${newPool.id}:`, error);
      }
    }, 1000);
    
    return newPool;
  }

  async getAllPoolsForAdmin(): Promise<any[]> {
    return await db
      .select({
        id: pools.id,
        tokenPair: pools.tokenPair,
        showUsdInFlow: pools.showUsdInFlow,
        isVisible: pools.isVisible,
        platform: {
          displayName: protocols.displayName,
        },
        chain: {
          displayName: networks.displayName,
        }
      })
      .from(pools)
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .where(isNull(pools.deletedAt)) // Exclude soft-deleted pools
      .orderBy(pools.isVisible ? asc(sql`0`) : asc(sql`1`), protocols.displayName);
  }

  async updatePool(id: string, pool: Partial<InsertPool>): Promise<Pool | undefined> {
    const [updatedPool] = await db.update(pools).set({
      ...pool,
      lastUpdated: new Date()
    }).where(eq(pools.id, id)).returning();
    return updatedPool || undefined;
  }

  async updatePoolRawData(id: string, rawData: any): Promise<Pool | undefined> {
    const [updatedPool] = await db.update(pools).set({ rawData }).where(eq(pools.id, id)).returning();
    return updatedPool || undefined;
  }

  async deletePool(id: string): Promise<boolean> {
    try {
      // Delete all related data in the correct order to avoid foreign key constraint violations
      
      // 1. Delete data that depends on other pool-related tables
      await db.delete(reviewVotes).where(
        sql`${reviewVotes.reviewId} IN (SELECT id FROM ${poolReviews} WHERE pool_id = ${id})`
      );
      
      // 2. Delete direct pool relationships
      await db.delete(notes).where(eq(notes.poolId, id));
      await db.delete(poolCategories).where(eq(poolCategories.poolId, id));
      await db.delete(aiOutlooks).where(eq(aiOutlooks.poolId, id));
      await db.delete(discussions).where(eq(discussions.poolId, id));
      await db.delete(poolReviews).where(eq(poolReviews.poolId, id));
      await db.delete(riskScores).where(eq(riskScores.poolId, id));
      await db.delete(strategyPools).where(eq(strategyPools.poolId, id));
      await db.delete(userAlerts).where(eq(userAlerts.poolId, id));
      await db.delete(watchlistPools).where(eq(watchlistPools.poolId, id));
      await db.delete(poolMetricsCurrent).where(eq(poolMetricsCurrent.poolId, id));
      await db.delete(poolMetricsHistory).where(eq(poolMetricsHistory.poolId, id));
      await db.delete(poolHistoricalData).where(eq(poolHistoricalData.poolId, id));
      // Token holders removed from system
      await db.delete(webhookConfigs).where(eq(webhookConfigs.poolId, id));
      await db.delete(tokenTransactions).where(eq(tokenTransactions.poolId, id));
      
      // 3. Finally delete the pool itself
      const result = await db.delete(pools).where(eq(pools.id, id));
      
      console.log(`✅ Pool ${id} and all related data deleted successfully`);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`❌ Error deleting pool ${id}:`, error);
      throw error;
    }
  }

  // Soft delete pool (move to trash)
  async softDeletePool(id: string, deletedBy: string | null): Promise<boolean> {
    const now = new Date();
    const permanentDeleteAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
    
    const result = await db
      .update(pools)
      .set({ 
        deletedAt: now, 
        deletedBy, 
        permanentDeleteAt,
        isVisible: false // Hide from regular listings
      })
      .where(eq(pools.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Get trashed pools
  async getTrashedPools(): Promise<PoolWithRelations[]> {
    const result = await db
      .select({
        // Pool fields
        pool: pools,
        // Platform fields (may be null)
        platform: protocols,
        // Chain fields (may be null) 
        chain: networks
      })
      .from(pools)
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .where(isNotNull(pools.deletedAt))
      .orderBy(desc(pools.deletedAt));

    return result.map(row => ({
      ...row.pool,
      platform: row.platform || {
        id: '',
        protocolId: null,
        name: 'Unknown',
        displayName: 'Unknown Platform',
        networkId: null,
        chainId: null,
        logoUrl: null,
        website: null,
        twitter: null,
        discord: null,
        github: null,
        docs: null,
        slug: null,
        visitUrlTemplate: null,
        showUnderlyingTokens: false,
        dataRefreshIntervalMinutes: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      },
      chain: row.chain || {
        id: '',
        chainId: '',
        name: 'Unknown',
        displayName: 'Unknown Chain',
        color: null,
        iconUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      },
      notes: [],
      categories: [],
      holdersCount: null,
      operatingDays: null
    }));
  }

  // Restore pool from trash
  async restorePool(id: string): Promise<boolean> {
    const result = await db
      .update(pools)
      .set({ 
        deletedAt: null, 
        deletedBy: null, 
        permanentDeleteAt: null,
        isVisible: true // Restore visibility
      })
      .where(eq(pools.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Permanently delete pool
  async permanentlyDeletePool(id: string): Promise<boolean> {
    const result = await db.delete(pools).where(eq(pools.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Cleanup expired pools (automatically called by scheduler)
  async cleanupExpiredPools(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(pools)
      .where(
        and(
          isNotNull(pools.permanentDeleteAt),
          lte(pools.permanentDeleteAt, now)
        )
      );
    return result.rowCount || 0;
  }

  async upsertPool(platformPoolId: string, poolData: InsertPool): Promise<Pool> {
    // Try to find existing pool by platformPoolId
    const [existingPool] = await db.select().from(pools).where(eq(pools.platform_pool_id, platformPoolId));

    if (existingPool) {
      // Update existing pool BUT preserve admin visibility settings
      const updateData = {
        ...poolData,
        // NEVER override admin visibility decisions
        isVisible: existingPool.isVisible,
        // Always update the lastUpdated timestamp when syncing
        lastUpdated: new Date(),
      };
      
      const [updatedPool] = await db.update(pools).set(updateData).where(eq(pools.id, existingPool.id)).returning();
      return updatedPool;
    } else {
      // Create new pool (defaults to hidden so admin can control visibility)
      const [newPool] = await db.insert(pools).values({
        ...poolData,
        platform_pool_id: platformPoolId,
        isVisible: false, // All new pools start hidden
        lastUpdated: new Date(),
      }).returning();
      
      // Trigger holder sync for new pool if it has a contract address
      if (newPool.poolAddress) {
      }
      
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
        parentId: categories.parentId,
        isActive: categories.isActive,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
        poolCount: sql<number>`count(${poolCategories.poolId})::int`,
      })
      .from(categories)
      .leftJoin(poolCategories, eq(categories.id, poolCategories.categoryId))
      .groupBy(categories.id)
      .orderBy(categories.sortOrder, categories.displayName);
    
    // Group categories into parent-child structure
    const parentCategories = result.filter(c => !c.parentId);
    const subcategories = result.filter(c => c.parentId);

    // Attach subcategories to their parents
    return parentCategories.map(parent => ({
      ...parent,
      subcategories: subcategories.filter(sub => sub.parentId === parent.id)
    }));
  }

  async getAllCategoriesFlat(): Promise<Category[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        displayName: categories.displayName,
        slug: categories.slug,
        iconUrl: categories.iconUrl,
        description: categories.description,
        color: categories.color,
        parentId: categories.parentId,
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
    const categoryData = {
      ...category,
      slug: category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      parentId: category.parentId || null,
    };
    const [newCategory] = await db.insert(categories).values(categoryData).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const updateData = { ...category };
    if (category.name) {
      updateData.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    // Ensure parentId is properly handled
    if ('parentId' in category) {
      updateData.parentId = category.parentId || null;
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
        parentId: categories.parentId,
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
    totalTvl: number;
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
      totalTvl: Number(visibleStats.total_tvl) || 0,
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
    let conditions = [eq(userAlerts.userId, userId)];
    
    if (isActive !== undefined) {
      conditions.push(eq(userAlerts.isActive, isActive));
    }
    
    return await db.select().from(userAlerts).where(and(...conditions));
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
    let conditions = [eq(userAlerts.userId, userId)];
    
    if (isRead !== undefined) {
      conditions.push(eq(alertNotifications.isRead, isRead));
    }
    
    const results = await db.select().from(alertNotifications)
      .innerJoin(userAlerts, eq(alertNotifications.alertId, userAlerts.id))
      .where(and(...conditions));
      
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
      .leftJoin(protocols, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id));

    const conditions = [];
    if (options?.userId) conditions.push(eq(strategies.userId, options.userId));
    if (options?.category) conditions.push(eq(strategies.category, options.category));
    if (options?.riskLevel) conditions.push(eq(strategies.riskLevel, options.riskLevel));
    if (options?.isPublic !== undefined) conditions.push(eq(strategies.isPublic, options.isPublic));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(desc(strategies.createdAt));

    const strategiesMap = new Map<string, any>();
    results.forEach((result: any) => {
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
            chain: result.networks
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

    const watchlistsMap = new Map<string, any>();
    results.forEach((result: any) => {
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
            chain: result.networks
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
    const conditions = [eq(apiEndpoints.isActive, true)];
    
    if (category) {
      conditions.push(eq(apiEndpoints.category, category));
    }
    
    if (accessLevel) {
      conditions.push(eq(apiEndpoints.accessLevel, accessLevel));
    }
    
    return await db.select().from(apiEndpoints).where(and(...conditions));
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
    if (status) {
      return await db.select().from(developerApplications)
        .where(eq(developerApplications.status, status))
        .orderBy(desc(developerApplications.createdAt));
    }
    
    return await db.select().from(developerApplications)
      .orderBy(desc(developerApplications.createdAt));
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

  // 🎯 Standardized Pool Metrics Implementation
  
  async getPoolMetricsCurrent(poolId: string): Promise<PoolMetricsCurrent | undefined> {
    const [current] = await db
      .select()
      .from(poolMetricsCurrent)
      .where(eq(poolMetricsCurrent.poolId, poolId));
    return current;
  }

  async upsertPoolMetricsCurrent(poolId: string, metrics: Partial<InsertPoolMetricsCurrent>): Promise<PoolMetricsCurrent> {
    // Check if record exists
    const existing = await this.getPoolMetricsCurrent(poolId);
    
    if (existing) {
      // Update existing record
      const [updated] = await db
        .update(poolMetricsCurrent)
        .set({ ...metrics, updatedAt: new Date() })
        .where(eq(poolMetricsCurrent.poolId, poolId))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(poolMetricsCurrent)
        .values({ poolId, ...metrics })
        .returning();
      return created;
    }
  }

  async updatePoolMetricCurrentStatus(
    poolId: string, 
    metric: 'apy' | 'days' | 'tvl' | 'holders', 
    status: 'success' | 'error' | 'pending' | 'n/a', 
    value?: any, 
    error?: string
  ): Promise<void> {
    const updates: any = {
      [`${metric}Status`]: status,
      updatedAt: new Date(),
      lastCollectionAt: new Date()
    };

    if (status === 'success' && value !== undefined) {
      updates[metric === 'days' ? 'operatingDays' : metric === 'holders' ? 'holdersCount' : metric] = value;
      updates.lastSuccessfulCollectionAt = new Date();
    }

    if (status === 'error' && error) {
      updates[`${metric}Error`] = error;
    }

    await this.upsertPoolMetricsCurrent(poolId, updates);
  }

  async storePoolMetricsHistory(metrics: InsertPoolMetricsHistory): Promise<PoolMetricsHistory> {
    const [created] = await db
      .insert(poolMetricsHistory)
      .values(metrics)
      .returning();
    return created;
  }

  async getPoolMetricsHistory(poolId: string, days: number = 30): Promise<PoolMetricsHistory[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await db
      .select()
      .from(poolMetricsHistory)
      .where(
        and(
          eq(poolMetricsHistory.poolId, poolId),
          sql`${poolMetricsHistory.collectedAt} >= ${since}`
        )
      )
      .orderBy(desc(poolMetricsHistory.collectedAt));
  }

  async triggerImmediateMetricsCollection(poolId: string): Promise<void> {
    // Initialize metrics current record if it doesn't exist
    await this.upsertPoolMetricsCurrent(poolId, {
      apyStatus: 'pending',
      daysStatus: 'pending', 
      tvlStatus: 'pending',
      holdersStatus: 'pending',
      lastCollectionAt: new Date()
    });
  }

  async getPoolsNeedingMetricsCollection(): Promise<Pool[]> {
    // Get pools that need metrics collection based on platform refresh intervals
    const result = await db
      .select({
        pool: pools,
        platform: platforms,
        current: poolMetricsCurrent
      })
      .from(pools)
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(poolMetricsCurrent, eq(pools.id, poolMetricsCurrent.poolId))
      .where(
        and(
          eq(pools.isActive, true),
          eq(pools.isVisible, true),
          isNull(pools.deletedAt)
        )
      );

    const poolsNeedingUpdate: Pool[] = [];
    const now = new Date();

    for (const row of result) {
      const pool = row.pool;
      const platform = row.platform;
      const current = row.current;

      if (!platform) continue;

      const refreshIntervalMs = (platform.dataRefreshIntervalMinutes || 10) * 60 * 1000;
      
      // Check if metrics collection is needed
      if (!current || !current.lastCollectionAt || 
          (now.getTime() - current.lastCollectionAt.getTime()) > refreshIntervalMs) {
        poolsNeedingUpdate.push(pool);
      }
    }

    return poolsNeedingUpdate;
  }

  async scheduleNextMetricsCollection(poolId: string, platformRefreshInterval: number): Promise<void> {
    const nextCollection = new Date();
    nextCollection.setMinutes(nextCollection.getMinutes() + platformRefreshInterval);

    await this.upsertPoolMetricsCurrent(poolId, {
      nextCollectionAt: nextCollection
    });
  }

  // Token holder functionality removed from system

  async getActivePools(): Promise<Pool[]> {
    return await db
      .select()
      .from(pools)
      .where(
        and(
          eq(pools.isActive, true),
          eq(pools.isVisible, true),
          isNull(pools.deletedAt)
        )
      )
      .orderBy(pools.tokenPair);
  }

  // SWR Cache methods
  async getSwrCachedPages(): Promise<SwrCachedPage[]> {
    return await db
      .select()
      .from(swrCachedPages)
      .orderBy(asc(swrCachedPages.priority));
  }

  async getSwrCachedPage(id: string): Promise<SwrCachedPage | undefined> {
    const [page] = await db
      .select()
      .from(swrCachedPages)
      .where(eq(swrCachedPages.id, id))
      .limit(1);
    return page;
  }

  async createSwrCachedPage(page: InsertSwrCachedPage): Promise<SwrCachedPage> {
    const [newPage] = await db
      .insert(swrCachedPages)
      .values(page)
      .returning();
    return newPage;
  }

  async updateSwrCachedPage(id: string, updates: Partial<InsertSwrCachedPage>): Promise<SwrCachedPage | undefined> {
    const [updatedPage] = await db
      .update(swrCachedPages)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(swrCachedPages.id, id))
      .returning();
    return updatedPage;
  }

  async deleteSwrCachedPage(id: string): Promise<boolean> {
    const result = await db
      .delete(swrCachedPages)
      .where(eq(swrCachedPages.id, id));
    return true;
  }

  async getSwrCacheSnapshots(pageId?: string): Promise<SwrCacheSnapshot[]> {
    if (pageId) {
      return await db
        .select()
        .from(swrCacheSnapshots)
        .where(eq(swrCacheSnapshots.pageId, pageId))
        .orderBy(desc(swrCacheSnapshots.createdAt));
    }
    return await db
      .select()
      .from(swrCacheSnapshots)
      .orderBy(desc(swrCacheSnapshots.createdAt));
  }

  async clearSwrCacheSnapshots(pageId?: string): Promise<number> {
    if (pageId) {
      await db
        .delete(swrCacheSnapshots)
        .where(eq(swrCacheSnapshots.pageId, pageId));
    } else {
      await db.delete(swrCacheSnapshots);
    }
    return 0;
  }
}

export const storage = new DatabaseStorage();
