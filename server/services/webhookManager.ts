/**
 * Webhook Management Service
 * Automatically tracks new pools and manages webhook configurations
 */

import { db } from '../db';
import { pools, webhookConfigs } from '@shared/schema';
import { eq, isNotNull } from 'drizzle-orm';

export class WebhookManager {
  private static instance: WebhookManager;
  
  private constructor() {}
  
  static getInstance(): WebhookManager {
    if (!this.instance) {
      this.instance = new WebhookManager();
    }
    return this.instance;
  }

  /**
   * Get all contract addresses that should be monitored
   * Includes all pools with valid addresses
   */
  async getMonitoredAddresses() {
    try {
      // Get all pools with addresses
      const allPools = await db
        .select({
          id: pools.id,
          name: pools.tokenPair,
          address: pools.poolAddress,
          network: pools.chainId,
          platformId: pools.platformId,
          createdAt: pools.createdAt
        })
        .from(pools)
        .where(isNotNull(pools.poolAddress));

      // Group by network for easier configuration
      const byNetwork: Record<string, any[]> = {};
      const allAddresses: string[] = [];
      
      allPools.forEach(pool => {
        if (pool.address) {
          const network = pool.network === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'base' : 'ethereum';
          
          if (!byNetwork[network]) {
            byNetwork[network] = [];
          }
          
          byNetwork[network].push({
            id: pool.id,
            name: pool.name,
            address: pool.address,
            addedAt: pool.createdAt
          });
          
          allAddresses.push(pool.address);
        }
      });

      return {
        total: allAddresses.length,
        addresses: allAddresses,
        byNetwork,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ Error getting monitored addresses:', error);
      throw error;
    }
  }

  /**
   * Check if a new pool needs webhook monitoring
   * Called automatically when a pool is created
   */
  async registerNewPool(poolId: string) {
    try {
      const [pool] = await db
        .select()
        .from(pools)
        .where(eq(pools.id, poolId))
        .limit(1);

      if (!pool || !pool.poolAddress) {
        return { registered: false, reason: 'No pool address' };
      }

      // Check if already registered
      const existing = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.contractAddress, pool.poolAddress))
        .limit(1);

      if (existing.length > 0) {
        return { registered: true, reason: 'Already registered' };
      }

      // Register the new webhook config
      await db.insert(webhookConfigs).values({
        poolId: pool.id,
        contractAddress: pool.poolAddress,
        network: pool.chainId === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'base' : 'ethereum',
        eventTypes: ['transfer', 'approval'], // Default events to monitor
        isActive: true,
        metadata: {
          poolName: pool.tokenPair,
          platform: pool.platformId,
          registeredAt: new Date().toISOString()
        }
      });

      console.log(`✅ Webhook monitoring registered for new pool: ${pool.tokenPair} (${pool.poolAddress})`);
      
      // Notify about the new pool needing Alchemy configuration
      this.notifyNewPoolAdded(pool);

      return { 
        registered: true, 
        address: pool.poolAddress,
        network: pool.chainId === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'base' : 'ethereum'
      };
    } catch (error) {
      console.error('❌ Error registering new pool for webhooks:', error);
      return { registered: false, error: error.message };
    }
  }

  /**
   * Get newly added pools that need webhook configuration
   * Useful for batch updates to Alchemy
   */
  async getNewPoolsSince(date: Date) {
    try {
      const newPools = await db
        .select({
          id: pools.id,
          name: pools.tokenPair,
          address: pools.poolAddress,
          network: pools.chainId,
          createdAt: pools.createdAt
        })
        .from(pools)
        .where(isNotNull(pools.poolAddress));

      const filtered = newPools.filter(p => 
        p.createdAt && new Date(p.createdAt) > date
      );

      return {
        count: filtered.length,
        pools: filtered.map(p => ({
          name: p.name,
          address: p.address,
          network: p.network === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'base' : 'ethereum',
          addedAt: p.createdAt
        }))
      };
    } catch (error) {
      console.error('❌ Error getting new pools:', error);
      throw error;
    }
  }

  /**
   * Notify system admin about new pool needing webhook config
   */
  private notifyNewPoolAdded(pool: any) {
    console.log('');
    console.log('🔔 ========================================');
    console.log('🔔 NEW POOL ADDED - WEBHOOK CONFIG NEEDED');
    console.log('🔔 ========================================');
    console.log(`📍 Pool: ${pool.tokenPair}`);
    console.log(`📍 Address: ${pool.poolAddress}`);
    console.log(`📍 Network: ${pool.chainId === '8c22f749-65ca-4340-a4c8-fc837df48928' ? 'Base' : 'Ethereum'}`);
    console.log('🔔 Add this address to your Alchemy webhook configuration');
    console.log('🔔 ========================================');
    console.log('');
  }

  /**
   * Get webhook status and statistics
   */
  async getWebhookStatus() {
    try {
      const configs = await db
        .select()
        .from(webhookConfigs);

      const activeConfigs = configs.filter(c => c.isActive);
      const networks = [...new Set(configs.map(c => c.network))];

      return {
        status: 'active',
        totalConfigs: configs.length,
        activeConfigs: activeConfigs.length,
        networks,
        lastChecked: new Date(),
        webhookEndpoint: '/api/webhooks/alchemy'
      };
    } catch (error) {
      console.error('❌ Error getting webhook status:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Batch register multiple pools
   * Useful when importing pools in bulk
   */
  async batchRegisterPools(poolIds: string[]) {
    const results = [];
    
    for (const poolId of poolIds) {
      const result = await this.registerNewPool(poolId);
      results.push({ poolId, ...result });
    }

    return {
      total: poolIds.length,
      registered: results.filter(r => r.registered).length,
      failed: results.filter(r => !r.registered).length,
      results
    };
  }
}

export const webhookManager = WebhookManager.getInstance();