import { db } from "../db";
import { serviceConfigurations, ServiceConfiguration, InsertServiceConfiguration } from "@shared/schema";
import { eq } from "drizzle-orm";
import { DEFAULT_SERVICE_CONFIGS } from "../config/service-configurations";

/**
 * Service for managing service configurations in the database
 */
export class ServiceConfigurationService {
  
  /**
   * Initialize service configurations in database from defaults
   */
  async initializeConfigurations(): Promise<void> {
    console.log("🔧 Initializing service configurations...");
    
    try {
      const existingConfigs = await db.select().from(serviceConfigurations);
      const existingServiceNames = new Set(existingConfigs.map(c => c.serviceName));
      
      let added = 0;
      let updated = 0;
      
      for (const [serviceName, config] of Object.entries(DEFAULT_SERVICE_CONFIGS)) {
        if (!existingServiceNames.has(serviceName)) {
          await db.insert(serviceConfigurations).values(config);
          added++;
          console.log(`  ✅ Added service config: ${config.displayName}`);
        } else {
          // Update description and display name only, preserve user settings
          await db
            .update(serviceConfigurations)
            .set({
              displayName: config.displayName,
              description: config.description,
              category: config.category,
              priority: config.priority,
            })
            .where(eq(serviceConfigurations.serviceName, serviceName));
          updated++;
        }
      }
      
      console.log(`🔧 Service configurations initialized: ${added} added, ${updated} updated`);
    } catch (error) {
      console.error("❌ Failed to initialize service configurations:", error);
      throw error;
    }
  }
  
  /**
   * Get all service configurations
   */
  async getAllConfigurations(): Promise<ServiceConfiguration[]> {
    return await db.select().from(serviceConfigurations);
  }
  
  /**
   * Get service configuration by name
   */
  async getConfiguration(serviceName: string): Promise<ServiceConfiguration | null> {
    const [config] = await db
      .select()
      .from(serviceConfigurations)
      .where(eq(serviceConfigurations.serviceName, serviceName));
    
    return config || null;
  }
  
  /**
   * Update service configuration
   */
  async updateConfiguration(
    serviceName: string, 
    updates: Partial<Pick<ServiceConfiguration, 'intervalMinutes' | 'isEnabled'>>
  ): Promise<ServiceConfiguration> {
    const [updated] = await db
      .update(serviceConfigurations)
      .set(updates)
      .where(eq(serviceConfigurations.serviceName, serviceName))
      .returning();
    
    if (!updated) {
      throw new Error(`Service configuration not found: ${serviceName}`);
    }
    
    console.log(`🔧 Updated service configuration: ${serviceName} - interval: ${updates.intervalMinutes}min, enabled: ${updates.isEnabled}`);
    return updated;
  }
  
  /**
   * Update service run statistics
   */
  async updateRunStats(
    serviceName: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    // First get current values
    const currentConfig = await this.getConfiguration(serviceName);
    if (!currentConfig) return;
    
    const updates: any = {
      lastRun: new Date(),
      runCount: (currentConfig.runCount || 0) + 1,
    };
    
    if (success) {
      updates.lastError = null;
      updates.lastErrorAt = null;
    } else {
      updates.errorCount = (currentConfig.errorCount || 0) + 1;
      updates.lastError = error || "Unknown error";
      updates.lastErrorAt = new Date();
    }
    
    await db
      .update(serviceConfigurations)
      .set(updates)
      .where(eq(serviceConfigurations.serviceName, serviceName));
  }
  
  /**
   * Get service configuration as simple object for memory compatibility
   */
  async getServiceConfig(serviceName: string): Promise<{ interval: number; enabled: boolean } | null> {
    const config = await this.getConfiguration(serviceName);
    if (!config) return null;
    
    return {
      interval: config.intervalMinutes,
      enabled: config.isEnabled,
    };
  }
}

// Singleton instance
export const serviceConfigService = new ServiceConfigurationService();