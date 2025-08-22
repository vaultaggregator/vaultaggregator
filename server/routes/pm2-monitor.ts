import express from "express";

const router = express.Router();

// Temporary middleware - will use centralized auth from main routes
const requireAuth = (req: any, res: any, next: any) => {
  // This will be replaced with centralized authentication
  next();
};

// PM2 monitoring endpoints integrated into main application
// This makes PM2 monitoring accessible via the external Replit URL

/**
 * Get PM2 process status - accessible via external URL
 */
router.get("/monitor/status", requireAuth, async (req, res) => {
  try {
    // Use direct PM2 access instead of relying on monitor server
    const pm2 = require('pm2');
    
    pm2.list((err: any, list: any[]) => {
      if (err) {
        return res.status(500).json({ 
          error: "PM2 not available", 
          message: "PM2 daemon not running or not accessible" 
        });
      }
      
      const data = list.map((p: any) => ({
        name: p.name,
        pid: p.pid,
        status: p.pm2_env.status,
        restarts: p.pm2_env.restart_time,
        cpu: p.monit.cpu,
        memory_mb: Math.round((p.monit.memory || 0) / 1048576),
        uptime_ms: Date.now() - (p.pm2_env.pm_uptime || Date.now()),
        uptime_display: formatUptime(Date.now() - (p.pm2_env.pm_uptime || Date.now()))
      }));
      
      res.json(data);
    });
  } catch (error) {
    console.error("Error fetching PM2 status:", error);
    res.status(500).json({ 
      error: "Failed to fetch PM2 status",
      message: "PM2 monitoring service unavailable"
    });
  }
});

// Helper function to format uptime
function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get PM2 service logs
 */
router.get("/monitor/logs/:serviceName", requireAuth, async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { lines = '200' } = req.query;
    
    // Read log files directly
    const fs = require('fs');
    const path = require('path');
    
    const logFile = path.join('logs', `${serviceName}.log`);
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const logLines = logContent.split('\n');
      const recentLines = logLines.slice(-parseInt(lines as string)).join('\n');
      res.type('text/plain').send(recentLines);
    } else {
      res.status(404).json({ 
        error: "Log file not found",
        message: `No log file found for service: ${serviceName}`
      });
    }
  } catch (error) {
    console.error("Error fetching service logs:", error);
    res.status(500).json({ 
      error: "Failed to fetch service logs",
      message: "Log retrieval service unavailable"
    });
  }
});

/**
 * Control PM2 services (start/stop/restart)
 */
router.post("/monitor/:action/:serviceName", requireAuth, async (req, res) => {
  try {
    const { action, serviceName } = req.params;
    
    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ 
        error: "Invalid action",
        message: "Action must be one of: start, stop, restart"
      });
    }
    
    // Use direct PM2 control
    const pm2 = require('pm2');
    
    pm2[action](serviceName, (err: any) => {
      if (err) {
        return res.status(500).json({ 
          error: `Failed to ${action} service`,
          message: String(err)
        });
      }
      
      res.json({
        success: true,
        message: `Service ${serviceName} ${action}ed successfully`,
        service: serviceName,
        action,
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error(`Error ${req.params.action}ing service:`, error);
    res.status(500).json({ 
      error: `Failed to ${req.params.action} service`,
      message: "PM2 control service unavailable"
    });
  }
});

/**
 * Get overall PM2 system health
 */
router.get("/monitor/health", requireAuth, async (req, res) => {
  try {
    // Direct PM2 health check
    const pm2 = require('pm2');
    
    pm2.list((err: any, list: any[]) => {
      if (err) {
        return res.status(500).json({
          status: "unhealthy",
          message: "PM2 daemon not available",
          processes: null,
          timestamp: new Date().toISOString()
        });
      }
      
      const processes = {
        total: list.length,
        online: list.filter((p: any) => p.pm2_env.status === 'online').length,
        stopped: list.filter((p: any) => p.pm2_env.status === 'stopped').length,
        errored: list.filter((p: any) => p.pm2_env.status === 'errored').length
      };
      
      res.json({
        status: processes.online > 0 ? "healthy" : "degraded",
        message: `${processes.online} of ${processes.total} services running`,
        processes,
        timestamp: new Date().toISOString()
      });
    });
    
  } catch (error) {
    console.error("Error checking PM2 health:", error);
    res.status(500).json({ 
      error: "Failed to check PM2 health",
      message: "Health check service unavailable"
    });
  }
});

export default router;