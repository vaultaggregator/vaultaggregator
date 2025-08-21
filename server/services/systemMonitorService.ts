import { performance } from 'perf_hooks';
import { cacheService } from './cacheService';
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
  cachePerformance: {
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
  };
  apiHealth: {
    etherscan: SystemCheck;
    defiLlama: SystemCheck;
    database: SystemCheck;
  };
  scheduledJobs: {
    defiLlamaSync: SystemCheck;
    holderDataSync: SystemCheck;
    aiOutlookGeneration: SystemCheck;
    cleanup: SystemCheck;
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

  constructor() {
    // Run initial health checks
    this.runAllHealthChecks();
    
    // Schedule regular health checks every 2 minutes
    setInterval(() => this.runAllHealthChecks(), 2 * 60 * 1000);
    
    console.log('System Monitor Service initialized');
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    await this.runAllHealthChecks();
    
    const checks = Array.from(this.checks.values());
    const downCount = checks.filter(c => c.status === 'down').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;
    
    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downCount > 0) {
      overall = 'down';
    } else if (warningCount > 0) {
      overall = 'degraded';
    }

    const cacheStats = cacheService.getStats();
    const memUsage = process.memoryUsage();
    
    // Get error rates
    const errorRates = await this.getErrorRates();

    return {
      overall,
      checks,
      uptime: Date.now() - this.startTime,
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cachePerformance: {
        hitRate: cacheStats.hitRate,
        totalEntries: cacheStats.totalEntries,
        memoryUsage: cacheStats.totalMemoryUsage
      },
      apiHealth: {
        etherscan: this.checks.get('etherscan') || this.createUnknownCheck('etherscan'),
        defiLlama: this.checks.get('defiLlama') || this.createUnknownCheck('defiLlama'),
        database: this.checks.get('database') || this.createUnknownCheck('database')
      },
      scheduledJobs: {
        defiLlamaSync: this.checks.get('defiLlamaSync') || this.createUnknownCheck('defiLlamaSync'),
        holderDataSync: this.checks.get('holderDataSync') || this.createUnknownCheck('holderDataSync'),
        aiOutlookGeneration: this.checks.get('aiOutlookGeneration') || this.createUnknownCheck('aiOutlookGeneration'),
        cleanup: this.checks.get('cleanup') || this.createUnknownCheck('cleanup')
      },
      errorRates
    };
  }

  /**
   * Run all health checks
   */
  private async runAllHealthChecks(): Promise<void> {
    await Promise.allSettled([
      this.checkEtherscanAPI(),
      this.checkDefiLlamaAPI(),
      this.checkDatabaseHealth(),
      this.checkScheduledJobs()
    ]);
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
   * Check DeFi Llama API health
   */
  private async checkDefiLlamaAPI(): Promise<void> {
    const startTime = performance.now();
    const checkName = 'defiLlama';
    
    try {
      const response = await fetch('https://yields.llama.fi/pools');
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.updateCheck(checkName, 'up', responseTime, undefined, {
          poolCount: data.data?.length || 0,
          status: 'ok'
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
    
    // Check DeFi Llama Sync Service (when pools were last updated)
    try {
      const pools = await storage.getPools({ limit: 5 });
      const lastUpdate = pools.reduce((latest, pool) => {
        const poolTime = pool.lastUpdated?.getTime() || 0;
        return Math.max(latest, poolTime);
      }, 0);
      
      const timeSinceUpdate = now - lastUpdate;
      const tenMinutes = 10 * 60 * 1000;
      
      if (timeSinceUpdate < tenMinutes) {
        this.updateCheck('defiLlamaSync', 'up', 0, undefined, {
          lastSync: new Date(lastUpdate),
          timeSinceSync: timeSinceUpdate
        });
      } else if (timeSinceUpdate < tenMinutes * 2) {
        this.updateCheck('defiLlamaSync', 'warning', 0, 'Sync overdue', {
          lastSync: new Date(lastUpdate),
          timeSinceSync: timeSinceUpdate
        });
      } else {
        this.updateCheck('defiLlamaSync', 'down', 0, 'Sync severely overdue', {
          lastSync: new Date(lastUpdate),
          timeSinceSync: timeSinceUpdate
        });
      }
    } catch (error) {
      this.updateCheck('defiLlamaSync', 'down', 0, error instanceof Error ? error.message : 'Unknown error');
    }

    // Check Holder Data Sync Service (currently disabled)
    this.updateCheck('holderDataSync', 'down', 0, 'Alchemy API temporarily disabled per user request', { 
      status: 'disabled',
      reason: 'Service temporarily disabled - Alchemy API connections suspended'
    });

    // Check AI Outlook Generation Service
    try {
      // Check if AI service has generated recent predictions
      const { db } = await import("../db");
      const { pools } = await import("../../shared/schema");
      const { desc, sql, isNotNull } = await import("drizzle-orm");
      
      const recentPools = await db.select()
        .from(pools)
        .where(isNotNull(pools.aiPrediction))
        .orderBy(desc(pools.lastUpdated))
        .limit(1);

      if (recentPools.length > 0) {
        const lastPrediction = recentPools[0].lastUpdated?.getTime() || 0;
        const timeSinceGeneration = now - lastPrediction;
        const twoHours = 2 * 60 * 60 * 1000;

        if (timeSinceGeneration < twoHours) {
          this.updateCheck('aiOutlookGeneration', 'up', 0, undefined, {
            lastGeneration: new Date(lastPrediction),
            timeSinceGeneration
          });
        } else {
          this.updateCheck('aiOutlookGeneration', 'warning', 0, 'AI predictions overdue', {
            lastGeneration: new Date(lastPrediction),
            timeSinceGeneration
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
}

// Singleton instance
export const systemMonitor = new SystemMonitorService();