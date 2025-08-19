import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Get all pools - database only, no hardcoded values
router.get('/pools/database-only', async (req, res) => {
  try {
    // Only read from database, return empty if no data
    const pools = await storage.getPools({ onlyVisible: true });
    
    if (pools.length === 0) {
      return res.json({
        message: 'No pools found in database',
        pools: [],
        count: 0,
        source: 'database_only'
      });
    }

    // Return only what's in the database - no fallbacks, no defaults
    const databasePools = pools.map(pool => ({
      id: pool.id,
      tokenPair: pool.tokenPair,
      platform: pool.platform.name,
      chain: pool.chain.name,
      apy: pool.apy || null,  // null if no data
      tvl: pool.tvl || null,  // null if no data
      riskLevel: pool.riskLevel,
      lastUpdated: pool.lastUpdated,
      dataSource: 'database'
    }));

    res.json({
      pools: databasePools,
      count: databasePools.length,
      source: 'database_only',
      message: 'Data sourced exclusively from database'
    });

  } catch (error) {
    console.error('❌ Database-only pools query failed:', error);
    res.status(500).json({
      error: 'Database query failed',
      message: 'Unable to retrieve pools from database',
      pools: []
    });
  }
});

// Get specific pool - database only
router.get('/pools/:poolId/database-only', async (req, res) => {
  try {
    const { poolId } = req.params;
    
    const pool = await storage.getPoolById(poolId);
    
    if (!pool) {
      return res.status(404).json({
        error: 'Pool not found',
        message: `No pool with ID ${poolId} found in database`,
        poolId
      });
    }

    // Return only database data - no fallbacks
    const databasePool = {
      id: pool.id,
      tokenPair: pool.tokenPair,
      platform: pool.platform.name,
      chain: pool.chain.name,
      apy: pool.apy || null,
      tvl: pool.tvl || null,
      riskLevel: pool.riskLevel,
      poolAddress: pool.poolAddress,
      lastUpdated: pool.lastUpdated,
      dataSource: 'database'
    };

    res.json({
      pool: databasePool,
      source: 'database_only',
      message: 'Data sourced exclusively from database'
    });

  } catch (error) {
    console.error(`❌ Database-only pool query failed for ${req.params.poolId}:`, error);
    res.status(500).json({
      error: 'Database query failed',
      message: 'Unable to retrieve pool from database'
    });
  }
});

// Database status check
router.get('/database/status', async (req, res) => {
  try {
    const pools = await storage.getPools({});
    const visiblePools = await storage.getPools({ onlyVisible: true });
    
    // Count pools with actual APY data
    const poolsWithApy = pools.filter(pool => pool.apy && parseFloat(pool.apy) > 0);
    const poolsWithTvl = pools.filter(pool => pool.tvl && parseFloat(pool.tvl) > 0);

    res.json({
      database: 'connected',
      totalPools: pools.length,
      visiblePools: visiblePools.length,
      poolsWithApy: poolsWithApy.length,
      poolsWithTvl: poolsWithTvl.length,
      dataIntegrity: {
        hasData: pools.length > 0,
        hasApyData: poolsWithApy.length > 0,
        hasTvlData: poolsWithTvl.length > 0
      },
      message: 'Database status check - no fallback data used'
    });

  } catch (error) {
    console.error('❌ Database status check failed:', error);
    res.status(500).json({
      database: 'error',
      error: 'Failed to check database status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;