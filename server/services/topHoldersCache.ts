import fs from 'fs/promises';
import path from 'path';
import { topHoldersSync } from './topHoldersSync';

interface CacheEntry {
  data: any;
  updatedAt: number;
  isStale: boolean;
}

interface CacheConfig {
  staleTTL: number; // 1 hour
  hardTTL: number; // 24 hours
}

export class TopHoldersCacheService {
  private static readonly config: CacheConfig = {
    staleTTL: 60 * 60 * 1000, // 1 hour
    hardTTL: 24 * 60 * 60 * 1000, // 24 hours
  };

  private static readonly runningBuilds = new Set<string>();

  private static getCacheKey(chain: string, vaultTokenAddress: string): string {
    return `topHolders:${chain}:${vaultTokenAddress}`;
  }

  private static getSnapshotPath(chain: string, poolId: string): string {
    return path.join(process.cwd(), 'data', 'snapshots', 'top-holders', chain, `${poolId}.json`);
  }

  private static async loadSnapshot(chain: string, poolId: string): Promise<any | null> {
    try {
      const snapshotPath = this.getSnapshotPath(chain, poolId);
      const content = await fs.readFile(snapshotPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private static isStale(updatedAt: number): boolean {
    return Date.now() - updatedAt > this.config.staleTTL;
  }

  private static isExpired(updatedAt: number): boolean {
    return Date.now() - updatedAt > this.config.hardTTL;
  }

  public static async get(
    chain: string,
    poolId: string,
    vaultTokenAddress: string,
    ensureFresh: boolean = false
  ): Promise<{ data: any; isStale: boolean } | null> {
    const cacheKey = this.getCacheKey(chain, vaultTokenAddress);
    
    try {
      // Load snapshot from disk
      const snapshot = await this.loadSnapshot(chain, poolId);
      
      if (!snapshot) {
        // No data exists, trigger background build if not already running
        if (!this.runningBuilds.has(cacheKey)) {
          this.triggerBackgroundBuild(cacheKey, poolId);
        }
        return null;
      }

      const updatedAt = new Date(snapshot.updatedAt).getTime();
      
      // Check if data is expired (hard TTL)
      if (this.isExpired(updatedAt)) {
        console.log(`🗑️ Data expired for ${cacheKey}, rebuilding...`);
        if (!this.runningBuilds.has(cacheKey)) {
          this.triggerBackgroundBuild(cacheKey, poolId);
        }
        return null;
      }

      const isStale = this.isStale(updatedAt);
      
      // If data is stale or ensureFresh is requested, trigger background refresh
      if ((isStale || ensureFresh) && !this.runningBuilds.has(cacheKey)) {
        console.log(`🔄 Triggering background refresh for ${cacheKey}`);
        this.triggerBackgroundBuild(cacheKey, poolId);
      }

      return {
        data: snapshot,
        isStale
      };
    } catch (error) {
      console.error(`❌ Error reading cache for ${cacheKey}:`, error);
      return null;
    }
  }

  private static async triggerBackgroundBuild(cacheKey: string, poolId: string): Promise<void> {
    if (this.runningBuilds.has(cacheKey)) {
      console.log(`⏳ Build already running for ${cacheKey}`);
      return;
    }

    this.runningBuilds.add(cacheKey);
    console.log(`🚀 Starting background build for ${cacheKey}`);

    try {
      await topHoldersSync.syncTopHolders(poolId);
      console.log(`✅ Background build completed for ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Background build failed for ${cacheKey}:`, error);
    } finally {
      this.runningBuilds.delete(cacheKey);
    }
  }

  public static async invalidate(chain: string, poolId: string, vaultTokenAddress: string): Promise<void> {
    const cacheKey = this.getCacheKey(chain, vaultTokenAddress);
    
    try {
      console.log(`🔄 Invalidating cache for ${cacheKey}`);
      await topHoldersSync.syncTopHolders(poolId);
      console.log(`✅ Cache invalidated and rebuilt for ${cacheKey}`);
    } catch (error) {
      console.error(`❌ Failed to invalidate cache for ${cacheKey}:`, error);
      throw error;
    }
  }

  public static isBuilding(chain: string, vaultTokenAddress: string): boolean {
    const cacheKey = this.getCacheKey(chain, vaultTokenAddress);
    return this.runningBuilds.has(cacheKey);
  }

  public static async getMetrics(): Promise<{ 
    runningBuilds: number;
    buildQueue: string[];
  }> {
    return {
      runningBuilds: this.runningBuilds.size,
      buildQueue: Array.from(this.runningBuilds)
    };
  }
}

export const topHoldersCache = TopHoldersCacheService;