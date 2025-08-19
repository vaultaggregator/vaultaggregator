import type { Express } from "express";
import { systemMonitor } from "../services/systemMonitorService";

export function registerAdminSystemRoutes(app: Express) {
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
   * Fix operating days for Morpho pools
   */
  app.post("/api/admin/fix-operating-days", requireAuth, async (req, res) => {
    try {
      const { etherscanService } = await import("../services/etherscanService");
      const { db } = await import("../db");
      const { pools, platforms } = await import("../../shared/schema");
      const { eq, and, isNotNull } = await import("drizzle-orm");
      
      // Get all Morpho pools that don't have operating days
      const morphoPools = await db.select()
        .from(pools)
        .leftJoin(platforms, eq(pools.platformId, platforms.id))
        .where(and(
          eq(platforms.name, 'morpho'),
          isNotNull(pools.poolAddress)
        ));

      let fixedCount = 0;
      
      for (const poolData of morphoPools) {
        const pool = poolData.pools;
        const currentRawData = pool.rawData || {};
        
        // Skip if already has operating days
        if (currentRawData.count) continue;
        
        console.log(`🔄 Fixing operating days for ${pool.tokenPair} (${pool.poolAddress})`);
        
        try {
          // Add delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const operatingDays = await etherscanService.getContractOperatingDays(pool.poolAddress);
          
          if (operatingDays && operatingDays > 0) {
            const updatedRawData = {
              ...currentRawData,
              count: operatingDays,
              operatingDays: operatingDays
            };
            
            await db.update(pools)
              .set({ 
                rawData: updatedRawData,
                lastUpdated: new Date()
              })
              .where(eq(pools.id, pool.id));
              
            console.log(`✅ Fixed ${pool.tokenPair}: ${operatingDays} days`);
            fixedCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to fix ${pool.tokenPair}:`, error);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Fixed operating days for ${fixedCount} Morpho pools`,
        fixedCount
      });
    } catch (error) {
      console.error("Error fixing operating days:", error);
      res.status(500).json({ error: "Failed to fix operating days" });
    }
  });

  /**
   * Get comprehensive system health status
   */
  app.get("/api/admin/system/health", requireAuth, async (req, res) => {
    try {
      const health = await systemMonitor.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error("Error fetching system health:", error);
      res.status(500).json({ error: "Failed to fetch system health" });
    }
  });

  /**
   * Get system uptime in human readable format
   */
  app.get("/api/admin/system/uptime", requireAuth, async (req, res) => {
    try {
      const uptime = systemMonitor.getUptimeString();
      const uptimeMs = Date.now() - (Date.now() - process.uptime() * 1000);
      
      res.json({
        uptime,
        uptimeMs,
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
      });
    } catch (error) {
      console.error("Error fetching system uptime:", error);
      res.status(500).json({ error: "Failed to fetch system uptime" });
    }
  });

  /**
   * Get detailed memory usage information
   */
  app.get("/api/admin/system/memory", requireAuth, async (req, res) => {
    try {
      const memUsage = process.memoryUsage();
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      res.json({
        raw: memUsage,
        formatted: {
          heapUsed: formatBytes(memUsage.heapUsed),
          heapTotal: formatBytes(memUsage.heapTotal),
          external: formatBytes(memUsage.external),
          rss: formatBytes(memUsage.rss)
        },
        percentages: {
          heapUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
          rssPct: Math.round((memUsage.rss / (memUsage.rss + memUsage.external)) * 100)
        }
      });
    } catch (error) {
      console.error("Error fetching memory usage:", error);
      res.status(500).json({ error: "Failed to fetch memory usage" });
    }
  });

  /**
   * Get environment and configuration information
   */
  app.get("/api/admin/system/environment", requireAuth, async (req, res) => {
    try {
      const env = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        environment: process.env.NODE_ENV || 'development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cpuCount: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem(),
        loadAverage: require('os').loadavg(),
        hostname: require('os').hostname(),
        uptime: require('os').uptime()
      };

      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      res.json({
        ...env,
        totalMemoryFormatted: formatBytes(env.totalMemory),
        freeMemoryFormatted: formatBytes(env.freeMemory),
        memoryUsagePercent: Math.round(((env.totalMemory - env.freeMemory) / env.totalMemory) * 100)
      });
    } catch (error) {
      console.error("Error fetching environment info:", error);
      res.status(500).json({ error: "Failed to fetch environment information" });
    }
  });

  /**
   * Get API endpoints status
   */
  app.get("/api/admin/system/apis", requireAuth, async (req, res) => {
    try {
      const health = await systemMonitor.getSystemHealth();
      
      res.json({
        etherscan: health.apiHealth.etherscan,
        defiLlama: health.apiHealth.defiLlama,
        database: health.apiHealth.database,
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching API status:", error);
      res.status(500).json({ error: "Failed to fetch API status" });
    }
  });

  /**
   * Get scheduled jobs status
   */
  app.get("/api/admin/system/jobs", requireAuth, async (req, res) => {
    try {
      const health = await systemMonitor.getSystemHealth();
      
      res.json({
        jobs: health.scheduledJobs,
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching jobs status:", error);
      res.status(500).json({ error: "Failed to fetch jobs status" });
    }
  });

  /**
   * Force a system health check
   */
  app.post("/api/admin/system/check", requireAuth, async (req, res) => {
    try {
      // This will trigger all health checks
      const health = await systemMonitor.getSystemHealth();
      
      res.json({
        success: true,
        message: "System health check completed",
        timestamp: new Date().toISOString(),
        overall: health.overall,
        checksCompleted: health.checks.length
      });
    } catch (error) {
      console.error("Error running system check:", error);
      res.status(500).json({ error: "Failed to run system health check" });
    }
  });

  /**
   * Get system performance metrics
   */
  app.get("/api/admin/system/performance", requireAuth, async (req, res) => {
    try {
      const health = await systemMonitor.getSystemHealth();
      const startTime = process.hrtime();
      
      // Simulate a small workload to measure performance
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += Math.random();
      }
      
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

      res.json({
        cpuMetrics: {
          executionTime: Math.round(executionTime * 100) / 100,
          loadAverage: require('os').loadavg()
        },
        memoryMetrics: health.memoryUsage,
        cacheMetrics: health.cachePerformance,
        errorRates: health.errorRates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });
}