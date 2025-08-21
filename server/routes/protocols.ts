import { Router } from "express";
import { db } from "../db";
import { platforms, pools, chains, poolHistoricalData } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

// Get protocol details
router.get("/api/protocols/:chainId/:protocolId", async (req, res) => {
  try {
    const { chainId, protocolId } = req.params;
    
    console.log(`📊 Fetching protocol details for ${protocolId} on chain ${chainId}`);

    // Get the chain info
    const chain = await db
      .select()
      .from(chains)
      .where(eq(chains.id, chainId))
      .limit(1);

    if (!chain || chain.length === 0) {
      return res.status(404).json({ error: "Chain not found" });
    }

    // Get the platform/protocol info
    const platform = await db
      .select()
      .from(platforms)
      .where(eq(platforms.id, protocolId))
      .limit(1);

    if (!platform || platform.length === 0) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    const protocolData = platform[0];
    const chainData = chain[0];

    // Get all pools for this protocol on this chain
    const protocolPools = await db
      .select({
        id: pools.id,
        tokenPair: pools.tokenPair,
        apy: pools.apy,
        tvl: pools.tvl,
        riskLevel: pools.riskLevel,
      })
      .from(pools)
      .where(
        and(
          eq(pools.platformId, protocolId),
          eq(pools.chainId, chainId)
        )
      );

    // Calculate protocol stats
    const totalTvl = protocolPools.reduce((sum, pool) => {
      const tvlValue = typeof pool.tvl === 'string' ? parseFloat(pool.tvl) : pool.tvl;
      return sum + (tvlValue || 0);
    }, 0);
    const avgApy = protocolPools.length > 0 
      ? protocolPools.reduce((sum, pool) => {
          const apyValue = typeof pool.apy === 'string' ? parseFloat(pool.apy) : pool.apy;
          return sum + (apyValue || 0);
        }, 0) / protocolPools.length
      : 0;
    const totalSupplied = totalTvl * 0.6; // Estimate: 60% is supplied
    const totalBorrowed = totalTvl * 0.4; // Estimate: 40% is borrowed

    // Get unique user count estimate based on number of pools and average holders per pool
    const userCount = protocolPools.length * 500; // Rough estimate

    // Transform pools into assets
    const assets = protocolPools.map(pool => {
      const [baseToken, quoteToken] = pool.tokenPair.split('/');
      const tvlValue = typeof pool.tvl === 'string' ? parseFloat(pool.tvl) : pool.tvl;
      const apyValue = typeof pool.apy === 'string' ? parseFloat(pool.apy) : pool.apy;
      return {
        symbol: baseToken || pool.tokenPair,
        name: pool.tokenPair,
        balance: tvlValue ? tvlValue / 1000000 : 0, // Convert to millions
        usdValue: tvlValue || 0,
        apy: apyValue,
        type: 'supplied' as const,
      };
    });

    // Create markets data from pools
    const markets = protocolPools.map(pool => {
      const tvlValue = typeof pool.tvl === 'string' ? parseFloat(pool.tvl) : pool.tvl || 0;
      const apyValue = typeof pool.apy === 'string' ? parseFloat(pool.apy) : pool.apy || 0;
      const supplyAmount = tvlValue * 0.6;
      const borrowAmount = tvlValue * 0.4;
      const utilization = supplyAmount > 0 ? (borrowAmount / supplyAmount) * 100 : 0;

      return {
        id: pool.id,
        asset: pool.tokenPair,
        totalSupply: supplyAmount,
        totalBorrow: borrowAmount,
        supplyApy: apyValue,
        borrowApy: apyValue * 1.5, // Borrow APY is typically higher
        utilization: Math.min(utilization, 100),
      };
    });

    // Get top holders for the largest pool  
    // Note: Holders data is not available in the current schema
    const topHolders: any[] = [];

    // Prepare the response
    const response = {
      id: protocolData.id,
      name: protocolData.name,
      logo: protocolData.logoUrl,
      chainName: chainData.name,
      chainId: chainData.id,
      description: `${protocolData.name} is a DeFi protocol operating on ${chainData.name} network.`,
      website: protocolData.website,
      tvl: totalTvl,
      userCount,
      totalSupplied,
      totalBorrowed,
      avgApy,
      assets,
      markets,
      topHolders,
      stats: {
        volume24h: totalTvl * 0.1, // Estimate: 10% daily volume
        fees24h: totalTvl * 0.0001, // Estimate: 0.01% daily fees
        revenue24h: totalTvl * 0.00005, // Estimate: 0.005% daily revenue
        activeUsers24h: Math.floor(userCount * 0.1), // Estimate: 10% daily active
      },
    };

    console.log(`✅ Successfully fetched protocol data for ${protocolData.name}`);
    res.json(response);

  } catch (error) {
    console.error("Error fetching protocol data:", error);
    res.status(500).json({ 
      error: "Failed to fetch protocol data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get all protocols
router.get("/api/protocols", async (req, res) => {
  try {
    const allProtocols = await db
      .select({
        platform: platforms,
        chain: chains,
        poolCount: sql<number>`count(${pools.id})::int`,
        totalTvl: sql<number>`sum(${pools.tvl})::float`,
        avgApy: sql<number>`avg(${pools.apy})::float`,
      })
      .from(platforms)
      .leftJoin(pools, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .groupBy(platforms.id, chains.id)
      .having(sql`count(${pools.id}) > 0`);

    const protocols = allProtocols.map(row => ({
      id: row.platform.id,
      name: row.platform.name,
      logo: row.platform.logoUrl,
      chainId: row.chain?.id,
      chainName: row.chain?.name,
      poolCount: row.poolCount || 0,
      tvl: row.totalTvl || 0,
      avgApy: row.avgApy || 0,
    }));

    res.json(protocols);
  } catch (error) {
    console.error("Error fetching protocols:", error);
    res.status(500).json({ 
      error: "Failed to fetch protocols",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;