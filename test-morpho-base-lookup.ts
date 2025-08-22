import { morphoService } from "./server/services/morphoService";

async function testMorphoBaseLookup() {
  const address = "0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183";
  const baseChainId = 8453;
  
  console.log(`\n🔍 Testing Morpho vault lookup for Base chain`);
  console.log(`Address: ${address}`);
  console.log(`Chain ID: ${baseChainId}`);
  
  try {
    // Test direct vault lookup
    console.log(`\n📡 Calling getVaultByAddress...`);
    const vault = await morphoService.getVaultByAddress(address, baseChainId);
    
    if (vault) {
      console.log(`✅ Vault found!`);
      console.log(`Name: ${vault.name}`);
      console.log(`Symbol: ${vault.symbol}`);
      console.log(`Address: ${vault.address}`);
    } else {
      console.log(`❌ Vault not found`);
      
      // Try getting all vaults and searching
      console.log(`\n🔄 Trying getAllVaults fallback...`);
      const allVaults = await morphoService.getAllVaults(baseChainId);
      console.log(`Found ${allVaults.length} vaults on Base`);
      
      const matchingVault = allVaults.find(v => 
        v.address?.toLowerCase() === address.toLowerCase()
      );
      
      if (matchingVault) {
        console.log(`✅ Found vault in list!`);
        console.log(`Name: ${matchingVault.name}`);
        console.log(`Symbol: ${matchingVault.symbol}`);
      } else {
        console.log(`❌ Vault not in list either`);
        console.log(`\nFirst 5 Base vaults:`);
        allVaults.slice(0, 5).forEach(v => {
          console.log(`- ${v.name || v.symbol} (${v.address})`);
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
  
  process.exit(0);
}

testMorphoBaseLookup();