import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPoolSchema, insertPlatformSchema, insertChainSchema, insertNoteSchema, insertUserSchema, insertApiKeySchema, pools } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import { db } from "./db";
import { and, eq, desc, asc, like, or, sql, count, gte, lte, isNotNull } from "drizzle-orm";

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
    // During development, bypass authentication for easier testing
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Bypassing authentication");
      next();
      return;
    }
    
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
  
  // Public API endpoints (no authentication required)
  app.get("/api/public/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      // Return basic stats without sensitive information
      res.json({
        totalPools: stats.totalPools,
        activePools: stats.activePools,
        avgApy: stats.avgApy,
        totalTvl: stats.totalTvl,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching public stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/public/chains", async (req, res) => {
    try {
      const chains = await storage.getActiveChains();
      // Return basic chain information
      res.json({
        chains: chains.map(chain => ({
          id: chain.id,
          name: chain.name,
          displayName: chain.displayName,
          color: chain.color,
          isActive: chain.isActive
        }))
      });
    } catch (error) {
      console.error("Error fetching public chains:", error);
      res.status(500).json({ error: "Failed to fetch chains" });
    }
  });

  app.get("/api/public/platforms", async (req, res) => {
    try {
      const platforms = await storage.getActivePlatforms();
      // Return basic platform information
      res.json({
        platforms: platforms.map(platform => ({
          id: platform.id,
          name: platform.name,
          displayName: platform.displayName,
          website: platform.website,
          isActive: platform.isActive
        }))
      });
    } catch (error) {
      console.error("Error fetching public platforms:", error);
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.get("/api/public/top-pools", async (req, res) => {
    try {
      const { limit = '10' } = req.query;
      const pools = await storage.getPools({
        onlyVisible: true,
        limit: Math.min(parseInt(limit as string), 50), // Max 50 pools for public API
        offset: 0,
      });

      // Return limited pool information for public access
      const publicPools = pools.map(pool => ({
        id: pool.id,
        tokenPair: pool.tokenPair,
        apy: pool.apy,
        tvl: pool.tvl,
        riskLevel: pool.riskLevel,
        platform: {
          name: pool.platform.name,
          displayName: pool.platform.displayName
        },
        chain: {
          name: pool.chain.name,
          displayName: pool.chain.displayName,
          color: pool.chain.color
        },
        lastUpdated: pool.lastUpdated
      }));

      res.json({
        pools: publicPools,
        count: publicPools.length,
        maxLimit: 50
      });
    } catch (error) {
      console.error("Error fetching public top pools:", error);
      res.status(500).json({ error: "Failed to fetch top pools" });
    }
  });

  // Authenticated API routes (require API key authentication)
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

  // Advanced search endpoint
  app.get("/api/pools/advanced-search", async (req, res) => {
    try {
      const { 
        search, 
        chainIds, 
        categoryIds, 
        minApy, 
        maxApy, 
        minTvl, 
        maxTvl, 
        riskLevels,
        platforms,
        hasAudit,
        minOperatingDays,
        limit = "100"
      } = req.query;

      // Parse parameters
      const searchOptions: any = {
        onlyVisible: true,
        limit: Math.min(parseInt(limit as string) || 100, 100),
        offset: 0
      };

      if (search) searchOptions.search = search as string;
      if (chainIds) {
        const chainIdArray = (chainIds as string).split(',');
        searchOptions.chainIds = chainIdArray;
      }

      const pools = await storage.getPools(searchOptions);

      // Apply additional filters
      let filteredPools = pools;

      if (minApy) {
        const minApyNum = parseFloat(minApy as string);
        filteredPools = filteredPools.filter(p => p.apy && parseFloat(p.apy) >= minApyNum);
      }

      if (maxApy) {
        const maxApyNum = parseFloat(maxApy as string);
        filteredPools = filteredPools.filter(p => p.apy && parseFloat(p.apy) <= maxApyNum);
      }

      if (minTvl) {
        const minTvlNum = parseFloat(minTvl as string);
        filteredPools = filteredPools.filter(p => p.tvl && parseFloat(p.tvl) >= minTvlNum);
      }

      if (maxTvl) {
        const maxTvlNum = parseFloat(maxTvl as string);
        filteredPools = filteredPools.filter(p => p.tvl && parseFloat(p.tvl) <= maxTvlNum);
      }

      if (riskLevels) {
        const riskArray = (riskLevels as string).split(',');
        filteredPools = filteredPools.filter(p => riskArray.includes(p.riskLevel));
      }

      if (platforms) {
        const platformArray = (platforms as string).split(',');
        filteredPools = filteredPools.filter(p => platformArray.includes(p.platform.name));
      }

      if (minOperatingDays) {
        const minDays = parseInt(minOperatingDays as string);
        filteredPools = filteredPools.filter(p => {
          // Use rawData.count from DeFi Llama data for operating days
          const rawData = p.rawData as any;
          return (rawData?.count || 0) >= minDays;
        });
      }

      res.json(filteredPools);
    } catch (error) {
      console.error("Error in advanced search:", error);
      res.status(500).json({ error: "Failed to perform advanced search" });
    }
  });

  // Yield forecasting endpoints
  app.get("/api/yield-forecasts", async (req, res) => {
    try {
      const { period = '7d', model = 'ml' } = req.query;
      
      // For now, return empty array - this would integrate with ML models
      res.json([]);
    } catch (error) {
      console.error("Error fetching yield forecasts:", error);
      res.status(500).json({ error: "Failed to fetch yield forecasts" });
    }
  });

  app.get("/api/yield-forecasts/:poolId", async (req, res) => {
    try {
      const { poolId } = req.params;
      const { period = '7d', model = 'ml' } = req.query;
      
      const pool = await storage.getPoolById(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // For now, return empty - this would integrate with ML models
      res.json(null);
    } catch (error) {
      console.error("Error fetching pool forecast:", error);
      res.status(500).json({ error: "Failed to fetch pool forecast" });
    }
  });

  // Risk assessment endpoints
  app.get("/api/risk-assessments", async (req, res) => {
    try {
      // For now, return empty array - this would integrate with risk analysis models
      res.json([]);
    } catch (error) {
      console.error("Error fetching risk assessments:", error);
      res.status(500).json({ error: "Failed to fetch risk assessments" });
    }
  });

  app.get("/api/risk-assessments/:poolId", async (req, res) => {
    try {
      const { poolId } = req.params;
      
      const pool = await storage.getPoolById(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // For now, return null - this would integrate with risk analysis models
      res.json(null);
    } catch (error) {
      console.error("Error fetching pool risk assessment:", error);
      res.status(500).json({ error: "Failed to fetch pool risk assessment" });
    }
  });

  // Pool routes
  app.get("/api/pools", async (req, res) => {
    try {
      const { 
        chainId, 
        platformId, 
        categoryId,
        search, 
        onlyVisible = 'true', 
        limit = '50', 
        offset = '0' 
      } = req.query;

      const pools = await storage.getPools({
        chainId: chainId as string,
        platformId: platformId as string,
        categoryId: categoryId as string,
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

  // AI Outlook routes
  app.get("/api/pools/:id/outlook", async (req, res) => {
    try {
      const { AIOutlookService } = await import("./services/aiOutlookService");
      const aiOutlookService = new AIOutlookService(storage);
      
      // Try to get existing valid outlook first
      let outlook = await aiOutlookService.getValidOutlook(req.params.id);
      
      // If no valid outlook exists, generate a new one
      if (!outlook) {
        outlook = await aiOutlookService.generateAndSaveOutlook(req.params.id);
      }
      
      if (!outlook) {
        return res.status(500).json({ message: "Failed to generate AI outlook" });
      }
      
      res.json(outlook);
    } catch (error) {
      console.error("Error fetching AI outlook:", error);
      res.status(500).json({ message: "Failed to fetch AI outlook" });
    }
  });

  // Enhanced Pool Analytics - Comprehensive analysis combining all data sources
  app.get("/api/pools/:poolId/enhanced-analytics", async (req, res) => {
    try {
      const { DataAnalysisService } = await import("./services/dataAnalysisService");
      const analysisService = new DataAnalysisService();
      
      const analytics = await analysisService.getPoolAnalytics(req.params.poolId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error generating enhanced pool analytics:", error);
      res.status(500).json({ 
        error: "Failed to generate enhanced analytics",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Market Intelligence Endpoints
  app.get("/api/market/overview", async (req, res) => {
    try {
      const { MarketIntelligenceService } = await import("./services/marketIntelligenceService");
      const marketService = new MarketIntelligenceService();
      
      const overview = await marketService.getMarketOverview();
      
      res.json(overview);
    } catch (error) {
      console.error("Error generating market overview:", error);
      res.status(500).json({ 
        error: "Failed to generate market overview",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/market/top-performers", async (req, res) => {
    try {
      const { MarketIntelligenceService } = await import("./services/marketIntelligenceService");
      const marketService = new MarketIntelligenceService();
      
      const topPerformers = await marketService.getTopPerformers();
      
      res.json(topPerformers);
    } catch (error) {
      console.error("Error getting top performers:", error);
      res.status(500).json({ 
        error: "Failed to get top performers",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/market/sentiment", async (req, res) => {
    try {
      const { MarketIntelligenceService } = await import("./services/marketIntelligenceService");
      const marketService = new MarketIntelligenceService();
      
      const sentiment = await marketService.getMarketSentiment();
      
      res.json(sentiment);
    } catch (error) {
      console.error("Error getting market sentiment:", error);
      res.status(500).json({ 
        error: "Failed to get market sentiment",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/pools/:id/outlook/regenerate", async (req, res) => {
    try {
      const { AIOutlookService } = await import("./services/aiOutlookService");
      const aiOutlookService = new AIOutlookService(storage);
      
      const outlook = await aiOutlookService.generateAndSaveOutlook(req.params.id);
      
      if (!outlook) {
        return res.status(500).json({ message: "Failed to regenerate AI outlook" });
      }
      
      res.json(outlook);
    } catch (error) {
      console.error("Error regenerating AI outlook:", error);
      res.status(500).json({ message: "Failed to regenerate AI outlook" });
    }
  });

  // Manual sync endpoints for admin use

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
        chainIds, 
        platformIds, 
        search, 
        visibilities,
        dataSources,
        limit = '50', // Much smaller default for better performance
        offset = '0' 
      } = req.query;

      console.log("Admin pools request:", { chainIds, platformIds, search, visibilities, dataSources, limit, offset });

      // Get pools with pagination
      const poolsResponse = await storage.getAdminPools({
        chainIds: (chainIds as string)?.split(',').filter(Boolean) || [],
        platformIds: (platformIds as string)?.split(',').filter(Boolean) || [],
        search: search as string,
        visibilities: (visibilities as string)?.split(',').filter(Boolean) || [],
        dataSources: (dataSources as string)?.split(',').filter(Boolean) || [],
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

  // Update underlying tokens
  app.put("/api/admin/pools/:id/underlying-tokens", requireAuth, async (req, res) => {
    try {
      const { underlyingTokens } = req.body;
      const poolId = req.params.id;

      const pool = await storage.getPoolById(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // Update the rawData field with new underlying tokens
      const updatedRawData = {
        ...(pool.rawData as any || {}),
        underlyingTokens: underlyingTokens
      };

      const updated = await storage.updatePoolRawData(poolId, updatedRawData);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update pool" });
      }

      res.json({ success: true, underlyingTokens });
    } catch (error) {
      console.error("Error updating underlying tokens:", error);
      res.status(500).json({ error: "Failed to update underlying tokens" });
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

  // Admin platforms endpoint with additional fields
  app.get("/api/admin/platforms", requireAuth, async (req, res) => {
    try {
      const platforms = await storage.getPlatformsWithVisibility();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching admin platforms:", error);
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  app.put("/api/admin/platforms/:id", requireAuth, async (req, res) => {
    try {
      const { displayName, name, website, visitUrlTemplate, showUnderlyingTokens } = req.body;
      
      const updateData: any = {};
      if (displayName) updateData.displayName = displayName;
      if (name) updateData.name = name;
      if (website !== undefined) updateData.website = website;
      if (visitUrlTemplate !== undefined) updateData.visitUrlTemplate = visitUrlTemplate;
      if (showUnderlyingTokens !== undefined) updateData.showUnderlyingTokens = showUnderlyingTokens;

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

  // Admin chains endpoint
  app.get("/api/admin/chains", requireAuth, async (req, res) => {
    try {
      const chains = await storage.getChains(); // Get all chains, not just active ones
      res.json(chains);
    } catch (error) {
      console.error("Error fetching all chains:", error);
      res.status(500).json({ message: "Failed to fetch chains" });
    }
  });

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
      const categories = await storage.getAllCategoriesFlat();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      // First validate basic required fields
      const { name, displayName, description, color, iconUrl, sortOrder, isActive, parentId } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: [{ message: "Name and display name are required" }] 
        });
      }

      // Check for duplicate subcategory names within the same parent
      if (parentId) {
        const existingCategories = await storage.getAllCategoriesFlat();
        const duplicateSubcategory = existingCategories.find(cat => 
          cat.parentId === parentId && 
          cat.name.toLowerCase() === name.toLowerCase()
        );
        
        if (duplicateSubcategory) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: [{ message: "A subcategory with this name already exists in the selected parent category" }] 
          });
        }
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
        parentId: parentId || null,
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
      const { name, displayName, description, color, iconUrl, sortOrder, isActive, parentId } = req.body;
      
      // Check for duplicate subcategory names within the same parent when updating
      if (parentId && name) {
        const existingCategories = await storage.getAllCategoriesFlat();
        const duplicateSubcategory = existingCategories.find(cat => 
          cat.parentId === parentId && 
          cat.name.toLowerCase() === name.toLowerCase() &&
          cat.id !== req.params.id
        );
        
        if (duplicateSubcategory) {
          return res.status(400).json({ 
            message: "Validation error", 
            errors: [{ message: "A subcategory with this name already exists in the selected parent category" }] 
          });
        }
      }
      
      const updateData = {
        ...req.body,
        parentId: parentId || null
      };
      
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

  // Update pool display configuration
  app.put("/api/admin/pools/:poolId/display-config", requireAuth, async (req: any, res) => {
    try {
      const { poolId } = req.params;
      const { displayMappings } = req.body;

      // For now, we'll just acknowledge the request and return success
      // In a full implementation, you would store this configuration in the database
      // and use it to customize the frontend display
      
      console.log(`Display configuration updated for pool ${poolId}:`, displayMappings);
      
      res.json({ 
        success: true, 
        message: "Display configuration updated successfully",
        poolId,
        configurationsCount: displayMappings?.length || 0
      });
    } catch (error: unknown) {
      console.error("Error updating display configuration:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update display configuration";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Manual pool scan removed for security - sync runs automatically via scheduler

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
      const platforms = await storage.getPlatformsWithVisibility();
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

  // Pool consolidation endpoint
  app.post("/api/admin/pools/consolidate", requireAuth, async (req, res) => {
    try {
      const { 
        platformId, 
        chainId, 
        tokenPair, 
        apy, 
        tvl, 
        riskLevel, 
        poolAddress, 
        project, 
        rawData, 
        notes,
        sourcePoolIds 
      } = req.body;

      // Create the consolidated pool
      const consolidatedPool = await storage.createPool({
        platformId,
        chainId,
        tokenPair,
        apy,
        tvl,
        riskLevel,
        poolAddress,
        project,
        rawData,
        isVisible: true,
        isActive: true,
      });

      // Add user notes only (no consolidation messages)
      if (notes) {
        await storage.createNote({
          poolId: consolidatedPool.id,
          content: notes,
          isPublic: true,
        });
      }

      res.json({ 
        pool: consolidatedPool,
        message: "Consolidated pool created successfully" 
      });
    } catch (error) {
      console.error("Error creating consolidated pool:", error);
      res.status(500).json({ message: "Failed to create consolidated pool" });
    }
  });

  // Get consolidated pools endpoint
  app.get("/api/admin/pools/consolidated", requireAuth, async (req, res) => {
    try {
      // Find all pools that have consolidation notes
      const allPools = await storage.getPools();
      const consolidatedPools: any[] = [];

      // Check each pool for consolidation notes and get full details
      for (const pool of allPools) {
        const notes = await storage.getNotesByPool(pool.id);
        const hasConsolidationNote = notes.some(note => 
          note.content.includes('Consolidated from pools:')
        );
        
        if (hasConsolidationNote) {
          // Get full pool details with platform and chain info
          const fullPool = await storage.getPoolById(pool.id);
          if (fullPool) {
            consolidatedPools.push({
              ...fullPool,
              notes: notes
            });
          }
        }
      }

      res.json(consolidatedPools);
    } catch (error) {
      console.error("Error fetching consolidated pools:", error);
      res.status(500).json({ message: "Failed to fetch consolidated pools" });
    }
  });

  // Delete individual consolidated pool endpoint
  app.delete("/api/admin/pools/consolidated/:poolId", requireAuth, async (req, res) => {
    try {
      const poolId = req.params.poolId;
      
      // Verify this is a consolidated pool by checking for consolidation notes
      const notes = await storage.getNotesByPool(poolId);
      const hasConsolidationNote = notes.some(note => 
        note.content.includes('Consolidated from pools:')
      );
      
      if (!hasConsolidationNote) {
        return res.status(400).json({ message: "This is not a consolidated pool" });
      }

      // Delete associated notes first
      for (const note of notes) {
        await storage.deleteNote(note.id);
      }
      
      // Delete the pool
      await storage.deletePool(poolId);

      res.json({ 
        message: "Consolidated pool deleted successfully",
        deletedPoolId: poolId
      });
    } catch (error) {
      console.error("Error deleting consolidated pool:", error);
      res.status(500).json({ message: "Failed to delete consolidated pool" });
    }
  });

  // Reset/clear consolidated pools endpoint
  app.delete("/api/admin/pools/consolidated", requireAuth, async (req, res) => {
    try {
      // Find all pools that have consolidation notes
      const allPools = await storage.getPools();
      const consolidatedPoolIds: string[] = [];

      // Check each pool for consolidation notes
      for (const pool of allPools) {
        const notes = await storage.getNotesByPool(pool.id);
        const hasConsolidationNote = notes.some(note => 
          note.content.includes('Consolidated from pools:')
        );
        
        if (hasConsolidationNote) {
          consolidatedPoolIds.push(pool.id);
        }
      }

      // Delete consolidated pools and their associated data
      let deletedCount = 0;
      for (const poolId of consolidatedPoolIds) {
        // Delete associated notes first
        const notes = await storage.getNotesByPool(poolId);
        for (const note of notes) {
          await storage.deleteNote(note.id);
        }
        
        // Delete the pool
        await storage.deletePool(poolId);
        deletedCount++;
      }

      res.json({ 
        message: `Successfully reset consolidated pools data`,
        deletedCount,
        deletedPoolIds: consolidatedPoolIds
      });
    } catch (error) {
      console.error("Error resetting consolidated pools:", error);
      res.status(500).json({ message: "Failed to reset consolidated pools data" });
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

  app.post("/api/pools/:poolId/notes", requireAuth, async (req, res) => {
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

  app.delete("/api/pools/:poolId/notes/:noteId", requireAuth, async (req, res) => {
    try {
      await storage.deleteNote(req.params.noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
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

  // Manual sync removed for security - sync runs automatically via scheduler

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

  // No longer need data sources endpoint since we only use DeFi Llama

  // Companion chatbot routes
  // Investment advisor routes
  app.post("/api/investment/analyze", async (req, res) => {
    try {
      const { amount, duration, expectedReturn, riskTolerance } = req.body;

      if (!amount || !duration || !expectedReturn || !riskTolerance) {
        return res.status(400).json({ error: "All investment parameters are required" });
      }

      // Get available pools for analysis
      const pools = await storage.getPools({ 
        limit: 100, 
        offset: 0,
        onlyVisible: true 
      });

      if (pools.length === 0) {
        return res.status(400).json({ error: "No pools available for analysis" });
      }

      // Basic investment analysis (simplified version)
      const filteredPools = pools.filter((pool: any) => {
        const poolRisk = pool.riskLevel?.toLowerCase();
        const apy = parseFloat(pool.apy || "0");
        
        switch (riskTolerance) {
          case "conservative":
            return (poolRisk === "low" || poolRisk === "medium") && apy <= 15;
          case "moderate":
            return poolRisk !== "extreme" && apy <= 30;
          case "aggressive":
            return apy > 0;
          default:
            return true;
        }
      });

      // Simple allocation strategy
      const topPools = filteredPools
        .sort((a: any, b: any) => parseFloat(b.apy || "0") - parseFloat(a.apy || "0"))
        .slice(0, 3);

      const allocations = topPools.length === 1 ? [100] : 
                         topPools.length === 2 ? [60, 40] : [50, 30, 20];

      const recommendations = topPools.map((pool: any, index: number) => ({
        id: pool.id,
        tokenPair: pool.tokenPair,
        apy: pool.apy,
        tvl: pool.tvl,
        platform: pool.platform,
        chain: pool.chain,
        riskLevel: pool.riskLevel,
        allocation: allocations[index] || 0,
        reason: `Selected for ${pool.apy}% APY with ${pool.riskLevel} risk profile`,
        projectedReturn: Math.round(((amount * (allocations[index] || 0)) / 100) * (1 + (parseFloat(pool.apy) / 100) * (duration / 12)))
      }));

      const totalProjectedReturn = recommendations.reduce((total, rec) => total + rec.projectedReturn, 0);

      res.json({
        summary: `Based on your ${riskTolerance} strategy with $${amount.toLocaleString()} over ${duration} months, we recommend diversifying across ${recommendations.length} high-performing pools. This strategy targets ${expectedReturn}% annual returns while managing risk through careful allocation.`,
        totalProjectedReturn,
        riskAssessment: `This ${riskTolerance} strategy carries standard DeFi risks including smart contract vulnerabilities and market volatility.`,
        recommendations,
        timeline: [
          {
            timeframe: `${Math.floor(duration/3)} months`,
            expectedValue: Math.round(amount * 1.02),
            description: "Initial growth phase"
          },
          {
            timeframe: `${duration} months`,
            expectedValue: totalProjectedReturn,
            description: "Target portfolio value"
          }
        ],
        warnings: ["DeFi investments carry inherent risks", "Past performance does not guarantee future results"],
        confidence: 75
      });

    } catch (error) {
      console.error("Investment analysis error:", error);
      res.status(500).json({ error: "Failed to process investment analysis" });
    }
  });



  app.post("/api/companion/chat", async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // Initialize knowledge base
      const { KnowledgeBase } = await import("./services/knowledge-base");
      const knowledgeBase = new KnowledgeBase(storage);

      // Get current pools data for context
      const pools = await storage.getPools({ 
        limit: 50, 
        offset: 0,
        onlyVisible: true 
      });

      // Prepare market context
      const marketContext = {
        totalPools: pools.length,
        avgApy: pools.reduce((sum: number, pool: any) => sum + parseFloat(pool.apy || "0"), 0) / pools.length,
        topPools: pools
          .sort((a: any, b: any) => parseFloat(b.apy || "0") - parseFloat(a.apy || "0"))
          .slice(0, 5)
          .map((pool: any) => ({
            tokenPair: pool.tokenPair,
            apy: pool.apy,
            tvl: pool.tvl,
            platform: pool.platform?.displayName || "Unknown",
            riskLevel: pool.riskLevel,
          })),
        platforms: Array.from(new Set(pools.map((p: any) => p.platform?.displayName).filter(Boolean))),
        chains: Array.from(new Set(pools.map((p: any) => p.chain?.displayName).filter(Boolean))),
      };

      const formatTvl = (value: string): string => {
        const num = parseFloat(value);
        if (isNaN(num)) return "N/A";
        
        if (num >= 1e9) {
          return `$${(num / 1e9).toFixed(2)}B`;
        } else if (num >= 1e6) {
          return `$${(num / 1e6).toFixed(2)}M`;
        } else if (num >= 1e3) {
          return `$${(num / 1e3).toFixed(2)}K`;
        } else {
          return `$${num.toFixed(2)}`;
        }
      };

      // First, check knowledge base for specific site questions
      const knowledgeResult = knowledgeBase.findAnswer(message, { 
        ...context, 
        marketContext,
        timestamp: new Date().toISOString() 
      });

      if (knowledgeResult && knowledgeResult.confidence > 0.7) {
        return res.json({
          message: knowledgeResult.answer,
          insights: knowledgeResult.urls.length > 0 ? [`Found ${knowledgeResult.urls.length} relevant page(s)`] : [],
          links: knowledgeResult.urls,
          confidence: knowledgeResult.confidence,
          source: "knowledge_base"
        });
      }

      // If not found in knowledge base, use intelligent response based on keywords
      let response: any;

      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("high") && (lowerMessage.includes("yield") || lowerMessage.includes("apy"))) {
        const highYieldPools = pools
          .filter((p: any) => parseFloat(p.apy || "0") > 10)
          .sort((a: any, b: any) => parseFloat(b.apy || "0") - parseFloat(a.apy || "0"))
          .slice(0, 3);

        response = {
          message: `Found ${highYieldPools.length} high-yield opportunities! 🚀 These pools offer attractive returns but remember - higher yields often mean higher risk. The top performers are showing ${highYieldPools[0]?.apy}% to ${highYieldPools[2]?.apy}% APY.`,
          insights: [
            `${highYieldPools.length} pools above 10% APY`,
            `Highest yield: ${highYieldPools[0]?.apy}%`,
            "Higher yields = higher risk"
          ],
          recommendedPools: highYieldPools.map((pool: any) => ({
            id: pool.id,
            tokenPair: pool.tokenPair,
            apy: pool.apy,
            tvl: formatTvl(pool.tvl || "0"),
            platform: pool.platform?.displayName || "Unknown",
            reason: "High yield opportunity"
          })),
          marketTip: "High yields can be tempting, but always check the protocol's security audit and TVL stability!"
        };
      } else if (lowerMessage.includes("low") && lowerMessage.includes("risk")) {
        const lowRiskPools = pools
          .filter((p: any) => p.riskLevel?.toLowerCase() === "low")
          .sort((a: any, b: any) => parseFloat(b.tvl || "0") - parseFloat(a.tvl || "0"))
          .slice(0, 3);

        response = {
          message: `Here are ${lowRiskPools.length} low-risk options perfect for conservative DeFi farming! 🛡️ These pools prioritize safety with established protocols and solid TVL. They might not offer moon yields, but they're built for steady growth.`,
          insights: [
            `${lowRiskPools.length} low-risk pools available`,
            "Focus on established protocols",
            "Steady yields over speculation"
          ],
          recommendedPools: lowRiskPools.map((pool: any) => ({
            id: pool.id,
            tokenPair: pool.tokenPair,
            apy: pool.apy,
            tvl: formatTvl(pool.tvl || "0"),
            platform: pool.platform?.displayName || "Unknown",
            reason: "Low-risk, established protocol"
          })),
          marketTip: "Low-risk doesn't mean no-risk! Even stable protocols can face smart contract vulnerabilities."
        };
      } else if (lowerMessage.includes("stablecoin")) {
        const stablePools = pools
          .filter((p: any) => {
            const pair = p.tokenPair?.toLowerCase() || "";
            return pair.includes("usdc") || pair.includes("usdt") || pair.includes("dai") || pair.includes("stable");
          })
          .sort((a: any, b: any) => parseFloat(b.apy || "0") - parseFloat(a.apy || "0"))
          .slice(0, 3);

        response = {
          message: `Found ${stablePools.length} stablecoin yield opportunities! 💰 These are great for earning yield without exposure to volatile crypto prices. Perfect for those who want DeFi gains with traditional asset stability.`,
          insights: [
            `${stablePools.length} stablecoin pools`,
            "Reduced price volatility",
            "USD-denominated returns"
          ],
          recommendedPools: stablePools.map((pool: any) => ({
            id: pool.id,
            tokenPair: pool.tokenPair,
            apy: pool.apy,
            tvl: formatTvl(pool.tvl || "0"),
            platform: pool.platform?.displayName || "Unknown",
            reason: "Stablecoin yield farming"
          })),
          marketTip: "Even stablecoins have risks - check if they're properly collateralized and regulated!"
        };
      } else if (lowerMessage.includes("market") || lowerMessage.includes("trend")) {
        response = {
          message: `The DeFi market is showing interesting patterns! 📊 We're tracking ${marketContext.totalPools} active pools with an average APY of ${marketContext.avgApy.toFixed(2)}%. Top platforms like ${marketContext.platforms.slice(0, 3).join(", ")} are leading the charge.`,
          insights: [
            `Average market APY: ${marketContext.avgApy.toFixed(2)}%`,
            `${marketContext.platforms.length} active platforms`,
            `${marketContext.chains.length} blockchain networks`
          ],
          recommendedPools: marketContext.topPools.slice(0, 3).map((pool: any) => ({
            id: crypto.randomUUID(),
            tokenPair: pool.tokenPair,
            apy: pool.apy,
            tvl: formatTvl(pool.tvl || "0"),
            platform: pool.platform,
            reason: "Top market performer"
          })),
          marketTip: "Market trends can change quickly in DeFi - always monitor your positions and stay informed!"
        };
      } else {
        // If no specific pattern matches and knowledge base didn't help, record as unknown query
        const queryId = knowledgeBase.recordUnknownQuery(message, {
          ...context,
          marketContext: {
            totalPools: marketContext.totalPools,
            avgApy: marketContext.avgApy.toFixed(2)
          },
          timestamp: new Date().toISOString()
        });

        response = {
          message: "I don't have specific information about that topic. I can help you with yield farming opportunities, market analysis, risk assessment, and platform features. You can also try asking about our AI tools, supported networks, or how to use specific features.",
          insights: [
            "I specialize in DeFi and yield farming topics",
            "Try asking about pools, risks, or platform features", 
            "Your question has been noted for improvement"
          ],
          suggestions: [
            "What AI tools are available?",
            "Show me high-yield opportunities",
            "How do I access the admin panel?",
            "What blockchain networks are supported?"
          ],
          queryId,
          source: "fallback"
        };
      }

      res.json(response);

    } catch (error) {
      console.error("Companion chat error:", error);
      res.status(500).json({ 
        error: "I'm experiencing technical difficulties. Please try again in a moment." 
      });
    }
  });

  // Knowledge base admin endpoints
  app.get("/api/admin/knowledge-stats", requireAuth, async (req, res) => {
    try {
      const { KnowledgeBase } = await import("./services/knowledge-base");
      const knowledgeBase = new KnowledgeBase(storage);
      
      const stats = knowledgeBase.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Knowledge stats error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge base stats" });
    }
  });

  app.get("/api/admin/unknown-queries", requireAuth, async (req, res) => {
    try {
      const { KnowledgeBase } = await import("./services/knowledge-base");
      const knowledgeBase = new KnowledgeBase(storage);
      
      const unknownQueries = knowledgeBase.getUnknownQueries();
      res.json(unknownQueries);
    } catch (error) {
      console.error("Unknown queries error:", error);
      res.status(500).json({ error: "Failed to fetch unknown queries" });
    }
  });

  app.post("/api/admin/resolve-query/:queryId", requireAuth, async (req, res) => {
    try {
      const { queryId } = req.params;
      const { adminAnswer } = req.body;
      
      const { KnowledgeBase } = await import("./services/knowledge-base");
      const knowledgeBase = new KnowledgeBase(storage);
      
      knowledgeBase.markQueryAsResolved(queryId, adminAnswer);
      res.json({ success: true });
    } catch (error) {
      console.error("Resolve query error:", error);
      res.status(500).json({ error: "Failed to resolve query" });
    }
  });

  // Register advanced features routes
  const { registerAdvancedRoutes } = await import('./routes/advanced-features');
  registerAdvancedRoutes(app);

  // Register AI routes
  const { registerAIRoutes } = await import('./routes/ai');
  registerAIRoutes(app);

  // Register market intelligence routes
  const { registerMarketIntelligenceRoutes } = await import('./routes/market-intelligence');
  registerMarketIntelligenceRoutes(app);

  // Start data sync scheduler
  const { startScheduler } = await import('./services/scheduler');
  startScheduler();

  // Admin Error Management Routes
  const adminErrorsRouter = (await import("./routes/admin-errors")).default;
  app.use("/api/admin/errors", requireAuth, adminErrorsRouter);

  // Logo Management Routes
  app.post("/api/admin/logos/update-all", requireAuth, async (req, res) => {
    try {
      console.log('Admin initiated bulk logo update');
      const { logoUpdaterService } = await import("./services/logo-updater");
      const result = await logoUpdaterService.updateAllPlatformLogos();
      
      res.json({
        message: `Logo update completed. ${result.success}/${result.total} successful.`,
        ...result
      });
    } catch (error) {
      console.error('Error updating all platform logos:', error);
      res.status(500).json({
        message: 'Failed to update platform logos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/admin/logos/update/:platformName", requireAuth, async (req, res) => {
    try {
      const { platformName } = req.params;
      const { logoUpdaterService } = await import("./services/logo-updater");
      
      if (!logoUpdaterService.hasPlatformConfig(platformName)) {
        return res.status(404).json({
          message: `No official logo source configured for platform: ${platformName}`,
          configuredPlatforms: logoUpdaterService.getConfiguredPlatforms()
        });
      }

      console.log(`Admin initiated logo update for: ${platformName}`);
      const success = await logoUpdaterService.updatePlatformLogo(platformName);
      
      if (success) {
        res.json({
          message: `Successfully updated logo for ${platformName}`,
          platform: platformName
        });
      } else {
        res.status(500).json({
          message: `Failed to update logo for ${platformName}`,
          platform: platformName
        });
      }
    } catch (error) {
      console.error(`Error updating logo for ${req.params.platformName}:`, error);
      res.status(500).json({
        message: 'Failed to update platform logo',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/admin/logos/configured-platforms", requireAuth, async (req, res) => {
    try {
      const { logoUpdaterService } = await import("./services/logo-updater");
      const platforms = logoUpdaterService.getConfiguredPlatforms();
      
      res.json({
        platforms,
        total: platforms.length,
        message: 'Platforms with official logo sources configured'
      });
    } catch (error) {
      console.error('Error fetching configured platforms:', error);
      res.status(500).json({
        message: 'Failed to fetch configured platforms',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Etherscan API routes - blockchain data endpoints
  app.get("/api/etherscan/account/:address", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const address = req.params.address;
      if (!EtherscanService.isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      
      const accountInfo = await etherscan.getAccountInfo(address);
      res.json({
        ...accountInfo,
        balanceEth: EtherscanService.weiToEth(accountInfo.balance)
      });
    } catch (error) {
      console.error("Error fetching account info:", error);
      res.status(500).json({ error: "Failed to fetch account information" });
    }
  });

  app.get("/api/etherscan/transactions/:address", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const address = req.params.address;
      const { page = "1", limit = "25", startBlock = "0" } = req.query;
      
      if (!EtherscanService.isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      
      const transactions = await etherscan.getTransactionHistory(
        address,
        parseInt(startBlock as string),
        999999999,
        parseInt(page as string),
        Math.min(parseInt(limit as string), 100) // Max 100 per request
      );
      
      res.json({
        address,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        transactions: transactions.map(tx => ({
          ...tx,
          valueEth: EtherscanService.weiToEth(tx.value),
          gasPriceGwei: (parseInt(tx.gasPrice) / 1e9).toFixed(2),
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString()
        }))
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  });

  app.get("/api/etherscan/tokens/:address", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const address = req.params.address;
      if (!EtherscanService.isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      
      const tokens = await etherscan.getTokenBalances(address);
      res.json({ address, tokens });
    } catch (error) {
      console.error("Error fetching token balances:", error);
      res.status(500).json({ error: "Failed to fetch token balances" });
    }
  });

  app.get("/api/etherscan/contract/:address", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const address = req.params.address;
      if (!EtherscanService.isValidAddress(address)) {
        return res.status(400).json({ error: "Invalid Ethereum address format" });
      }
      
      const contractInfo = await etherscan.getContractInfo(address);
      if (!contractInfo) {
        return res.status(404).json({ error: "Contract not found or not verified" });
      }
      
      res.json(contractInfo);
    } catch (error) {
      console.error("Error fetching contract info:", error);
      res.status(500).json({ error: "Failed to fetch contract information" });
    }
  });

  app.get("/api/etherscan/gas", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const gasData = await etherscan.getGasTracker();
      res.json({
        timestamp: new Date().toISOString(),
        ...gasData
      });
    } catch (error) {
      console.error("Error fetching gas prices:", error);
      res.status(500).json({ error: "Failed to fetch gas prices" });
    }
  });

  app.get("/api/etherscan/transaction/:hash", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const txHash = req.params.hash;
      if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return res.status(400).json({ error: "Invalid transaction hash format" });
      }
      
      const transaction = await etherscan.getTransactionByHash(txHash);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json({
        ...transaction,
        valueEth: EtherscanService.weiToEth(transaction.value || "0"),
        gasPriceGwei: transaction.gasPrice ? (parseInt(transaction.gasPrice) / 1e9).toFixed(2) : "0"
      });
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Failed to fetch transaction details" });
    }
  });

  app.get("/api/etherscan/blocks/latest", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const latestBlockNumber = await etherscan.getLatestBlockNumber();
      res.json({ 
        latestBlock: latestBlockNumber,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching latest block:", error);
      res.status(500).json({ error: "Failed to fetch latest block number" });
    }
  });

  app.get("/api/etherscan/blocks/:number", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const blockNumber = req.params.number;
      const blockData = await etherscan.getBlockByNumber(blockNumber);
      
      res.json({
        blockNumber,
        ...blockData,
        timestamp: blockData.timestamp ? new Date(parseInt(blockData.timestamp) * 1000).toISOString() : null
      });
    } catch (error) {
      console.error("Error fetching block:", error);
      res.status(500).json({ error: "Failed to fetch block information" });
    }
  });

  app.get("/api/etherscan/eth-price", requireApiKey, async (req, res) => {
    try {
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      const priceData = await etherscan.getEthPrice();
      res.json({
        timestamp: new Date().toISOString(),
        ...priceData
      });
    } catch (error) {
      console.error("Error fetching ETH price:", error);
      res.status(500).json({ error: "Failed to fetch ETH price" });
    }
  });



  // Token data endpoints for pool detail page (no API key required)
  app.get("/api/pools/:poolId/token-info", async (req, res) => {
    try {
      const pool = await storage.getPoolById(req.params.poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // Extract underlying token address from raw data with proper mapping
      const rawData: any = pool.rawData || {};
      let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
      
      // Fix known token addresses (DeFi Llama sometimes provides zero address)
      const tokenAddressMap: { [key: string]: string } = {
        'STETH': '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
        'STEAKUSDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
      };

      // If we have a zero address or null, try to map from token pair name
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        const tokenPair = pool.tokenPair.toUpperCase();
        if (tokenAddressMap[tokenPair]) {
          underlyingToken = tokenAddressMap[tokenPair];
          console.log(`Mapped ${tokenPair} to correct address: ${underlyingToken}`);
        }
      }
      
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        return res.status(404).json({ error: "No valid underlying token found for this pool" });
      }
      
      console.log(`Fetching token info for pool ${pool.id}, token: ${underlyingToken}`);

      // First check for stored token info in database
      const storedTokenInfo = await storage.getTokenInfoByAddress(underlyingToken);
      let tokenInfo = storedTokenInfo;
      let shouldFetchFromEtherscan = true;

      // If we have stored data that's less than 24 hours old, use it
      if (storedTokenInfo && storedTokenInfo.lastUpdated) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (storedTokenInfo.lastUpdated > dayAgo) {
          console.log(`Using stored token info for ${underlyingToken}`);
          shouldFetchFromEtherscan = false;
        }
      }

      let tokenSupply: any;
      let topHolders: any[] = [];
      let recentTransfers: any[] = [];
      let analytics: any;
      let gasStats: any;
      let events: any[] = [];
      let contractInfo: any;
      
      if (shouldFetchFromEtherscan) {
        console.log(`Fetching fresh token info from Etherscan for ${underlyingToken}`);
        
        const { EtherscanTokenService } = await import("./services/etherscanTokenService");
        const tokenService = new EtherscanTokenService();

        // Fetch all token data in parallel
        const [
          fetchedTokenInfo,
          fetchedTokenSupply,
          fetchedTopHolders,
          fetchedRecentTransfers,
          fetchedAnalytics,
          fetchedGasStats,
          fetchedEvents
        ] = await Promise.all([
          tokenService.getTokenInfo(underlyingToken),
          tokenService.getTokenSupply(underlyingToken),
          tokenService.getTopHolders(underlyingToken, 10),
          tokenService.getRecentTransfers(underlyingToken, 20),
          tokenService.getTokenAnalytics(underlyingToken),
          tokenService.getGasUsageStats(underlyingToken),
          tokenService.getContractEvents(underlyingToken, 50)
        ]);

        tokenInfo = fetchedTokenInfo || storedTokenInfo;
        tokenSupply = fetchedTokenSupply;
        topHolders = fetchedTopHolders;
        recentTransfers = fetchedRecentTransfers;
        analytics = fetchedAnalytics;
        gasStats = fetchedGasStats;
        events = fetchedEvents;

        // Get contract info
        const { EtherscanService } = await import("./services/etherscanService");
        const etherscan = new EtherscanService();
        contractInfo = await etherscan.getContractInfo(underlyingToken);

        // Store holder history data for analytics when we have fresh data
        if (tokenInfo && tokenInfo.holdersCount && tokenInfo.holdersCount > 0) {
          try {
            await storage.storeHolderHistory({
              tokenAddress: underlyingToken,
              holdersCount: tokenInfo.holdersCount,
              priceUsd: tokenInfo.priceUsd || null,
              marketCapUsd: tokenInfo.marketCapUsd || null,
            });
            console.log(`Stored holder history for ${underlyingToken}: ${tokenInfo.holdersCount} holders`);
          } catch (error) {
            console.error("Error storing holder history:", error);
          }
        }
      } else {
        // Use stored data and provide minimal additional data
        tokenSupply = { totalSupply: storedTokenInfo?.totalSupply || "0" };
        topHolders = [];
        recentTransfers = [];
        analytics = null;
        gasStats = null;
        events = [];
        contractInfo = null;
      }

      // Use holdersCount from tokenInfo if available
      const holdersCount = tokenInfo?.holdersCount || topHolders.length;
      
      res.json({
        tokenAddress: underlyingToken,
        tokenInfo,
        contractInfo,
        supplyData: tokenSupply,
        holders: {
          count: holdersCount,
          topHolders
        },
        transfers: {
          recent: recentTransfers,
          analytics
        },
        technical: {
          gasUsage: gasStats,
          events: events.slice(0, 10) // Limit events for performance
        }
      });
    } catch (error) {
      console.error("Error fetching token info:", error);
      res.status(500).json({ error: "Failed to fetch token information" });
    }
  });

  // Holder analytics endpoints
  app.get("/api/pools/:poolId/holder-analytics", async (req, res) => {
    try {
      const pool = await storage.getPoolById(req.params.poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // Extract underlying token address from raw data with proper mapping
      const rawData: any = pool.rawData || {};
      let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
      
      // Fix known token addresses (DeFi Llama sometimes provides zero address)
      const tokenAddressMap: { [key: string]: string } = {
        'STETH': '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
        'STEAKUSDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
      };

      // If we have a zero address or null, try to map from token pair name
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        const tokenPair = pool.tokenPair.toUpperCase();
        if (tokenAddressMap[tokenPair]) {
          underlyingToken = tokenAddressMap[tokenPair];
          console.log(`Mapped ${tokenPair} to correct address: ${underlyingToken}`);
        }
      }
      
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        return res.status(404).json({ error: "No valid underlying token found for this pool" });
      }

      const analytics = await storage.getHolderAnalytics(underlyingToken);
      
      res.json({
        tokenAddress: underlyingToken,
        analytics
      });
    } catch (error) {
      console.error("Error fetching holder analytics:", error);
      res.status(500).json({ error: "Failed to fetch holder analytics" });
    }
  });

  app.get("/api/pools/:poolId/holder-history", async (req, res) => {
    try {
      const { days } = req.query;
      const pool = await storage.getPoolById(req.params.poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // Extract underlying token address from raw data with proper mapping
      const rawData: any = pool.rawData || {};
      let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
      
      // Fix known token addresses (DeFi Llama sometimes provides zero address)
      const tokenAddressMap: { [key: string]: string } = {
        'STETH': '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
        'STEAKUSDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
      };

      // If we have a zero address or null, try to map from token pair name
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        const tokenPair = pool.tokenPair.toUpperCase();
        if (tokenAddressMap[tokenPair]) {
          underlyingToken = tokenAddressMap[tokenPair];
          console.log(`Mapped ${tokenPair} to correct address: ${underlyingToken}`);
        }
      }
      
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        return res.status(404).json({ error: "No valid underlying token found for this pool" });
      }

      const dayLimit = days ? parseInt(days as string) : undefined;
      const history = await storage.getHolderHistory(underlyingToken, dayLimit);
      
      res.json({
        tokenAddress: underlyingToken,
        history: history.map(record => ({
          holdersCount: record.holdersCount,
          priceUsd: record.priceUsd,
          marketCapUsd: record.marketCapUsd,
          timestamp: record.timestamp
        })),
        totalRecords: history.length
      });
    } catch (error) {
      console.error("Error fetching holder history:", error);
      res.status(500).json({ error: "Failed to fetch holder history" });
    }
  });

  // Cross-pool analytics endpoints
  app.get("/api/pools/:poolId/cross-analysis", async (req, res) => {
    try {
      const { poolId } = req.params;
      const CrossPoolAnalysisService = (await import("./services/crossPoolAnalysisService")).CrossPoolAnalysisService;
      const service = new CrossPoolAnalysisService();
      
      // Fetch multiple analytics in parallel
      const [
        correlations,
        gasOptimization,
        mevActivity,
        networkEffect,
        behavioralInsights,
        riskScore
      ] = await Promise.all([
        service.findPoolCorrelations(poolId),
        service.analyzeGasOptimization(poolId),
        service.detectMEVActivity(poolId),
        service.analyzeNetworkEffects(poolId),
        service.generateBehavioralInsights(poolId),
        service.calculateRiskScore(poolId)
      ]);
      
      res.json({
        correlations,
        gasOptimization,
        mevActivity,
        networkEffect,
        behavioralInsights,
        riskScore
      });
    } catch (error) {
      console.error("Error in cross-pool analysis:", error);
      res.status(500).json({ error: "Failed to fetch cross-pool analysis" });
    }
  });

  // Wallet journey analysis
  app.post("/api/analytics/wallet-journeys", async (req, res) => {
    try {
      const { poolIds } = req.body;
      const CrossPoolAnalysisService = (await import("./services/crossPoolAnalysisService")).CrossPoolAnalysisService;
      const service = new CrossPoolAnalysisService();
      
      const journeys = await service.analyzeWalletJourneys(poolIds);
      res.json({ journeys });
    } catch (error) {
      console.error("Error analyzing wallet journeys:", error);
      res.status(500).json({ error: "Failed to analyze wallet journeys" });
    }
  });

  // Social graph analysis for wallet
  app.get("/api/wallets/:address/social-graph", async (req, res) => {
    try {
      const { address } = req.params;
      const CrossPoolAnalysisService = (await import("./services/crossPoolAnalysisService")).CrossPoolAnalysisService;
      const service = new CrossPoolAnalysisService();
      
      const socialGraph = await service.analyzeSocialGraph(address);
      res.json(socialGraph);
    } catch (error) {
      console.error("Error analyzing social graph:", error);
      res.status(500).json({ error: "Failed to analyze social graph" });
    }
  });

  // Enhanced Token Flow Analysis Endpoint with Advanced Metrics
  app.get("/api/pools/:poolId/token-transfers", async (req, res) => {
    try {
      const { page = 1, limit = 100 } = req.query; // Increased default limit for better analysis
      const pool = await storage.getPoolById(req.params.poolId);
      
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      // Extract underlying token address from raw data with proper mapping
      const rawData: any = pool.rawData || {};
      let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
      
      // Fix known token addresses (DeFi Llama sometimes provides zero address)
      const tokenAddressMap: { [key: string]: string } = {
        'STETH': '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
        'STEAKUSDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
      };

      // If we have a zero address or null, try to map from token pair name
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        const tokenPair = pool.tokenPair.toUpperCase();
        if (tokenAddressMap[tokenPair]) {
          underlyingToken = tokenAddressMap[tokenPair];
          console.log(`Mapped ${tokenPair} to correct address: ${underlyingToken}`);
        }
      }
      
      if (!underlyingToken || underlyingToken === '0x0000000000000000000000000000000000000000') {
        return res.status(404).json({ error: "No valid underlying token found for this pool" });
      }

      // Fetch more transfers for comprehensive analysis
      const { EtherscanService } = await import("./services/etherscanService");
      const etherscan = new EtherscanService();
      
      // Fetch up to 1000 transfers for proper time coverage
      const transfers = await etherscan.getTokenTransfers(
        underlyingToken, 
        1, 
        1000 // Get much more data for accurate multi-period analysis
      );

      if (!transfers || transfers.length === 0) {
        return res.json({
          tokenAddress: underlyingToken,
          transfers: [],
          flowAnalysis: {
            periods: {
              '24h': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0 },
              '7d': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0 },
              '30d': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0 },
              'all': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0 }
            },
            advanced: {
              whaleActivity: { detected: false },
              smartMoney: { movements: [] },
              flowVelocity: { trend: 'neutral' }
            }
          }
        });
      }

      const decimals = parseInt(transfers[0]?.tokenDecimal || '18');
      const tokenSymbol = transfers[0]?.tokenSymbol || 'TOKEN';
      const now = Date.now();
      
      // Time boundaries for different periods
      const periods = {
        '24h': now - (24 * 60 * 60 * 1000), // Last 24 hours
        '7d': now - (7 * 24 * 60 * 60 * 1000), // Last 7 days
        '30d': now - (30 * 24 * 60 * 60 * 1000), // Last 30 days
        'all': 0 // All time
      };
      
      // Initialize metrics for each period
      const flowMetrics: any = {
        '24h': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0, whaleTransfers: [], avgSize: 0, uniqueAddresses: new Set() },
        '7d': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0, whaleTransfers: [], avgSize: 0, uniqueAddresses: new Set() },
        '30d': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0, whaleTransfers: [], avgSize: 0, uniqueAddresses: new Set() },
        'all': { inflow: 0, outflow: 0, netFlow: 0, txCount: 0, whaleTransfers: [], avgSize: 0, uniqueAddresses: new Set() }
      };
      
      // Chart data structures
      const hourlyData = new Map<number, {inflow: number, outflow: number, volume: number, txCount: number}>();
      const dailyData = new Map<number, {inflow: number, outflow: number, volume: number, txCount: number}>();
      
      // Advanced analytics structures
      const addressActivity = new Map<string, {inflow: number, outflow: number, txCount: number, isWhale: boolean, label?: string}>();
      const transferSizes: number[] = [];
      
      // Calculate median transfer size for whale detection
      const calculateMedianTransferSize = () => {
        if (transferSizes.length === 0) return 0;
        const sorted = [...transferSizes].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };
      
      // Protocol addresses for accurate flow detection
      const protocolAddresses = {
        lido: [
          '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH token contract
          '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', // wstETH wrapper  
          '0x1643e812ae58766192cf7d2cf9567df2c37e9b7f', // Lido: Oracle
          '0x442af784a788a5bd6f989e78c9421f53b84d57d5', // Lido: NodeOperatorsRegistry  
          '0x55032650b14df07b85bf18a3a9ae94a96ba7fdcb', // Lido: Staking Router
          '0xb9d7934878b5fb9610b3fe8a5e441e8fad7e293f', // Lido: Execution Layer Rewards Vault
          '0xae1c5e497b6b3febe74a57d13baeaa79e4e9b81e', // Lido: stETH/ETH Curve Pool
          '0x21e27a5e5513d6e65c4f830167390997aa84843a' // Additional Lido-related address
        ],
        morpho: [
          '0x334f5d28a71432f8fc21c7b2b6f5dbbcd8b32a7b', // Morpho steakUSDC vault contract
          '0xa44febf3-34f6-4cd5-8ab1-f246ebe49f9e', // Morpho vault address from pool data
          '0xcfbf12bc2d27e6964fe977b489b617a7bec1660f', // Morpho protocol address
          '0x79720266dec914247424aeb0f06b8fa5b3ec073e', // Morpho protocol address
          '0xdcee3ae4f82bd085ff147b87a754517d8caaff3b'  // Morpho swap contract
        ]
      };
      
      // Process all transfers for comprehensive analysis
      for (const transfer of transfers) {
        const timestamp = parseInt(transfer.timeStamp) * 1000;
        const value = parseFloat(transfer.value) / Math.pow(10, decimals);
        const fromAddr = transfer.from.toLowerCase();
        const toAddr = transfer.to.toLowerCase();
        
        // Skip zero-value transfers
        if (value === 0) continue;
        
        // Track transfer sizes for whale detection
        transferSizes.push(value);
        
        // Calculate chart data timestamps
        const hourTimestamp = Math.floor(timestamp / (1000 * 60 * 60)) * (1000 * 60 * 60);
        const dayTimestamp = Math.floor(timestamp / (1000 * 60 * 60 * 24)) * (1000 * 60 * 60 * 24);
        
        // Determine flow direction with protocol awareness
        const isZeroAddress = (addr: string) => addr === '0x0000000000000000000000000000000000000000';
        const isProtocolAddress = (addr: string) => 
          protocolAddresses.lido.includes(addr) || 
          protocolAddresses.morpho.includes(addr);
        
        let isInflow = false;
        let isOutflow = false;
        
        // Classification logic
        if (isZeroAddress(fromAddr)) {
          // Minting = inflow
          isInflow = true;
        } else if (isZeroAddress(toAddr)) {
          // Burning = outflow
          isOutflow = true;
        } else if (isProtocolAddress(toAddr) && !isProtocolAddress(fromAddr)) {
          // User -> Protocol = inflow (staking/deposits)
          isInflow = true;
        } else if (isProtocolAddress(fromAddr) && !isProtocolAddress(toAddr)) {
          // Protocol -> User = outflow (unstaking/withdrawals)
          isOutflow = true;
        }
        // User-to-user transfers are neutral (not counted)
        
        // Update metrics for each applicable period
        Object.entries(periods).forEach(([period, startTime]) => {
          if (timestamp >= startTime) {
            const metrics = flowMetrics[period];
            
            if (isInflow) {
              metrics.inflow += value;
              metrics.txCount++;
            } else if (isOutflow) {
              metrics.outflow += value;
              metrics.txCount++;
            }
            
            // Track unique addresses
            metrics.uniqueAddresses.add(fromAddr);
            metrics.uniqueAddresses.add(toAddr);
          }
        });
        
        // Update chart data
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, {inflow: 0, outflow: 0, volume: 0, txCount: 0});
        }
        if (!dailyData.has(dayTimestamp)) {
          dailyData.set(dayTimestamp, {inflow: 0, outflow: 0, volume: 0, txCount: 0});
        }
        
        const hourData = hourlyData.get(hourTimestamp)!;
        const dayData = dailyData.get(dayTimestamp)!;
        
        if (isInflow) {
          hourData.inflow += value;
          dayData.inflow += value;
        } else if (isOutflow) {
          hourData.outflow += value;
          dayData.outflow += value;
        }
        
        hourData.volume += value;
        hourData.txCount++;
        dayData.volume += value;
        dayData.txCount++;
        
        // Track address activity for whale detection
        if (!addressActivity.has(fromAddr)) {
          addressActivity.set(fromAddr, {inflow: 0, outflow: 0, txCount: 0, isWhale: false});
        }
        if (!addressActivity.has(toAddr)) {
          addressActivity.set(toAddr, {inflow: 0, outflow: 0, txCount: 0, isWhale: false});
        }
        
        addressActivity.get(fromAddr)!.outflow += value;
        addressActivity.get(fromAddr)!.txCount++;
        addressActivity.get(toAddr)!.inflow += value;
        addressActivity.get(toAddr)!.txCount++;
      }
      
      // Calculate metrics and finalize periods
      Object.keys(flowMetrics).forEach(period => {
        const metrics = flowMetrics[period];
        metrics.netFlow = metrics.inflow - metrics.outflow;
        metrics.uniqueAddressCount = metrics.uniqueAddresses.size;
        metrics.avgSize = metrics.txCount > 0 ? (metrics.inflow + metrics.outflow) / metrics.txCount : 0;
        delete metrics.uniqueAddresses; // Remove Set from response
      });
      
      // Whale detection - find addresses with large volumes
      const medianTransferSize = calculateMedianTransferSize();
      const whaleThreshold = medianTransferSize * 10; // 10x median = whale
      
      const whales = Array.from(addressActivity.entries())
        .filter(([_, activity]) => (activity.inflow + activity.outflow) > whaleThreshold)
        .map(([address, activity]) => ({
          address: address.slice(0, 6) + '...' + address.slice(-4), // Abbreviated address
          totalVolume: activity.inflow + activity.outflow,
          netFlow: activity.inflow - activity.outflow,
          txCount: activity.txCount,
          type: activity.inflow > activity.outflow ? 'accumulator' : 'distributor'
        }))
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, 10); // Top 10 whales
      
      // Smart money detection - addresses with consistent profitable patterns
      const smartMoneyAddresses = Array.from(addressActivity.entries())
        .filter(([_, activity]) => activity.txCount >= 5) // Minimum 5 transactions
        .map(([address, activity]) => ({
          address: address.slice(0, 6) + '...' + address.slice(-4),
          profitability: activity.inflow - activity.outflow,
          txCount: activity.txCount,
          avgTxSize: (activity.inflow + activity.outflow) / activity.txCount
        }))
        .filter(addr => addr.profitability > 0) // Profitable addresses
        .sort((a, b) => b.profitability - a.profitability)
        .slice(0, 5); // Top 5 smart money addresses
      
      // Flow velocity analysis
      const recentFlows = transfers.slice(0, 100); // Last 100 transfers
      const oldFlows = transfers.slice(100, 200); // Previous 100 transfers
      
      const recentVolume = recentFlows.reduce((sum, t) => sum + parseFloat(t.value) / Math.pow(10, decimals), 0);
      const oldVolume = oldFlows.reduce((sum, t) => sum + parseFloat(t.value) / Math.pow(10, decimals), 0);
      
      const velocityTrend = recentVolume > oldVolume * 1.2 ? 'accelerating' : 
                           recentVolume < oldVolume * 0.8 ? 'decelerating' : 'stable';
      
      // Accumulation/Distribution phase detection
      const last24hMetrics = flowMetrics['24h'];
      const last7dMetrics = flowMetrics['7d'];
      
      const phase = last24hMetrics.netFlow > 0 && last7dMetrics.netFlow > 0 ? 'accumulation' :
                   last24hMetrics.netFlow < 0 && last7dMetrics.netFlow < 0 ? 'distribution' :
                   'transition';
      
      // Prepare chart data
      const chartData = {
        hourly: Array.from(hourlyData.entries())
          .map(([timestamp, data]) => ({
            timestamp,
            inflow: data.inflow,
            outflow: data.outflow,
            netFlow: data.inflow - data.outflow,
            volume: data.volume,
            txCount: data.txCount
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-24), // Last 24 hours
        daily: Array.from(dailyData.entries())
          .map(([timestamp, data]) => ({
            timestamp,
            inflow: data.inflow,
            outflow: data.outflow,
            netFlow: data.inflow - data.outflow,
            volume: data.volume,
            txCount: data.txCount
          }))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-30) // Last 30 days
      };
      
      // Predictive insights
      const insights = {
        trend: last24hMetrics.netFlow > 0 ? 'bullish' : last24hMetrics.netFlow < 0 ? 'bearish' : 'neutral',
        momentum: velocityTrend,
        phase,
        whaleActivity: whales.length > 0 ? 'high' : 'low',
        smartMoneySignal: smartMoneyAddresses.length > 3 ? 'strong' : 'weak',
        volumeProfile: {
          '24h': last24hMetrics.inflow + last24hMetrics.outflow,
          '7d': last7dMetrics.inflow + last7dMetrics.outflow,
          '30d': flowMetrics['30d'].inflow + flowMetrics['30d'].outflow
        }
      };

      res.json({
        tokenAddress: underlyingToken,
        tokenSymbol,
        transfers: transfers.slice(0, Math.min(Number(limit), 50)), // Limited for display
        flowAnalysis: {
          periods: flowMetrics,
          advanced: {
            whaleActivity: {
              detected: whales.length > 0,
              count: whales.length,
              topWhales: whales.slice(0, 5),
              totalWhaleVolume: whales.reduce((sum, w) => sum + w.totalVolume, 0)
            },
            smartMoney: {
              movements: smartMoneyAddresses,
              signal: insights.smartMoneySignal
            },
            flowVelocity: {
              trend: velocityTrend,
              recentVolume,
              previousVolume: oldVolume,
              changePercent: oldVolume > 0 ? ((recentVolume - oldVolume) / oldVolume) * 100 : 0
            },
            marketPhase: {
              current: phase,
              confidence: Math.abs(last24hMetrics.netFlow) / (last24hMetrics.inflow + last24hMetrics.outflow) || 0
            }
          },
          chartData,
          insights,
          statistics: {
            medianTransferSize,
            totalAddresses: addressActivity.size,
            activeAddresses24h: flowMetrics['24h'].uniqueAddressCount,
            volumeDistribution: {
              small: transferSizes.filter(s => s < medianTransferSize * 0.5).length,
              medium: transferSizes.filter(s => s >= medianTransferSize * 0.5 && s < medianTransferSize * 2).length,
              large: transferSizes.filter(s => s >= medianTransferSize * 2).length
            }
          }
        }
      });
    } catch (error) {
      console.error("Error fetching token transfers:", error);
      res.status(500).json({ error: "Failed to fetch token transfers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
