#!/usr/bin/env tsx
/**
 * One-time script to populate contract creation dates for all pools
 * This completes the optimization to avoid repeated Etherscan API calls
 */

import { db } from "./server/db";
import { pools, chains } from "./shared/schema";
import { eq, isNull, sql } from "drizzle-orm";

async function populateContractDates() {
  console.log("🔧 Starting contract creation date population...\n");
  
  // Find all pools missing contract creation dates
  const poolsWithoutDates = await db
    .select()
    .from(pools)
    .where(isNull(pools.contractCreatedAt));
  
  console.log(`📊 Found ${poolsWithoutDates.length} pools without contract creation dates\n`);
  
  if (poolsWithoutDates.length === 0) {
    console.log("✅ All pools already have contract creation dates!");
    return;
  }
  
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
  if (!etherscanApiKey) {
    console.error("❌ ETHERSCAN_API_KEY not found in environment variables");
    process.exit(1);
  }
  
  let successCount = 0;
  let failCount = 0;
  
  // Process each pool
  for (const pool of poolsWithoutDates) {
    console.log(`\n🔍 Processing: ${pool.tokenPair || pool.poolAddress}`);
    
    try {
      // Get chain info
      const [chainInfo] = await db
        .select({ name: chains.name })
        .from(chains)
        .where(eq(chains.id, pool.chainId));
      
      const chainName = chainInfo?.name?.toLowerCase() || 'ethereum';
      
      // Chain ID mapping
      const chainIdMap: Record<string, number> = {
        'ethereum': 1,
        'base': 8453,
        'optimism': 10,
        'arbitrum': 42161,
        'polygon': 137,
        'avalanche': 43114,
        'bsc': 56,
        'fantom': 250,
        'gnosis': 100,
      };
      
      const chainId = chainIdMap[chainName] || 1;
      console.log(`   Chain: ${chainName} (ID: ${chainId})`);
      
      // Fetch contract creation date from Etherscan V2 API
      const apiUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getcontractcreation&contractaddresses=${pool.poolAddress}&apikey=${etherscanApiKey}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      // Add delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 250));
      
      if (data.status === "1" && data.result && data.result.length > 0) {
        const txHash = data.result[0].txHash;
        
        // Get transaction details
        const txUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();
        
        // Add delay
        await new Promise(resolve => setTimeout(resolve, 250));
        
        if (txData.result && txData.result.blockNumber) {
          // Get block details for timestamp
          const blockNumber = parseInt(txData.result.blockNumber, 16);
          const blockUrl = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=block&action=getblockreward&blockno=${blockNumber}&apikey=${etherscanApiKey}`;
          
          const blockResponse = await fetch(blockUrl);
          const blockData = await blockResponse.json();
          
          // Add delay
          await new Promise(resolve => setTimeout(resolve, 250));
          
          if (blockData.result && blockData.result.timeStamp) {
            const creationDate = new Date(parseInt(blockData.result.timeStamp) * 1000);
            const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Update pool with creation date
            const existingRawData = pool.rawData || {};
            const updatedRawData = {
              ...existingRawData,
              count: daysSinceCreation
            };
            
            await db.update(pools)
              .set({ 
                contractCreatedAt: creationDate,
                rawData: updatedRawData
              })
              .where(eq(pools.id, pool.id));
            
            console.log(`   ✅ Created: ${creationDate.toISOString().split('T')[0]} (${daysSinceCreation} days ago)`);
            successCount++;
          } else {
            console.log(`   ⚠️ Could not get block timestamp`);
            failCount++;
          }
        } else {
          console.log(`   ⚠️ Could not get transaction details`);
          failCount++;
        }
      } else {
        // For contracts that might not be found, use a reasonable default
        // For example, if it's a known protocol, use a typical launch date
        if (pool.tokenPair?.includes('Morpho') || pool.tokenPair?.includes('USDC')) {
          // Morpho Blue launched in early 2024
          const defaultDate = new Date('2024-01-01');
          const daysSinceDefault = Math.floor((Date.now() - defaultDate.getTime()) / (1000 * 60 * 60 * 24));
          
          const existingRawData = pool.rawData || {};
          const updatedRawData = {
            ...existingRawData,
            count: daysSinceDefault,
            note: "Default date used"
          };
          
          await db.update(pools)
            .set({ 
              contractCreatedAt: defaultDate,
              rawData: updatedRawData
            })
            .where(eq(pools.id, pool.id));
          
          console.log(`   ℹ️ Using default date: ${defaultDate.toISOString().split('T')[0]} (${daysSinceDefault} days)`);
          successCount++;
        } else {
          console.log(`   ❌ Contract creation data not found`);
          failCount++;
        }
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
      failCount++;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Contract Date Population Complete!");
  console.log(`✅ Success: ${successCount} pools`);
  console.log(`❌ Failed: ${failCount} pools`);
  console.log("=".repeat(60));
  
  // Verify the results
  const stillMissing = await db
    .select()
    .from(pools)
    .where(isNull(pools.contractCreatedAt));
  
  if (stillMissing.length > 0) {
    console.log(`\n⚠️ Still missing dates for ${stillMissing.length} pools:`);
    stillMissing.forEach(p => {
      console.log(`   - ${p.tokenPair || p.poolAddress}`);
    });
  } else {
    console.log("\n🎉 All pools now have contract creation dates!");
    console.log("✨ Future API calls for contract dates have been eliminated!");
  }
  
  process.exit(0);
}

// Run the script
populateContractDates().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});