import { storage } from "../storage";
import type { InsertPool, InsertPlatform, InsertChain } from "@shared/schema";

interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  pool: string;
  poolMeta?: string;
  underlyingTokens?: string[];
  rewardTokens?: string[];
  count?: number;
  outlier?: boolean;
  ilRisk?: string;
  stablecoin?: boolean;
  exposure?: string;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
}

const DEFI_LLAMA_BASE_URL = "https://yields.llama.fi";

// Chain mapping for consistency - expanded to support more networks from the API
const CHAIN_MAPPING: Record<string, { name: string; displayName: string; color: string }> = {
  'ethereum': { name: 'ethereum', displayName: 'Ethereum', color: '#627EEA' },
  'arbitrum': { name: 'arbitrum', displayName: 'Arbitrum', color: '#96BEDC' },
  'polygon': { name: 'polygon', displayName: 'Polygon', color: '#8247E5' },
  'optimism': { name: 'optimism', displayName: 'Optimism', color: '#FF0420' },
  'avalanche': { name: 'avalanche', displayName: 'Avalanche', color: '#E84142' },
  'bsc': { name: 'bsc', displayName: 'BSC', color: '#F3BA2F' },
  'fantom': { name: 'fantom', displayName: 'Fantom', color: '#1969FF' },
  'solana': { name: 'solana', displayName: 'Solana', color: '#00FFA3' },
  'base': { name: 'base', displayName: 'Base', color: '#0052FF' },
  'linea': { name: 'linea', displayName: 'Linea', color: '#121212' },
  'scroll': { name: 'scroll', displayName: 'Scroll', color: '#FFEEDA' },
  'blast': { name: 'blast', displayName: 'Blast', color: '#FCFC03' },
  'mode': { name: 'mode', displayName: 'Mode', color: '#DFFE00' },
  'manta': { name: 'manta', displayName: 'Manta', color: '#000000' },
  'mantle': { name: 'mantle', displayName: 'Mantle', color: '#000000' },
  'fraxtal': { name: 'fraxtal', displayName: 'Fraxtal', color: '#000000' },
  'cronos': { name: 'cronos', displayName: 'Cronos', color: '#002D74' },
  'gnosis': { name: 'gnosis', displayName: 'Gnosis', color: '#04795B' },
  'sonic': { name: 'sonic', displayName: 'Sonic', color: '#1E40AF' },
};

function mapRiskLevel(ilRisk?: string, stablecoin?: boolean): 'low' | 'medium' | 'high' {
  if (stablecoin) return 'low';
  if (!ilRisk) return 'medium';
  
  const risk = ilRisk.toLowerCase();
  if (risk === 'no' || risk === 'low') return 'low';
  if (risk === 'yes' || risk === 'high') return 'high';
  return 'medium';
}

export async function fetchYieldPools(): Promise<DefiLlamaPool[]> {
  try {
    const response = await fetch(`${DEFI_LLAMA_BASE_URL}/pools`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching yield pools from DeFi Llama:", error);
    throw error;
  }
}

export async function syncData(): Promise<void> {
  try {
    console.log("Starting DeFi Llama data sync...");
    
    const pools = await fetchYieldPools();
    console.log(`Fetched ${pools.length} pools from DeFi Llama`);

    // Filter out pools with very low TVL or APY to focus on quality opportunities
    const filteredPools = pools.filter(pool => 
      pool.tvlUsd > 10000 && // Min $10k TVL
      pool.apy > 0.01 && // Min 1% APY
      pool.apy < 1000 && // Max 1000% APY (filter out obvious outliers)
      !pool.outlier &&
      CHAIN_MAPPING[pool.chain?.toLowerCase()]
    );

    console.log(`Filtered to ${filteredPools.length} quality pools`);
    
    // Log how many Beefy pools we have
    const beefyPools = filteredPools.filter(p => p.project.toLowerCase() === 'beefy');
    console.log(`Found ${beefyPools.length} Beefy pools in filtered results`);

    // Ensure chains exist
    const chains = new Set(filteredPools.map(pool => pool.chain?.toLowerCase()).filter(Boolean));
    for (const chainName of Array.from(chains)) {
      const chainInfo = CHAIN_MAPPING[chainName];
      if (chainInfo) {
        try {
          await storage.createChain({
            name: chainInfo.name,
            displayName: chainInfo.displayName,
            color: chainInfo.color,
            isActive: true,
          });
        } catch (error) {
          // Chain might already exist, continue
        }
      }
    }

    // Ensure platforms exist
    const platforms = new Set(filteredPools.map(pool => pool.project).filter(Boolean));
    for (const platformName of Array.from(platforms)) {
      try {
        await storage.createPlatform({
          name: platformName.toLowerCase().replace(/\s+/g, '-'),
          displayName: platformName,
          slug: platformName.toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
        });
      } catch (error) {
        // Platform might already exist, continue
      }
    }

    // Get existing chains and platforms for mapping
    const allChains = await storage.getChains();
    const allPlatforms = await storage.getPlatforms();

    const chainMap = new Map(allChains.map(c => [c.name, c.id]));
    const platformMap = new Map(allPlatforms.map(p => [p.name, p.id]));

    let syncedCount = 0;
    let errorCount = 0;

    // Sync pools
    for (const pool of filteredPools) { // Process all filtered pools
      try {
        const chainId = chainMap.get(pool.chain?.toLowerCase());
        const platformId = platformMap.get(pool.project?.toLowerCase().replace(/\s+/g, '-'));

        if (!chainId || !platformId) {
          if (pool.project?.toLowerCase() === 'beefy') {
            console.warn(`Skipping Beefy pool ${pool.pool} - missing chain (${pool.chain}) or platform mapping`);
          }
          continue;
        }

        const poolData: InsertPool = {
          platformId,
          chainId,
          tokenPair: pool.symbol || 'Unknown',
          apy: pool.apy.toString(),
          tvl: pool.tvlUsd.toString(),
          riskLevel: mapRiskLevel(pool.ilRisk, (pool as any).stablecoin),
          poolAddress: pool.pool,
          defiLlamaId: pool.pool,
          project: 'defillama', // Data source identifier
          rawData: pool,
          isVisible: true,
          isActive: true,
        };

        await storage.upsertPool(pool.pool, poolData);
        syncedCount++;

        if (syncedCount % 50 === 0) {
          console.log(`Synced ${syncedCount} pools...`);
        }
      } catch (error) {
        console.error(`Error syncing pool ${pool.pool}:`, error);
        errorCount++;
      }
    }

    console.log(`Data sync completed. Synced: ${syncedCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error during data sync:", error);
    throw error;
  }
}
