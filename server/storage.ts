import { 
  pools, platforms, chains, tokens, notes,
  type Pool, type Platform, type Chain, type Token, type Note,
  type InsertPool, type InsertPlatform, type InsertChain, type InsertToken, type InsertNote,
  type PoolWithRelations, type User, type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User methods (existing)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chain methods
  getChains(): Promise<Chain[]>;
  getActiveChains(): Promise<Chain[]>;
  createChain(chain: InsertChain): Promise<Chain>;
  updateChain(id: string, chain: Partial<InsertChain>): Promise<Chain | undefined>;

  // Platform methods
  getPlatforms(): Promise<Platform[]>;
  getActivePlatforms(): Promise<Platform[]>;
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
  getPoolById(id: string): Promise<PoolWithRelations | undefined>;
  createPool(pool: InsertPool): Promise<Pool>;
  updatePool(id: string, pool: Partial<InsertPool>): Promise<Pool | undefined>;
  deletePool(id: string): Promise<boolean>;
  upsertPool(defiLlamaId: string, pool: InsertPool): Promise<Pool>;

  // Note methods
  getNotesByPool(poolId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // Stats methods
  getStats(): Promise<{
    totalPools: number;
    activePools: number;
    hiddenPools: number;
    avgApy: number;
    totalTvl: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(pools as any).where(eq((pools as any).id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(pools as any).where(eq((pools as any).username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(pools as any)
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

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db.insert(platforms).values(platform).returning();
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
      query = query.where(and(...conditions));
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
    return result.rowCount > 0;
  }

  async upsertPool(defiLlamaId: string, poolData: InsertPool): Promise<Pool> {
    // Try to find existing pool by defiLlamaId
    const [existingPool] = await db.select().from(pools).where(eq(pools.defiLlamaId, defiLlamaId));

    if (existingPool) {
      // Update existing pool
      const [updatedPool] = await db.update(pools).set({
        ...poolData,
        lastUpdated: new Date(),
      }).where(eq(pools.id, existingPool.id)).returning();
      return updatedPool;
    } else {
      // Create new pool
      const [newPool] = await db.insert(pools).values({
        ...poolData,
        defiLlamaId,
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
    return result.rowCount > 0;
  }

  async getStats(): Promise<{
    totalPools: number;
    activePools: number;
    hiddenPools: number;
    avgApy: number;
    totalTvl: string;
  }> {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_pools,
        COUNT(*) FILTER (WHERE is_visible = true AND is_active = true) as active_pools,
        COUNT(*) FILTER (WHERE is_visible = false OR is_active = false) as hidden_pools,
        COALESCE(AVG(apy::numeric), 0) as avg_apy,
        COALESCE(SUM(tvl::numeric), 0) as total_tvl
      FROM pools
      WHERE is_active = true
    `);

    return {
      totalPools: Number(stats.total_pools) || 0,
      activePools: Number(stats.active_pools) || 0,
      hiddenPools: Number(stats.hidden_pools) || 0,
      avgApy: Number(stats.avg_apy) || 0,
      totalTvl: (Number(stats.total_tvl) || 0).toLocaleString(),
    };
  }
}

export const storage = new DatabaseStorage();
