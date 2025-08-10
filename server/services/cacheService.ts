import { performance } from 'perf_hooks';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
  source: string; // Which service/API this came from
  size: number; // Approximate size in bytes
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  totalMemoryUsage: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry: number;
  newestEntry: number;
}

export class IntelligentCacheService {
  private cache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    cleanups: 0
  };

  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Maximum number of entries
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start automatic cleanup
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    console.log('Intelligent Cache Service initialized with 10-minute TTL');
  }

  /**
   * Store data in cache with intelligent categorization
   */
  set<T>(key: string, data: T, source: string, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl || this.DEFAULT_TTL;
    const size = this.estimateSize(data);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check cache size limit
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl,
      key,
      source,
      size,
      hits: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.stats.sets++;

    console.log(`Cached: ${key} (${source}) - Size: ${this.formatBytes(size)} - TTL: ${Math.round(ttl/1000/60)}min`);
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.deletes++;
      return false;
    }

    return true;
  }

  /**
   * Get cache entry with metadata
   */
  getEntry(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.deletes++;
      return null;
    }

    return entry;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.deletes += count;
    console.log(`Cache cleared: ${count} entries removed`);
  }

  /**
   * Clear cache entries by source
   */
  clearBySource(source: string): number {
    let count = 0;
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.source === source) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.deletes += count;
    console.log(`Cache cleared for ${source}: ${count} entries removed`);
    return count;
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats & typeof this.stats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const totalMemoryUsage = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      totalMemoryUsage,
      hitRate,
      missRate: 100 - hitRate,
      totalHits,
      totalMisses: this.stats.misses,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
      ...this.stats
    };
  }

  /**
   * Get all cache entries for admin interface
   */
  getAllEntries(): Array<CacheEntry & { timeToExpire: number; expired: boolean }> {
    const now = Date.now();
    const entries: Array<CacheEntry & { timeToExpire: number; expired: boolean }> = [];
    const values = Array.from(this.cache.values());

    for (const entry of values) {
      const timeToExpire = entry.ttl - (now - entry.timestamp);
      const expired = timeToExpire <= 0;

      entries.push({
        ...entry,
        timeToExpire: Math.max(0, timeToExpire),
        expired
      });
    }

    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get cache entries grouped by source
   */
  getEntriesBySource(): Record<string, Array<CacheEntry>> {
    const grouped: Record<string, Array<CacheEntry>> = {};
    const values = Array.from(this.cache.values());

    for (const entry of values) {
      if (!grouped[entry.source]) {
        grouped[entry.source] = [];
      }
      grouped[entry.source].push(entry);
    }

    return grouped;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    const entries = Array.from(this.cache.entries());

    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.cleanups++;
      this.stats.deletes += cleaned;
      console.log(`Cache cleanup: ${cleaned} expired entries removed`);
    }
  }

  /**
   * Evict oldest entry when cache is full
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    const entries = Array.from(this.cache.entries());

    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.deletes++;
      console.log(`Cache evicted oldest entry: ${oldestKey}`);
    }
  }

  /**
   * Estimate memory size of data
   */
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate cache keys for different data types
   */
  static generateKey(type: string, ...params: string[]): string {
    return `${type}:${params.join(':')}`;
  }
}

// Singleton instance
export const cacheService = new IntelligentCacheService();