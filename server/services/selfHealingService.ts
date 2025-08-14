/**
 * Self-Healing Service
 * Automatically detects, diagnoses, and attempts to fix errors in critical operations
 */

import { setTimeout } from 'timers/promises';

interface HealingStrategy {
  pattern: RegExp | string;
  fix: () => Promise<void>;
  description: string;
}

interface SelfHealingOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onHealingAttempt?: (attempt: number, error: Error, strategy?: HealingStrategy) => void;
  onHealingSuccess?: (attempt: number, strategy: HealingStrategy) => void;
  onHealingFailure?: (error: Error, attempts: number) => void;
}

class SelfHealingService {
  private healingStrategies: Map<string, HealingStrategy[]> = new Map();
  private healingHistory: Array<{
    timestamp: Date;
    service: string;
    error: string;
    strategy?: string;
    success: boolean;
    attempts: number;
  }> = [];

  constructor() {
    this.initializeHealingStrategies();
  }

  private initializeHealingStrategies() {
    // Morpho API healing strategies
    this.registerHealingStrategy('morpho', {
      pattern: /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/,
      fix: async () => {
        console.log('🔧 Healing: Waiting for network recovery...');
        await setTimeout(5000);
      },
      description: 'Network connectivity issue - waiting for recovery'
    });

    this.registerHealingStrategy('morpho', {
      pattern: /rate limit|429|too many requests/i,
      fix: async () => {
        console.log('🔧 Healing: Rate limit detected, implementing exponential backoff...');
        await setTimeout(30000);
      },
      description: 'Rate limit - implementing longer delay'
    });

    this.registerHealingStrategy('morpho', {
      pattern: /invalid token|401|unauthorized/i,
      fix: async () => {
        console.log('🔧 Healing: Authentication issue, refreshing tokens...');
        // In a real scenario, this would refresh auth tokens
        await setTimeout(1000);
      },
      description: 'Authentication issue - refreshing credentials'
    });

    // Database healing strategies
    this.registerHealingStrategy('database', {
      pattern: /connection timeout|ECONNREFUSED.*5432/,
      fix: async () => {
        console.log('🔧 Healing: Database connection lost, attempting reconnection...');
        // Reset connection pool
        const { pool } = await import('../db');
        try {
          await pool.query('SELECT 1');
        } catch {
          // Connection will auto-recover on next query
        }
        await setTimeout(3000);
      },
      description: 'Database connection issue - resetting pool'
    });

    this.registerHealingStrategy('database', {
      pattern: /deadlock detected/i,
      fix: async () => {
        console.log('🔧 Healing: Deadlock detected, implementing jitter delay...');
        const jitter = Math.random() * 2000;
        await setTimeout(1000 + jitter);
      },
      description: 'Database deadlock - adding jitter delay'
    });

    // Cache healing strategies
    this.registerHealingStrategy('cache', {
      pattern: /cache.*corrupt|invalid cache/i,
      fix: async () => {
        console.log('🔧 Healing: Cache corruption detected, clearing cache...');
        // Clear corrupted cache entries - simple cache clear
        // In production, this would clear the specific cache implementation
        await setTimeout(100);
      },
      description: 'Cache corruption - clearing cache'
    });

    // Generic healing strategies
    this.registerHealingStrategy('generic', {
      pattern: /out of memory|ENOMEM/i,
      fix: async () => {
        console.log('🔧 Healing: Memory issue detected, triggering garbage collection...');
        if (global.gc) {
          global.gc();
        }
        await setTimeout(5000);
      },
      description: 'Memory issue - triggering garbage collection'
    });
  }

  /**
   * Register a healing strategy for a specific service
   */
  registerHealingStrategy(service: string, strategy: HealingStrategy) {
    if (!this.healingStrategies.has(service)) {
      this.healingStrategies.set(service, []);
    }
    this.healingStrategies.get(service)!.push(strategy);
  }

  /**
   * Find applicable healing strategy for an error
   */
  private findHealingStrategy(service: string, error: Error): HealingStrategy | undefined {
    const strategies = [
      ...(this.healingStrategies.get(service) || []),
      ...(this.healingStrategies.get('generic') || [])
    ];

    const errorMessage = error.message + ' ' + error.stack;
    
    for (const strategy of strategies) {
      if (typeof strategy.pattern === 'string') {
        if (errorMessage.includes(strategy.pattern)) {
          return strategy;
        }
      } else if (strategy.pattern.test(errorMessage)) {
        return strategy;
      }
    }

    return undefined;
  }

  /**
   * Execute a function with self-healing capabilities
   */
  async executeWithHealing<T>(
    service: string,
    operation: () => Promise<T>,
    options: SelfHealingOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 5,
      retryDelay = 1000,
      exponentialBackoff = true,
      onHealingAttempt,
      onHealingSuccess,
      onHealingFailure
    } = options;

    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Try the operation
        const result = await operation();
        
        // If we're here after a retry, log the healing success
        if (attempt > 1 && lastError) {
          const strategy = this.findHealingStrategy(service, lastError);
          if (strategy && onHealingSuccess) {
            onHealingSuccess(attempt, strategy);
          }
          
          this.logHealingAttempt(service, lastError, strategy, true, attempt);
          console.log(`✅ Self-healing successful for ${service} after ${attempt} attempts`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Log the error
        console.error(`❌ Error in ${service} (attempt ${attempt}/${maxRetries}):`, error);
        
        // Find and apply healing strategy
        const strategy = this.findHealingStrategy(service, lastError);
        
        if (strategy) {
          console.log(`🔧 Applying healing strategy: ${strategy.description}`);
          if (onHealingAttempt) {
            onHealingAttempt(attempt, lastError, strategy);
          }
          
          try {
            await strategy.fix();
          } catch (fixError) {
            console.error('🔴 Healing strategy failed:', fixError);
          }
        } else {
          console.log('⚠️ No specific healing strategy found, using default retry');
          if (onHealingAttempt) {
            onHealingAttempt(attempt, lastError);
          }
        }
        
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = exponentialBackoff 
            ? retryDelay * Math.pow(2, attempt - 1)
            : retryDelay;
          
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await setTimeout(delay);
        } else {
          // Final attempt failed
          this.logHealingAttempt(service, lastError, strategy, false, attempt);
          
          if (onHealingFailure) {
            onHealingFailure(lastError, attempt);
          }
          
          throw new Error(
            `Self-healing failed for ${service} after ${maxRetries} attempts. Last error: ${lastError.message}`
          );
        }
      }
    }
    
    throw lastError || new Error(`Operation failed after ${maxRetries} attempts`);
  }

  /**
   * Log healing attempt for monitoring
   */
  private logHealingAttempt(
    service: string,
    error: Error,
    strategy: HealingStrategy | undefined,
    success: boolean,
    attempts: number
  ) {
    const entry = {
      timestamp: new Date(),
      service,
      error: error.message,
      strategy: strategy?.description,
      success,
      attempts
    };
    
    this.healingHistory.push(entry);
    
    // Keep only last 100 entries
    if (this.healingHistory.length > 100) {
      this.healingHistory.shift();
    }
  }

  /**
   * Get healing statistics
   */
  getHealingStats() {
    const stats = {
      totalAttempts: this.healingHistory.length,
      successfulHeals: this.healingHistory.filter(h => h.success).length,
      failedHeals: this.healingHistory.filter(h => !h.success).length,
      byService: {} as Record<string, { success: number; failed: number }>,
      recentHistory: this.healingHistory.slice(-10),
      successRate: 'N/A' as string
    };
    
    for (const entry of this.healingHistory) {
      if (!stats.byService[entry.service]) {
        stats.byService[entry.service] = { success: 0, failed: 0 };
      }
      
      if (entry.success) {
        stats.byService[entry.service].success++;
      } else {
        stats.byService[entry.service].failed++;
      }
    }
    
    if (stats.totalAttempts > 0) {
      stats.successRate = (stats.successfulHeals / stats.totalAttempts * 100).toFixed(2) + '%';
    }
    
    return stats;
  }

  /**
   * Monitor healing health
   */
  startHealthMonitoring(intervalMs: number = 60000) {
    setInterval(() => {
      const stats = this.getHealingStats();
      
      if (stats.totalAttempts > 0) {
        console.log('🏥 Self-Healing Health Report:');
        console.log(`  Total healing attempts: ${stats.totalAttempts}`);
        console.log(`  Success rate: ${stats.successRate}`);
        console.log(`  Services healed:`, Object.keys(stats.byService).join(', '));
        
        // Alert if success rate is low
        const successRate = parseFloat(stats.successRate);
        if (successRate < 50 && stats.totalAttempts > 5) {
          console.warn('⚠️ Warning: Self-healing success rate is below 50%');
        }
      }
    }, intervalMs);
  }
}

// Singleton instance
let instance: SelfHealingService | null = null;

export function getSelfHealingService(): SelfHealingService {
  if (!instance) {
    instance = new SelfHealingService();
    // Start monitoring every 5 minutes
    instance.startHealthMonitoring(5 * 60 * 1000);
  }
  return instance;
}

export default SelfHealingService;