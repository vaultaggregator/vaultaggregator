import { db } from "../db";
import { apiSettings } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { getAllApiServicesConfig } from "../config/api-services-config";

/**
 * API Registration Service
 * Automatically syncs API services from config to database
 * Ensures all configured APIs appear in the admin panel
 */
export class ApiRegistrationService {
  /**
   * Sync all configured API services to the database
   * - Adds new services that don't exist
   * - Updates existing services with new config (preserves user settings like isEnabled)
   * - Removes services that are no longer in config (optional)
   */
  static async syncApiServices(options: { removeOrphaned?: boolean } = {}): Promise<{
    added: string[];
    updated: string[];
    removed: string[];
    errors: string[];
  }> {
    const result = {
      added: [] as string[],
      updated: [] as string[],
      removed: [] as string[],
      errors: [] as string[]
    };

    try {
      const configServices = getAllApiServicesConfig();
      const configServiceNames = Object.keys(configServices);

      // Get all existing services from database
      const existingServices = await db
        .select()
        .from(apiSettings);

      const existingServiceNames = existingServices.map(s => s.serviceName);

      // Add new services
      for (const [serviceName, config] of Object.entries(configServices)) {
        try {
          const existingService = existingServices.find(s => s.serviceName === serviceName);

          if (!existingService) {
            // Add new service
            await db.insert(apiSettings).values(config);
            result.added.push(serviceName);
            console.log(`✅ Added new API service: ${config.displayName}`);
          } else {
            // Update existing service config (preserve user settings)
            const updateData = {
              displayName: config.displayName,
              description: config.description,
              baseUrl: config.baseUrl,
              category: config.category,
              priority: config.priority,
              rateLimitRpm: config.rateLimitRpm,
              // Preserve user-controlled settings
              // isEnabled: keep existing
              // healthStatus: keep existing  
              // disabledReason: keep existing
              // etc.
            };

            await db
              .update(apiSettings)
              .set(updateData)
              .where(eq(apiSettings.serviceName, serviceName));
            
            result.updated.push(serviceName);
            console.log(`🔄 Updated API service config: ${config.displayName}`);
          }
        } catch (error) {
          console.error(`❌ Error syncing service ${serviceName}:`, error);
          result.errors.push(`${serviceName}: ${error}`);
        }
      }

      // Remove orphaned services (if requested)
      if (options.removeOrphaned) {
        const orphanedServices = existingServiceNames.filter(
          name => !configServiceNames.includes(name)
        );

        if (orphanedServices.length > 0) {
          await db
            .delete(apiSettings)
            .where(inArray(apiSettings.serviceName, orphanedServices));

          result.removed = orphanedServices;
          console.log(`🗑️ Removed orphaned API services: ${orphanedServices.join(', ')}`);
        }
      }

      console.log(`🔧 API Service Sync Complete: ${result.added.length} added, ${result.updated.length} updated, ${result.removed.length} removed`);

    } catch (error) {
      console.error('❌ Error syncing API services:', error);
      result.errors.push(`General sync error: ${error}`);
    }

    return result;
  }

  /**
   * Initialize API services on server startup
   * Only adds missing services, never removes or overwrites existing ones
   */
  static async initializeApiServices(): Promise<void> {
    console.log('🔧 Initializing API services from configuration...');
    
    try {
      const result = await this.syncApiServices({ removeOrphaned: false });
      
      if (result.errors.length > 0) {
        console.error('⚠️ API service initialization had errors:', result.errors);
      } else {
        console.log('✅ API services initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize API services:', error);
    }
  }

  /**
   * Get service status summary for admin dashboard
   */
  static async getServiceStatusSummary(): Promise<{
    total: number;
    enabled: number;
    healthy: number;
    unhealthy: number;
    down: number;
  }> {
    try {
      const services = await db.select().from(apiSettings);
      
      return {
        total: services.length,
        enabled: services.filter(s => s.isEnabled).length,
        healthy: services.filter(s => s.healthStatus === 'healthy').length,
        unhealthy: services.filter(s => s.healthStatus === 'unhealthy' || s.healthStatus === 'degraded').length,
        down: services.filter(s => s.healthStatus === 'down').length,
      };
    } catch (error) {
      console.error('❌ Error getting service status summary:', error);
      return {
        total: 0,
        enabled: 0,
        healthy: 0,
        unhealthy: 0,
        down: 0,
      };
    }
  }

  /**
   * Check if a service is enabled and healthy
   */
  static async isServiceAvailable(serviceName: string): Promise<boolean> {
    try {
      const [service] = await db
        .select()
        .from(apiSettings)
        .where(eq(apiSettings.serviceName, serviceName));

      return service?.isEnabled === true && service?.healthStatus === 'healthy';
    } catch (error) {
      console.error(`❌ Error checking service availability for ${serviceName}:`, error);
      return false;
    }
  }

  /**
   * Initialize API services on server startup
   * This ensures all configured APIs are synced to the database automatically
   */
  static async initializeApiServices(): Promise<void> {
    try {
      console.log('🔄 Initializing API services from configuration...');
      const result = await this.syncApiServices();
      
      if (result.added.length > 0) {
        console.log(`✅ New APIs registered: ${result.added.join(', ')}`);
      }
      if (result.updated.length > 0) {
        console.log(`🔄 APIs updated: ${result.updated.join(', ')}`);
      }
      if (result.errors.length > 0) {
        console.log(`⚠️  API sync errors: ${result.errors.join(', ')}`);
      }
      
      console.log('✅ API services initialization complete');
    } catch (error) {
      console.error('❌ Error initializing API services:', error);
    }
  }
}