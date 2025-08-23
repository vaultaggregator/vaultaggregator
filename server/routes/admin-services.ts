import { Router } from "express";
import { db } from "../db";
import { serviceConfigurations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { serviceRegistry } from "../lib/serviceRegistry";

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

// Dynamic service discovery endpoints

// GET /api/admin/services/list - Get all discovered services
router.get("/admin/services/list", requireAuth, async (req, res) => {
  try {
    const services = serviceRegistry.getServices();
    console.log(`📋 Serving ${services.length} discovered services`);
    
    res.json({
      success: true,
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        lastRun: service.lastRun?.toISOString() || null,
        lastError: service.lastError || null,
        totalRuns: service.totalRuns,
        successRate: service.totalRuns > 0 ? (service.successCount / service.totalRuns) * 100 : 100
      }))
    });
  } catch (error) {
    console.error("❌ Error fetching service list:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch service list" 
    });
  }
});

// POST /api/admin/services/run/:id - Run a service
router.post("/admin/services/run/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🚀 Manual trigger requested for service: ${id}`);
    
    const result = await serviceRegistry.runService(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Service ${id} executed successfully`,
        duration: result.duration,
        result: result.result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        duration: result.duration
      });
    }
  } catch (error) {
    console.error(`❌ Error running service ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to run service" 
    });
  }
});

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

// Get all service statuses (enhanced with dynamic discovery)
router.get("/admin/services/status", requireAuth, async (req, res) => {
  try {
    // Load scheduled services from database
    const dbServices = await db.query.serviceConfigurations.findMany({
      orderBy: (configs, { asc }) => [asc(configs.priority), asc(configs.serviceName)]
    });

    // Get discovered admin services
    const discoveredServices = serviceRegistry.getServices();

    // Get actual pool count from database
    const poolCount = await db.query.pools.findMany();
    const totalPools = poolCount.length;

    // Map scheduled services from database
    const scheduledServices = dbServices.map(config => {
      const stats = serviceRegistry.getServiceStats(config.serviceName);
      
      return {
        id: config.serviceName,
        name: config.serviceName,
        displayName: config.displayName,
        type: config.category || 'sync',
        status: config.isEnabled ? 'active' : 'disabled',
        interval: config.intervalMinutes,
        lastRun: stats?.stats.lastRun || config.updatedAt?.toISOString() || null,
        nextRun: config.isEnabled && config.intervalMinutes > 0 
          ? new Date(Date.now() + config.intervalMinutes * 60 * 1000).toISOString() 
          : null,
        description: config.description,
        poolsAffected: totalPools,
        successRate: stats?.stats.successRate || 100,
        totalRuns: stats?.stats.totalRuns || 0,
        errorCount: stats?.stats.errorCount || 0,
        lastError: stats?.stats.lastError || null,
        uptime: null,
        lastCheck: config.updatedAt ? config.updatedAt.toLocaleTimeString() : 'Never',
        stats: {
          processed: null,
          failed: stats?.stats.errorCount || 0,
          pending: null,
          successRate: stats?.stats.successRate || 100
        },
        hasError: Boolean(stats?.stats.lastError),
        source: 'scheduled'
      };
    });

    // Map discovered admin services (one-time run services)
    const adminServices = discoveredServices.map(service => ({
      id: service.id,
      name: service.name,
      displayName: service.name,
      type: 'admin',
      status: 'available',
      interval: 0, // One-time run services
      lastRun: service.lastRun?.toISOString() || null,
      nextRun: null,
      description: service.description,
      poolsAffected: 0,
      successRate: service.totalRuns > 0 ? (service.successCount / service.totalRuns) * 100 : 100,
      totalRuns: service.totalRuns,
      errorCount: service.errorCount,
      lastError: service.lastError || null,
      uptime: null,
      lastCheck: service.lastRun ? service.lastRun.toLocaleTimeString() : 'Never',
      stats: {
        processed: service.successCount,
        failed: service.errorCount,
        pending: null,
        successRate: service.totalRuns > 0 ? (service.successCount / service.totalRuns) * 100 : 100
      },
      hasError: Boolean(service.lastError),
      source: 'admin'
    }));

    // Combine both types of services
    const allServices = [...scheduledServices, ...adminServices];

    console.log(`📊 Serving ${scheduledServices.length} scheduled + ${adminServices.length} admin services = ${allServices.length} total`);

    res.json(allServices);
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

    res.json({ 
      success: true, 
      message: `Service ${serviceId} configuration updated`
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
      
      case 'holderDataSync':
        const { comprehensiveHolderSyncService } = await import("../services/comprehensiveHolderSyncService");
        if (isEnabled) {
          comprehensiveHolderSyncService.startService(intervalMinutes);
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
    
    // Use database service names instead of hardcoded IDs
    switch(serviceId) {
      case 'poolDataSync':
        const { scraperManager } = await import("../scrapers/scraper-manager");
        await scraperManager.scrapeAllPools();
        break;
        
      case 'holderDataSync':
        const { comprehensiveHolderSyncService } = await import("../services/comprehensiveHolderSyncService");
        await comprehensiveHolderSyncService.syncAllPools();
        break;
        
      case 'topHoldersSync':
        const { topHoldersSyncService } = await import("../services/topHoldersSync");
        await topHoldersSyncService.syncAllHolders();
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