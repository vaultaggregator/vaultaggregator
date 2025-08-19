import { db } from "../db";
import { 
  platformApiConfigs, 
  apiResponseHistory, 
  apiCallLogs, 
  platforms 
} from "@shared/schema";
import type { 
  PlatformApiConfig, 
  InsertPlatformApiConfig, 
  InsertApiResponseHistory, 
  InsertApiCallLog 
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { PlatformServiceRegistry } from './platforms/platformServiceRegistry';
import type { BasePlatformService } from './platforms/basePlatformService';

export class PlatformApiManager {
  private serviceCache: Map<string, BasePlatformService> = new Map();

  async createApiConfig(data: InsertPlatformApiConfig): Promise<PlatformApiConfig> {
    const [config] = await db
      .insert(platformApiConfigs)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    
    // Clear cache for this platform
    this.clearServiceCache(data.platformId);
    return config;
  }

  async updateApiConfig(
    configId: string, 
    data: Partial<InsertPlatformApiConfig>
  ): Promise<PlatformApiConfig> {
    const [config] = await db
      .update(platformApiConfigs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(platformApiConfigs.id, configId))
      .returning();
    
    // Clear cache for this platform
    if (config) {
      this.clearServiceCache(config.platformId);
    }
    
    return config;
  }

  async deleteApiConfig(configId: string): Promise<void> {
    const config = await this.getApiConfig(configId);
    if (config) {
      this.clearServiceCache(config.platformId);
    }
    
    await db
      .delete(platformApiConfigs)
      .where(eq(platformApiConfigs.id, configId));
  }

  async getApiConfig(configId: string): Promise<PlatformApiConfig | null> {
    const [config] = await db
      .select()
      .from(platformApiConfigs)
      .where(eq(platformApiConfigs.id, configId));
    
    return config || null;
  }

  async getApiConfigsByPlatform(platformId: string): Promise<PlatformApiConfig[]> {
    return await db
      .select()
      .from(platformApiConfigs)
      .where(eq(platformApiConfigs.platformId, platformId))
      .orderBy(desc(platformApiConfigs.createdAt));
  }

  async getAllApiConfigs(): Promise<PlatformApiConfig[]> {
    return await db
      .select()
      .from(platformApiConfigs)
      .orderBy(desc(platformApiConfigs.createdAt));
  }

  async getPlatformService(platformId: string): Promise<BasePlatformService | null> {
    // Check cache first
    if (this.serviceCache.has(platformId)) {
      return this.serviceCache.get(platformId)!;
    }

    // Get enabled API config for this platform
    const configs = await this.getApiConfigsByPlatform(platformId);
    const enabledConfig = configs.find(config => config.isEnabled);
    
    if (!enabledConfig) {
      console.warn(`No enabled API config found for platform: ${platformId}`);
      return null;
    }

    // Get platform info
    const [platform] = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, platformId));
    
    if (!platform) {
      console.error(`Platform not found: ${platformId}`);
      return null;
    }

    // Create service instance
    const service = PlatformServiceRegistry.createService(
      enabledConfig, 
      platformId, 
      platform.name
    );

    if (service) {
      this.serviceCache.set(platformId, service);
    }

    return service;
  }

  async executePlatformApiCall(
    platformId: string, 
    triggeredBy: string = 'manual'
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    logId: string;
  }> {
    const startTime = new Date();
    
    // Create call log
    const [callLog] = await db
      .insert(apiCallLogs)
      .values({
        platformId,
        callType: 'manual',
        triggeredBy,
        status: 'pending',
        startTime,
      } as InsertApiCallLog)
      .returning();

    try {
      const service = await this.getPlatformService(platformId);
      
      if (!service) {
        await this.updateCallLog(callLog.id, {
          status: 'failed',
          endTime: new Date(),
          duration: Date.now() - startTime.getTime(),
          notes: 'No service available for platform',
        });
        
        return {
          success: false,
          error: 'No API service configured for this platform',
          logId: callLog.id,
        };
      }

      // Execute API call
      const result = await service.fetchLiveData();
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Save response history
      const responseHistoryData: InsertApiResponseHistory = {
        platformId,
        configId: (await this.getApiConfigsByPlatform(platformId))[0]?.id,
        endpoint: 'live_data',
        responseData: result.data,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        errorMessage: result.error,
        dataType: 'live_data',
        isSuccess: result.success,
      };
      
      await db.insert(apiResponseHistory).values(responseHistoryData);

      // Update call log
      await this.updateCallLog(callLog.id, {
        status: result.success ? 'success' : 'failed',
        endTime,
        duration,
        recordsProcessed: result.success ? 1 : 0,
        errorsEncountered: result.success ? 0 : 1,
        notes: result.error,
      });

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        logId: callLog.id,
      };

    } catch (error: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      await this.updateCallLog(callLog.id, {
        status: 'failed',
        endTime,
        duration,
        errorsEncountered: 1,
        notes: error.message,
      });

      return {
        success: false,
        error: error.message,
        logId: callLog.id,
      };
    }
  }

  async getApiResponseHistory(
    platformId: string, 
    limit: number = 50
  ): Promise<any[]> {
    return await db
      .select()
      .from(apiResponseHistory)
      .where(eq(apiResponseHistory.platformId, platformId))
      .orderBy(desc(apiResponseHistory.timestamp))
      .limit(limit);
  }

  async getApiCallLogs(
    platformId: string, 
    limit: number = 50
  ): Promise<any[]> {
    return await db
      .select()
      .from(apiCallLogs)
      .where(eq(apiCallLogs.platformId, platformId))
      .orderBy(desc(apiCallLogs.startTime))
      .limit(limit);
  }

  async updateHealthStatus(platformId: string): Promise<void> {
    const service = await this.getPlatformService(platformId);
    if (!service) return;

    try {
      const healthStatus = await service.getHealthStatus();
      const configs = await this.getApiConfigsByPlatform(platformId);
      
      for (const config of configs) {
        if (config.isEnabled) {
          await this.updateApiConfig(config.id, {
            healthStatus,
            lastHealthCheck: new Date(),
          });
        }
      }
    } catch (error: any) {
      console.error(`Health check failed for platform ${platformId}:`, error);
    }
  }

  private async updateCallLog(
    logId: string, 
    updates: Partial<InsertApiCallLog>
  ): Promise<void> {
    await db
      .update(apiCallLogs)
      .set(updates)
      .where(eq(apiCallLogs.id, logId));
  }

  private clearServiceCache(platformId: string): void {
    this.serviceCache.delete(platformId);
  }

  // Health monitoring methods
  async runHealthChecks(): Promise<void> {
    const allConfigs = await this.getAllApiConfigs();
    const platformIds = Array.from(new Set(allConfigs.map(c => c.platformId)));
    
    for (const platformId of platformIds) {
      await this.updateHealthStatus(platformId);
    }
  }
}

// Export singleton instance
export const platformApiManager = new PlatformApiManager();