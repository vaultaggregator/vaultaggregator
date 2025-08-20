import { Alchemy, Network, AssetTransfersCategory, SortingOrder } from 'alchemy-sdk';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const MEV_CAPITAL_ADDRESS = '0xd63070114470f685b75B74D60EEc7c1113d33a3D';

async function fetchAllMEVHolders() {
  console.log('🚀 Starting comprehensive MEV Capital USDC holder fetch...');
  
  const alchemy = new Alchemy({
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  });
  
  const uniqueAddresses = new Set<string>();
  let pageKey: string | undefined;
  let iterations = 0;
  const maxIterations = 100;
  
  console.log('📊 Fetching ALL transfer events for MEV Capital USDC...');
  
  while (iterations < maxIterations) {
    const transfers = await alchemy.core.getAssetTransfers({
      fromBlock: '0x0',
      toBlock: 'latest', 
      contractAddresses: [MEV_CAPITAL_ADDRESS],
      category: [AssetTransfersCategory.ERC20],
      maxCount: 1000,
      excludeZeroValue: false,
      order: SortingOrder.DESCENDING,
      pageKey,
    });
    
    for (const transfer of transfers.transfers) {
      if (transfer.to) uniqueAddresses.add(transfer.to.toLowerCase());
      if (transfer.from) uniqueAddresses.add(transfer.from.toLowerCase());
    }
    
    console.log(`📊 Iteration ${iterations + 1}: Found ${uniqueAddresses.size} unique addresses`);
    
    pageKey = transfers.pageKey;
    iterations++;
    
    if (!pageKey || uniqueAddresses.size >= 2000) break;
  }
  
  console.log(`\n✅ Found ${uniqueAddresses.size} total unique addresses`);
  console.log('🔍 This includes all historical holders (many may have zero balance now)');
  console.log('📊 Etherscan shows 1,665 current holders with non-zero balances');
  
  // Check how many have current balances
  const addressArray = Array.from(uniqueAddresses).slice(0, 100); // Check first 100
  let activeHolders = 0;
  
  for (const address of addressArray) {
    try {
      const balance = await alchemy.core.getTokenBalances(address, [MEV_CAPITAL_ADDRESS]);
      if (balance.tokenBalances[0]?.tokenBalance !== '0x0') {
        activeHolders++;
      }
    } catch (error) {
      // Skip
    }
  }
  
  console.log(`\n📈 Sample check: ${activeHolders}/100 addresses have non-zero balances`);
  console.log('⚠️ The issue: We need to check MORE addresses to find all 1,665 active holders');
}

fetchAllMEVHolders().catch(console.error);
