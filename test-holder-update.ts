import { simpleHolderCountService } from './server/services/simpleHolderCountService';

async function testUpdate() {
  console.log('🚀 Manually triggering holder count update...');
  try {
    await simpleHolderCountService.updateAllPoolHolderCounts();
    console.log('✅ Holder count update complete!');
  } catch (error) {
    console.error('❌ Error updating holder counts:', error);
  }
  process.exit(0);
}

testUpdate();