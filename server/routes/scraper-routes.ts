import { Router } from 'express';
import { scraperManager } from '../scrapers/scraper-manager';

const router = Router();

// Trigger manual scraping of all pools
router.post('/scrape/all', async (req, res) => {
  try {
    console.log('🔄 Manual scrape triggered via API');
    await scraperManager.scrapeAllPools();
    
    res.json({
      message: 'Pool scraping completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in manual pool scraping:', error);
    res.status(500).json({
      error: 'Failed to scrape pools',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger manual scraping of specific pool
router.post('/scrape/pool/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    if (!poolId) {
      return res.status(400).json({ error: 'Pool ID is required' });
    }

    console.log(`🔄 Manual scrape triggered for pool: ${poolId}`);
    const result = await scraperManager.scrapeSpecificPool(poolId);
    
    if (result) {
      res.json({
        message: 'Pool scraped successfully',
        poolId,
        apy: result.apy,
        tvl: result.tvl,
        timestamp: result.scrapedAt
      });
    } else {
      res.status(404).json({
        error: 'Pool not found or no scraper available',
        poolId
      });
    }
  } catch (error) {
    console.error(`❌ Error scraping pool ${req.params.poolId}:`, error);
    res.status(500).json({
      error: 'Failed to scrape pool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get supported platforms for scraping
router.get('/scrapers/platforms', (req, res) => {
  try {
    const platforms = scraperManager.getSupportedPlatforms();
    
    res.json({
      platforms,
      count: platforms.length,
      message: 'Available scraper platforms'
    });
  } catch (error) {
    console.error('❌ Error getting scraper platforms:', error);
    res.status(500).json({
      error: 'Failed to get scraper platforms',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;