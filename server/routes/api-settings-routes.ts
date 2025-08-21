import { Router } from "express";
import { db } from "../db";
import { apiSettings, type InsertApiSettings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Get all API settings with status information
router.get("/api-settings", async (req, res) => {
  try {
    const settings = await db
      .select()
      .from(apiSettings)
      .orderBy(desc(apiSettings.priority), apiSettings.displayName);

    res.json(settings);
  } catch (error) {
    console.error("Error fetching API settings:", error);
    res.status(500).json({ error: "Failed to fetch API settings" });
  }
});

// Get specific API setting by service name
router.get("/api-settings/:serviceName", async (req, res) => {
  try {
    const { serviceName } = req.params;
    
    const [setting] = await db
      .select()
      .from(apiSettings)
      .where(eq(apiSettings.serviceName, serviceName));

    if (!setting) {
      return res.status(404).json({ error: "API setting not found" });
    }

    res.json(setting);
  } catch (error) {
    console.error("Error fetching API setting:", error);
    res.status(500).json({ error: "Failed to fetch API setting" });
  }
});

// Toggle API on/off
router.patch("/api-settings/:serviceName/toggle", async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { isEnabled, disabledReason = null } = req.body;

    const updateData: any = {
      isEnabled,
    };

    if (!isEnabled) {
      updateData.disabledReason = disabledReason;
      updateData.disabledBy = 'admin'; // In a real app, this would be the current user
      updateData.disabledAt = now;
    } else {
      updateData.disabledReason = null;
      updateData.disabledBy = null;
      updateData.disabledAt = null;
    }

    const [updated] = await db
      .update(apiSettings)
      .set(updateData)
      .where(eq(apiSettings.serviceName, serviceName))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "API setting not found" });
    }

    console.log(`🔧 API ${serviceName} ${isEnabled ? 'ENABLED' : 'DISABLED'} by admin`);
    
    res.json(updated);
  } catch (error) {
    console.error("Error toggling API setting:", error);
    res.status(500).json({ error: "Failed to toggle API setting" });
  }
});

// Update API health status
router.patch("/api-settings/:serviceName/health", async (req, res) => {
  try {
    const { serviceName } = req.params;
    const { healthStatus, errorCount = 0 } = req.body;

    const updateData: any = {
      healthStatus,
      lastHealthCheck: new Date(),
      errorCount,
    };

    if (errorCount > 0) {
      updateData.lastErrorAt = new Date();
    }

    const [updated] = await db
      .update(apiSettings)
      .set(updateData)
      .where(eq(apiSettings.serviceName, serviceName))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "API setting not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating API health:", error);
    res.status(500).json({ error: "Failed to update API health" });
  }
});

// Create new API setting
router.post("/api-settings", async (req, res) => {
  try {
    const apiSettingData: InsertApiSettings = req.body;

    const [created] = await db
      .insert(apiSettings)
      .values(apiSettingData)
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating API setting:", error);
    res.status(500).json({ error: "Failed to create API setting" });
  }
});

// Update API setting
router.put("/api-settings/:serviceName", async (req, res) => {
  try {
    const { serviceName } = req.params;
    const updateData: Partial<InsertApiSettings> = {
      ...req.body,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(apiSettings)
      .set(updateData)
      .where(eq(apiSettings.serviceName, serviceName))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "API setting not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating API setting:", error);
    res.status(500).json({ error: "Failed to update API setting" });
  }
});

// Delete API setting
router.delete("/api-settings/:serviceName", async (req, res) => {
  try {
    const { serviceName } = req.params;

    const [deleted] = await db
      .delete(apiSettings)
      .where(eq(apiSettings.serviceName, serviceName))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "API setting not found" });
    }

    res.json({ message: "API setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting API setting:", error);
    res.status(500).json({ error: "Failed to delete API setting" });
  }
});

// Initialize default API settings (for setup)
router.post("/api-settings/initialize", async (req, res) => {
  try {
    const defaultSettings: InsertApiSettings[] = [
      {
        serviceName: "alchemy_api",
        displayName: "Alchemy API",
        description: "Blockchain data provider for token holders, metadata, and balances",
        baseUrl: "https://eth-mainnet.g.alchemy.com/v2/",
        isEnabled: false, // Currently disabled per user request
        category: "blockchain",
        priority: 1,
        rateLimitRpm: 300,
        healthStatus: "down",
        disabledReason: "Temporarily disabled per user request",
        disabledBy: "admin",
        disabledAt: new Date(),
      },
      {
        serviceName: "etherscan_api",
        displayName: "Etherscan API",
        description: "Ethereum blockchain explorer API for contract info and transaction data",
        baseUrl: "https://api.etherscan.io/api",
        isEnabled: true,
        category: "blockchain",
        priority: 1,
        rateLimitRpm: 200,
        healthStatus: "healthy",
      },
      {
        serviceName: "morpho_api",
        displayName: "Morpho API",
        description: "GraphQL API for Morpho pool APY and TVL data",
        baseUrl: "https://api.morpho.org/graphql",
        isEnabled: true,
        category: "data",
        priority: 1,
        rateLimitRpm: 30,
        healthStatus: "healthy",
      },
      {
        serviceName: "lido_api",
        displayName: "Lido API",
        description: "Official Lido API for stETH APR data",
        baseUrl: "https://eth-api.lido.fi/v1",
        isEnabled: true,
        category: "data",
        priority: 1,
        rateLimitRpm: 60,
        healthStatus: "healthy",
      },
      {
        serviceName: "openai_api",
        displayName: "OpenAI API",
        description: "AI-powered market predictions and insights using GPT models",
        baseUrl: "https://api.openai.com/v1",
        isEnabled: true,
        category: "ai",
        priority: 2,
        rateLimitRpm: 60,
        healthStatus: "healthy",
      },
    ];

    // Insert only if not already exists
    for (const setting of defaultSettings) {
      const existing = await db
        .select()
        .from(apiSettings)
        .where(eq(apiSettings.serviceName, setting.serviceName));

      if (existing.length === 0) {
        await db.insert(apiSettings).values(setting);
        console.log(`✅ Initialized API setting: ${setting.displayName}`);
      }
    }

    res.json({ message: "API settings initialized successfully" });
  } catch (error) {
    console.error("Error initializing API settings:", error);
    res.status(500).json({ error: "Failed to initialize API settings" });
  }
});

export default router;