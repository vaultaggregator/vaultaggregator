import fs from 'fs-extra';
import path from 'path';
import NodeCache from 'node-cache';
import { db } from '../db';
import { swrCachedPages, swrCacheSnapshots } from '../../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

interface CacheConfig {
  cacheDurationMs: number;
  revalidateOnFocus: boolean;
  revalidateOnReconnect: boolean;
  persistToDisk: boolean;
}

interface CacheSnapshot {
  data: any;
  timestamp: number;
  etag?: string;
  metadata?: any;
}

export class SwrCacheService {
  private memoryCache: NodeCache;
  private cacheDir: string = path.join(process.cwd(), '.cache', 'swr');
  private isInitialized: boolean = false;

  constructor() {
    // Initialize in-memory cache with default TTL of 60 seconds
    this.memoryCache = new NodeCache({ 
      stdTTL: 60,
      checkperiod: 10,
      useClones: false // Don't clone for better performance
    });
    
    this.init();
  }

  private async init() {
    // Ensure cache directory exists
    await fs.ensureDir(this.cacheDir);
    
    // Load persisted cache from disk on startup
    await this.loadPersistedCache();
    
    this.isInitialized = true;
    console.log('✅ SWR Cache Service initialized with disk persistence');
  }

  private async loadPersistedCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let loadedCount = 0;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const cacheKey = file.replace('.json', '');
          
          try {
            const snapshot = await fs.readJson(filePath);
            
            // Check if snapshot is still valid
            if (snapshot.timestamp && Date.now() - snapshot.timestamp < 3600000) { // 1 hour
              this.memoryCache.set(cacheKey, snapshot, 3600);
              loadedCount++;
            }
          } catch (err) {
            console.error(`Failed to load cache file ${file}:`, err);
          }
        }
      }
      
      if (loadedCount > 0) {
        console.log(`📦 Loaded ${loadedCount} cache snapshots from disk`);
      }
    } catch (err) {
      console.error('Failed to load persisted cache:', err);
    }
  }

  async getCachedPageConfig(routePattern: string): Promise<CacheConfig | null> {
    try {
      const [config] = await db
        .select()
        .from(swrCachedPages)
        .where(
          and(
            eq(swrCachedPages.routePattern, routePattern),
            eq(swrCachedPages.isEnabled, true)
          )
        )
        .limit(1);
      
      if (!config) return null;
      
      return {
        cacheDurationMs: config.cacheDurationMs,
        revalidateOnFocus: config.revalidateOnFocus,
        revalidateOnReconnect: config.revalidateOnReconnect,
        persistToDisk: config.persistToDisk
      };
    } catch (err) {
      console.error('Failed to get cache config:', err);
      return null;
    }
  }

  async get(cacheKey: string): Promise<CacheSnapshot | null> {
    // First check memory cache
    const memCached = this.memoryCache.get<CacheSnapshot>(cacheKey);
    if (memCached) {
      // Update access stats
      this.updateCacheStats(cacheKey, true);
      return memCached;
    }
    
    // Then check disk cache
    const diskCached = await this.getFromDisk(cacheKey);
    if (diskCached) {
      // Load back to memory cache
      this.memoryCache.set(cacheKey, diskCached, 3600);
      this.updateCacheStats(cacheKey, true);
      return diskCached;
    }
    
    // Finally check database snapshots
    const dbCached = await this.getFromDatabase(cacheKey);
    if (dbCached) {
      // Load to memory and disk
      this.memoryCache.set(cacheKey, dbCached, 3600);
      await this.saveToDisk(cacheKey, dbCached);
      this.updateCacheStats(cacheKey, true);
      return dbCached;
    }
    
    this.updateCacheStats(cacheKey, false);
    return null;
  }

  async set(cacheKey: string, data: any, config?: CacheConfig): Promise<void> {
    const snapshot: CacheSnapshot = {
      data,
      timestamp: Date.now(),
      etag: this.generateEtag(data),
      metadata: {
        size: JSON.stringify(data).length,
        type: typeof data
      }
    };
    
    // Save to memory cache
    const ttl = config?.cacheDurationMs ? config.cacheDurationMs / 1000 : 60;
    this.memoryCache.set(cacheKey, snapshot, ttl);
    
    // Save to disk if configured
    if (config?.persistToDisk !== false) {
      await this.saveToDisk(cacheKey, snapshot);
    }
    
    // Save to database for long-term persistence
    await this.saveToDatabase(cacheKey, snapshot, config);
    
    console.log(`💾 Cached ${cacheKey} (memory + disk + db)`);
  }

  private async getFromDisk(cacheKey: string): Promise<CacheSnapshot | null> {
    try {
      const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
      if (await fs.pathExists(filePath)) {
        const snapshot = await fs.readJson(filePath);
        
        // Check if still valid (default 1 hour)
        if (Date.now() - snapshot.timestamp < 3600000) {
          return snapshot;
        }
      }
    } catch (err) {
      console.error(`Failed to read cache from disk for ${cacheKey}:`, err);
    }
    return null;
  }

  private async saveToDisk(cacheKey: string, snapshot: CacheSnapshot): Promise<void> {
    try {
      const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
      await fs.writeJson(filePath, snapshot, { spaces: 2 });
    } catch (err) {
      console.error(`Failed to save cache to disk for ${cacheKey}:`, err);
    }
  }

  private async getFromDatabase(cacheKey: string): Promise<CacheSnapshot | null> {
    try {
      const [snapshot] = await db
        .select()
        .from(swrCacheSnapshots)
        .where(
          and(
            eq(swrCacheSnapshots.cacheKey, cacheKey),
            gte(swrCacheSnapshots.expiresAt, new Date()),
            eq(swrCacheSnapshots.isStale, false)
          )
        )
        .orderBy(sql`${swrCacheSnapshots.createdAt} DESC`)
        .limit(1);
      
      if (snapshot) {
        // Update access count
        await db
          .update(swrCacheSnapshots)
          .set({
            accessCount: sql`${swrCacheSnapshots.accessCount} + 1`,
            lastAccessedAt: new Date()
          })
          .where(eq(swrCacheSnapshots.id, snapshot.id));
        
        return {
          data: snapshot.data,
          timestamp: snapshot.createdAt?.getTime() || Date.now(),
          etag: snapshot.etag || undefined,
          metadata: snapshot.metadata
        };
      }
    } catch (err) {
      console.error(`Failed to get cache from database for ${cacheKey}:`, err);
    }
    return null;
  }

  private async saveToDatabase(cacheKey: string, snapshot: CacheSnapshot, config?: CacheConfig): Promise<void> {
    try {
      // Find the page configuration
      const routePattern = this.extractRoutePattern(cacheKey);
      const [pageConfig] = await db
        .select()
        .from(swrCachedPages)
        .where(eq(swrCachedPages.routePattern, routePattern))
        .limit(1);
      
      if (!pageConfig) return;
      
      // Mark old snapshots as stale
      await db
        .update(swrCacheSnapshots)
        .set({ isStale: true })
        .where(
          and(
            eq(swrCacheSnapshots.pageId, pageConfig.id),
            eq(swrCacheSnapshots.cacheKey, cacheKey)
          )
        );
      
      // Insert new snapshot
      const expiresAt = new Date(Date.now() + (config?.cacheDurationMs || 60000));
      await db.insert(swrCacheSnapshots).values({
        pageId: pageConfig.id,
        cacheKey,
        data: snapshot.data,
        metadata: snapshot.metadata,
        dataSize: JSON.stringify(snapshot.data).length,
        etag: snapshot.etag,
        expiresAt,
        accessCount: 0,
        isStale: false
      });
      
      // Update page stats
      await db
        .update(swrCachedPages)
        .set({
          lastCachedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(swrCachedPages.id, pageConfig.id));
      
    } catch (err) {
      console.error(`Failed to save cache to database for ${cacheKey}:`, err);
    }
  }

  async invalidate(cacheKey: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.del(cacheKey);
    
    // Remove from disk
    try {
      const filePath = path.join(this.cacheDir, `${cacheKey}.json`);
      await fs.remove(filePath);
    } catch (err) {
      // Ignore if file doesn't exist
    }
    
    // Mark as stale in database
    await db
      .update(swrCacheSnapshots)
      .set({ isStale: true })
      .where(eq(swrCacheSnapshots.cacheKey, cacheKey));
    
    console.log(`🗑️ Invalidated cache for ${cacheKey}`);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Get all keys matching pattern
    const keys = this.memoryCache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    for (const key of matchingKeys) {
      await this.invalidate(key);
    }
    
    console.log(`🗑️ Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
  }

  async getStats(): Promise<any> {
    const cachePages = await db.select().from(swrCachedPages);
    const stats = await Promise.all(
      cachePages.map(async (page) => {
        const [snapshots] = await db
          .select({
            count: sql<number>`count(*)`,
            totalSize: sql<number>`sum(${swrCacheSnapshots.dataSize})`,
            avgAccessCount: sql<number>`avg(${swrCacheSnapshots.accessCount})`
          })
          .from(swrCacheSnapshots)
          .where(eq(swrCacheSnapshots.pageId, page.id));
        
        return {
          ...page,
          snapshotCount: snapshots?.count || 0,
          totalSize: snapshots?.totalSize || 0,
          avgAccessCount: snapshots?.avgAccessCount || 0
        };
      })
    );
    
    return stats;
  }

  private generateEtag(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `W/"${Math.abs(hash).toString(36)}"`;
  }

  private extractRoutePattern(cacheKey: string): string {
    // Extract the base route pattern from cache key
    // e.g., "api_pools_123" -> "/api/pools"
    const parts = cacheKey.split('_');
    if (parts.length >= 2) {
      return `/${parts[0]}/${parts[1]}`;
    }
    return cacheKey;
  }

  private async updateCacheStats(cacheKey: string, isHit: boolean): Promise<void> {
    try {
      const routePattern = this.extractRoutePattern(cacheKey);
      
      if (isHit) {
        await db
          .update(swrCachedPages)
          .set({
            cacheHitCount: sql`${swrCachedPages.cacheHitCount} + 1`
          })
          .where(eq(swrCachedPages.routePattern, routePattern));
      } else {
        await db
          .update(swrCachedPages)
          .set({
            cacheMissCount: sql`${swrCachedPages.cacheMissCount} + 1`
          })
          .where(eq(swrCachedPages.routePattern, routePattern));
      }
    } catch (err) {
      // Ignore stats update errors
    }
  }

  async cleanup(): Promise<void> {
    // Clean up old snapshots from database
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    const result = await db
      .delete(swrCacheSnapshots)
      .where(
        sql`${swrCacheSnapshots.expiresAt} < ${cutoffDate} OR ${swrCacheSnapshots.isStale} = true`
      );
    
    console.log(`🧹 Cleaned up old cache snapshots`);
    
    // Clean up old disk cache files
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        // Remove files older than 24 hours
        if (Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
          await fs.remove(filePath);
        }
      }
    } catch (err) {
      console.error('Failed to clean up disk cache:', err);
    }
  }
}

// Export singleton instance
export const swrCacheService = new SwrCacheService();