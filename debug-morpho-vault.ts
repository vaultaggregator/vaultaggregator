#!/usr/bin/env tsx

// Debug script to find the correct Morpho vault address
async function debugMorphoVault() {
  console.log('🔍 Debugging Morpho vault address for Seamless USDC Vault...');
  
  const query = `
    query {
      vaults(first: 100, orderBy: TotalAssetsUsd, orderDirection: Desc) {
        items {
          address
          name
          chain { 
            id
            name 
          }
          totalAssetsUsd
          netApy
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.morpho.org/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      return;
    }

    console.log('🎯 Searching for Seamless vaults...');
    
    const vaults = result.data.vaults.items || result.data.vaults;
    
    const seamlessVaults = vaults.filter((vault: any) => 
      vault.name.toLowerCase().includes('seamless') || 
      vault.name.toLowerCase().includes('usdc')
    );
    
    console.log(`Found ${seamlessVaults.length} potential vaults:`);
    
    seamlessVaults.forEach((vault: any) => {
      console.log(`
📋 Vault: ${vault.name}
🏦 Address: ${vault.address}
🌐 Chain: ${vault.chain?.name || 'Unknown'} (ID: ${vault.chain?.id || 'Unknown'})
💰 TVL: $${vault.totalAssetsUsd ? Number(vault.totalAssetsUsd).toLocaleString() : 'N/A'}
📊 APY: ${vault.netApy ? (vault.netApy * 100).toFixed(2) + '%' : 'N/A'}
      `);
    });

    // Also search Base chain specifically
    const baseVaults = vaults.filter((vault: any) => 
      vault.chain?.id === '8453' || vault.chain?.name?.toLowerCase().includes('base')
    );
    
    console.log(`\n🔗 Base chain vaults (${baseVaults.length}):`);
    
    baseVaults.forEach((vault: any) => {
      console.log(`
📋 Base Vault: ${vault.name}
🏦 Address: ${vault.address}
💰 TVL: $${vault.totalAssetsUsd ? Number(vault.totalAssetsUsd).toLocaleString() : 'N/A'}
📊 APY: ${vault.netApy ? (vault.netApy * 100).toFixed(2) + '%' : 'N/A'}
      `);
    });

  } catch (error) {
    console.error('❌ Error querying Morpho API:', error);
  }
}

debugMorphoVault().then(() => {
  console.log('🎉 Debug completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});