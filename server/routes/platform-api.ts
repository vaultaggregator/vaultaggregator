import type { Express } from "express";
import { platformApiManager } from "../services/platformApiManager";
import { PlatformServiceRegistry, defaultConfigurations } from "../services/platforms/platformServiceRegistry";
import { 
  insertPlatformApiConfigSchema, 
  type InsertPlatformApiConfig 
} from "@shared/schema";

const requireAuth = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log("Development mode: Bypassing authentication");
    return next();
  }
  
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

export function registerPlatformApiRoutes(app: Express) {
  // Get all API configurations
  app.get("/api/admin/platform-apis", requireAuth, async (req, res) => {
    try {
      const configs = await platformApiManager.getAllApiConfigs();
      res.json(configs);
    } catch (error: any) {
      console.error("Error fetching API configs:", error);
      res.status(500).json({ error: "Failed to fetch API configurations" });
    }
  });

  // Get API configurations for a specific platform
  app.get("/api/admin/platforms/:platformId/api-configs", requireAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const configs = await platformApiManager.getApiConfigsByPlatform(platformId);
      res.json(configs);
    } catch (error: any) {
      console.error("Error fetching platform API configs:", error);
      res.status(500).json({ error: "Failed to fetch platform API configurations" });
    }
  });

  // Create new API configuration
  app.post("/api/admin/platforms/:platformId/api-configs", requireAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const configData = insertPlatformApiConfigSchema.parse({
        ...req.body,
        platformId,
      });

      const config = await platformApiManager.createApiConfig(configData);
      res.status(201).json(config);
    } catch (error: any) {
      console.error("Error creating API config:", error);
      res.status(400).json({ error: error.message || "Failed to create API configuration" });
    }
  });

  // Update API configuration
  app.put("/api/admin/platform-apis/:configId", requireAuth, async (req, res) => {
    try {
      const { configId } = req.params;
      const updates = req.body;

      const config = await platformApiManager.updateApiConfig(configId, updates);
      res.json(config);
    } catch (error: any) {
      console.error("Error updating API config:", error);
      res.status(400).json({ error: error.message || "Failed to update API configuration" });
    }
  });

  // Delete API configuration
  app.delete("/api/admin/platform-apis/:configId", requireAuth, async (req, res) => {
    try {
      const { configId } = req.params;
      await platformApiManager.deleteApiConfig(configId);
      res.json({ message: "API configuration deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting API config:", error);
      res.status(500).json({ error: "Failed to delete API configuration" });
    }
  });

  // Test/execute API call for a platform
  app.post("/api/admin/platforms/:platformId/test-api", requireAuth, async (req: any, res) => {
    try {
      const { platformId } = req.params;
      const triggeredBy = req.user?.id || 'admin';
      
      const result = await platformApiManager.executePlatformApiCall(platformId, triggeredBy);
      res.json(result);
    } catch (error: any) {
      console.error("Error executing API call:", error);
      res.status(500).json({ 
        success: false,
        error: error.message || "Failed to execute API call" 
      });
    }
  });

  // Get API response history for a platform
  app.get("/api/admin/platforms/:platformId/api-history", requireAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await platformApiManager.getApiResponseHistory(platformId, limit);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching API history:", error);
      res.status(500).json({ error: "Failed to fetch API response history" });
    }
  });

  // Get API call logs for a platform
  app.get("/api/admin/platforms/:platformId/api-logs", requireAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const logs = await platformApiManager.getApiCallLogs(platformId, limit);
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching API logs:", error);
      res.status(500).json({ error: "Failed to fetch API call logs" });
    }
  });

  // Get supported platform types and their configurations
  app.get("/api/admin/platform-api-types", requireAuth, async (req, res) => {
    try {
      const supportedTypes = PlatformServiceRegistry.getServiceInfo();
      res.json({
        supportedTypes,
        defaultConfigurations,
      });
    } catch (error: any) {
      console.error("Error fetching platform API types:", error);
      res.status(500).json({ error: "Failed to fetch platform API types" });
    }
  });

  // Health check for a specific platform API
  app.post("/api/admin/platforms/:platformId/health-check", requireAuth, async (req, res) => {
    try {
      const { platformId } = req.params;
      await platformApiManager.updateHealthStatus(platformId);
      
      const configs = await platformApiManager.getApiConfigsByPlatform(platformId);
      const healthStatuses = configs.map(config => ({
        configId: config.id,
        name: config.name,
        healthStatus: config.healthStatus,
        lastHealthCheck: config.lastHealthCheck,
      }));
      
      res.json({ platformId, healthStatuses });
    } catch (error: any) {
      console.error("Error performing health check:", error);
      res.status(500).json({ error: "Failed to perform health check" });
    }
  });

  // Run health checks for all platforms
  app.post("/api/admin/platform-apis/health-check-all", requireAuth, async (req, res) => {
    try {
      await platformApiManager.runHealthChecks();
      res.json({ message: "Health checks completed for all platforms" });
    } catch (error: any) {
      console.error("Error running health checks:", error);
      res.status(500).json({ error: "Failed to run health checks" });
    }
  });
}