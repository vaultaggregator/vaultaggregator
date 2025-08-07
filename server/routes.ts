import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPoolSchema, insertPlatformSchema, insertChainSchema, insertNoteSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
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
        limit = '1000', 
        offset = '0' 
      } = req.query;

      console.log("Admin pools request:", { chainId, platformId, search, limit, offset });

      const pools = await storage.getPools({
        chainId: chainId as string,
        platformId: platformId as string,
        search: search as string,
        onlyVisible: false, // Admin can see all pools
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      console.log(`Returning ${pools.length} admin pools`);
      res.json(pools);
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

  const httpServer = createServer(app);
  return httpServer;
}
