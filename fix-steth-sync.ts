import { holderService } from './server/services/holderService';

async function fixStethSync() {
  try {
    console.log('🔄 Starting optimized sync for STETH pool...');
    
    // STETH pool ID from the check output
    const stethPoolId = '31e292ba-a842-490b-8688-3868e18bd615';
    
    // Run the optimized sync
    await holderService.syncPoolHolders(stethPoolId);
    
    console.log('✅ STETH pool sync complete!');
    console.log('The pool should now show 547,477 total holders with only top 100 stored');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing STETH:', error);
    process.exit(1);
  }
}

fixStethSync();