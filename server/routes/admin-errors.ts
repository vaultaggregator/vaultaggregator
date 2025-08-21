import { Router } from "express";
import { errorLogger } from "../services/errorLogger.js";
import { errorLogs } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db.js";

const router = Router();

// Get all errors with comprehensive filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { 
      type, 
      severity, 
      resolved, 
      source,
      limit = '50',
      offset = '0',
      sortBy = 'timestamp',
      sortOrder = 'desc',
      search
    } = req.query;
    
    // Enhanced filtering with search capabilities
    const filters = {
      errorType: type as string,
      severity: severity as string,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      source: source as string,
      search: search as string
    };
    
    const options = {
      limit: Math.min(parseInt(limit as string) || 50, 200), // Max 200 results
      offset: parseInt(offset as string) || 0,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };
    
    const result = await errorLogger.getErrorsWithFilters(filters, options);
    
    res.json({
      errors: result.errors,
      totalCount: result.totalCount,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        hasMore: result.totalCount > (options.offset + options.limit)
      },
      appliedFilters: filters
    });
  } catch (error) {
    console.error("Failed to fetch errors:", error);
    res.status(500).json({ error: "Failed to fetch errors" });
  }
});

// Get error statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await errorLogger.getErrorStats();
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch error stats:", error);
    res.status(500).json({ error: "Failed to fetch error stats" });
  }
});

// Get unresolved errors only
router.get("/unresolved", async (req, res) => {
  try {
    const errors = await errorLogger.getUnresolvedErrors();
    res.json(errors);
  } catch (error) {
    console.error("Failed to fetch unresolved errors:", error);
    res.status(500).json({ error: "Failed to fetch unresolved errors" });
  }
});

// Mark error as resolved
router.post("/:errorId/resolve", async (req, res) => {
  try {
    const { errorId } = req.params;
    const { resolvedBy } = req.body;
    
    if (!resolvedBy) {
      return res.status(400).json({ error: "resolvedBy is required" });
    }
    
    await errorLogger.resolveError(errorId, resolvedBy);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to resolve error:", error);
    res.status(500).json({ error: "Failed to resolve error" });
  }
});

// Manually create an error log (for testing or manual logging)
router.post("/", async (req, res) => {
  try {
    const errorData = req.body;
    const errorId = await errorLogger.logError(errorData);
    res.json({ id: errorId, success: true });
  } catch (error) {
    console.error("Failed to create error log:", error);
    res.status(500).json({ error: "Failed to create error log" });
  }
});

// Get error details with full context
router.get("/:errorId", async (req, res) => {
  try {
    const { errorId } = req.params;
    const errorDetails = await errorLogger.getErrorById(errorId);
    
    if (!errorDetails) {
      return res.status(404).json({ error: "Error not found" });
    }
    
    res.json(errorDetails);
  } catch (error) {
    console.error("Failed to fetch error details:", error);
    res.status(500).json({ error: "Failed to fetch error details" });
  }
});

// Get system logs (new feature for comprehensive monitoring)
router.get("/system/logs", async (req, res) => {
  try {
    const { 
      level = 'info',
      limit = '100',
      offset = '0',
      startTime,
      endTime 
    } = req.query;
    
    // This will be enhanced when we add system logging service
    const logs = await errorLogger.getSystemLogs({
      level: level as string,
      limit: parseInt(limit as string) || 100,
      offset: parseInt(offset as string) || 0,
      startTime: startTime as string,
      endTime: endTime as string
    });
    
    res.json(logs);
  } catch (error) {
    console.error("Failed to fetch system logs:", error);
    res.status(500).json({ error: "Failed to fetch system logs" });
  }
});

// Export error logs for analysis
router.get("/export/:format", async (req, res) => {
  try {
    const { format } = req.params;
    const { startDate, endDate, severity } = req.query;
    
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ error: "Supported formats: json, csv" });
    }
    
    const exportData = await errorLogger.exportErrors({
      format: format as 'json' | 'csv',
      startDate: startDate as string,
      endDate: endDate as string,
      severity: severity as string
    });
    
    const filename = `error-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    
    res.send(exportData);
  } catch (error) {
    console.error("Failed to export error logs:", error);
    res.status(500).json({ error: "Failed to export error logs" });
  }
});

export default router;