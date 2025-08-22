#!/usr/bin/env tsx

import { MorphoHistoricalService } from './server/services/morphoHistoricalService';

async function fixSeamlessUsdcVaultHistoricalData() {
  console.log('🔧 Fixing missing historical data for Seamless USDC Vault...');
  
  const poolId = '883cad38-7b18-45af-8fc5-4a50400cd6fe';
  const vaultAddress = '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738';
  
  try {
    const morphoHistoricalService = new MorphoHistoricalService();
    
    console.log(`📊 Fetching historical data for pool ${poolId}...`);
    console.log(`🏦 Vault address: ${vaultAddress}`);
    
    // Store historical data for the last 90 days (comprehensive)
    await morphoHistoricalService.storeHistoricalData(poolId, vaultAddress, 90);
    
    console.log('✅ Historical data collection completed!');
    console.log('🎯 You should now see historical APY charts for this pool.');
    
  } catch (error) {
    console.error('❌ Error fixing historical data:', error);
    process.exit(1);
  }
}

// Run the fix
fixSeamlessUsdcVaultHistoricalData().then(() => {
  console.log('🎉 Seamless USDC Vault historical data fix completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});