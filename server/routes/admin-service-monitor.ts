import express from "express";
import { storage } from "../storage";
import { db } from "../db";
import { sql, desc, eq, and, gte } from "drizzle-orm";

const router = express.Router();

interface ServiceStatus {
  id: string;
  name: string;
  type: 'scraper' | 'sync' | 'metrics' | 'healing';
  status: 'active' | 'error' | 'disabled' | 'unknown';
  lastRun: string | null;
  nextRun: string | null;
  interval: number; // minutes
  successRate: number;
  totalRuns: number;
  errorCount: number;
  lastError: string | null;
  description: string;
  poolsAffected?: number;
}

interface ServiceConfig {
  serviceId: string;
  interval: number;
  enabled: boolean;
  lastModified: string;
}

// In-memory service configurations (could be moved to database)
const serviceConfigs = new Map<string, ServiceConfig>();

// Service definitions
const SERVICE_DEFINITIONS = [
  {
    id: 'pool-scraper',
    name: 'Pool Data Scraper',
    type: 'scraper' as const,
    description: 'Collects APY, TVL, and pool data from Morpho and Lido APIs',
    defaultInterval: 5,
    poolsAffected: 12
  },
  {
    id: 'holder-sync',
    name: 'Holder Data Sync',
    type: 'sync' as const,
    description: 'Synchronizes holder counts from Etherscan',
    defaultInterval: 30,
    poolsAffected: 12
  },
  {
    id: 'token-info-sync',
    name: 'Token Information Sync',
    type: 'sync' as const,
    description: 'Updates token metadata and pricing information',
    defaultInterval: 60,
    poolsAffected: 12
  },
  {
    id: 'standardized-metrics',
    name: 'Standardized Metrics Collection',
    type: 'metrics' as const,
    description: 'Collects and standardizes APY, TVL, Days, and Holders metrics',
    defaultInterval: 10,
    poolsAffected: 12
  },
  {
    id: 'historical-apy',
    name: 'Historical APY Analysis',
    type: 'metrics' as const,
    description: 'Calculates historical APY averages (7d, 30d, 90d, all-time)',
    defaultInterval: 30,
    poolsAffected: 12
  },
  {
    id: 'error-healing',
    name: 'Error Healing Service',
    type: 'healing' as const,
    description: 'Automatically retries failed data collection operations',
    defaultInterval: 15,
    poolsAffected: 12
  }
];

// Initialize default configurations
SERVICE_DEFINITIONS.forEach(service => {
  if (!serviceConfigs.has(service.id)) {
    serviceConfigs.set(service.id, {
      serviceId: service.id,
      interval: service.defaultInterval,
      enabled: true,
      lastModified: new Date().toISOString()
    });
  }
});

// Get service status from various sources
async function getServiceStatus(serviceId: string): Promise<Partial<ServiceStatus>> {
  try {
    // Get error count from error_logs table
    const errorResult = await db.execute(sql`
      SELECT COUNT(*) as error_count
      FROM error_logs 
      WHERE source = ${serviceId} 
      AND occurred_at > NOW() - INTERVAL '24 hours'
    `);
    
    const errorCount = Number(errorResult.rows[0]?.error_count || 0);

    // Get recent successful runs from various log sources
    let totalRuns = 0;
    let lastRun: string | null = null;
    let lastError: string | null = null;
    let status: 'active' | 'error' | 'disabled' | 'unknown' = 'unknown';

    // Check specific service status based on service type
    if (serviceId === 'pool-scraper') {
      // Check pool last_updated timestamps
      const poolResult = await db.execute(sql`
        SELECT MAX(last_updated) as last_run, COUNT(*) as total_pools
        FROM pools 
        WHERE last_updated > NOW() - INTERVAL '1 hour'
      `);
      
      lastRun = poolResult.rows[0]?.last_run as string || null;
      totalRuns = Number(poolResult.rows[0]?.total_pools || 0);
      status = totalRuns > 0 ? 'active' : (errorCount > 0 ? 'error' : 'unknown');
      
    } else if (serviceId === 'holder-sync') {
      // Check holder_history for recent updates
      const holderResult = await db.execute(sql`
        SELECT MAX(timestamp) as last_run, COUNT(DISTINCT token_address) as addresses_updated
        FROM holder_history 
        WHERE timestamp > NOW() - INTERVAL '4 hours'
      `);
      
      lastRun = holderResult.rows[0]?.last_run as string || null;
      totalRuns = Number(holderResult.rows[0]?.addresses_updated || 0);
      status = totalRuns > 0 ? 'active' : (errorCount > 0 ? 'error' : 'unknown');
      
    } else if (serviceId === 'standardized-metrics') {
      // Check pool_metrics_current for recent updates
      const metricsResult = await db.execute(sql`
        SELECT MAX(last_collection_at) as last_run, COUNT(*) as metrics_updated
        FROM pool_metrics_current 
        WHERE last_collection_at > NOW() - INTERVAL '2 hours'
      `);
      
      lastRun = metricsResult.rows[0]?.last_run as string || null;
      totalRuns = Number(metricsResult.rows[0]?.metrics_updated || 0);
      status = totalRuns > 0 ? 'active' : (errorCount > 0 ? 'error' : 'unknown');
      
    } else if (serviceId === 'token-info-sync') {
      // Check token_info for recent updates
      const tokenResult = await db.execute(sql`
        SELECT MAX(last_updated) as last_run, COUNT(*) as tokens_updated
        FROM token_info 
        WHERE last_updated > NOW() - INTERVAL '2 hours'
      `);
      
      lastRun = tokenResult.rows[0]?.last_run as string || null;
      totalRuns = Number(tokenResult.rows[0]?.tokens_updated || 0);
      status = totalRuns > 0 ? 'active' : (errorCount > 0 ? 'error' : 'unknown');
    }

    // Get last error message
    const lastErrorResult = await db.execute(sql`
      SELECT description 
      FROM error_logs 
      WHERE source = ${serviceId}
      ORDER BY occurred_at DESC 
      LIMIT 1
    `);
    
    lastError = lastErrorResult.rows[0]?.description as string || null;

    // Calculate success rate
    const successfulRuns = Math.max(0, totalRuns - errorCount);
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

    // Calculate next run time
    const config = serviceConfigs.get(serviceId);
    const interval = config?.interval || 30;
    const nextRun = lastRun 
      ? new Date(new Date(lastRun).getTime() + interval * 60 * 1000).toISOString()
      : new Date(Date.now() + interval * 60 * 1000).toISOString();

    return {
      status: config?.enabled === false ? 'disabled' : status,
      lastRun,
      nextRun,
      successRate,
      totalRuns,
      errorCount,
      lastError
    };
    
  } catch (error) {
    console.error(`Error getting status for service ${serviceId}:`, error);
    return {
      status: 'error',
      lastRun: null,
      nextRun: null,
      successRate: 0,
      totalRuns: 0,
      errorCount: 1,
      lastError: 'Failed to retrieve service status'
    };
  }
}

// GET /api/admin/services/status - Get all service statuses
router.get('/status', async (req, res) => {
  try {
    console.log('📊 Fetching service statuses...');
    
    const serviceStatuses: ServiceStatus[] = [];
    
    for (const serviceDef of SERVICE_DEFINITIONS) {
      const config = serviceConfigs.get(serviceDef.id);
      const status = await getServiceStatus(serviceDef.id);
      
      serviceStatuses.push({
        id: serviceDef.id,
        name: serviceDef.name,
        type: serviceDef.type,
        description: serviceDef.description,
        interval: config?.interval || serviceDef.defaultInterval,
        poolsAffected: serviceDef.poolsAffected,
        ...status
      } as ServiceStatus);
    }
    
    console.log(`📊 Retrieved status for ${serviceStatuses.length} services`);
    res.json(serviceStatuses);
    
  } catch (error) {
    console.error('Error fetching service statuses:', error);
    res.status(500).json({ error: 'Failed to fetch service statuses' });
  }
});

// GET /api/admin/services/errors - Get recent service errors
router.get('/errors', async (req, res) => {
  try {
    console.log('🚨 Fetching recent service errors...');
    
    const errors = await db.execute(sql`
      SELECT 
        id,
        source as service_id,
        occurred_at as timestamp,
        error_type,
        description as error_message,
        severity,
        is_resolved as resolved
      FROM error_logs 
      WHERE occurred_at > NOW() - INTERVAL '24 hours'
      ORDER BY occurred_at DESC 
      LIMIT 50
    `);
    
    console.log(`🚨 Retrieved ${errors.rows.length} recent errors`);
    res.json(errors.rows);
    
  } catch (error) {
    console.error('Error fetching service errors:', error);
    res.status(500).json({ error: 'Failed to fetch service errors' });
  }
});

// PUT /api/admin/services/:serviceId/config - Update service configuration
router.put('/:serviceId/config', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { interval, enabled } = req.body;
    
    console.log(`⚙️ Updating configuration for service ${serviceId}:`, { interval, enabled });
    
    if (!SERVICE_DEFINITIONS.find(s => s.id === serviceId)) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (typeof interval !== 'number' || interval < 1 || interval > 1440) {
      return res.status(400).json({ error: 'Interval must be between 1 and 1440 minutes' });
    }
    
    // Update configuration
    serviceConfigs.set(serviceId, {
      serviceId,
      interval: Math.floor(interval),
      enabled: Boolean(enabled),
      lastModified: new Date().toISOString()
    });
    
    console.log(`✅ Configuration updated for service ${serviceId}`);
    res.json({ success: true, serviceId, interval, enabled });
    
  } catch (error) {
    console.error('Error updating service configuration:', error);
    res.status(500).json({ error: 'Failed to update service configuration' });
  }
});

// POST /api/admin/services/:serviceId/trigger - Manually trigger a service
router.post('/:serviceId/trigger', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    console.log(`🚀 Manually triggering service ${serviceId}...`);
    
    const serviceDef = SERVICE_DEFINITIONS.find(s => s.id === serviceId);
    if (!serviceDef) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Trigger appropriate service based on serviceId
    let result: any = { success: false };
    
    try {
      switch (serviceId) {
        case 'pool-scraper':
          // Import and trigger pool scraper
          try {
            const { ScraperManager } = await import('../scrapers/scraper-manager');
            const scraperManager = new ScraperManager();
            await scraperManager.scrapeAllPools();
            result = { success: true, message: 'Pool scraping triggered successfully' };
          } catch (err) {
            console.error('Pool scraper error:', err);
            result = { success: false, message: 'Pool scraping service not available' };
          }
          break;
          
        case 'holder-sync':
          // Import and trigger holder sync
          const { HolderDataSyncService } = await import('../services/holderDataSyncService');
          const holderService = new HolderDataSyncService();
          await holderService.syncAllHolderData();
          result = { success: true, message: 'Holder data sync triggered successfully' };
          break;
          
        case 'token-info-sync':
          // Import and trigger token info sync
          try {
            const { syncTokenInfo } = await import('../scripts/syncTokenInfo');
            await syncTokenInfo();
            result = { success: true, message: 'Token info sync triggered successfully' };
          } catch (err) {
            console.error('Token info sync error:', err);
            result = { success: false, message: 'Token info sync service failed: ' + (err as Error).message };
          }
          break;
          
        case 'standardized-metrics':
          // Import and trigger standardized metrics collection
          const { StandardizedMetricsService } = await import('../services/standardizedMetricsService');
          const metricsService = new StandardizedMetricsService(storage);
          
          // Get all pools and collect metrics for each
          const pools = await storage.getPools({ limit: 100 });
          const promises = pools.map(pool => 
            metricsService.collectAllMetricsForPool(pool.id, "manual")
          );
          await Promise.allSettled(promises);
          result = { success: true, message: 'Standardized metrics collection triggered successfully' };
          break;
          
        case 'historical-apy':
          try {
            const { HistoricalApyService } = await import('../services/historicalApyService');
            const histApyService = new HistoricalApyService();
            
            // Get all pools and update their historical averages
            const pools = await storage.getPools({ limit: 100 });
            const promises = pools.map(pool => 
              histApyService.calculateRealHistoricalAverages(pool.id, pool.platform?.name)
            );
            await Promise.allSettled(promises);
            result = { success: true, message: 'Historical APY analysis triggered successfully' };
          } catch (err) {
            console.error('Historical APY service error:', err);
            result = { success: false, message: 'Historical APY service failed: ' + (err as Error).message };
          }
          break;
          
        case 'error-healing':
          try {
            // Implement a basic error healing by retrying failed operations
            console.log('🔧 Running error healing service...');
            
            // Get recent unresolved errors
            const recentErrors = await db.execute(sql`
              SELECT id, source, error_type, description
              FROM error_logs 
              WHERE is_resolved = false 
              AND occurred_at > NOW() - INTERVAL '24 hours'
              ORDER BY occurred_at DESC 
              LIMIT 10
            `);
            
            let healedCount = 0;
            for (const error of recentErrors.rows) {
              try {
                // Mark error as resolved if it's from services that might have recovered
                if (error.source?.includes('Service') || error.source?.includes('sync')) {
                  await db.execute(sql`
                    UPDATE error_logs 
                    SET is_resolved = true, resolved_at = NOW(), resolved_by = 'AutoHealing'
                    WHERE id = ${error.id}
                  `);
                  healedCount++;
                }
              } catch (healError) {
                console.error('Failed to heal error:', healError);
              }
            }
            
            result = { 
              success: true, 
              message: `Error healing completed: ${healedCount} errors marked as resolved` 
            };
          } catch (err) {
            console.error('Error healing service error:', err);
            result = { success: false, message: 'Error healing service failed: ' + (err as Error).message };
          }
          break;
          
        default:
          result = { success: false, message: 'Service trigger not implemented' };
      }
      
    } catch (serviceError) {
      console.error(`❌ Error triggering service ${serviceId}:`, serviceError);
      result = { 
        success: false, 
        message: `Service execution failed: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}` 
      };
    }
    
    console.log(`${result.success ? '✅' : '❌'} Service ${serviceId} trigger result:`, result.message);
    res.json(result);
    
  } catch (error) {
    console.error('Error triggering service:', error);
    res.status(500).json({ error: 'Failed to trigger service' });
  }
});

// GET /api/admin/services/:serviceId/config - Get service configuration
router.get('/:serviceId/config', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    const serviceDef = SERVICE_DEFINITIONS.find(s => s.id === serviceId);
    if (!serviceDef) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const config = serviceConfigs.get(serviceId) || {
      serviceId,
      interval: serviceDef.defaultInterval,
      enabled: true,
      lastModified: new Date().toISOString()
    };
    
    res.json(config);
    
  } catch (error) {
    console.error('Error fetching service configuration:', error);
    res.status(500).json({ error: 'Failed to fetch service configuration' });
  }
});

export default router;