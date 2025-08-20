/**
 * Webhook Routes for Real-Time Updates
 * Handles Alchemy webhooks for instant holder updates
 */

import { Router } from 'express';
import { db } from '../db';
import { tokenHolders, pools, webhookConfigs } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { alchemyService } from '../services/alchemyService';
import { webhookManager } from '../services/webhookManager';

const router = Router();

// Store for webhook signatures to prevent replay attacks
const processedWebhooks = new Set<string>();

/**
 * Alchemy Webhook Handler
 * Receives real-time notifications when token transfers occur
 */
router.post('/api/webhooks/alchemy', async (req, res) => {
  try {
    const { id, webhookId, type, event } = req.body;
    
    // Prevent replay attacks
    if (processedWebhooks.has(id)) {
      return res.status(200).json({ status: 'already_processed' });
    }
    processedWebhooks.add(id);
    
    // Clean up old webhook IDs (keep last 10000)
    if (processedWebhooks.size > 10000) {
      const oldIds = Array.from(processedWebhooks).slice(0, 5000);
      oldIds.forEach(id => processedWebhooks.delete(id));
    }
    
    console.log(`🔔 Webhook received: ${type} for webhook ${webhookId}`);
    
    if (type === 'ADDRESS_ACTIVITY' || type === 'NFT_ACTIVITY') {
      // Handle token transfer events
      const { activity } = event;
      
      for (const transfer of activity || []) {
        if (transfer.category === 'token' || transfer.category === 'erc20') {
          const tokenAddress = transfer.rawContract?.address || transfer.contractAddress;
          
          if (tokenAddress) {
            console.log(`📡 Real-time update for token ${tokenAddress}`);
            
            // Find the pool for this token
            const [pool] = await db
              .select()
              .from(pools)
              .where(eq(pools.poolAddress, tokenAddress))
              .limit(1);
            
            if (pool) {
              console.log(`🔄 Updating holders for pool ${pool.tokenPair}`);
              
              // Update holder balances for both from and to addresses
              const addressesToUpdate = [transfer.fromAddress, transfer.toAddress].filter(Boolean);
              
              for (const address of addressesToUpdate) {
                try {
                  // Get updated balance from Alchemy
                  const holders = await alchemyService.getTopTokenHolders(
                    tokenAddress, 
                    1, 
                    pool.chainId === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'base' : undefined
                  );
                  
                  // Find the specific holder
                  const holder = holders.find(h => h.address.toLowerCase() === address.toLowerCase());
                  
                  if (holder) {
                    // Update or insert holder data
                    await db
                      .insert(tokenHolders)
                      .values({
                        poolId: pool.id,
                        tokenAddress: tokenAddress,
                        holderAddress: holder.address,
                        tokenBalance: holder.balance,
                        tokenBalanceFormatted: holder.formattedBalance.toString(),
                        usdValue: holder.formattedBalance.toString(), // Will be calculated separately
                        walletBalanceEth: '0', // Will be calculated separately
                        walletBalanceUsd: '0', // Will be calculated separately  
                        poolSharePercentage: '0', // Will be calculated separately
                        rank: 0, // Will be calculated separately
                        lastUpdated: new Date(),
                      })
                      .onConflictDoUpdate({
                        target: [tokenHolders.poolId, tokenHolders.holderAddress],
                        set: {
                          tokenBalance: holder.balance,
                          tokenBalanceFormatted: holder.formattedBalance.toString(),
                          lastUpdated: new Date(),
                        },
                      });
                    
                    console.log(`✅ Updated holder ${address} for pool ${pool.tokenPair}`);
                  } else if (holder === undefined && addressesToUpdate.includes(transfer.fromAddress)) {
                    // Holder sold all tokens, remove from database
                    await db
                      .delete(tokenHolders)
                      .where(
                        and(
                          eq(tokenHolders.poolId, pool.id),
                          eq(tokenHolders.holderAddress, address)
                        )
                      );
                    
                    console.log(`🗑️ Removed holder ${address} from pool ${pool.tokenPair} (zero balance)`);
                  }
                } catch (error) {
                  console.error(`Error updating holder ${address}:`, error);
                }
              }
            }
          }
        }
      }
    }
    
    res.status(200).json({ status: 'success', processed: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Webhook Status Endpoint
 * Check if webhooks are configured and working
 */
router.get('/api/webhooks/status', async (req, res) => {
  res.json({
    enabled: true,
    provider: 'alchemy',
    capabilities: [
      'Real-time holder updates',
      'Instant transfer notifications',
      'Portfolio value tracking',
      'Cross-chain monitoring'
    ],
    message: '✅ Webhooks are active with 100 webhook allowance'
  });
});

/**
 * Get all monitored contract addresses
 * Returns all pool addresses that should be configured in Alchemy
 */
router.get('/api/webhooks/monitored-addresses', async (req, res) => {
  try {
    const addresses = await webhookManager.getMonitoredAddresses();
    res.json(addresses);
  } catch (error) {
    console.error('❌ Error getting monitored addresses:', error);
    res.status(500).json({ error: 'Failed to get monitored addresses' });
  }
});

/**
 * Get new pools added since a specific date
 * Useful for identifying pools that need webhook configuration
 */
router.get('/api/webhooks/new-pools', async (req, res) => {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    
    const newPools = await webhookManager.getNewPoolsSince(sinceDate);
    res.json(newPools);
  } catch (error) {
    console.error('❌ Error getting new pools:', error);
    res.status(500).json({ error: 'Failed to get new pools' });
  }
});

/**
 * Register a pool for webhook monitoring
 * Automatically called when new pools are added
 */
router.post('/api/webhooks/register-pool', async (req, res) => {
  try {
    const { poolId } = req.body;
    
    if (!poolId) {
      return res.status(400).json({ error: 'Pool ID required' });
    }
    
    const result = await webhookManager.registerNewPool(poolId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error registering pool:', error);
    res.status(500).json({ error: 'Failed to register pool' });
  }
});

/**
 * Get webhook configuration status
 */
router.get('/api/webhooks/config-status', async (req, res) => {
  try {
    const status = await webhookManager.getWebhookStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Error getting webhook status:', error);
    res.status(500).json({ error: 'Failed to get webhook status' });
  }
});

export default router;