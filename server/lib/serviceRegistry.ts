/**
 * Service Discovery Registry
 * Dynamically discovers and manages admin services
 */

import fs from 'fs';
import path from 'path';

export interface ServiceMeta {
  id: string;
  name: string;
  description: string;
}

export interface DiscoveredService {
  id: string;
  name: string;
  description: string;
  filePath: string;
  hasRun: boolean;
  meta?: ServiceMeta;
  lastRun?: Date;
  lastError?: string;
  totalRuns: number;
  successCount: number;
  errorCount: number;
}

export interface ServiceRunResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

class ServiceRegistry {
  private services = new Map<string, DiscoveredService>();
  private serviceStats = new Map<string, {
    lastRun?: Date;
    lastError?: string;
    totalRuns: number;
    successCount: number;
    errorCount: number;
  }>();

  private readonly SERVICES_DIR = path.join(process.cwd(), 'admin', 'services');
  private readonly IGNORE_PATTERNS = [
    /^status$/,
    /^utils$/,
    /^\./, // Hidden files
    /\.js\.map$/,
    /\.d\.ts$/
  ];

  constructor() {
    // Don't auto-discover in constructor, wait for explicit initialize call
  }

  /**
   * Initialize the service registry and discover services
   */
  public async initialize(): Promise<void> {
    await this.discoverServices();
  }

  /**
   * Scan admin/services directory for service files
   */
  private async discoverServices(): Promise<void> {
    if (!fs.existsSync(this.SERVICES_DIR)) {
      console.warn('⚠️ Admin services directory not found:', this.SERVICES_DIR);
      return;
    }

    try {
      const entries = fs.readdirSync(this.SERVICES_DIR, { withFileTypes: true });
      let discoveredCount = 0;

      for (const entry of entries) {
        // Skip directories and ignored patterns
        if (entry.isDirectory()) {
          if (!this.IGNORE_PATTERNS.some(pattern => pattern.test(entry.name))) {
            console.log(`📁 Skipping directory: ${entry.name}`);
          }
          continue;
        }

        // Skip ignored files
        if (this.IGNORE_PATTERNS.some(pattern => pattern.test(entry.name))) {
          continue;
        }

        // Only process .ts and .js files
        const ext = path.extname(entry.name);
        if (!['.ts', '.js'].includes(ext)) {
          continue;
        }

        const filePath = path.join(this.SERVICES_DIR, entry.name);
        const serviceId = path.basename(entry.name, ext);
        
        try {
          // Dynamic import to check for run() function
          const module = await import(filePath);
          
          if (typeof module.run === 'function') {
            const meta = module.meta as ServiceMeta | undefined;
            
            const service: DiscoveredService = {
              id: meta?.id || serviceId,
              name: meta?.name || this.formatServiceName(serviceId),
              description: meta?.description || `Service description not available`,
              filePath,
              hasRun: true,
              meta,
              totalRuns: 0,
              successCount: 0,
              errorCount: 0
            };

            this.services.set(service.id, service);
            discoveredCount++;
            
            console.log(`✅ Discovered service: ${service.name} (${service.id})`);
          } else {
            console.log(`⚠️ Skipping ${entry.name}: no run() function found`);
          }
        } catch (error) {
          console.error(`❌ Error importing ${entry.name}:`, error);
        }
      }

      console.log(`🔍 Service discovery complete: ${discoveredCount} services found`);
    } catch (error) {
      console.error('❌ Error during service discovery:', error);
    }
  }

  /**
   * Format service name from filename
   */
  private formatServiceName(serviceId: string): string {
    return serviceId
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Get all discovered services
   */
  public getServices(): DiscoveredService[] {
    return Array.from(this.services.values());
  }

  /**
   * Get service by ID
   */
  public getService(id: string): DiscoveredService | undefined {
    return this.services.get(id);
  }

  /**
   * Run a service by ID
   */
  public async runService(id: string): Promise<ServiceRunResult> {
    const service = this.services.get(id);
    if (!service) {
      return {
        success: false,
        error: `Service ${id} not found`,
        duration: 0
      };
    }

    const startTime = Date.now();
    
    console.log(`🚀 Running service: ${service.name} (${service.id})`);
    
    try {
      // Dynamic import and execute
      const module = await import(service.filePath);
      const result = await module.run();
      
      const duration = Date.now() - startTime;
      
      // Update stats
      const stats = this.serviceStats.get(id) || {
        totalRuns: 0,
        successCount: 0,
        errorCount: 0
      };
      
      stats.lastRun = new Date();
      stats.totalRuns++;
      stats.successCount++;
      stats.lastError = undefined;
      
      this.serviceStats.set(id, stats);
      
      // Update service
      service.lastRun = stats.lastRun;
      service.lastError = undefined;
      service.totalRuns = stats.totalRuns;
      service.successCount = stats.successCount;
      service.errorCount = stats.errorCount;
      
      console.log(`✅ Service ${service.name} completed successfully in ${duration}ms`);
      
      return {
        success: true,
        result,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update stats
      const stats = this.serviceStats.get(id) || {
        totalRuns: 0,
        successCount: 0,
        errorCount: 0
      };
      
      stats.lastRun = new Date();
      stats.totalRuns++;
      stats.errorCount++;
      stats.lastError = errorMessage;
      
      this.serviceStats.set(id, stats);
      
      // Update service
      service.lastRun = stats.lastRun;
      service.lastError = errorMessage;
      service.totalRuns = stats.totalRuns;
      service.successCount = stats.successCount;
      service.errorCount = stats.errorCount;
      
      console.error(`❌ Service ${service.name} failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: errorMessage,
        duration
      };
    }
  }

  /**
   * Get service statistics
   */
  public getServiceStats(id: string) {
    const service = this.services.get(id);
    const stats = this.serviceStats.get(id);
    
    if (!service) return null;
    
    return {
      ...service,
      stats: {
        successRate: service.totalRuns > 0 ? (service.successCount / service.totalRuns) * 100 : 100,
        totalRuns: service.totalRuns,
        successCount: service.successCount,
        errorCount: service.errorCount,
        lastRun: service.lastRun?.toISOString() || null,
        lastError: service.lastError || null
      }
    };
  }

  /**
   * Refresh service discovery (for hot reload)
   */
  public async refresh(): Promise<void> {
    this.services.clear();
    await this.discoverServices();
  }
}

// Singleton instance  
export const serviceRegistry = new ServiceRegistry();