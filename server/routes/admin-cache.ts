import { Router } from 'express';
import { db } from '../db';
import { cacheSettings } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

const router = Router();

// Get all cache settings
router.get('/cache-settings', async (req, res) => {
  try {
    const settings = await db.select().from(cacheSettings).orderBy(cacheSettings.category, cacheSettings.displayName);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching cache settings:', error);
    res.status(500).json({ error: 'Failed to fetch cache settings' });
  }
});

// Get cache statistics
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = await db
      .select({
        totalCaches: sql<number>`COUNT(*)`,
        activeCaches: sql<number>`COUNT(*) FILTER (WHERE ${cacheSettings.isEnabled} = true)`,
        totalHits: sql<number>`COALESCE(SUM(${cacheSettings.hitCount}), 0)`,
        totalMisses: sql<number>`COALESCE(SUM(${cacheSettings.missCount}), 0)`,
      })
      .from(cacheSettings);

    const result = stats[0];
    const hitRatio = result.totalHits + result.totalMisses > 0 
      ? result.totalHits / (result.totalHits + result.totalMisses)
      : 0;

    res.json({
      totalCaches: result.totalCaches,
      activeCaches: result.activeCaches,
      totalHits: result.totalHits,
      totalMisses: result.totalMisses,
      hitRatio,
    });
  } catch (error) {
    console.error('Error fetching cache statistics:', error);
    res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
});

// Update cache setting
router.put('/cache-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cacheDurationMs, isEnabled, maxEntries } = req.body;

    const updatedSetting = await db
      .update(cacheSettings)
      .set({
        cacheDurationMs,
        isEnabled,
        maxEntries,
        updatedAt: new Date(),
      })
      .where(eq(cacheSettings.id, id))
      .returning();

    if (updatedSetting.length === 0) {
      return res.status(404).json({ error: 'Cache setting not found' });
    }

    // Notify services about cache setting changes
    console.log(`🔧 Cache setting updated: ${updatedSetting[0].serviceName} - Duration: ${cacheDurationMs}ms, Enabled: ${isEnabled}`);
    
    res.json(updatedSetting[0]);
  } catch (error) {
    console.error('Error updating cache setting:', error);
    res.status(500).json({ error: 'Failed to update cache setting' });
  }
});

// Clear specific cache
router.post('/cache-settings/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    
    const setting = await db.query.cacheSettings.findFirst({
      where: eq(cacheSettings.id, id)
    });

    if (!setting) {
      return res.status(404).json({ error: 'Cache setting not found' });
    }

    // Reset hit/miss counters and update last clear time
    await db
      .update(cacheSettings)
      .set({
        hitCount: 0,
        missCount: 0,
        lastClearAt: new Date(),
      })
      .where(eq(cacheSettings.id, id));

    console.log(`🗑️ Cache cleared: ${setting.serviceName}`);
    
    res.json({ message: `Cache cleared for ${setting.displayName}` });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;