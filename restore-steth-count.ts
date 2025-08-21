import { db } from './server/db';
import { poolMetricsCurrent } from './shared/schema';
import { eq } from 'drizzle-orm';

async function restoreStethCount() {
  try {
    console.log('🔧 Restoring correct holder count for STETH pool...');
    
    // STETH pool ID
    const stethPoolId = '31e292ba-a842-490b-8688-3868e18bd615';
    
    // Update the pool_metrics_current with the correct holder count
    await db
      .update(poolMetricsCurrent)
      .set({
        holdersCount: 547477,  // The actual stETH holder count
        updatedAt: new Date()
      })
      .where(eq(poolMetricsCurrent.poolId, stethPoolId));
    
    console.log('✅ Restored STETH holder count to 547,477!');
    console.log('The pool detail page should now show the correct count.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error restoring count:', error);
    process.exit(1);
  }
}

restoreStethCount();