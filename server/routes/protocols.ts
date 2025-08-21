import { Router } from "express";
import { db } from "../db";
import { protocols, pools, networks, poolHistoricalData } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

// Get protocol details
router.get("/api/protocols/:chainId/:protocolId", async (req, res) => {
  try {
    const { chainId, protocolId } = req.params;
    
    console.log(`📊 Fetching protocol details for ${protocolId} on chain ${chainId}`);

    // Get the network info - search by chainId not by UUID id
    const network = await db
      .select()
      .from(networks)
      .where(eq(networks.chainId, chainId))
      .limit(1);

    if (!network || network.length === 0) {
      return res.status(404).json({ error: "Network not found" });
    }

    // Get the protocol info - search by protocol_id not by UUID id
    const protocol = await db
      .select()
      .from(protocols)
      .where(eq(protocols.protocolId, protocolId))
      .limit(1);

    if (!protocol || protocol.length === 0) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    const protocolData = protocol[0];
    const networkData = network[0];

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
      chainName: networkData.name,
      chainId: networkData.id,
      description: `${protocolData.name} is a DeFi protocol operating on ${networkData.name} network.`,
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
        protocol: protocols,
        network: networks,
        poolCount: sql<number>`count(${pools.id})::int`,
        totalTvl: sql<number>`sum(${pools.tvl})::float`,
        avgApy: sql<number>`avg(${pools.apy})::float`,
      })
      .from(protocols)
      .leftJoin(pools, eq(pools.platformId, protocols.id))
      .leftJoin(networks, eq(pools.chainId, networks.id))
      .groupBy(protocols.id, networks.id)
      .having(sql`count(${pools.id}) > 0`);

    const protocolsList = allProtocols.map(row => ({
      id: row.protocol.id,
      name: row.protocol.name,
      logo: row.protocol.logoUrl,
      chainId: row.network?.id,
      chainName: row.network?.name,
      poolCount: row.poolCount || 0,
      tvl: row.totalTvl || 0,
      avgApy: row.avgApy || 0,
    }));

    res.json(protocolsList);
  } catch (error) {
    console.error("Error fetching protocols:", error);
    res.status(500).json({ 
      error: "Failed to fetch protocols",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;