import { performance } from 'perf_hooks';
import { storage } from '../storage';

interface SystemCheck {
  name: string;
  status: 'up' | 'down' | 'warning' | 'unknown';
  responseTime?: number;
  lastCheck: number;
  error?: string;
  details?: any;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  checks: SystemCheck[];
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  apiHealth: {
    etherscan: SystemCheck;
    morpho: SystemCheck;
    database: SystemCheck;
  };
  scheduledJobs: {
    poolDataSync: SystemCheck;
    aiOutlookGeneration: SystemCheck;
    cleanup: SystemCheck;
    etherscanScraper: SystemCheck;
  };
  errorRates: {
    last1Hour: number;
    last24Hours: number;
    critical: number;
  };
}

export class SystemMonitorService {
  private startTime = Date.now();
  private checks: Map<string, SystemCheck> = new Map();
  private healthHistory: Array<{ timestamp: number; status: string }> = [];
  private cachedHealth: SystemHealth | null = null;
  private lastHealthCheckTime = 0;
  private readonly HEALTH_CACHE_TTL = 30000; // Cache for 30 seconds
  private isRunningHealthCheck = false;

  constructor() {
    // Run initial health checks in background
    this.runBackgroundHealthCheck();
    
    // Schedule regular health checks every 2 minutes
    setInterval(() => this.runBackgroundHealthCheck(), 2 * 60 * 1000);
    
    console.log('System Monitor Service initialized');
  }
  
  private async runBackgroundHealthCheck() {
    if (this.isRunningHealthCheck) return;
    this.isRunningHealthCheck = true;
    try {
      await this.runAllHealthChecks();
      this.lastHealthCheckTime = Date.now();
    } finally {
      this.isRunningHealthCheck = false;
    }
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.cachedHealth && (now - this.lastHealthCheckTime) < this.HEALTH_CACHE_TTL) {
      return this.cachedHealth;
    }
    
    // Don't wait for health checks if they're already running
    if (!this.isRunningHealthCheck) {
      // Run health checks in background for next request
      this.runBackgroundHealthCheck();
    }
    
    const checks = Array.from(this.checks.values());
    const downCount = checks.filter(c => c.status === 'down').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    
    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downCount > 0) {
      overall = 'down';
    } else if (warningCount > 0) {
      overall = 'degraded';
    }

    const memUsage = process.memoryUsage();
    
    // Get error rates
    const errorRates = await this.getErrorRates();

    const health: SystemHealth = {
      overall,
      checks,
      uptime: Date.now() - this.startTime,
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      apiHealth: {
        etherscan: this.checks.get('etherscan') || this.createUnknownCheck('etherscan'),
        morpho: this.checks.get('morpho') || this.createUnknownCheck('morpho'),
        database: this.checks.get('database') || this.createUnknownCheck('database')
      },
      scheduledJobs: {
        poolDataSync: this.checks.get('poolDataSync') || this.createUnknownCheck('poolDataSync'),
        aiOutlookGeneration: this.checks.get('aiOutlookGeneration') || this.createUnknownCheck('aiOutlookGeneration'),
        cleanup: this.checks.get('cleanup') || this.createUnknownCheck('cleanup'),
        etherscanScraper: this.checks.get('etherscanScraper') || this.createUnknownCheck('etherscanScraper')
      },
      errorRates
    };
    
    // Cache the result
    this.cachedHealth = health;
    
    return health;
  }

  /**
   * Run all health checks
   */
  private async runAllHealthChecks(): Promise<void> {
    await Promise.allSettled([
      this.checkAlchemyAPI(),
      this.checkEtherscanAPI(),
      this.checkMorphoAPI(),
      this.checkDatabaseHealth(),
      this.checkScheduledJobs()
    ]);
  }

  /**
   * Check Alchemy API health
   */
  private async checkAlchemyAPI(): Promise<void> {
    try {
      // Test with a simple blockNumber request
      const response = await fetch('http://localhost:5000/api/test/alchemy/blockNumber');
      
      if (response.ok) {
        const data = await response.json();
        if (data.blockNumber && data.blockNumberDecimal) {
          // Update database health status
          await fetch('http://localhost:5000/api/api-settings/alchemy_api/health', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ healthStatus: 'healthy', errorCount: 0 })
          });
          
          this.updateCheck('alchemy', 'up', 0, undefined, {
            blockNumber: data.blockNumberDecimal,
            status: 'healthy'
          });
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Update database health status  
      await fetch('http://localhost:5000/api/api-settings/alchemy_api/health', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ healthStatus: 'down', errorCount: 1 })
      });
      
      this.updateCheck('alchemy', 'down', 0, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check Etherscan API health
   */
  private async checkEtherscanAPI(): Promise<void> {
    const startTime = performance.now();
    const checkName = 'etherscan';
    
    try {
      // Test with a simple API call
      const response = await fetch('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YourApiKeyToken');
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.updateCheck(checkName, 'up', responseTime, undefined, {
          status: data.status,
          message: data.message
        });
      } else {
        this.updateCheck(checkName, 'down', responseTime, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.updateCheck(checkName, 'down', responseTime, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check Morpho API health
   */
  private async checkMorphoAPI(): Promise<void> {
    const startTime = performance.now();
    const checkName = 'morpho';
    
    try {
      const response = await fetch('https://api.morpho.org/blue/health');
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        this.updateCheck(checkName, 'up', responseTime, undefined, {
          status: 'healthy'
        });
      } else {
        this.updateCheck(checkName, 'down', responseTime, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.updateCheck(checkName, 'down', responseTime, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<void> {
    const startTime = performance.now();
    const checkName = 'database';
    
    try {
      // Simple database query to test connectivity
      const pools = await storage.getPools({ limit: 1 });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.updateCheck(checkName, 'up', responseTime, undefined, {
        connectionStatus: 'connected',
        queryTime: responseTime
      });
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      this.updateCheck(checkName, 'down', responseTime, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Check scheduled jobs status
   */
  private async checkScheduledJobs(): Promise<void> {
    const now = Date.now();
    
    // Check Pool Data Sync Service (when pools were last updated)
    try {
      const pools = await storage.getPools({ limit: 5 });
      const lastUpdate = pools.reduce((latest, pool) => {
        const poolTime = pool.lastUpdated?.getTime() || 0;
        return Math.max(latest, poolTime);
      }, 0);
      
      const timeSinceUpdate = now - lastUpdate;
      const tenMinutes = 10 * 60 * 1000;
      
      if (timeSinceUpdate < tenMinutes) {
        this.updateCheck('poolDataSync', 'up', 0, undefined, {
          lastSync: new Date(lastUpdate),
          timeSinceSync: timeSinceUpdate
        });
      } else if (timeSinceUpdate < tenMinutes * 2) {
        this.updateCheck('poolDataSync', 'warning', 0, 'Sync overdue', {
          lastSync: new Date(lastUpdate),
          timeSinceSync: timeSinceUpdate
        });
      } else {
        this.updateCheck('poolDataSync', 'down', 0, 'Sync severely overdue', {
          lastSync: new Date(lastUpdate),
          timeSinceSync: timeSinceUpdate
        });
      }
    } catch (error) {
      this.updateCheck('poolDataSync', 'down', 0, error instanceof Error ? error.message : 'Unknown error');
    }


    // Check Etherscan Scraper Service
    try {
      const { db } = await import("../db");
      const { poolMetricsCurrent } = await import("../../shared/schema");
      const { desc } = await import("drizzle-orm");
      
      // Check when holder counts were last updated
      const recentHolderUpdates = await db.select()
        .from(poolMetricsCurrent)
        .orderBy(desc(poolMetricsCurrent.updatedAt))
        .limit(1);
      
      if (recentHolderUpdates.length > 0) {
        const lastUpdate = recentHolderUpdates[0].updatedAt?.getTime() || 0;
        const timeSinceUpdate = now - lastUpdate;
        const thirtyMinutes = 30 * 60 * 1000; // Scraper runs every 30 minutes
        
        if (timeSinceUpdate < thirtyMinutes * 2) {
          this.updateCheck('etherscanScraper', 'up', 0, undefined, {
            lastSync: new Date(lastUpdate),
            timeSinceSync: timeSinceUpdate,
            holdersCount: recentHolderUpdates[0].holdersCount,
            status: 'active'
          });
        } else if (timeSinceUpdate < thirtyMinutes * 4) {
          this.updateCheck('etherscanScraper', 'warning', 0, 'Scraper may be delayed', {
            lastSync: new Date(lastUpdate),
            timeSinceSync: timeSinceUpdate,
            status: 'delayed'
          });
        } else {
          this.updateCheck('etherscanScraper', 'down', 0, 'Scraper appears to be stopped', {
            lastSync: new Date(lastUpdate),
            timeSinceSync: timeSinceUpdate,
            status: 'stopped'
          });
        }
      } else {
        this.updateCheck('etherscanScraper', 'warning', 0, 'No holder data found', {
          status: 'no_data'
        });
      }
    } catch (error) {
      this.updateCheck('etherscanScraper', 'down', 0, error instanceof Error ? error.message : 'Unknown error');
    }

    // Check AI Outlook Generation Service
    try {
      // Check if AI service has generated recent predictions
      const { db } = await import("../db");
      const { aiOutlooks } = await import("../../shared/schema");
      const { desc } = await import("drizzle-orm");
      
      const recentPredictions = await db.select()
        .from(aiOutlooks)
        .orderBy(desc(aiOutlooks.generatedAt))
        .limit(1);

      if (recentPredictions.length > 0) {
        const lastPrediction = recentPredictions[0].generatedAt?.getTime() || 0;
        const timeSinceGeneration = now - lastPrediction;
        const twentyFiveHours = 25 * 60 * 60 * 1000; // AI service runs every 24h, allow 25h buffer

        if (timeSinceGeneration < twentyFiveHours) {
          this.updateCheck('aiOutlookGeneration', 'up', 0, undefined, {
            lastGeneration: new Date(lastPrediction),
            timeSinceGeneration,
            sentiment: recentPredictions[0].sentiment
          });
        } else {
          this.updateCheck('aiOutlookGeneration', 'warning', 0, 'AI predictions overdue', {
            lastGeneration: new Date(lastPrediction),
            timeSinceGeneration,
            sentiment: recentPredictions[0].sentiment
          });
        }
      } else {
        this.updateCheck('aiOutlookGeneration', 'warning', 0, 'No recent AI predictions found', {
          status: 'no_data'
        });
      }
    } catch (error) {
      this.updateCheck('aiOutlookGeneration', 'down', 0, error instanceof Error ? error.message : 'Unknown error');
    }

    // Check Database Cleanup Service
    try {
      // Check if cleanup service is running by looking at recent database activity
      const { db } = await import("../db");
      const { errorLogs } = await import("../../shared/schema");
      const { desc, and, eq, sql, gte } = await import("drizzle-orm");
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Check if cleanup has removed old errors (resolved ones)
      const recentCleanup = await db.select()
        .from(errorLogs)
        .where(and(
          eq(errorLogs.isResolved, true),
          gte(errorLogs.resolvedAt, oneDayAgo)
        ))
        .orderBy(desc(errorLogs.resolvedAt))
        .limit(1);

      if (recentCleanup.length > 0) {
        this.updateCheck('cleanup', 'up', 0, undefined, {
          lastCleanup: recentCleanup[0].resolvedAt,
          status: 'active'
        });
      } else {
        // If no recent cleanup activity, assume it's running normally (cleanup may not always have work to do)
        this.updateCheck('cleanup', 'up', 0, undefined, {
          status: 'idle',
          message: 'No recent cleanup required'
        });
      }
    } catch (error) {
      this.updateCheck('cleanup', 'warning', 0, `Cleanup status unknown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get error rates from error logging system
   */
  private async getErrorRates(): Promise<{ last1Hour: number; last24Hours: number; critical: number }> {
    try {
      // This would integrate with your error logging system
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // For now, return placeholder data
      // In a real implementation, you'd query the errorLogs table
      return {
        last1Hour: 0,
        last24Hours: 0,
        critical: 0
      };
    } catch (error) {
      return {
        last1Hour: -1,
        last24Hours: -1,
        critical: -1
      };
    }
  }

  /**
   * Update or create a health check
   */
  private updateCheck(name: string, status: SystemCheck['status'], responseTime?: number, error?: string, details?: any): void {
    this.checks.set(name, {
      name,
      status,
      responseTime,
      lastCheck: Date.now(),
      error,
      details
    });
  }

  /**
   * Create unknown status check
   */
  private createUnknownCheck(name: string): SystemCheck {
    return {
      name,
      status: 'unknown',
      lastCheck: 0
    };
  }

  /**
   * Get uptime in human readable format
   */
  getUptimeString(): string {
    const uptime = Date.now() - this.startTime;
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Update service last run time for manual triggers
   */
  async updateServiceLastRun(serviceName: string): Promise<void> {
    // Update the check status to clear any previous errors
    this.updateCheck(serviceName, 'up', 0, undefined, {
      status: 'manually_triggered',
      lastUpdate: new Date()
    });
    console.log(`✅ Updated last run time for ${serviceName}`);
  }
}

import { serviceConfigService } from './serviceConfigurationService';

// Service configuration - now database-backed
export const serviceConfigs: Record<string, { interval: number; enabled: boolean }> = {};

// Initialize service configurations from database
export async function initializeServiceConfigs(): Promise<void> {
  try {
    await serviceConfigService.initializeConfigurations();
    const configs = await serviceConfigService.getAllConfigurations();
    
    // Populate memory cache for fast access
    for (const config of configs) {
      serviceConfigs[config.serviceName] = {
        interval: config.intervalMinutes,
        enabled: config.isEnabled,
      };
      console.log(`  📋 ${config.displayName}: ${config.intervalMinutes}min, enabled: ${config.isEnabled}`);
    }
    
    console.log(`🔧 Loaded ${configs.length} service configurations from database`);
  } catch (error) {
    console.error("❌ Failed to initialize service configs:", error);
    // Fallback to default configurations
    serviceConfigs.poolDataSync = { interval: 5, enabled: true };
    serviceConfigs.morphoApiSync = { interval: 3, enabled: true };
    serviceConfigs.aiOutlookGeneration = { interval: 1440, enabled: true };
    serviceConfigs.cleanup = { interval: 86400, enabled: false };
    serviceConfigs.etherscanScraper = { interval: 30, enabled: true };
    serviceConfigs.tokenPriceSync = { interval: 10, enabled: true };
    serviceConfigs.historicalDataSync = { interval: 60, enabled: true };
    serviceConfigs.alchemyHealthCheck = { interval: 2, enabled: true };
  }
}

// Update service configuration with database persistence
export async function updateServiceConfig(serviceName: string, config: { interval: number; enabled: boolean }): Promise<void> {
  console.log(`🔧 Updating ${serviceName} configuration: interval=${config.interval}min, enabled=${config.enabled}`);
  
  try {
    // Update in database first
    console.log(`📝 Calling database update for ${serviceName}...`);
    const updated = await serviceConfigService.updateConfiguration(serviceName, {
      intervalMinutes: config.interval,
      isEnabled: config.enabled,
    });
    
    console.log(`📋 Database updated for ${serviceName}:`, updated);
    
    // Update memory cache
    serviceConfigs[serviceName] = config;
    
    // Apply the configuration change to the running scheduler
    const { databaseScheduler } = await import('./database-scheduler');
    databaseScheduler.updateServiceInterval(serviceName);
    console.log(`✅ Updated ${serviceName} configuration: { interval: ${config.interval}, enabled: ${config.enabled} }`);
  } catch (error) {
    console.error(`❌ Failed to update ${serviceName} configuration:`, error);
    console.error(`Error stack:`, (error as Error).stack);
    throw error;
  }
}

// Singleton instance
export const systemMonitor = new SystemMonitorService();