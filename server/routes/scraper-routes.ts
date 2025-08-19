import { Router } from 'express';
import { scraperManager } from '../scrapers/scraper-manager';
import { morphoService } from '../services/morphoService';
import { storage } from '../storage';
import type { PoolWithRelations } from '@shared/schema';

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

// ===== MORPHO PLATFORM ENDPOINTS =====

// Get Morpho TVL
router.get('/scrape/morpho/tvl', async (req, res) => {
  try {
    console.log('💰 Testing Morpho TVL endpoint');
    
    // Try to get vault data from Morpho API
    const vaultData = await morphoService.getVaultByAddress('0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB');
    
    if (vaultData && vaultData.state?.totalAssetsUsd) {
      res.json({
        success: true,
        source: 'morpho_api',
        tvl: vaultData.state.totalAssetsUsd,
        totalSupplyUsd: vaultData.state.totalSupplyUsd,
        vaultAddress: vaultData.address,
        timestamp: new Date().toISOString()
      });
    } else {
      // Try to get from database as fallback
      const pools = await storage.getPools({ onlyVisible: true });
      const morphoPool = pools.find((p: PoolWithRelations) => 
        p.platform?.name?.toLowerCase().includes('morpho') && p.isActive);
      
      if (morphoPool) {
        res.json({
          success: true,
          source: 'database',
          tvl: morphoPool.tvl,
          poolId: morphoPool.id,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          error: 'No Morpho TVL data available',
          message: 'Unable to fetch from API or database'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error fetching Morpho TVL:', error);
    res.status(500).json({
      error: 'Failed to fetch Morpho TVL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Morpho Days (Operating Days)
router.get('/scrape/morpho/days', async (req, res) => {
  try {
    console.log('📅 Testing Morpho Days endpoint');
    
    // Get pool data from database
    const pools = await storage.getPools({ onlyVisible: true });
    const morphoPool = pools.find((p: PoolWithRelations) => 
      p.platform?.name?.toLowerCase().includes('morpho') && p.isActive);
    
    if (morphoPool) {
      // Calculate days from creation date if available
      let operatingDays = null;
      if (morphoPool.createdAt) {
        const creationDate = new Date(morphoPool.createdAt);
        const currentDate = new Date();
        const timeDiff = currentDate.getTime() - creationDate.getTime();
        operatingDays = Math.floor(timeDiff / (1000 * 3600 * 24));
      }
      
      res.json({
        success: true,
        source: 'database_calculation',
        operatingDays: operatingDays,
        createdAt: morphoPool.createdAt,
        poolId: morphoPool.id,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: 'No Morpho pool data available',
        message: 'Unable to calculate operating days'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching Morpho Days:', error);
    res.status(500).json({
      error: 'Failed to fetch Morpho Days',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== LIDO PLATFORM ENDPOINTS =====

// Get Lido TVL
router.get('/scrape/lido/tvl', async (req, res) => {
  try {
    console.log('💰 Testing Lido TVL endpoint');
    
    // Get pool data from database (Lido API integration would be added here)
    const pools = await storage.getPools({ onlyVisible: true });
    const lidoPool = pools.find((p: PoolWithRelations) => 
      p.platform?.name?.toLowerCase().includes('lido') && p.isActive);
    
    if (lidoPool) {
      res.json({
        success: true,
        source: 'database',
        tvl: lidoPool.tvl,
        poolId: lidoPool.id,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: 'No Lido TVL data available',
        message: 'Unable to fetch from database'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching Lido TVL:', error);
    res.status(500).json({
      error: 'Failed to fetch Lido TVL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Lido Days (Operating Days)
router.get('/scrape/lido/days', async (req, res) => {
  try {
    console.log('📅 Testing Lido Days endpoint');
    
    // Get pool data from database
    const pools = await storage.getPools({ onlyVisible: true });
    const lidoPool = pools.find((p: PoolWithRelations) => 
      p.platform?.name?.toLowerCase().includes('lido') && p.isActive);
    
    if (lidoPool) {
      // Calculate days from creation date if available
      let operatingDays = null;
      if (lidoPool.createdAt) {
        const creationDate = new Date(lidoPool.createdAt);
        const currentDate = new Date();
        const timeDiff = currentDate.getTime() - creationDate.getTime();
        operatingDays = Math.floor(timeDiff / (1000 * 3600 * 24));
      }
      
      res.json({
        success: true,
        source: 'database_calculation',
        operatingDays: operatingDays,
        createdAt: lidoPool.createdAt,
        poolId: lidoPool.id,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        error: 'No Lido pool data available',
        message: 'Unable to calculate operating days'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching Lido Days:', error);
    res.status(500).json({
      error: 'Failed to fetch Lido Days',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;