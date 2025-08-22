/**
 * Enhanced Alchemy API Routes
 * Exposes Enhanced Transfers and Token Metadata APIs
 */

import express from 'express';
import { enhancedTransfersService } from '../services/enhancedTransfersService';
import { tokenMetadataService } from '../services/tokenMetadataService';
import { z } from 'zod';

const router = express.Router();

// ===== ENHANCED TRANSFERS ROUTES =====

/**
 * Get wallet transaction history
 */
router.get('/api/transfers/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'ethereum', pageKey } = req.query;

    const schema = z.object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      network: z.enum(['ethereum', 'base']).optional(),
      pageKey: z.string().optional()
    });

    const validated = schema.parse({ 
      address, 
      network, 
      pageKey 
    });

    const history = await enhancedTransfersService.getWalletTransactionHistory(
      validated.address,
      validated.network as 'ethereum' | 'base',
      validated.pageKey
    );

    res.json({
      success: true,
      data: history,
      performance: '100x faster than traditional methods'
    });
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch history' 
    });
  }
});

/**
 * Get pool transaction history
 */
router.get('/api/transfers/pool/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { limit = 100 } = req.query;

    const history = await enhancedTransfersService.getPoolTransactionHistory(
      poolId,
      Number(limit)
    );

    res.json({
      success: true,
      data: history,
      message: '📊 Complete transaction history with internal transfers'
    });
  } catch (error) {
    console.error('Error fetching pool history:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch history' 
    });
  }
});

/**
 * Track internal transfers for an address
 */
router.get('/api/transfers/internal/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'ethereum' } = req.query;

    const internalTransfers = await enhancedTransfersService.trackInternalTransfers(
      address,
      network as 'ethereum' | 'base'
    );

    res.json({
      success: true,
      data: internalTransfers,
      message: '🔍 Internal smart contract interactions tracked'
    });
  } catch (error) {
    console.error('Error tracking internal transfers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track internal transfers' 
    });
  }
});

/**
 * Get whale alerts
 */
router.get('/api/transfers/whale-alerts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const alerts = await enhancedTransfersService.getWhaleAlerts(Number(limit));

    res.json({
      success: true,
      data: alerts,
      message: `🐋 Top ${limit} whale movements detected`
    });
  } catch (error) {
    console.error('Error getting whale alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get whale alerts' 
    });
  }
});

// ===== TOKEN METADATA ROUTES =====

/**
 * Get token metadata
 */
router.get('/api/metadata/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'ethereum' } = req.query;

    const metadata = await tokenMetadataService.getTokenMetadata(
      address,
      network as 'ethereum' | 'base'
    );

    res.json({
      success: true,
      data: metadata,
      message: '🪙 Rich token metadata retrieved'
    });
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch metadata' 
    });
  }
});

/**
 * Batch get token metadata
 */
router.post('/api/metadata/batch', async (req, res) => {
  try {
    const { addresses, network = 'ethereum' } = req.body;

    const schema = z.object({
      addresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
      network: z.enum(['ethereum', 'base']).optional()
    });

    const validated = schema.parse({ addresses, network });

    const metadata = await tokenMetadataService.batchGetTokenMetadata(
      validated.addresses,
      validated.network as 'ethereum' | 'base'
    );

    res.json({
      success: true,
      data: metadata,
      message: `📦 Batch metadata for ${addresses.length} tokens`
    });
  } catch (error) {
    console.error('Error batch fetching metadata:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to batch fetch' 
    });
  }
});

/**
 * Get token social links
 */
router.get('/api/metadata/social/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const socialLinks = await tokenMetadataService.getTokenSocialLinks(address);

    res.json({
      success: true,
      data: socialLinks,
      message: '🔗 Social links retrieved'
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch social links' 
    });
  }
});

/**
 * Update all pool metadata
 */
router.post('/api/metadata/update-all', async (req, res) => {
  try {
    const result = await tokenMetadataService.updateAllPoolMetadata();

    res.json({
      success: true,
      data: result,
      message: `✅ Updated metadata for ${result.updated}/${result.total} pools`
    });
  } catch (error) {
    console.error('Error updating all metadata:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update metadata' 
    });
  }
});

/**
 * Get metadata cache stats
 */
router.get('/api/metadata/cache-stats', (req, res) => {
  try {
    const stats = tokenMetadataService.getCacheStats();

    res.json({
      success: true,
      data: stats,
      message: '📊 Token metadata cache statistics'
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cache stats' 
    });
  }
});

/**
 * Clear metadata cache
 */
router.post('/api/metadata/clear-cache', (req, res) => {
  try {
    tokenMetadataService.clearCache();

    res.json({
      success: true,
      message: '🧹 Token metadata cache cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear cache' 
    });
  }
});

export default router;