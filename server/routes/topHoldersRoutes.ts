import { Router } from 'express';
import { topHoldersCache } from '../services/topHoldersCache';
import { topHoldersSync } from '../services/topHoldersSync';
import { db } from '../db';
import { pools } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/top-holders/:chain/:protocol/:vault
router.get('/:chain/:protocol/:vault', async (req, res) => {
  try {
    const { chain, protocol, vault } = req.params;
    
    console.log(`🔍 Top holders request: ${chain}/${protocol}/${vault}`);
    
    // Find the pool by chain, protocol, and vault token name  
    const chainId = chain === 'ethereum' ? '164641ea-b9e1-49a0-b655-334a73efabec' : '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7';
    
    const pool = await db.query.pools.findFirst({
      where: (pools, { eq }) => eq(pools.chainId, chainId),
      with: {
        network: true,
        platform: true
      }
    });

    if (!pool || !pool.poolAddress) {
      return res.status(404).json({ 
        error: 'Pool not found',
        message: `Pool ${vault} not found on ${protocol}/${chain}` 
      });
    }

    // Try to get cached data
    const cacheResult = await topHoldersCache.get(chain, pool.id, pool.poolAddress);
    
    if (cacheResult) {
      console.log(`✅ Serving cached top holders for ${pool.tokenPair}`);
      return res.json({
        success: true,
        data: cacheResult.data,
        isStale: cacheResult.isStale,
        poolInfo: {
          id: pool.id,
          name: pool.tokenPair,
          chain: pool.network.name,
          protocol: pool.platform.name
        }
      });
    }

    // No data available yet
    console.log(`⏳ No top holders data available for ${pool.tokenPair}, serving empty response`);
    return res.json({
      success: true,
      data: null,
      isStale: false,
      isBuilding: topHoldersCache.isBuilding(chain, pool.poolAddress),
      poolInfo: {
        id: pool.id,
        name: pool.tokenPair,
        chain: pool.network.name,
        protocol: pool.platform.name
      },
      message: 'Top holders data is being generated. Please check back in a few minutes.'
    });

  } catch (error) {
    console.error('❌ Error fetching top holders:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch top holders data'
    });
  }
});

// POST /api/revalidate/top-holders/:chain/:protocol/:vault
router.post('/revalidate/:chain/:protocol/:vault', async (req, res) => {
  try {
    const { chain, protocol, vault } = req.params;
    
    console.log(`🔄 Top holders revalidation request: ${chain}/${protocol}/${vault}`);
    
    // Find the pool
    const chainId = chain === 'ethereum' ? '164641ea-b9e1-49a0-b655-334a73efabec' : '19a7e3af-bc9b-4c6a-9df5-0b24b19934a7';
    
    const pool = await db.query.pools.findFirst({
      where: (pools, { eq }) => eq(pools.chainId, chainId),
      with: {
        network: true,
        platform: true
      }
    });

    if (!pool || !pool.poolAddress) {
      return res.status(404).json({ 
        error: 'Pool not found',
        message: `Pool ${vault} not found on ${protocol}/${chain}` 
      });
    }

    // Force cache invalidation and rebuild
    await topHoldersCache.invalidate(chain, pool.id, pool.poolAddress);
    
    console.log(`✅ Top holders revalidated for ${pool.tokenPair}`);
    res.json({
      success: true,
      message: `Top holders data revalidated for ${pool.tokenPair}`,
      poolInfo: {
        id: pool.id,
        name: pool.tokenPair,
        chain: pool.network.name,
        protocol: pool.platform.name
      }
    });

  } catch (error) {
    console.error('❌ Error revalidating top holders:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to revalidate top holders data'
    });
  }
});

// POST /api/revalidate/top-holders/all
router.post('/revalidate/all', async (req, res) => {
  try {
    console.log('🔄 Revalidating top holders for all pools...');
    
    // Run sync for all pools in background
    topHoldersSync.syncAllPools().catch(error => {
      console.error('❌ Background sync failed:', error);
    });
    
    res.json({
      success: true,
      message: 'Top holders sync started for all pools'
    });

  } catch (error) {
    console.error('❌ Error starting bulk revalidation:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to start bulk revalidation'
    });
  }
});

// GET /api/top-holders/metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await topHoldersCache.getMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ Error fetching top holders metrics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch metrics'
    });
  }
});

export default router;