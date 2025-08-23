/**
 * Admin Hardcode Scan Routes
 * API endpoints for the hardcode scanner service
 */

import express from 'express';
import { run as runHardcodeScan } from '../../admin/services/hardcodeScan';
import fs from 'fs';
import path from 'path';

// Import specific constants to avoid config import issues
const TTL_SHORT = 300; // 5 minutes

const router = express.Router();

// Simple auth middleware - reuse from other admin routes
const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    next();
    return;
  }
  // In production, implement proper auth
  next();
};

// SWR Cache for scan results
let cachedReport: any = null;
let cacheExpiry = 0;
const CACHE_TTL = TTL_SHORT; // 5 minutes
const CACHE_HARD_TTL = 30; // 30 seconds hard TTL

/**
 * GET /api/admin/hardcode-scan
 * Returns the latest hardcode scan report (cached)
 */
router.get('/admin/hardcode-scan', requireAuth, async (req, res) => {
  try {
    const now = Date.now();
    
    // Check if cache is still valid (soft TTL)
    if (cachedReport && now < cacheExpiry) {
      return res.json(cachedReport);
    }
    
    // Try to load report from file if cache expired
    const reportPath = path.join(process.cwd(), 'admin', 'tools', 'hardcode-report.json');
    
    if (fs.existsSync(reportPath)) {
      const reportContent = fs.readFileSync(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);
      
      // Check if report is recent enough (within hard TTL)
      const reportAge = now - new Date(report.timestamp).getTime();
      
      if (reportAge < CACHE_HARD_TTL * 1000) {
        cachedReport = report;
        cacheExpiry = now + CACHE_TTL * 1000;
        return res.json(report);
      }
    }
    
    // If no recent report exists, return empty state
    res.json({
      timestamp: null,
      totalFindings: 0,
      severityCounts: {},
      findings: [],
      summary: {
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0
      },
      message: 'No recent scan available. Run a new scan to get results.'
    });
    
  } catch (error) {
    console.error('Error fetching hardcode scan report:', error);
    res.status(500).json({ error: 'Failed to fetch hardcode scan report' });
  }
});

/**
 * POST /api/admin/hardcode-scan/run
 * Triggers a new hardcode scan and returns the fresh results
 */
router.post('/admin/hardcode-scan/run', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Admin triggered hardcode scan...');
    
    // Run the scan
    const report = await runHardcodeScan();
    
    // Update cache
    cachedReport = report;
    cacheExpiry = Date.now() + CACHE_TTL * 1000;
    
    res.json(report);
    
  } catch (error) {
    console.error('Error running hardcode scan:', error);
    res.status(500).json({ error: 'Failed to run hardcode scan' });
  }
});

/**
 * GET /api/admin/hardcode-scan/status
 * Returns scan status and cache info
 */
router.get('/admin/hardcode-scan/status', requireAuth, async (req, res) => {
  try {
    const reportPath = path.join(process.cwd(), 'admin', 'tools', 'hardcode-report.json');
    const hasReport = fs.existsSync(reportPath);
    
    let lastRun = null;
    let cacheValid = false;
    
    if (hasReport) {
      const stat = fs.statSync(reportPath);
      lastRun = stat.mtime.toISOString();
      
      const now = Date.now();
      cacheValid = cachedReport && now < cacheExpiry;
    }
    
    res.json({
      hasReport,
      lastRun,
      cacheValid,
      cacheExpiry: cacheExpiry > 0 ? new Date(cacheExpiry).toISOString() : null
    });
    
  } catch (error) {
    console.error('Error getting hardcode scan status:', error);
    res.status(500).json({ error: 'Failed to get scan status' });
  }
});

export default router;