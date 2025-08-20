import { db } from './server/db';
import { pools, tokenHolders } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function triggerMEVSync() {
  console.log('🎯 Triggering MEV Capital USDC holder sync via API...');
  
  const [pool] = await db.select().from(pools).where(eq(pools.tokenPair, 'MEV Capital USDC'));
  if (!pool) {
    console.error('Pool not found');
    process.exit(1);
  }
  
  console.log(`📊 Pool ID: ${pool.id}`);
  console.log(`🔄 Triggering sync via admin API...`);
  
  try {
    // Trigger sync via API
    const response = await fetch(`http://localhost:5000/api/admin/sync/holder/${pool.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    
    if (response.ok) {
      console.log('✅ Sync triggered successfully');
      console.log('⏳ Waiting 60 seconds for sync to complete...');
      
      // Monitor progress
      for (let i = 0; i < 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const [result] = await db.execute(
          `SELECT COUNT(*) as count FROM token_holders WHERE pool_id = '${pool.id}'`
        );
        
        const count = (result as any).count;
        console.log(`Progress: ${count} holders synced`);
        
        if (count > 1000) {
          console.log(`\n🎉 SUCCESS! MEV Capital USDC now has ${count} holders!`);
          process.exit(0);
        }
      }
      
      console.log('⚠️ Sync may still be in progress, check later');
    } else {
      console.error('Failed to trigger sync:', response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(1);
}

triggerMEVSync().catch(console.error);