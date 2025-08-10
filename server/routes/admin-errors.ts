import { Router } from "express";
import { errorLogger } from "../services/errorLogger.js";
import { errorLogs } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db.js";

const router = Router();

// Get all errors with optional filtering
router.get("/", async (req, res) => {
  try {
    const { type, severity, resolved } = req.query;
    
    // For now, get all errors (can add filtering logic later)
    const errors = await errorLogger.getAllErrors(100);
    
    res.json(errors);
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

export default router;