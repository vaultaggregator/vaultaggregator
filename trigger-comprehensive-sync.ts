import { comprehensiveHolderSyncService } from './server/services/comprehensiveHolderSyncService';

async function triggerComprehensiveSync() {
  console.log('🚀 Triggering comprehensive sync for ALL pools including Lido...');
  
  try {
    // Trigger sync for all pools including Lido
    await comprehensiveHolderSyncService.syncAllPools();
    
    console.log('✅ Comprehensive sync completed');
  } catch (error) {
    console.error('❌ Error during comprehensive sync:', error);
  }
  
  process.exit(0);
}

triggerComprehensiveSync();