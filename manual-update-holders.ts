import { simpleHolderCountService } from './server/services/simpleHolderCountService';

async function updateHolders() {
  console.log('🚀 Starting manual holder count update for all pools...');
  console.log('⚠️ This will update holder counts for all Ethereum and Base pools');
  console.log('⚠️ Using Etherscan/Basescan scraping with 2-second delays to avoid rate limiting');
  
  try {
    await simpleHolderCountService.updateAllPoolHolderCounts();
    console.log('✅ Manual holder count update completed successfully');
  } catch (error) {
    console.error('❌ Failed to update holder counts:', error);
  }
  
  process.exit(0);
}

updateHolders().catch(console.error);