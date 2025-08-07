import { storage } from "../storage";
import { MorphoService } from "./morphoService";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { platforms, chains } from "@shared/schema";

export async function syncMorphoData(): Promise<void> {
  try {
    console.log("Starting Morpho data synchronization...");
    
    // Fetch vaults and markets from supported chains
    const [vaults, markets] = await Promise.all([
      MorphoService.getAllVaults([1, 42161, 8453, 137]), // Ethereum, Arbitrum, Base, Polygon
      MorphoService.getAllMarkets([1, 42161, 8453, 137])
    ]);

    console.log(`Retrieved ${vaults.length} Morpho vaults and ${markets.length} markets`);

    // Ensure Morpho platform exists
    let morphoPlatform;
    const existingPlatforms = await storage.getPlatforms();
    morphoPlatform = existingPlatforms.find(p => p.name.toLowerCase() === "morpho");
    
    if (!morphoPlatform) {
      morphoPlatform = await storage.createPlatform({
        name: "Morpho",
        displayName: "Morpho",
        slug: "morpho",
        website: "https://app.morpho.org",
        logoUrl: "/public-objects/morpho-logo.png"
      });
      console.log("Created Morpho platform");
    }

    // Process vaults as pools
    for (const vault of vaults) {
      try {
        // Ensure the chain exists
        const chainName = MorphoService.getChainName(vault.chain.id);
        let chain;
        const existingChains = await storage.getChains();
        chain = existingChains.find(c => c.name.toLowerCase() === chainName.toLowerCase());
        
        if (!chain) {
          chain = await storage.createChain({
            name: chainName,
            displayName: chainName
          });
        }

        // Check if pool already exists using defiLlamaId field
        const poolData = {
          platformId: morphoPlatform.id,
          chainId: chain.id,
          tokenPair: vault.symbol,
          apy: vault.state.apy ? (vault.state.apy * 100).toString() : "0", // Convert to percentage string
          tvl: vault.state.totalAssetsUsd ? vault.state.totalAssetsUsd.toString() : "0",
          poolAddress: vault.address,
          defiLlamaId: `morpho-vault-${vault.address}`, // Use this as unique identifier
          riskLevel: "medium",
          rawData: {
            source: "morpho",
            type: "vault",
            vaultData: vault
          }
        };

        await storage.upsertPool(poolData.defiLlamaId, poolData);
      } catch (error) {
        console.error(`Error processing vault ${vault.address}:`, error);
      }
    }

    // Process markets as pools
    for (const market of markets) {
      try {
        // Ensure the chain exists
        const chainName = MorphoService.getChainName(market.chain.id);
        let chain;
        const existingChains = await storage.getChains();
        chain = existingChains.find(c => c.name.toLowerCase() === chainName.toLowerCase());
        
        if (!chain) {
          chain = await storage.createChain({
            name: chainName,
            displayName: chainName
          });
        }

        // Check if pool already exists using defiLlamaId field
        const poolData = {
          platformId: morphoPlatform.id,
          chainId: chain.id,
          tokenPair: `${market.loanAsset.symbol}/${market.collateralAsset.symbol}`,
          apy: market.state.supplyApy ? (market.state.supplyApy * 100).toString() : "0", // Convert to percentage string
          tvl: market.state.supplyAssetsUsd ? market.state.supplyAssetsUsd.toString() : "0",
          poolAddress: market.uniqueKey,
          defiLlamaId: `morpho-market-${market.uniqueKey}`, // Use this as unique identifier
          riskLevel: "medium",
          rawData: {
            source: "morpho",
            type: "market", 
            marketData: market
          }
        };

        await storage.upsertPool(poolData.defiLlamaId, poolData);
      } catch (error) {
        console.error(`Error processing market ${market.uniqueKey}:`, error);
      }
    }

    console.log("Morpho data synchronization completed successfully");
  } catch (error) {
    console.error("Error during Morpho data synchronization:", error);
    throw error;
  }
}

// Export individual functions for API endpoints
export { MorphoService };