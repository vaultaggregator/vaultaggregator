// Manual trigger for comprehensive holder sync with 1000 limit
import { comprehensiveHolderSyncService } from './server/services/comprehensiveHolderSyncService.js';

console.log('🚀 Manually triggering comprehensive holder sync for all pools...');
console.log('📊 This will fetch up to 1000 holders for each pool');

comprehensiveHolderSyncService.syncAllPoolHolders()
  .then(() => {
    console.log('✅ Sync completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });