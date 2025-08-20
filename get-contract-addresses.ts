import { db } from './server/db';
import { pools } from './shared/schema';

async function getContractAddresses() {
  try {
    const allPools = await db.select({
      name: pools.tokenPair,
      address: pools.poolAddress,
      network: pools.chainId
    }).from(pools);
    
    console.log('=== ALL CONTRACT ADDRESSES FOR ALCHEMY WEBHOOKS ===\n');
    console.log('Copy these addresses to your Alchemy webhook configuration:\n');
    
    // Group by network
    const byNetwork: Record<string, Array<{name: string, address: string}>> = {};
    allPools.forEach(pool => {
      if (pool.address) {
        const network = pool.network || 'ethereum';
        if (!byNetwork[network]) byNetwork[network] = [];
        byNetwork[network].push({
          name: pool.name,
          address: pool.address
        });
      }
    });
    
    // Display by network
    Object.keys(byNetwork).forEach(network => {
      console.log(`\n📍 ${network.toUpperCase()} NETWORK (${byNetwork[network].length} pools):`);
      console.log('----------------------------------------');
      byNetwork[network].forEach(pool => {
        console.log(`${pool.address}`);
      });
    });
    
    // All addresses in one list for easy copy
    console.log('\n\n=== ALL ADDRESSES (ONE PER LINE) ===');
    allPools.filter(p => p.address).forEach(pool => {
      console.log(pool.address);
    });
    
    console.log('\n\n=== DETAILED LIST WITH NAMES ===');
    allPools.filter(p => p.address).forEach(pool => {
      console.log(`${pool.address} - ${pool.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getContractAddresses();
