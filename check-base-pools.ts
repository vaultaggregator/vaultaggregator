import { db } from './server/db';
import { pools, chains } from './shared/schema';
import { eq } from 'drizzle-orm';

async function checkBasePools() {
  try {
    // Get BASE chain
    const baseChain = await db.query.chains.findFirst({
      where: (chains, { eq }) => eq(chains.name, 'BASE')
    });
    
    console.log('BASE chain:', baseChain);
    
    if (baseChain) {
      // Get pools on BASE
      const basePools = await db.query.pools.findMany({
        where: (pools, { eq }) => eq(pools.chainId, baseChain.id)
      });
      
      console.log(`\nFound ${basePools.length} pools on BASE network:`);
      basePools.slice(0, 5).forEach(pool => {
        console.log(`- ${pool.name}: ${pool.poolAddress || 'No address'}`);
      });
    }
    
    // Also check ethereum pools for comparison
    const ethChain = await db.query.chains.findFirst({
      where: (chains, { eq }) => eq(chains.name, 'ethereum')
    });
    
    if (ethChain) {
      const ethPools = await db.query.pools.findMany({
        where: (pools, { eq }) => eq(pools.chainId, ethChain.id)
      });
      
      console.log(`\nFound ${ethPools.length} pools on Ethereum network:`);
      ethPools.slice(0, 5).forEach(pool => {
        console.log(`- ${pool.name}: ${pool.poolAddress || 'No address'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkBasePools();