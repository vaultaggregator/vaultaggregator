import { storage } from "../storage";
import type { InsertPool, InsertPlatform, InsertChain } from "@shared/schema";
import { TokenInfoSyncService } from "./tokenInfoSyncService";

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
    
    // First, get only visible pools from database to sync
    const visiblePools = await storage.getPools({ onlyVisible: true });
    const visibleDefiLlamaIds = new Set(
      visiblePools
        .filter(p => p.defiLlamaId && p.project === 'defillama')
        .map(p => p.defiLlamaId)
    );
    
    console.log(`Found ${visibleDefiLlamaIds.size} visible pools to sync`);
    
    if (visibleDefiLlamaIds.size === 0) {
      console.log("No visible pools to sync - skipping DeFi Llama API call");
      return;
    }
    
    const pools = await fetchYieldPools();
    console.log(`Fetched ${pools.length} pools from DeFi Llama`);

    // Only sync pools that are marked as visible in our database
    const filteredPools = [];
    const debugInfo = { totalVisible: 0, passedFilters: 0, failReasons: [] as string[] };
    
    for (const pool of pools) {
      if (visibleDefiLlamaIds.has(pool.pool)) {
        debugInfo.totalVisible++;
        
        // Check each filter and log failures for debugging
        const checks = [
          { name: 'TVL > $10k', pass: pool.tvlUsd > 10000, value: pool.tvlUsd },
          { name: 'APY > 1%', pass: pool.apy > 0.01, value: pool.apy },
          { name: 'APY < 1000%', pass: pool.apy < 1000, value: pool.apy },
          { name: 'Not outlier', pass: !pool.outlier, value: pool.outlier },
          { name: 'Supported chain', pass: !!CHAIN_MAPPING[pool.chain?.toLowerCase()], value: pool.chain }
        ];
        
        const failedChecks = checks.filter(check => !check.pass);
        
        if (failedChecks.length === 0) {
          filteredPools.push(pool);
          debugInfo.passedFilters++;
        } else {
          // For visible pools that fail filters, still update them but with relaxed criteria
          // This ensures the lastUpdated timestamp gets refreshed
          if (pool.apy > 0 && pool.tvlUsd > 0 && CHAIN_MAPPING[pool.chain?.toLowerCase()]) {
            filteredPools.push(pool);
            debugInfo.passedFilters++;
            console.log(`Including visible pool ${pool.pool} despite filter failures:`, 
              failedChecks.map(f => `${f.name}: ${f.value}`).join(', '));
          } else {
            debugInfo.failReasons.push(`${pool.pool}: ${failedChecks.map(f => f.name).join(', ')}`);
          }
        }
      }
    }

    console.log(`Filtered to ${filteredPools.length} visible pools for sync`);
    if (debugInfo.failReasons.length > 0) {
      console.log('Pools filtered out:', debugInfo.failReasons);
    }
    
    if (filteredPools.length === 0) {
      console.log("No visible pools found in DeFi Llama data - sync complete");
      return;
    }

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

    // Initialize token info sync service
    const tokenInfoService = new TokenInfoSyncService();

    // Sync only visible pools
    for (const pool of filteredPools) { // Process only visible pools
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
          isVisible: false, // Let admin control visibility
          isActive: true,
        };

        const upsertedPool = await storage.upsertPool(pool.pool, poolData);
        syncedCount++;

        // Sync token info for this pool if it has underlying tokens
        if (pool.underlyingTokens && pool.underlyingTokens.length > 0) {
          await tokenInfoService.syncTokenInfo(upsertedPool.id, pool);
        }

        if (syncedCount % 25 === 0) {
          console.log(`Synced ${syncedCount} visible pools...`);
        }
      } catch (error) {
        console.error(`Error syncing pool ${pool.pool}:`, error);
        errorCount++;
      }
    }

    console.log(`Data sync completed. Synced ${syncedCount} visible pools, Errors: ${errorCount}`);
  } catch (error) {
    console.error("Error during data sync:", error);
    throw error;
  }
}
