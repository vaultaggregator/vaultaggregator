/**
 * Cache settings seed script - DISABLED
 * All cache functionality has been removed from the system
 */
import { db } from './server/db';
import { cacheSettings } from './shared/schema';

// No cache settings - system runs without caching
const defaultCacheSettings: any[] = [];

async function seedCacheSettings() {
  try {
    console.log('⚠️ Cache settings seed disabled - system runs without caching');
    
    // Remove any existing cache settings if they exist
    const existingSettings = await db.select().from(cacheSettings);
    if (existingSettings.length > 0) {
      console.log(`🗑️ Found ${existingSettings.length} cache settings, removing them...`);
      await db.delete(cacheSettings);
      console.log('✅ All cache settings removed');
    }
    
    console.log('🎯 System is cache-free');
  } catch (error) {
    console.error('❌ Error in cache settings cleanup:', error);
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