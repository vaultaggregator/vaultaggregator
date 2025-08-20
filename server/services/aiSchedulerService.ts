import { AIPredictionService } from './aiPredictionService';
import { db } from '../db';
import { pools } from '@shared/schema';

export interface SchedulerConfig {
  enabled: boolean;
  intervalHours: number;
  lastRun?: Date;
  nextRun?: Date;
}

export class AISchedulerService {
  private static instance: AISchedulerService;
  private config: SchedulerConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private predictionService: AIPredictionService;

  constructor() {
    this.predictionService = AIPredictionService.getInstance();
    this.config = {
      enabled: false,
      intervalHours: 24, // Default: generate insights every 24 hours
    };
    this.loadConfig();
  }

  static getInstance(): AISchedulerService {
    if (!AISchedulerService.instance) {
      AISchedulerService.instance = new AISchedulerService();
    }
    return AISchedulerService.instance;
  }

  private loadConfig(): void {
    // Load configuration from environment or use defaults
    const envEnabled = process.env.AI_SCHEDULER_ENABLED;
    const envInterval = process.env.AI_SCHEDULER_INTERVAL_HOURS;

    this.config = {
      enabled: envEnabled === 'true',
      intervalHours: envInterval ? parseInt(envInterval) : 24,
    };

    console.log(`🤖 AI Scheduler loaded: ${this.config.enabled ? 'enabled' : 'disabled'}, interval: ${this.config.intervalHours}h`);
  }

  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('🤖 AI Scheduler is disabled');
      return;
    }

    if (this.intervalId) {
      this.stop();
    }

    const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
    
    console.log(`🤖 Starting AI Scheduler: generating insights every ${this.config.intervalHours} hours`);
    
    // Set next run time
    this.config.nextRun = new Date(Date.now() + intervalMs);
    
    this.intervalId = setInterval(async () => {
      await this.generateAllInsights();
    }, intervalMs);

    // Optionally run immediately on start
    // await this.generateAllInsights();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🤖 AI Scheduler stopped');
    }
  }

  async updateConfig(newConfig: Partial<SchedulerConfig>): Promise<SchedulerConfig> {
    this.config = { ...this.config, ...newConfig };
    
    // Restart scheduler with new config
    if (this.config.enabled) {
      this.stop();
      await this.start();
    } else {
      this.stop();
    }

    console.log(`🤖 AI Scheduler config updated:`, this.config);
    return this.config;
  }

  getConfig(): SchedulerConfig {
    return { ...this.config };
  }

  async generateAllInsights(): Promise<{ success: number; errors: number; total: number }> {
    console.log('🤖 AI Scheduler: Starting bulk insight generation...');
    
    const startTime = Date.now();
    this.config.lastRun = new Date();
    
    try {
      // Get all pools
      const allPools = await db.select({ id: pools.id }).from(pools);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Generate insights for each pool (with some rate limiting)
      for (const pool of allPools) {
        try {
          // Force new prediction generation by calling generatePrediction directly
          const newPrediction = await this.predictionService.generatePrediction(pool.id);
          console.log(`✅ Generated new AI insight for pool ${pool.id}`);
          successCount++;
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to generate insight for pool ${pool.id}:`, error);
          errorCount++;
        }
      }

      const duration = Date.now() - startTime;
      const nextRun = new Date(Date.now() + (this.config.intervalHours * 60 * 60 * 1000));
      this.config.nextRun = nextRun;

      console.log(`✅ AI Scheduler completed: ${successCount} success, ${errorCount} errors in ${duration}ms`);
      console.log(`🔄 Next scheduled run: ${nextRun.toISOString()}`);

      return {
        success: successCount,
        errors: errorCount,
        total: allPools.length
      };
    } catch (error) {
      console.error('❌ AI Scheduler bulk generation failed:', error);
      throw error;
    }
  }

  async manualTrigger(): Promise<{ success: number; errors: number; total: number }> {
    console.log('🤖 AI Scheduler: Manual trigger initiated...');
    return await this.generateAllInsights();
  }

  getStatus(): {
    enabled: boolean;
    intervalHours: number;
    lastRun?: string;
    nextRun?: string;
    isRunning: boolean;
  } {
    return {
      enabled: this.config.enabled,
      intervalHours: this.config.intervalHours,
      lastRun: this.config.lastRun?.toISOString(),
      nextRun: this.config.nextRun?.toISOString(),
      isRunning: this.intervalId !== null,
    };
  }
}

// Export singleton instance
export const aiScheduler = AISchedulerService.getInstance();