import { Router, Request, Response } from 'express';
import { alchemyService } from '../services/alchemyService';

const router = Router();

/**
 * Get cache statistics for monitoring optimization effectiveness
 */
router.get('/api/admin/cache-stats', async (req: Request, res: Response) => {
  try {
    const stats = alchemyService.getCacheStats();
    
    // Calculate savings
    const totalCached = stats.totalCached;
    const estimatedSavings = totalCached * 100; // Estimate 100 API calls saved per cached token over 24h
    
    res.json({
      success: true,
      cacheStats: {
        totalCachedTokens: totalCached,
        estimatedApiCallsSaved: estimatedSavings,
        estimatedCostSavings: `$${(estimatedSavings * 0.00005).toFixed(2)}`, // Rough estimate
        cacheDurationHours: 24,
        entries: stats.cacheEntries
      },
      message: `Caching ${totalCached} tokens, saving approximately ${estimatedSavings} API calls per day`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

/**
 * Clear expired cache entries
 */
router.post('/api/admin/cache-clear', async (req: Request, res: Response) => {
  try {
    const cleared = alchemyService.clearExpiredCache();
    
    res.json({
      success: true,
      clearedEntries: cleared,
      message: `Cleared ${cleared} expired cache entries`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

export default router;