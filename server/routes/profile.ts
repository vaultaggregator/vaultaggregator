import { Router } from "express";
import { db } from "../db";
import { tokenHolders, pools, tokenInfo } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const router = Router();

interface ProtocolPosition {
  protocolName: string;
  protocolLogo?: string;
  chain: string;
  healthRate?: number;
  supplied: any[];
  borrowed: any[];
  rewards?: any[];
  totalSuppliedUsd: number;
  totalBorrowedUsd: number;
  totalRewardsUsd?: number;
  netPositionUsd: number;
}

interface WalletAsset {
  token: string;
  symbol: string;
  balance: number;
  usdValue: number;
  price: number;
  logo?: string;
  chain: string;
  change24h?: number;
}

// Generate mock portfolio data since Alchemy is disabled
const generateMockPortfolio = (address: string) => {
  const mockProtocols: ProtocolPosition[] = [
    {
      protocolName: "Lido",
      chain: "Ethereum",
      healthRate: 2.5,
      supplied: [
        {
          token: "stETH",
          symbol: "stETH",
          amount: parseFloat((Math.random() * 100).toFixed(4)),
          usdValue: parseFloat((Math.random() * 100000).toFixed(2)),
          apy: 2.61
        }
      ],
      borrowed: [],
      totalSuppliedUsd: parseFloat((Math.random() * 100000).toFixed(2)),
      totalBorrowedUsd: 0,
      netPositionUsd: parseFloat((Math.random() * 100000).toFixed(2))
    },
    {
      protocolName: "Morpho",
      chain: "Ethereum",
      healthRate: 1.8,
      supplied: [
        {
          token: "USDC",
          symbol: "USDC",
          amount: parseFloat((Math.random() * 50000).toFixed(2)),
          usdValue: parseFloat((Math.random() * 50000).toFixed(2)),
          apy: 8.5
        }
      ],
      borrowed: [
        {
          token: "WETH",
          symbol: "WETH",
          amount: parseFloat((Math.random() * 10).toFixed(4)),
          usdValue: parseFloat((Math.random() * 30000).toFixed(2)),
          apy: 5.2
        }
      ],
      totalSuppliedUsd: parseFloat((Math.random() * 50000).toFixed(2)),
      totalBorrowedUsd: parseFloat((Math.random() * 30000).toFixed(2)),
      netPositionUsd: parseFloat((Math.random() * 20000).toFixed(2))
    }
  ];

  const mockWalletAssets: WalletAsset[] = [
    {
      token: "ETH",
      symbol: "ETH",
      balance: parseFloat((Math.random() * 10).toFixed(4)),
      usdValue: parseFloat((Math.random() * 30000).toFixed(2)),
      price: 3000,
      chain: "Ethereum",
      change24h: (Math.random() - 0.5) * 10
    },
    {
      token: "USDC",
      symbol: "USDC",
      balance: parseFloat((Math.random() * 10000).toFixed(2)),
      usdValue: parseFloat((Math.random() * 10000).toFixed(2)),
      price: 1,
      chain: "Ethereum",
      change24h: 0
    }
  ];

  const totalSupplied = mockProtocols.reduce((acc, p) => acc + p.totalSuppliedUsd, 0);
  const totalBorrowed = mockProtocols.reduce((acc, p) => acc + p.totalBorrowedUsd, 0);
  const walletBalance = mockWalletAssets.reduce((acc, a) => acc + a.usdValue, 0);
  const totalValue = walletBalance + totalSupplied - totalBorrowed;

  return {
    address,
    totalValueUsd: totalValue,
    totalSuppliedUsd: totalSupplied,
    totalBorrowedUsd: totalBorrowed,
    walletBalanceUsd: walletBalance,
    change24h: (Math.random() - 0.5) * 5000,
    change24hPercent: (Math.random() - 0.5) * 10,
    lastUpdated: new Date().toLocaleTimeString(),
    protocols: mockProtocols,
    walletAssets: mockWalletAssets
  };
};

// Fetch real holder data from database
router.get("/api/profile/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    // Try to find the address in token holders
    const holderData = await db
      .select({
        address: tokenHolders.holderAddress,
        balance: tokenHolders.balance,
        usdValue: tokenHolders.usdValue,
        poolId: tokenHolders.poolId,
        poolName: pools.tokenPair,
        apy: pools.apy,
        tvl: pools.tvl
      })
      .from(tokenHolders)
      .leftJoin(pools, eq(tokenHolders.poolId, pools.id))
      .where(eq(tokenHolders.holderAddress, address))
      .limit(10);

    // If we have real holder data, use it to build portfolio
    if (holderData && holderData.length > 0) {
      const protocols: ProtocolPosition[] = [];
      const protocolMap = new Map<string, ProtocolPosition>();

      for (const data of holderData) {
        const protocolName = "DeFi Protocol"; // Since we don't have platform info directly
        
        if (!protocolMap.has(protocolName)) {
          protocolMap.set(protocolName, {
            protocolName,
            chain: "Ethereum",
            supplied: [],
            borrowed: [],
            totalSuppliedUsd: 0,
            totalBorrowedUsd: 0,
            netPositionUsd: 0
          });
        }

        const protocol = protocolMap.get(protocolName)!;
        protocol.supplied.push({
          token: data.poolName || "Unknown",
          symbol: data.poolName || "Unknown",
          amount: Number(data.balance) || 0,
          usdValue: Number(data.usdValue) || 0,
          apy: Number(data.apy) || 0
        });
        protocol.totalSuppliedUsd += Number(data.usdValue) || 0;
        protocol.netPositionUsd += Number(data.usdValue) || 0;
      }

      protocols.push(...Array.from(protocolMap.values()));

      const totalSupplied = protocols.reduce((acc, p) => acc + p.totalSuppliedUsd, 0);
      const totalValue = totalSupplied;

      res.json({
        address,
        totalValueUsd: totalValue,
        totalSuppliedUsd: totalSupplied,
        totalBorrowedUsd: 0,
        walletBalanceUsd: 0, // N/A - Alchemy disabled
        change24h: 0,
        change24hPercent: 0,
        lastUpdated: new Date().toLocaleTimeString(),
        protocols,
        walletAssets: [] // N/A - Alchemy disabled
      });
    } else {
      // Return mock data if no real data found
      res.json(generateMockPortfolio(address));
    }
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    // Return mock data on error
    res.json(generateMockPortfolio(req.params.address));
  }
});

export default router;