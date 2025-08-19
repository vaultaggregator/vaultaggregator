/**
 * 🎯 Standardized Pool Metrics API Routes
 * 
 * Routes for managing the standardized 4-metric collection system:
 * - APY, DAYS, TVL, HOLDERS
 * - Platform-specific collection from APIs (Morpho, Lido, Etherscan)
 * - Historical tracking and status monitoring
 */

import { Router } from "express";
import { storage } from "../storage";
import { StandardizedMetricsService } from "../services/standardizedMetricsService";
import { z } from "zod";

const router = Router();

// Initialize the metrics service
const metricsService = new StandardizedMetricsService(storage);

// 🎯 Trigger immediate metrics collection for a pool
router.post('/admin/pools/:poolId/metrics/collect', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    console.log(`🎯 API: Triggering immediate metrics collection for pool ${poolId}`);
    
    // Trigger immediate collection
    await metricsService.triggerImmediateCollection(poolId);
    
    res.json({ 
      success: true, 
      message: `Metrics collection triggered for pool ${poolId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error triggering metrics collection:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to trigger metrics collection" 
    });
  }
});

// 📊 Get current metrics status for a pool
router.get('/admin/pools/:poolId/metrics/current', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const currentMetrics = await storage.getPoolMetricsCurrent(poolId);
    
    if (!currentMetrics) {
      return res.json({
        poolId,
        status: "not_initialized",
        message: "No metrics data available. Trigger collection to initialize."
      });
    }
    
    res.json({
      poolId,
      status: "initialized",
      metrics: currentMetrics,
      lastUpdated: currentMetrics.updatedAt
    });
  } catch (error) {
    console.error("❌ Error fetching current metrics:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch current metrics" 
    });
  }
});

// 📈 Get metrics history for a pool
router.get('/admin/pools/:poolId/metrics/history', async (req, res) => {
  try {
    const { poolId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    
    const history = await storage.getPoolMetricsHistory(poolId, days);
    
    res.json({
      poolId,
      days,
      history,
      count: history.length
    });
  } catch (error) {
    console.error("❌ Error fetching metrics history:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch metrics history" 
    });
  }
});

// ⚙️ Update platform refresh interval
router.put('/admin/platforms/:platformId/refresh-interval', async (req, res) => {
  try {
    const { platformId } = req.params;
    const { dataRefreshIntervalMinutes } = req.body;
    
    // Validate input
    const intervalSchema = z.object({
      dataRefreshIntervalMinutes: z.number().min(1).max(1440) // 1 minute to 24 hours
    });
    
    const validated = intervalSchema.parse({ dataRefreshIntervalMinutes });
    
    // Update platform
    const updatedPlatform = await storage.updatePlatform(platformId, {
      dataRefreshIntervalMinutes: validated.dataRefreshIntervalMinutes
    });
    
    if (!updatedPlatform) {
      return res.status(404).json({ error: "Platform not found" });
    }
    
    console.log(`⚙️ Updated platform ${platformId} refresh interval to ${validated.dataRefreshIntervalMinutes} minutes`);
    
    res.json({
      success: true,
      platform: updatedPlatform,
      message: `Refresh interval updated to ${validated.dataRefreshIntervalMinutes} minutes`
    });
  } catch (error) {
    console.error("❌ Error updating platform refresh interval:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to update refresh interval" 
    });
  }
});

// 🔄 Trigger metrics collection for all pools that need updates
router.post('/admin/metrics/collect-scheduled', async (req, res) => {
  try {
    console.log(`🔄 API: Triggering scheduled metrics collection for all pools`);
    
    await metricsService.collectMetricsForScheduledPools();
    
    res.json({ 
      success: true, 
      message: "Scheduled metrics collection completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error in scheduled metrics collection:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to complete scheduled collection" 
    });
  }
});

// 📋 Get pools that need metrics collection
router.get('/admin/metrics/pools-needing-collection', async (req, res) => {
  try {
    const pools = await storage.getPoolsNeedingMetricsCollection();
    
    res.json({
      pools,
      count: pools.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error fetching pools needing collection:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to fetch pools needing collection" 
    });
  }
});

// 📊 Get metrics summary across all pools
router.get('/admin/metrics/summary', async (req, res) => {
  try {
    // Get all active pools with their current metrics
    const pools = await storage.getPools({ onlyVisible: true });
    const metricsPromises = pools.map(pool => storage.getPoolMetricsCurrent(pool.id));
    const allMetrics = await Promise.all(metricsPromises);
    
    let totalPools = pools.length;
    let poolsWithMetrics = 0;
    let successfulAPY = 0;
    let successfulTVL = 0;
    let successfulDays = 0;
    let successfulHolders = 0;
    
    for (const metrics of allMetrics) {
      if (metrics) {
        poolsWithMetrics++;
        if (metrics.apyStatus === 'success') successfulAPY++;
        if (metrics.tvlStatus === 'success') successfulTVL++;
        if (metrics.daysStatus === 'success') successfulDays++;
        if (metrics.holdersStatus === 'success') successfulHolders++;
      }
    }
    
    res.json({
      totalPools,
      poolsWithMetrics,
      coverage: {
        apy: `${successfulAPY}/${totalPools}`,
        tvl: `${successfulTVL}/${totalPools}`,
        days: `${successfulDays}/${totalPools}`,
        holders: `${successfulHolders}/${totalPools}`
      },
      percentages: {
        apy: Math.round((successfulAPY / totalPools) * 100),
        tvl: Math.round((successfulTVL / totalPools) * 100),
        days: Math.round((successfulDays / totalPools) * 100),
        holders: Math.round((successfulHolders / totalPools) * 100)
      }
    });
  } catch (error) {
    console.error("❌ Error generating metrics summary:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to generate metrics summary" 
    });
  }
});

export { router };
export default router;