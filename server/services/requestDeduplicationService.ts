/**
 * Global Request Deduplication Service
 * Prevents duplicate API requests across the entire application
 */

export interface RequestCacheEntry<T = any> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

export class RequestDeduplicationService {
  private static instance: RequestDeduplicationService;
  private cache = new Map<string, RequestCacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  // Cache durations by request type
  private readonly CACHE_DURATIONS = {
    'alchemy_metadata': 24 * 60 * 60 * 1000, // 24 hours
    'alchemy_price': 5 * 60 * 1000, // 5 minutes  
    'alchemy_balance': 1 * 60 * 1000, // 1 minute
    'alchemy_health': 30 * 1000, // 30 seconds

    'token_info': 60 * 60 * 1000, // 1 hour
    'default': 5 * 60 * 1000 // 5 minutes default
  };

  private constructor() {}

  static getInstance(): RequestDeduplicationService {
    if (!RequestDeduplicationService.instance) {
      RequestDeduplicationService.instance = new RequestDeduplicationService();
    }
    return RequestDeduplicationService.instance;
  }

  /**
   * Get cached data or execute function with deduplication
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    cacheType: keyof typeof this.CACHE_DURATIONS = 'default'
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      const maxAge = this.CACHE_DURATIONS[cacheType];
      const age = Date.now() - cached.timestamp;
      
      if (age < maxAge) {
        console.log(`✅ Cache hit for ${key} (${Math.round(age / 1000)}s old)`);
        return cached.data;
      }
    }

    // Check if there's already a pending request
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      console.log(`🔄 Waiting for pending request: ${key}`);
      return await pendingRequest;
    }

    // Execute function and cache result
    console.log(`🔍 Executing fresh request: ${key}`);
    const promise = fn();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      
      // Cache the result
      this.cache.set(key, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      // If we have stale cache data, use it as fallback
      if (cached) {
        console.log(`⚠️ Using stale cache for ${key} due to error:`, error);
        return cached.data;
      }
      throw error;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    let cleared = 0;
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      // Determine cache type from key prefix
      const cacheType = Object.keys(this.CACHE_DURATIONS).find(type => 
        key.startsWith(type)
      ) as keyof typeof this.CACHE_DURATIONS || 'default';
      
      const maxAge = this.CACHE_DURATIONS[cacheType];
      const age = now - entry.timestamp;
      
      if (age > maxAge) {
        this.cache.delete(key);
        cleared++;
      }
    });

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats: Record<string, { count: number; totalAge: number }> = {};
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      const cacheType = Object.keys(this.CACHE_DURATIONS).find(type => 
        key.startsWith(type)
      ) || 'other';
      
      if (!stats[cacheType]) {
        stats[cacheType] = { count: 0, totalAge: 0 };
      }
      
      stats[cacheType].count++;
      stats[cacheType].totalAge += (now - entry.timestamp);
    });

    // Calculate average ages
    Object.keys(stats).forEach(type => {
      if (stats[type].count > 0) {
        stats[type].totalAge = Math.round(stats[type].totalAge / stats[type].count / 1000); // Convert to seconds
      }
    });

    return {
      totalEntries: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      byType: stats
    };
  }

  /**
   * Force clear all cache
   */
  clearAllCache(): void {
    const cleared = this.cache.size;
    this.cache.clear();
    this.pendingRequests.clear();
    console.log(`🗑️ Cleared all cache: ${cleared} entries`);
  }
}

// Export singleton instance
export const requestDeduplicationService = RequestDeduplicationService.getInstance();