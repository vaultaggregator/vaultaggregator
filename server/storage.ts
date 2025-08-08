import { 
  pools, platforms, chains, tokens, notes, users, categories, poolCategories, apiKeys, apiKeyUsage,
  type Pool, type Platform, type Chain, type Token, type Note,
  type InsertPool, type InsertPlatform, type InsertChain, type InsertToken, type InsertNote,
  type PoolWithRelations, type User, type InsertUser,
  type Category, type InsertCategory, type PoolCategory, type InsertPoolCategory,
  type CategoryWithPoolCount, type ApiKey, type InsertApiKey, type ApiKeyUsage, type InsertApiKeyUsage
} from "@shared/schema";
import { db } from "./db";
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
  
  // Data source methods  
  getDataSources(): Promise<Array<{key: string, name: string}>>;
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
          ilike(pools.tokenPair, `%${search}%`)
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
        ilike(pools.tokenPair, `%${search}%`)
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
        conditions.push(or(...visibilityConditions));
      }
    }

    if (dataSources && dataSources.length > 0) {
      const dataSourceConditions = [];
      if (dataSources.includes('defillama')) {
        // Pools from DeFi Llama that are not Morpho or Lido pools
        dataSourceConditions.push(and(
          sql`${pools.rawData}->>'project' != 'morpho-blue'`,
          sql`${pools.project} != 'lido'`
        ));
      }
      if (dataSources.includes('morpho')) {
        // Pools from Morpho have project='morpho-blue'
        dataSourceConditions.push(sql`${pools.rawData}->>'project' = 'morpho-blue'`);
      }
      if (dataSources.includes('lido')) {
        // Pools from Lido have project='lido'
        dataSourceConditions.push(eq(pools.project, 'lido'));
      }
      if (dataSourceConditions.length > 0) {
        conditions.push(or(...dataSourceConditions));
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
    const [updatedPool] = await db.update(pools).set({
      ...pool,
      lastUpdated: new Date(),
    }).where(eq(pools.id, id)).returning();
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
      const updateData: Partial<InsertPool> = {
        ...poolData,
        lastUpdated: new Date(),
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

  async updatePlatform(id: string, platform: Partial<InsertPlatform>): Promise<Platform | undefined> {
    const [updatedPlatform] = await db.update(platforms).set(platform).where(eq(platforms.id, id)).returning();
    return updatedPlatform || undefined;
  }

  async updateChain(id: string, chain: Partial<InsertChain>): Promise<Chain | undefined> {
    const [updatedChain] = await db.update(chains).set(chain).where(eq(chains.id, id)).returning();
    return updatedChain || undefined;
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
    return result.rowCount > 0;
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
  
  async getDataSources(): Promise<Array<{key: string, name: string}>> {
    const result = await db
      .select({
        source: sql<string>`DISTINCT ${pools.project}`,
      })
      .from(pools)
      .where(
        and(
          eq(pools.isActive, true),
          sql`${pools.project} IS NOT NULL`,
          sql`${pools.project} != ''`
        )
      );

    const dataSources = result
      .map(row => row.source)
      .filter(source => source && source !== 'null' && source.trim() !== '')
      .map(source => {
        // Map source names to display names
        const sourceMap: Record<string, string> = {
          'defillama': 'DeFi Llama API',
          'morpho': 'Morpho API', 
          'lido': 'Lido API'
        };
        return {
          key: source,
          name: sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1) + ' API'
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return dataSources;
  }

  async removeDuplicatePools(): Promise<number> {
    // Find duplicate pools based on platformId + tokenPair + chainId, keeping the one with data
    const duplicates = await this.db.execute(sql`
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
    `);

    if (duplicates.rows.length > 0) {
      const idsToDelete = duplicates.rows.map(row => row.id as string);
      await this.db.delete(pools).where(sql`id = ANY(${idsToDelete})`);
      console.log(`Removed ${idsToDelete.length} duplicate pools`);
      return idsToDelete.length;
    }
    
    return 0;
  }

  async getVisiblePoolsForProtection(): Promise<Pool[]> {
    return await this.db.select().from(pools).where(eq(pools.isVisible, true));
  }
}

export const storage = new DatabaseStorage();
