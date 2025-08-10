import { db } from "../db.js";
import { errorLogs, type InsertErrorLog } from "../../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";

export interface ErrorLogData {
  title: string;
  description: string;
  errorType: 'API' | 'Database' | 'Validation' | 'Service' | 'External' | 'Authentication';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  stackTrace?: string;
  fixPrompt: string;
  metadata?: any;
}

class ErrorLogger {
  
  /**
   * 🚨 Creative Error Logger - Logs errors with human-readable descriptions and fix prompts
   */
  async logError(errorData: ErrorLogData): Promise<string> {
    try {
      // Check if similar error exists (same title + source)
      const existingError = await db
        .select()
        .from(errorLogs)
        .where(
          and(
            eq(errorLogs.title, errorData.title),
            eq(errorLogs.source, errorData.source),
            eq(errorLogs.isResolved, false)
          )
        )
        .limit(1);

      if (existingError.length > 0) {
        // Update existing error: increment count and update last occurrence
        await db
          .update(errorLogs)
          .set({
            count: existingError[0].count + 1,
            lastOccurredAt: new Date(),
            metadata: errorData.metadata || existingError[0].metadata
          })
          .where(eq(errorLogs.id, existingError[0].id));
        
        return existingError[0].id;
      } else {
        // Create new error log
        const [newError] = await db
          .insert(errorLogs)
          .values({
            title: errorData.title,
            description: errorData.description,
            errorType: errorData.errorType,
            severity: errorData.severity,
            source: errorData.source,
            stackTrace: errorData.stackTrace,
            fixPrompt: errorData.fixPrompt,
            metadata: errorData.metadata,
          })
          .returning({ id: errorLogs.id });

        return newError.id;
      }
    } catch (err) {
      console.error('Failed to log error to database:', err);
      // Prevent infinite loops
      return 'failed-to-log';
    }
  }

  /**
   * 🔧 Pre-built error templates for common issues
   */
  async logEtherscanRateLimit(details: { url: string; retryCount: number }) {
    return this.logError({
      title: "Etherscan API Rate Limit Hit",
      description: `The Etherscan API returned a rate limit error. This is affecting token data, holder information, and transfer history. The system is retrying but users may see stale data.`,
      errorType: "API",
      severity: "medium",
      source: "EtherscanService",
      fixPrompt: "The Etherscan API is hitting rate limits frequently. You need to check if the ETHERSCAN_API_KEY is properly configured and has sufficient request limits. Consider implementing better request queuing or getting a higher tier API key. Also check if the retry logic is working correctly.",
      metadata: {
        url: details.url,
        retryCount: details.retryCount,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logDataSyncFailure(details: { poolId: string; error: string }) {
    return this.logError({
      title: "Pool Data Synchronization Failed", 
      description: `Failed to sync data for pool ${details.poolId}. This means the pool's APY, TVL, and other metrics might be outdated for users.`,
      errorType: "Service",
      severity: "high",
      source: "DefiLlamaService",
      fixPrompt: "A pool failed to synchronize with DeFi Llama data. Check if the pool's defiLlamaId is correct, verify the DeFi Llama API is responding, and ensure the pool mapping logic is working. You might need to manually update the pool's defiLlamaId or check for API changes.",
      metadata: {
        poolId: details.poolId,
        error: details.error,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logTokenMappingError(details: { token: string; poolId: string }) {
    return this.logError({
      title: "Token Address Mapping Failed",
      description: `The system couldn't map token "${details.token}" to a valid contract address for pool ${details.poolId}. This affects holder analytics and transfer data.`,
      errorType: "Validation",
      severity: "medium", 
      source: "TokenMappingService",
      fixPrompt: "A token couldn't be mapped to its contract address. Add the missing token mapping in the token address mapping system, or check if DeFi Llama is returning unexpected token symbols. Update the token mapping logic to handle this token type.",
      metadata: {
        token: details.token,
        poolId: details.poolId,
        timestamp: new Date().toISOString()
      }
    });
  }

  async logDatabaseConnectionError(details: { operation: string; error: string }) {
    return this.logError({
      title: "Database Connection Error",
      description: `Database operation "${details.operation}" failed. This is a critical issue that affects all app functionality.`,
      errorType: "Database",
      severity: "critical",
      source: "DatabaseConnection",
      fixPrompt: "Database connection failed. Check if the DATABASE_URL environment variable is correct, verify the PostgreSQL database is running and accessible, and check for any network connectivity issues. This is urgent and needs immediate attention.",
      metadata: {
        operation: details.operation,
        error: details.error,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get all unresolved errors for admin dashboard
   */
  async getUnresolvedErrors() {
    return db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.isResolved, false))
      .orderBy(desc(errorLogs.lastOccurredAt))
      .limit(100);
  }

  /**
   * Get all errors (resolved and unresolved) for admin dashboard
   */
  async getAllErrors(limit = 50) {
    return db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.lastOccurredAt))
      .limit(limit);
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string, resolvedBy: string) {
    return db
      .update(errorLogs)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy
      })
      .where(eq(errorLogs.id, errorId));
  }

  /**
   * Get error statistics for admin dashboard
   */
  async getErrorStats() {
    const allErrors = await db.select().from(errorLogs);
    
    const stats = {
      total: allErrors.length,
      unresolved: allErrors.filter(e => !e.isResolved).length,
      critical: allErrors.filter(e => e.severity === 'critical').length,
      high: allErrors.filter(e => e.severity === 'high').length,
      byType: allErrors.reduce((acc, err) => {
        acc[err.errorType] = (acc[err.errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return stats;
  }
}

export const errorLogger = new ErrorLogger();