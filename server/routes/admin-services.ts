import { Router } from "express";
import { db } from "../db";

const router = Router();

// Simple auth middleware - in production this would check session/API keys
const requireAuth = (req: any, res: any, next: any) => {
  // For now, allow all requests in development
  // In production, this would check req.session.userId or API key
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  
  // Check for session-based auth
  if (req.session?.userId) {
    next();
    return;
  }
  
  // Check for API key auth
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  
  res.status(401).json({ error: "Authentication required" });
};

// Service configuration with default intervals
interface ServiceConfig {
  id: string;
  name: string;
  type: 'scraper' | 'sync' | 'metrics' | 'healing' | 'ai' | 'cache';
  description: string;
  interval: number; // minutes
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

// Track service configurations
const serviceConfigs = new Map<string, ServiceConfig>([
  ['database-scraper', {
    id: 'database-scraper',
    name: 'Database Pool Scraper',
    type: 'scraper',
    description: 'Scrapes APY and TVL data for all pools from external APIs',
    interval: 5,
    enabled: true
  }],
  ['holder-sync', {
    id: 'holder-sync',
    name: 'Token Holder Sync',
    type: 'sync',
    description: 'Synchronizes token holder data using Alchemy API',
    interval: 30,
    enabled: true
  }],
  ['comprehensive-holder-sync', {
    id: 'comprehensive-holder-sync',
    name: 'Comprehensive Holder Sync',
    type: 'sync',
    description: 'Complete holder data synchronization for all pools',
    interval: 30,
    enabled: true
  }],
  ['system-monitor', {
    id: 'system-monitor',
    name: 'System Health Monitor',
    type: 'metrics',
    description: 'Monitors system health and API status',
    interval: 2,
    enabled: true
  }],
  ['ai-scheduler', {
    id: 'ai-scheduler',
    name: 'AI Prediction Scheduler',
    type: 'ai',
    description: 'Generates AI market predictions and insights',
    interval: 1440, // 24 hours
    enabled: true
  }],
  ['cache-cleanup', {
    id: 'cache-cleanup',
    name: 'Cache Cleanup Service',
    type: 'cache',
    description: 'Cleans expired cache entries to maintain performance',
    interval: 5,
    enabled: true
  }],
  ['alchemy-health', {
    id: 'alchemy-health',
    name: 'Alchemy API Health Check',
    type: 'metrics',
    description: 'Monitors Alchemy API availability and health',
    interval: 2,
    enabled: true
  }],
  ['defi-llama-sync', {
    id: 'defi-llama-sync',
    name: 'DeFi Llama Sync',
    type: 'sync',
    description: 'Syncs pool data from DeFi Llama API',
    interval: 10,
    enabled: false
  }],
  ['morpho-sync', {
    id: 'morpho-sync',
    name: 'Morpho Data Sync',
    type: 'sync',
    description: 'Syncs Morpho vault data and APY information',
    interval: 5,
    enabled: true
  }],
  ['lido-sync', {
    id: 'lido-sync',
    name: 'Lido Data Sync',
    type: 'sync',
    description: 'Syncs Lido staking data and rewards',
    interval: 5,
    enabled: true
  }],
  ['error-cleanup', {
    id: 'error-cleanup',
    name: 'Error Log Cleanup',
    type: 'healing',
    description: 'Removes old error logs and maintains database health',
    interval: 1440, // 24 hours
    enabled: true
  }],
  ['token-price-sync', {
    id: 'token-price-sync',
    name: 'Token Price Updater',
    type: 'sync',
    description: 'Updates token prices and exchange rates',
    interval: 15,
    enabled: true
  }],
  ['etherscan-scraper', {
    id: 'etherscan-scraper',
    name: 'Etherscan Holder Scraper',
    type: 'scraper',
    description: 'Scrapes token holder counts from Etherscan for accurate holder data',
    interval: 30,
    enabled: true
  }]
]);

// Track service statistics
interface ServiceStats {
  successRate: number;
  totalRuns: number;
  errorCount: number;
  lastError?: string;
  poolsAffected?: number;
}

const serviceStats = new Map<string, ServiceStats>();

// Get all service statuses
router.get("/admin/services/status", requireAuth, async (req, res) => {
  try {
    const services = Array.from(serviceConfigs.values()).map(config => {
      const stats = serviceStats.get(config.id) || {
        successRate: 100,
        totalRuns: 0,
        errorCount: 0
      };

      // Calculate next run based on last run and interval
      let nextRun = null;
      if (config.lastRun && config.enabled) {
        nextRun = new Date(config.lastRun.getTime() + config.interval * 60 * 1000);
      }

      return {
        ...config,
        status: config.enabled ? 'active' : 'disabled',
        lastRun: config.lastRun?.toISOString() || null,
        nextRun: nextRun?.toISOString() || null,
        ...stats
      };
    });

    res.json(services);
  } catch (error) {
    console.error("Error fetching service statuses:", error);
    res.status(500).json({ error: "Failed to fetch service statuses" });
  }
});

// Get service errors
router.get("/admin/services/errors", requireAuth, async (req, res) => {
  try {
    // Mock errors for now - in production, these would come from error logs
    const errors = [
      {
        id: '1',
        serviceId: 'holder-sync',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        errorType: 'API_TIMEOUT',
        errorMessage: 'Alchemy API request timeout after 30 seconds',
        severity: 'medium' as const,
        resolved: true
      }
    ];

    res.json(errors);
  } catch (error) {
    console.error("Error fetching service errors:", error);
    res.status(500).json({ error: "Failed to fetch service errors" });
  }
});

// Update service configuration
router.put("/admin/services/:serviceId/config", requireAuth, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { interval, enabled } = req.body;

    const config = serviceConfigs.get(serviceId);
    if (!config) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update configuration
    config.interval = interval || config.interval;
    config.enabled = enabled !== undefined ? enabled : config.enabled;
    serviceConfigs.set(serviceId, config);

    // Apply configuration changes to running services
    await applyServiceConfiguration(serviceId, config);

    res.json({ success: true, config });
  } catch (error) {
    console.error("Error updating service configuration:", error);
    res.status(500).json({ error: "Failed to update service configuration" });
  }
});

// Trigger manual service run
router.post("/admin/services/:serviceId/trigger", requireAuth, async (req, res) => {
  try {
    const { serviceId } = req.params;

    const config = serviceConfigs.get(serviceId);
    if (!config) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update last run time
    config.lastRun = new Date();
    serviceConfigs.set(serviceId, config);

    // Trigger the service
    await triggerService(serviceId);

    res.json({ success: true, message: `Service ${config.name} triggered successfully` });
  } catch (error) {
    console.error("Error triggering service:", error);
    res.status(500).json({ error: "Failed to trigger service" });
  }
});

// Apply service configuration changes
async function applyServiceConfiguration(serviceId: string, config: ServiceConfig) {
  try {
    console.log(`Applying configuration for ${serviceId}:`, config);
    
    // Here we would update the actual service intervals
    switch(serviceId) {
      case 'ai-scheduler':
        const { aiScheduler } = await import("../services/aiSchedulerService");
        await aiScheduler.updateConfig({
          enabled: config.enabled,
          intervalHours: config.interval / 60
        });
        break;
      
      case 'comprehensive-holder-sync':
        const { comprehensiveHolderSyncService } = await import("../services/comprehensiveHolderSyncService");
        if (config.enabled) {
          comprehensiveHolderSyncService.startService(config.interval);
        } else {
          comprehensiveHolderSyncService.stopService();
        }
        break;
        
      // Add more services as needed
    }
  } catch (error) {
    console.error(`Error applying configuration for ${serviceId}:`, error);
  }
}

// Trigger a service manually
async function triggerService(serviceId: string) {
  try {
    console.log(`Manually triggering service: ${serviceId}`);
    
    switch(serviceId) {
      case 'database-scraper':
        const { scraperManager } = await import("../scrapers/scraper-manager");
        await scraperManager.scrapeAllPools();
        break;
        
      case 'holder-sync':
      case 'comprehensive-holder-sync':
        const { comprehensiveHolderSyncService } = await import("../services/comprehensiveHolderSyncService");
        await comprehensiveHolderSyncService.syncAllPools();
        break;
        
      case 'ai-scheduler':
        const { aiScheduler } = await import("../services/aiSchedulerService");
        await aiScheduler.generateAllInsights();
        break;
        
      // Add more services as needed
      default:
        console.log(`Service ${serviceId} triggered (simulation)`);
    }
  } catch (error) {
    console.error(`Error triggering service ${serviceId}:`, error);
    throw error;
  }
}

export default router;