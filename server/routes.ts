import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPoolSchema, insertPlatformSchema, insertChainSchema, insertNoteSchema, insertUserSchema, insertApiKeySchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

import session from "express-session";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  // Middleware to check if user is authenticated admin
  const requireAuth = (req: any, res: any, next: any) => {
    console.log("Auth check:", { 
      sessionId: req.sessionID, 
      userId: req.session?.userId, 
      hasSession: !!req.session,
      cookies: req.headers.cookie 
    });
    if (req.session?.userId) {
      next();
    } else {
      res.status(401).json({ message: "Authentication required" });
    }
  };

  // API Key authentication middleware
  const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!apiKey) {
      return res.status(401).json({ 
        error: "API key required", 
        message: "Include your API key in the Authorization header as 'Bearer YOUR_API_KEY'" 
      });
    }

    try {
      const keyData = await storage.getApiKeyByKey(apiKey);
      if (!keyData || !keyData.isActive) {
        return res.status(401).json({ 
          error: "Invalid API key", 
          message: "The provided API key is invalid or inactive" 
        });
      }

      // Check rate limits
      const usageCount = await storage.getApiKeyUsage(keyData.id, 1); // Last hour
      if (usageCount >= keyData.requestsPerHour) {
        return res.status(429).json({ 
          error: "Rate limit exceeded", 
          message: `You have exceeded the rate limit of ${keyData.requestsPerHour} requests per hour` 
        });
      }

      // Log the API usage
      await storage.logApiKeyUsage({
        apiKeyId: keyData.id,
        endpoint: req.path,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || null,
      });

      // Update the API key usage count and last used timestamp
      await storage.updateApiKey(keyData.id, {
        usageCount: keyData.usageCount + 1,
        lastUsed: new Date(),
      });

      (req as any).apiKey = keyData;
      next();
    } catch (error) {
      console.error("API key validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      res.json({ message: "Login successful", user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin user creation route (for initial setup)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });

      res.status(201).json({ message: "User created successfully", user: { id: user.id, username: user.username } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  // Public API routes (require API key authentication)
  app.get("/api/v1/pools", requireApiKey, async (req, res) => {
    try {
      const { chainId, platformId, search, limit = "50", offset = "0" } = req.query;
      
      const pools = await storage.getPools({
        chainId: chainId as string,
        platformId: platformId as string,
        search: search as string,
        onlyVisible: true,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json({ pools });
    } catch (error) {
      console.error("Error fetching pools:", error);
      res.status(500).json({ error: "Failed to fetch pools" });
    }
  });

  app.get("/api/v1/pools/:id", requireApiKey, async (req, res) => {
    try {
      const pool = await storage.getPoolById(req.params.id);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      console.error("Error fetching pool:", error);
      res.status(500).json({ error: "Failed to fetch pool" });
    }
  });

  app.get("/api/v1/chains", requireApiKey, async (req, res) => {
    try {
      const chains = await storage.getActiveChains();
      res.json({ chains });
    } catch (error) {
      console.error("Error fetching chains:", error);
      res.status(500).json({ error: "Failed to fetch chains" });
    }
  });

  app.get("/api/v1/platforms", requireApiKey, async (req, res) => {
    try {
      const platforms = await storage.getActivePlatforms();
      res.json({ platforms });
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.get("/api/v1/stats", requireApiKey, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Pool routes
  app.get("/api/pools", async (req, res) => {
    try {
      const { 
        chainId, 
        platformId, 
        search, 
        onlyVisible = 'true', 
        limit = '50', 
        offset = '0' 
      } = req.query;

      const pools = await storage.getPools({
        chainId: chainId as string,
        platformId: platformId as string,
        search: search as string,
        onlyVisible: onlyVisible === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.json(pools);
    } catch (error) {
      console.error("Error fetching pools:", error);
      res.status(500).json({ message: "Failed to fetch pools" });
    }
  });

  app.get("/api/pools/:id", async (req, res) => {
    try {
      const pool = await storage.getPoolById(req.params.id);
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      console.error("Error fetching pool:", error);
      res.status(500).json({ message: "Failed to fetch pool" });
    }
  });

  // DeFi Llama integration endpoints
  app.get("/api/pools/:id/defillama", async (req, res) => {
    try {
      const { DefiLlamaService } = await import("./services/defiLlamaService");
      
      const pool = await storage.getPoolById(req.params.id);
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }

      // Try to find additional data from DeFi Llama
      const defiLlamaData = await DefiLlamaService.searchPools({
        project: pool.platform.name,
        chain: pool.chain.name,
        symbol: pool.tokenPair
      });

      res.json({
        pool,
        defiLlamaData: defiLlamaData.slice(0, 5), // Return top 5 matches
        additionalInfo: {
          hasHistoricalData: defiLlamaData.length > 0,
          matchCount: defiLlamaData.length
        }
      });
    } catch (error) {
      console.error("Error fetching DeFi Llama data:", error);
      res.status(500).json({ message: "Failed to fetch additional pool data" });
    }
  });

  app.get("/api/pools/:id/chart", async (req, res) => {
    try {
      const { DefiLlamaService } = await import("./services/defiLlamaService");
      
      const pool = await storage.getPoolById(req.params.id);
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }

      // Search for matching pools in DeFi Llama
      const defiLlamaPools = await DefiLlamaService.searchPools({
        project: pool.platform.name,
        chain: pool.chain.name
      });

      if (defiLlamaPools.length === 0) {
        return res.json({ 
          hasData: false, 
          message: "No historical data available",
          mockData: [
            { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], apy: parseFloat(pool.apy || '0') * 0.95, tvl: parseFloat(pool.tvl || '0') * 0.9 },
            { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], apy: parseFloat(pool.apy || '0') * 1.02, tvl: parseFloat(pool.tvl || '0') * 0.95 },
            { date: new Date().toISOString().split('T')[0], apy: parseFloat(pool.apy || '0'), tvl: parseFloat(pool.tvl || '0') }
          ]
        });
      }

      // Get the best matching pool
      const bestMatch = defiLlamaPools[0];
      const historicalData = await DefiLlamaService.getPoolHistoricalData(bestMatch.pool);

      if (historicalData.length === 0) {
        return res.json({ 
          hasData: false, 
          message: "No historical data available for this pool",
          poolInfo: bestMatch
        });
      }

      // Format the data for our chart
      const chartData = historicalData
        .slice(-30) // Last 30 data points
        .map(point => ({
          date: new Date(point.timestamp).toISOString().split('T')[0],
          apy: point.apy,
          tvl: point.tvlUsd
        }));

      res.json({
        hasData: true,
        data: chartData,
        poolInfo: bestMatch,
        summary: {
          dataPoints: chartData.length,
          averageApy: chartData.reduce((sum, point) => sum + point.apy, 0) / chartData.length,
          minApy: Math.min(...chartData.map(p => p.apy)),
          maxApy: Math.max(...chartData.map(p => p.apy))
        }
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      res.status(500).json({ message: "Failed to fetch chart data" });
    }
  });



  app.post("/api/pools", async (req, res) => {
    try {
      const poolData = insertPoolSchema.parse(req.body);
      const pool = await storage.createPool(poolData);
      res.status(201).json(pool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating pool:", error);
      res.status(500).json({ message: "Failed to create pool" });
    }
  });

  // Admin-only pool management routes
  app.get("/api/admin/pools", requireAuth, async (req, res) => {
    try {
      const { 
        chainId, 
        platformId, 
        search, 
        visibility,
        limit = '50', // Much smaller default for better performance
        offset = '0' 
      } = req.query;

      console.log("Admin pools request:", { chainId, platformId, search, visibility, limit, offset });

      // Get pools with pagination
      const poolsResponse = await storage.getAdminPools({
        chainId: chainId as string,
        platformId: platformId as string,
        search: search as string,
        visibility: visibility as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      console.log(`Returning ${poolsResponse.pools.length} admin pools out of ${poolsResponse.total} total`);
      
      res.json({
        pools: poolsResponse.pools,
        pagination: {
          total: poolsResponse.total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: (parseInt(offset as string) + poolsResponse.pools.length) < poolsResponse.total,
          showing: poolsResponse.pools.length
        }
      });
    } catch (error) {
      console.error("Error fetching admin pools:", error);
      res.status(500).json({ message: "Failed to fetch pools" });
    }
  });

  app.put("/api/admin/pools/:id/visibility", requireAuth, async (req, res) => {
    try {
      const { isVisible } = req.body;
      console.log("Updating pool visibility:", { poolId: req.params.id, isVisible, userId: (req.session as any).userId });
      
      if (typeof isVisible !== 'boolean') {
        return res.status(400).json({ message: "isVisible must be a boolean" });
      }

      const pool = await storage.updatePool(req.params.id, { isVisible });
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }
      
      console.log("Pool visibility updated successfully:", { poolId: pool.id, isVisible: pool.isVisible });
      res.json(pool);
    } catch (error) {
      console.error("Error updating pool visibility:", error);
      res.status(500).json({ message: "Failed to update pool visibility" });
    }
  });

  app.put("/api/admin/pools/:id", requireAuth, async (req, res) => {
    try {
      const { tokenPair } = req.body;
      
      if (!tokenPair || typeof tokenPair !== 'string') {
        return res.status(400).json({ message: "tokenPair must be a string" });
      }

      const pool = await storage.updatePool(req.params.id, { tokenPair });
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }
      
      res.json(pool);
    } catch (error) {
      console.error("Error updating pool:", error);
      res.status(500).json({ message: "Failed to update pool" });
    }
  });

  app.put("/api/admin/platforms/:id", requireAuth, async (req, res) => {
    try {
      const { displayName, name, website } = req.body;
      
      const updateData: any = {};
      if (displayName) updateData.displayName = displayName;
      if (name) updateData.name = name;
      if (website !== undefined) updateData.website = website;

      const platform = await storage.updatePlatform(req.params.id, updateData);
      if (!platform) {
        return res.status(404).json({ message: "Platform not found" });
      }
      
      res.json(platform);
    } catch (error) {
      console.error("Error updating platform:", error);
      res.status(500).json({ message: "Failed to update platform" });
    }
  });

  // Network icon upload routes
  app.post("/api/admin/chains/:id/icon/upload", requireAuth, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const iconName = `${req.params.id}-${Date.now()}.png`;
      const uploadURL = await objectStorageService.getNetworkIconUploadURL(iconName);
      
      res.json({ uploadURL, iconName });
    } catch (error) {
      console.error("Error getting network icon upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/admin/chains/:id/icon", requireAuth, async (req, res) => {
    try {
      const { iconUrl } = req.body;
      
      if (!iconUrl || typeof iconUrl !== 'string') {
        return res.status(400).json({ message: "iconUrl must be a string" });
      }

      // Convert the GCS URL to a public object path
      const iconPath = iconUrl.replace(/.*\/network-icons\//, '/public-objects/network-icons/');
      
      const chain = await storage.updateChain(req.params.id, { iconUrl: iconPath });
      if (!chain) {
        return res.status(404).json({ message: "Network not found" });
      }
      
      res.json(chain);
    } catch (error) {
      console.error("Error updating network icon:", error);
      res.status(500).json({ message: "Failed to update network icon" });
    }
  });

  // Admin chain update route
  app.put("/api/admin/chains/:id", requireAuth, async (req, res) => {
    try {
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      const chain = await storage.updateChain(req.params.id, { isActive });
      if (!chain) {
        return res.status(404).json({ message: "Chain not found" });
      }
      
      res.json(chain);
    } catch (error) {
      console.error("Error updating chain:", error);
      res.status(500).json({ message: "Failed to update chain" });
    }
  });

  // Public categories route
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      // Only return active categories for public API
      const activeCategories = categories.filter(cat => cat.isActive);
      res.json(activeCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Admin category management routes
  app.get("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      // First validate basic required fields
      const { name, displayName, description, color, iconUrl, sortOrder, isActive } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Name and display name are required" }] 
        });
      }
      
      // Auto-generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      const categoryData = {
        name,
        displayName,
        slug,
        description: description || null,
        color: color || "#3B82F6",
        iconUrl: iconUrl || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true
      };
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(400).json({ message: "Category name or slug already exists" });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const updateData = req.body;
      const category = await storage.updateCategory(req.params.id, updateData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Pool-Category assignment routes
  app.get("/api/pools/:poolId/categories", async (req, res) => {
    try {
      const categories = await storage.getPoolCategories(req.params.poolId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching pool categories:", error);
      res.status(500).json({ message: "Failed to fetch pool categories" });
    }
  });

  app.put("/api/admin/pools/:poolId/categories", requireAuth, async (req, res) => {
    try {
      const { categoryIds } = req.body;
      
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "categoryIds must be an array" });
      }

      await storage.updatePoolCategories(req.params.poolId, categoryIds);
      const updatedCategories = await storage.getPoolCategories(req.params.poolId);
      res.json(updatedCategories);
    } catch (error) {
      console.error("Error updating pool categories:", error);
      res.status(500).json({ message: "Failed to update pool categories" });
    }
  });

  // Category icon upload routes
  app.post("/api/admin/categories/:id/icon/upload", requireAuth, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const iconName = `category-${req.params.id}-${Date.now()}.png`;
      const uploadURL = await objectStorageService.getCategoryIconUploadURL(iconName);
      
      res.json({ uploadURL, iconName });
    } catch (error) {
      console.error("Error getting category icon upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/admin/categories/:id/icon", requireAuth, async (req, res) => {
    try {
      const { iconUrl } = req.body;
      
      if (!iconUrl || typeof iconUrl !== 'string') {
        return res.status(400).json({ message: "iconUrl must be a string" });
      }

      // Convert the GCS URL to a public object path
      const iconPath = iconUrl.replace(/.*\/category-icons\//, '/public-objects/category-icons/');
      
      const category = await storage.updateCategory(req.params.id, { iconUrl: iconPath });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category icon:", error);
      res.status(500).json({ message: "Failed to update category icon" });
    }
  });

  // Platform logo upload endpoints
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting platform logo upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/platform-logos", requireAuth, async (req, res) => {
    try {
      const { platformId, logoUrl } = req.body;
      
      if (!platformId || !logoUrl) {
        return res.status(400).json({ message: "platformId and logoUrl are required" });
      }

      // Convert the GCS URL to a public object path
      const logoPath = logoUrl.replace(/.*\/objects\/uploads\//, '/objects/uploads/');
      
      const platform = await storage.updatePlatform(platformId, { logoUrl: logoPath });
      if (!platform) {
        return res.status(404).json({ message: "Platform not found" });
      }
      
      res.json(platform);
    } catch (error) {
      console.error("Error updating platform logo:", error);
      res.status(500).json({ message: "Failed to update platform logo" });
    }
  });

  // Serve private objects (platform logos)
  app.get("/objects/uploads/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, objectStorageClient } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const parseObjectPath = (path: string): { bucketName: string; objectName: string; } => {
        if (!path.startsWith("/")) {
          path = `/${path}`;
        }
        const pathParts = path.split("/");
        if (pathParts.length < 3) {
          throw new Error("Invalid path: must contain at least a bucket name");
        }
        const bucketName = pathParts[1];
        const objectName = pathParts.slice(2).join("/");
        return { bucketName, objectName };
      };
      
      const privateObjectDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/uploads/${req.params.objectPath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "File not found" });
      }
      
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving private object:", error);
      res.status(500).json({ error: "Error serving file" });
    }
  });

  // Serve public objects (including network icons)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      
      const filePath = req.params.filePath;
      const file = await objectStorageService.searchPublicObject(filePath);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/pools/:id", async (req, res) => {
    try {
      const poolData = insertPoolSchema.partial().parse(req.body);
      const pool = await storage.updatePool(req.params.id, poolData);
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating pool:", error);
      res.status(500).json({ message: "Failed to update pool" });
    }
  });

  app.delete("/api/pools/:id", async (req, res) => {
    try {
      const success = await storage.deletePool(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Pool not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting pool:", error);
      res.status(500).json({ message: "Failed to delete pool" });
    }
  });

  // Chain routes
  app.get("/api/chains", async (req, res) => {
    try {
      const chains = await storage.getActiveChains();
      res.json(chains);
    } catch (error) {
      console.error("Error fetching chains:", error);
      res.status(500).json({ message: "Failed to fetch chains" });
    }
  });

  app.post("/api/chains", async (req, res) => {
    try {
      const chainData = insertChainSchema.parse(req.body);
      const chain = await storage.createChain(chainData);
      res.status(201).json(chain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating chain:", error);
      res.status(500).json({ message: "Failed to create chain" });
    }
  });

  // Platform routes
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getActivePlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  app.post("/api/platforms", async (req, res) => {
    try {
      const platformData = insertPlatformSchema.parse(req.body);
      const platform = await storage.createPlatform(platformData);
      res.status(201).json(platform);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating platform:", error);
      res.status(500).json({ message: "Failed to create platform" });
    }
  });

  // Notes routes
  app.get("/api/pools/:poolId/notes", async (req, res) => {
    try {
      const notes = await storage.getNotesByPool(req.params.poolId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/pools/:poolId/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse({
        ...req.body,
        poolId: req.params.poolId,
      });
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", async (req, res) => {
    try {
      const noteData = insertNoteSchema.partial().parse(req.body);
      const note = await storage.updateNote(req.params.id, noteData);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const success = await storage.deleteNote(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Manual sync route for admin
  app.post("/api/sync", async (req, res) => {
    try {
      const { syncData } = await import("./services/defi-llama");
      await syncData();
      res.json({ message: "Data sync completed successfully" });
    } catch (error) {
      console.error("Error during manual sync:", error);
      res.status(500).json({ message: "Failed to sync data" });
    }
  });

  // API Key management endpoints (admin only)
  app.post("/api/admin/api-keys", requireAuth, async (req, res) => {
    try {
      const { name, tier = "free" } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Generate a secure API key
      const apiKey = `va_${crypto.randomBytes(32).toString('hex')}`;
      
      const requestsPerHour = tier === "pro" ? 10000 : 1000;

      const newApiKey = await storage.createApiKey({
        key: apiKey,
        name,
        tier,
        requestsPerHour,
        usageCount: 0,
        isActive: true,
      });

      res.json({ apiKey: newApiKey });
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.get("/api/admin/api-keys", requireAuth, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys();
      // Don't expose the actual key in the list
      const sanitizedKeys = apiKeys.map(key => ({
        ...key,
        key: `${key.key.slice(0, 10)}...`,
      }));
      res.json({ apiKeys: sanitizedKeys });
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.delete("/api/admin/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteApiKey(req.params.id);
      if (success) {
        res.json({ message: "API key deleted successfully" });
      } else {
        res.status(404).json({ error: "API key not found" });
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // Pool-Category assignment routes
  app.post("/api/admin/pools/:poolId/categories/:categoryId", requireAuth, async (req, res) => {
    try {
      const poolCategory = await storage.addPoolToCategory(req.params.poolId, req.params.categoryId);
      res.status(201).json(poolCategory);
    } catch (error) {
      console.error("Error adding pool to category:", error);
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(400).json({ message: "Pool already assigned to this category" });
      }
      res.status(500).json({ message: "Failed to assign pool to category" });
    }
  });

  app.delete("/api/admin/pools/:poolId/categories/:categoryId", requireAuth, async (req, res) => {
    try {
      const removed = await storage.removePoolFromCategory(req.params.poolId, req.params.categoryId);
      if (!removed) {
        return res.status(404).json({ message: "Pool-category assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing pool from category:", error);
      res.status(500).json({ message: "Failed to remove pool from category" });
    }
  });

  app.get("/api/pools/:poolId/categories", async (req, res) => {
    try {
      const categories = await storage.getPoolCategories(req.params.poolId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching pool categories:", error);
      res.status(500).json({ message: "Failed to fetch pool categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
