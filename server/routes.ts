import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPoolSchema, insertPlatformSchema, insertChainSchema, insertNoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
