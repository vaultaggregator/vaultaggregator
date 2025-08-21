/**
 * Seed script to initialize cache settings for optimization services
 */
import { db } from './server/db';
import { cacheSettings } from './shared/schema';

const defaultCacheSettings = [
  {
    serviceName: 'alchemy_token_metadata',
    displayName: 'Alchemy Token Metadata',
    description: 'Cache for token metadata from Alchemy API (name, symbol, decimals)',
    cacheDurationMs: 24 * 60 * 60 * 1000, // 24 hours
    cacheType: 'memory',
    category: 'metadata',
    maxEntries: 1000,
    isEnabled: true
  },
  {
    serviceName: 'alchemy_token_pricing',
    displayName: 'Alchemy Token Pricing',
    description: 'Cache for token price data from Alchemy API',
    cacheDurationMs: 5 * 60 * 1000, // 5 minutes
    cacheType: 'memory',
    category: 'pricing',
    maxEntries: 500,
    isEnabled: true
  },
  {
    serviceName: 'moralis_token_holders',
    displayName: 'Moralis Token Holders',
    description: 'Cache for token holder data from Moralis API',
    cacheDurationMs: 30 * 60 * 1000, // 30 minutes
    cacheType: 'memory',
    category: 'holders',
    maxEntries: 100,
    isEnabled: true
  },
  {
    serviceName: 'static_vault_tokens',
    displayName: 'Static Vault Token Cache',
    description: 'Static cache for known vault token metadata and pricing',
    cacheDurationMs: 365 * 24 * 60 * 60 * 1000, // 1 year (essentially permanent)
    cacheType: 'memory',
    category: 'metadata',
    maxEntries: 50,
    isEnabled: true
  },
  {
    serviceName: 'token_info_sync',
    displayName: 'Token Info Sync Cache',
    description: 'Cache for token information synchronization service',
    cacheDurationMs: 60 * 60 * 1000, // 1 hour
    cacheType: 'database',
    category: 'metadata',
    maxEntries: null,
    isEnabled: true
  },
  {
    serviceName: 'holder_service_cache',
    displayName: 'Holder Service Cache',
    description: 'Cache for holder data processing and portfolio calculations',
    cacheDurationMs: 30 * 60 * 1000, // 30 minutes
    cacheType: 'memory',
    category: 'holders',
    maxEntries: 200,
    isEnabled: true
  }
];

async function seedCacheSettings() {
  try {
    console.log('🌱 Starting cache settings seed...');
    
    for (const setting of defaultCacheSettings) {
      // Check if setting already exists
      const existing = await db.query.cacheSettings.findFirst({
        where: (cacheSettings, { eq }) => eq(cacheSettings.serviceName, setting.serviceName)
      });
      
      if (existing) {
        console.log(`⚡ Cache setting already exists: ${setting.displayName}`);
        continue;
      }
      
      // Insert new cache setting
      await db.insert(cacheSettings).values(setting);
      console.log(`✅ Added cache setting: ${setting.displayName} (${setting.cacheDurationMs / 60000}min cache)`);
    }
    
    console.log('🎯 Cache settings seed completed successfully');
  } catch (error) {
    console.error('❌ Error seeding cache settings:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCacheSettings()
    .then(() => {
      console.log('Cache settings seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed cache settings:', error);
      process.exit(1);
    });
}

export { seedCacheSettings };