import { Router } from "express";
import { storage } from "../storage";

const router = Router();

/**
 * Manual sync endpoint to force refresh TVL data from Morpho
 */
router.post("/admin/sync/morpho/:poolId", async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await storage.getPoolById(poolId);
    
    if (!pool) {
      return res.status(404).json({ error: "Pool not found" });
    }

    console.log(`🔄 Manual sync requested for pool ${poolId}`);

    try {
      const { morphoService } = await import("../services/morphoService");
      const rawData = pool.rawData as any || {};
      const vaultAddress = rawData.address || pool.poolAddress;
      
      // Try to get fresh data from Morpho
      const vaultData = await morphoService.getVaultByAddress(vaultAddress);
      
      if (vaultData && vaultData.state?.totalAssetsUsd) {
        // Update the pool with fresh data
        const updatedData = {
          ...rawData,
          state: {
            ...rawData.state,
            totalAssetsUsd: vaultData.state.totalAssetsUsd,
            totalSupplyUsd: vaultData.state.totalSupplyUsd,
            apy: vaultData.state.apy,
            netApy: vaultData.state.netApy
          }
        };

        await storage.updatePool(poolId, {
          rawData: updatedData,
          tvl: vaultData.state.totalAssetsUsd.toString(),
          apy: (vaultData.state.netApy * 100).toString(), // Convert to percentage
          lastUpdated: new Date()
        });

        console.log(`✅ Successfully updated pool ${poolId} with fresh Morpho data`);
        console.log(`📊 New TVL: $${vaultData.state.totalAssetsUsd.toLocaleString()}`);

        res.json({
          success: true,
          message: "Pool data updated successfully",
          data: {
            poolId,
            oldTvl: pool.tvl,
            newTvl: vaultData.state.totalAssetsUsd,
            timestamp: new Date()
          }
        });
      } else {
        throw new Error("No fresh data received from Morpho API");
      }
    } catch (morphoError) {
      console.error(`❌ Failed to sync from Morpho API:`, morphoError);
      res.status(503).json({
        error: "Morpho API sync failed",
        message: morphoError.message,
        suggestion: "Morpho API may be experiencing issues. Please try again later."
      });
    }
  } catch (error) {
    console.error("Error in manual sync:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;