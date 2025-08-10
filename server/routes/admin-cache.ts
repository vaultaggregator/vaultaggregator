import type { Express } from "express";
import { cacheService } from "../services/cacheService";

export function registerAdminCacheRoutes(app: Express) {
  // Middleware to check if user is authenticated admin
  const requireAuth = (req: any, res: any, next: any) => {
    // During development, bypass authentication for easier testing
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Bypassing authentication");
      next();
      return;
    }
    
    if (req.session?.userId) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  };

  /**
   * Get comprehensive cache statistics
   */
  app.get("/api/admin/cache/stats", requireAuth, async (req, res) => {
    try {
      const stats = cacheService.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res.status(500).json({ error: "Failed to fetch cache statistics" });
    }
  });

  /**
   * Get all cache entries with metadata
   */
  app.get("/api/admin/cache/entries", requireAuth, async (req, res) => {
    try {
      const { source, limit = '100', offset = '0' } = req.query;
      
      let entries = cacheService.getAllEntries();
      
      // Filter by source if specified
      if (source && source !== 'all') {
        entries = entries.filter(entry => entry.source === source);
      }
      
      // Apply pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedEntries = entries.slice(offsetNum, offsetNum + limitNum);
      
      res.json({
        entries: paginatedEntries,
        total: entries.length,
        hasMore: offsetNum + limitNum < entries.length
      });
    } catch (error) {
      console.error("Error fetching cache entries:", error);
      res.status(500).json({ error: "Failed to fetch cache entries" });
    }
  });

  /**
   * Get cache entries grouped by source
   */
  app.get("/api/admin/cache/sources", requireAuth, async (req, res) => {
    try {
      const grouped = cacheService.getEntriesBySource();
      
      // Transform to include summary statistics for each source
      const sources = Object.keys(grouped).map(source => {
        const entries = grouped[source];
        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
        const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
        const avgAge = entries.length > 0 ? 
          (Date.now() - entries.reduce((sum, entry) => sum + entry.timestamp, 0) / entries.length) : 0;

        return {
          source,
          count: entries.length,
          totalSize,
          totalHits,
          averageAge: avgAge,
          entries: entries.slice(0, 5) // Only return first 5 entries for preview
        };
      });

      res.json(sources);
    } catch (error) {
      console.error("Error fetching cache sources:", error);
      res.status(500).json({ error: "Failed to fetch cache sources" });
    }
  });

  /**
   * Clear entire cache
   */
  app.delete("/api/admin/cache/clear", requireAuth, async (req, res) => {
    try {
      cacheService.clear();
      res.json({ success: true, message: "Cache cleared successfully" });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  /**
   * Clear cache by source
   */
  app.delete("/api/admin/cache/clear/:source", requireAuth, async (req, res) => {
    try {
      const { source } = req.params;
      const count = cacheService.clearBySource(source);
      res.json({ 
        success: true, 
        message: `Cleared ${count} entries from ${source}`,
        clearedCount: count
      });
    } catch (error) {
      console.error("Error clearing cache by source:", error);
      res.status(500).json({ error: "Failed to clear cache by source" });
    }
  });

  /**
   * Delete specific cache entry
   */
  app.delete("/api/admin/cache/entry/:key", requireAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const deleted = cacheService.delete(decodeURIComponent(key));
      
      if (deleted) {
        res.json({ success: true, message: "Cache entry deleted successfully" });
      } else {
        res.status(404).json({ error: "Cache entry not found" });
      }
    } catch (error) {
      console.error("Error deleting cache entry:", error);
      res.status(500).json({ error: "Failed to delete cache entry" });
    }
  });

  /**
   * Get specific cache entry details
   */
  app.get("/api/admin/cache/entry/:key", requireAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const entry = cacheService.getEntry(decodeURIComponent(key));
      
      if (entry) {
        const now = Date.now();
        const timeToExpire = entry.ttl - (now - entry.timestamp);
        
        res.json({
          ...entry,
          timeToExpire: Math.max(0, timeToExpire),
          expired: timeToExpire <= 0,
          ageInMinutes: Math.round((now - entry.timestamp) / 60000),
          sizeFormatted: formatBytes(entry.size)
        });
      } else {
        res.status(404).json({ error: "Cache entry not found" });
      }
    } catch (error) {
      console.error("Error fetching cache entry:", error);
      res.status(500).json({ error: "Failed to fetch cache entry" });
    }
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}