#!/usr/bin/env tsx

// Simple script to find the Seamless vault by querying the exact address
async function findSeamlessVault() {
  console.log('🔍 Testing direct vault query for Seamless USDC Vault...');
  
  const vaultAddress = '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738';
  
  const query = `
    query VaultDetails($address: String!) {
      vaultByAddress(address: $address) {
        address
        name
        asset {
          address
          name
          symbol
        }
        chain {
          id
        }
        state {
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
      body: JSON.stringify({ 
        query, 
        variables: { address: vaultAddress }
      }),
    });

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      
      // Try with alternative queries
      console.log('🔄 Trying alternative approach...');
      
      // Try querying all vaults and search
      const simpleQuery = `
        query {
          vaults(first: 50) {
            items {
              address
              name
            }
          }
        }
      `;
      
      const simpleResponse = await fetch('https://api.morpho.org/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: simpleQuery }),
      });
      
      const simpleResult = await simpleResponse.json();
      
      if (simpleResult.data?.vaults?.items) {
        console.log('📋 Found vaults:');
        simpleResult.data.vaults.items.forEach((vault: any, index: number) => {
          if (index < 10) { // Show first 10
            console.log(`  ${vault.address}: ${vault.name}`);
          }
        });
        
        // Look for our address
        const ourVault = simpleResult.data.vaults.items.find((vault: any) => 
          vault.address.toLowerCase() === vaultAddress.toLowerCase()
        );
        
        if (ourVault) {
          console.log(`✅ Found our vault: ${ourVault.name} at ${ourVault.address}`);
        } else {
          console.log(`❌ Vault ${vaultAddress} not found in API results`);
          console.log('💡 This might be a Base chain vault that is not indexed by Morpho API yet');
        }
      }
      
      return;
    }

    if (result.data?.vaultByAddress) {
      const vault = result.data.vaultByAddress;
      console.log(`✅ Found vault: ${vault.name}`);
      console.log(`🏦 Address: ${vault.address}`);
      console.log(`🪙 Asset: ${vault.asset?.symbol || 'Unknown'}`);
      console.log(`🌐 Chain ID: ${vault.chain?.id || 'Unknown'}`);
      console.log(`💰 TVL: $${vault.state?.totalAssetsUsd ? Number(vault.state.totalAssetsUsd).toLocaleString() : 'N/A'}`);
      console.log(`📊 APY: ${vault.state?.netApy ? (vault.state.netApy * 100).toFixed(2) + '%' : 'N/A'}`);
    } else {
      console.log('❌ Vault not found in Morpho API');
      console.log('💡 This vault might be:');
      console.log('   - A newer vault not yet indexed');
      console.log('   - A Base chain vault with limited API coverage');
      console.log('   - Using a different address format');
    }

  } catch (error) {
    console.error('❌ Error querying Morpho API:', error);
  }
}

findSeamlessVault().then(() => {
  console.log('🎉 Search completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Search failed:', error);
  process.exit(1);
});