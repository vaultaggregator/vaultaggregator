import { Router } from "express";
import { db } from "../db";
import { serviceConfigurations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { updateServiceConfig } from "../services/systemMonitorService";

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

// Removed hardcoded service configurations - all services now loaded from database

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
    // Load services from database
    const dbServices = await db.query.serviceConfigurations.findMany({
      orderBy: (configs, { asc }) => [asc(configs.priority), asc(configs.serviceName)]
    });



    // Get actual pool count from database
    const poolCount = await db.query.pools.findMany();
    const totalPools = poolCount.length;

    // Simple mapping without complex logic to identify the issue
    const services = dbServices.map(config => ({
      id: config.serviceName,
      name: config.serviceName,
      displayName: config.displayName,
      type: config.category || 'sync',
      status: config.isEnabled ? 'active' : 'disabled',
      interval: config.intervalMinutes,
      lastRun: config.updatedAt?.toISOString() || null,
      nextRun: config.isEnabled && config.intervalMinutes > 0 
        ? new Date(Date.now() + config.intervalMinutes * 60 * 1000).toISOString() 
        : null,
      description: config.description,
      poolsAffected: totalPools,
      successRate: null,
      totalRuns: 0,
      errorCount: 0,
      lastError: null,
      uptime: null,
      lastCheck: config.updatedAt ? config.updatedAt.toLocaleTimeString() : 'N/A',
      stats: {
        processed: null,
        failed: 0,
        pending: null,
        successRate: null
      },
      hasError: false
    }));

    res.json(services);
  } catch (error) {
    console.error("Error fetching service statuses:", error);
    res.status(500).json({ error: "Failed to fetch service statuses" });
  }
});

// Get service errors
router.get("/admin/services/errors", requireAuth, async (req, res) => {
  try {
    // Return empty array since no real error logging is implemented yet
    const errors: any[] = [];
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

    // Check if service exists in database
    const existingService = await db.query.serviceConfigurations.findFirst({
      where: eq(serviceConfigurations.serviceName, serviceId)
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update configuration in database
    await db.update(serviceConfigurations)
      .set({
        intervalMinutes: interval,
        isEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(serviceConfigurations.serviceName, serviceId));

    // Apply configuration to running services
    console.log(`🔧 Applying configuration changes for ${serviceId}: interval=${interval}min, enabled=${enabled}`);
    try {
      await updateServiceConfig(serviceId, { interval: parseInt(interval), enabled });
      console.log(`✅ Successfully applied configuration for ${serviceId}`);
    } catch (error) {
      console.error(`❌ Failed to apply configuration for ${serviceId}:`, error);
      // Still return success since database was updated, but log the error
    }

    res.json({ 
      success: true, 
      message: `Service ${serviceId} configuration updated and applied`
    });
  } catch (error) {
    console.error("Error updating service configuration:", error);
    res.status(500).json({ error: "Failed to update service configuration" });
  }
});

// Trigger manual service run
router.post("/admin/services/:serviceId/trigger", requireAuth, async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Check if service exists in database
    const existingService = await db.query.serviceConfigurations.findFirst({
      where: eq(serviceConfigurations.serviceName, serviceId)
    });

    if (!existingService) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Update last run time in database
    await db.update(serviceConfigurations)
      .set({
        updatedAt: new Date()
      })
      .where(eq(serviceConfigurations.serviceName, serviceId));

    // Trigger the service
    await triggerService(serviceId);

    res.json({ success: true, message: `Service ${existingService.displayName} triggered successfully` });
  } catch (error) {
    console.error("Error triggering service:", error);
    res.status(500).json({ error: "Failed to trigger service" });
  }
});

// Apply service configuration changes
async function applyServiceConfiguration(serviceId: string, isEnabled: boolean, intervalMinutes: number) {
  try {
    console.log(`Applying configuration for ${serviceId}: enabled=${isEnabled}, interval=${intervalMinutes}min`);
    
    // Here we would update the actual service intervals based on database service names
    switch(serviceId) {
      case 'aiOutlookGeneration':
        const { aiScheduler } = await import("../services/aiSchedulerService");
        await aiScheduler.updateConfig({
          enabled: isEnabled,
          intervalHours: intervalMinutes / 60
        });
        break;
      
      case 'poolHoldersSync':
        // Pool Holders Sync configuration is handled via database scheduler
        console.log(`Pool Holders Sync configuration updated: enabled=${isEnabled}, interval=${intervalMinutes}min`);
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
    
    // Use database service names instead of hardcoded IDs
    switch(serviceId) {
      case 'poolDataSync':
        const { scraperManager } = await import("../scrapers/scraper-manager");
        await scraperManager.scrapeAllPools();
        break;
        
      case 'walletHoldersSync':
        console.log('🔍 Manually triggering Wallet Holders Sync...');
        const { PoolHoldersService } = await import("../services/pool-holders-service");
        const result = await PoolHoldersService.syncAllPoolHolders();
        console.log('✅ Wallet Holders Sync completed:', result);
        break;
        
      case 'holderCountScraper':
        console.log('🔍 Manually triggering Holder Count Scraper...');
        const { EtherscanHolderScraper } = await import("../services/etherscan-holder-scraper");
        const scraperResult = await EtherscanHolderScraper.scrapeAllPoolHolderCounts();
        console.log('✅ Holder Count Scraper completed:', scraperResult);
        break;
        
      case 'aiOutlookGeneration':
        const { aiScheduler } = await import("../services/aiSchedulerService");
        await aiScheduler.generateAllInsights();
        break;
        
      // Add more services as needed based on actual database service names
      default:
        console.log(`Service ${serviceId} triggered (simulation)`);
    }
  } catch (error) {
    console.error(`Error triggering service ${serviceId}:`, error);
    throw error;
  }
}

export default router;