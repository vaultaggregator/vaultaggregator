import type { Express } from "express";
import { MarketIntelligenceService } from "../services/market-intelligence";

// For now, make endpoints publicly accessible for testing
// In production, you can add proper authentication
const requireAuth = (req: any, res: any, next: any) => {
  // TODO: Implement proper auth check
  next();
};

export function registerMarketIntelligenceRoutes(app: Express) {
  const marketIntelligence = new MarketIntelligenceService();

  // Get comprehensive market intelligence dashboard
  app.get("/api/market-intelligence", requireAuth, async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const pools = await storage.getPools({ limit: 100, offset: 0, onlyVisible: true });
      
      const intelligence = await marketIntelligence.generateMarketIntelligence(pools);
      res.json(intelligence);
    } catch (error) {
      console.error("Market intelligence dashboard error:", error);
      res.status(500).json({ error: "Failed to generate market intelligence" });
    }
  });

  // Get market sentiment analysis
  app.get("/api/market-intelligence/sentiment", requireAuth, async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const pools = await storage.getPools({ limit: 50, offset: 0, onlyVisible: true });
      
      const sentiment = await marketIntelligence.analyzeSentiment(pools);
      res.json(sentiment);
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      res.status(500).json({ error: "Failed to analyze market sentiment" });
    }
  });

  // Get whale movement tracking
  app.get("/api/market-intelligence/whales", requireAuth, async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const pools = await storage.getPools({ limit: 30, offset: 0, onlyVisible: true });
      
      const whales = await marketIntelligence.trackWhaleMovements(pools);
      res.json(whales);
    } catch (error) {
      console.error("Whale tracking error:", error);
      res.status(500).json({ error: "Failed to track whale movements" });
    }
  });

  // Get protocol health scores
  app.get("/api/market-intelligence/health", requireAuth, async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const pools = await storage.getPools({ limit: 100, offset: 0, onlyVisible: true });
      
      const health = await marketIntelligence.calculateProtocolHealth(pools);
      res.json(health);
    } catch (error) {
      console.error("Protocol health scoring error:", error);
      res.status(500).json({ error: "Failed to calculate protocol health" });
    }
  });

  // Get yield forecasts
  app.get("/api/market-intelligence/forecasts", requireAuth, async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const pools = await storage.getPools({ limit: 50, offset: 0, onlyVisible: true });
      
      const forecasts = await marketIntelligence.forecastYields(pools);
      res.json(forecasts);
    } catch (error) {
      console.error("Yield forecasting error:", error);
      res.status(500).json({ error: "Failed to generate yield forecasts" });
    }
  });

  // Get specific protocol analysis
  app.get("/api/market-intelligence/protocol/:platformName", requireAuth, async (req, res) => {
    try {
      const { platformName } = req.params;
      const { storage } = await import("../storage");
      
      const allPools = await storage.getPools({ 
        limit: 1000, 
        offset: 0, 
        onlyVisible: true
      });
      
      const pools = allPools.filter(pool => 
        pool.platformName && pool.platformName.toLowerCase().includes(platformName.toLowerCase())
      );

      if (pools.length === 0) {
        return res.status(404).json({ error: "Protocol not found" });
      }

      const [sentiment, whales, health, forecasts] = await Promise.all([
        marketIntelligence.analyzeSentiment(pools),
        marketIntelligence.trackWhaleMovements(pools),
        marketIntelligence.calculateProtocolHealth(pools),
        marketIntelligence.forecastYields(pools)
      ]);

      res.json({
        protocol: platformName,
        pools: pools.length,
        analysis: {
          sentiment,
          whaleActivity: whales,
          healthScore: health,
          forecasts
        },
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Protocol analysis error:", error);
      res.status(500).json({ error: "Failed to analyze protocol" });
    }
  });
}