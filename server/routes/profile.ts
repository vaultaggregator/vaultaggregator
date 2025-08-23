import { Router } from "express";
import { WalletProfileService } from "../services/walletProfileService";

const router = Router();

// Get comprehensive wallet profile using tracked tokens only
router.get("/api/profile/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    console.log(`📊 Profile API called for address: ${address}`);
    
    const walletProfileService = new WalletProfileService();
    const walletProfile = await walletProfileService.getWalletProfile(address);
    
    // Transform wallet profile data to match frontend expectations
    const walletAssets = walletProfile.trackedTokens.map(token => ({
      token: token.name,
      symbol: token.symbol,
      balance: token.formattedBalance,
      usdValue: token.usdValue,
      price: token.price,
      logo: token.logo,
      chain: token.chain,
      change24h: token.change24h
    }));

    // Add ETH as the first asset if there's a balance
    if (walletProfile.ethBalance > 0) {
      walletAssets.unshift({
        token: "Ethereum",
        symbol: "ETH",
        balance: walletProfile.ethBalance,
        usdValue: walletProfile.ethValueUsd,
        price: 3200, // Static ETH price
        chain: "Ethereum",
        change24h: 0
      });
    }

    const response = {
      address,
      totalValueUsd: walletProfile.totalValueUsd,
      totalSuppliedUsd: 0, // N/A for basic wallet view
      totalBorrowedUsd: 0, // N/A for basic wallet view  
      walletBalanceUsd: walletProfile.totalValueUsd,
      change24h: 0,
      change24hPercent: 0,
      lastUpdated: walletProfile.lastUpdated,
      protocols: [], // N/A for basic wallet view - showing tracked tokens only
      walletAssets,
      trackedTokenCount: walletProfile.tokenCount,
      chainInfo: walletProfile.chainInfo
    };

    console.log(`✅ Returning profile for ${address}: ${walletAssets.length} assets, $${walletProfile.totalValueUsd.toFixed(2)} total`);
    res.json(response);
    
  } catch (error) {
    console.error("❌ Error fetching comprehensive wallet profile:", error);
    
    // Return basic empty structure on error
    res.json({
      address: req.params.address,
      totalValueUsd: 0,
      totalSuppliedUsd: 0,
      totalBorrowedUsd: 0,
      walletBalanceUsd: 0,
      change24h: 0,
      change24hPercent: 0,
      lastUpdated: new Date().toLocaleTimeString(),
      protocols: [],
      walletAssets: [],
      trackedTokenCount: 0,
      chainInfo: { name: 'ethereum', displayName: 'Ethereum' }
    });
  }
});

export default router;