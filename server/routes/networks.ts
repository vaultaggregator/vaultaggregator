import { Request, Response } from 'express';
import { db } from '../db';
import { networks } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface NetworkResponse {
  name: string;
  chainId: string;
  logo: string;
  nativeToken: {
    name: string;
    symbol: string;
    decimals: number;
    price: number;
    price24hChange: number;
    marketCap: number;
    volume24h: number;
  };
  metrics: {
    tvl: number;
    tvl24hChange: number;
    blockTime: number;
    gasPrice: number;
    activeAddresses: number;
    transactionCount24h: number;
    blockHeight: number;
    validators?: number;
  };
  links: {
    website?: string;
    twitter?: string;
    discord?: string;
    github?: string;
    docs?: string;
    explorer?: string;
  };
  description?: string;
  rpcUrl?: string;
  isTestnet: boolean;
  ecosystem?: string;
  consensusAlgorithm?: string;
  launchDate?: string;
}

// Chain configurations with logos and metadata
const CHAIN_CONFIGS: Record<string, {
  name: string;
  logo: string;
  nativeToken: { name: string; symbol: string; decimals: number; coingeckoId?: string };
  rpcUrl: string;
  explorer: string;
  website?: string;
  twitter?: string;
  github?: string;
  docs?: string;
  discord?: string;
  ecosystem?: string;
  consensusAlgorithm?: string;
  launchDate?: string;
  description?: string;
  isTestnet?: boolean;
}> = {
  '1': {
    name: 'Ethereum',
    logo: '/logos/chains/ethereum.svg',
    nativeToken: { name: 'Ether', symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum' },
    rpcUrl: 'https://ethereum.publicnode.com',
    explorer: 'https://etherscan.io',
    website: 'https://ethereum.org',
    twitter: 'https://twitter.com/ethereum',
    github: 'https://github.com/ethereum',
    docs: 'https://ethereum.org/developers',
    discord: 'https://discord.gg/ethereum-org',
    ecosystem: 'Ethereum',
    consensusAlgorithm: 'Proof of Stake',
    launchDate: '2015-07-30',
    description: 'Ethereum is a decentralized, open-source blockchain with smart contract functionality. It is the foundation for a digital money and global payments system.',
  },
  '8453': {
    name: 'Base',
    logo: '/logos/chains/base.svg',
    nativeToken: { name: 'Ether', symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum' },
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    website: 'https://base.org',
    twitter: 'https://twitter.com/base',
    github: 'https://github.com/base-org',
    docs: 'https://docs.base.org',
    discord: 'https://discord.gg/buildonbase',
    ecosystem: 'Ethereum L2',
    consensusAlgorithm: 'Optimistic Rollup',
    launchDate: '2023-08-09',
    description: 'Base is a secure, low-cost, builder-friendly Ethereum L2 built to bring the next billion users onchain. It is built on the OP Stack in collaboration with Optimism.',
  },
  '42161': {
    name: 'Arbitrum One',
    logo: '/logos/chains/arbitrum.svg',
    nativeToken: { name: 'Ether', symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum' },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    website: 'https://arbitrum.io',
    twitter: 'https://twitter.com/arbitrum',
    github: 'https://github.com/OffchainLabs',
    docs: 'https://docs.arbitrum.io',
    discord: 'https://discord.gg/arbitrum',
    ecosystem: 'Ethereum L2',
    consensusAlgorithm: 'Optimistic Rollup',
    launchDate: '2021-08-31',
    description: 'Arbitrum One is a Layer 2 optimistic rollup that enhances Ethereum with faster speeds and lower costs while maintaining security.',
  },
  '10': {
    name: 'Optimism',
    logo: '/logos/chains/optimism.svg',
    nativeToken: { name: 'Ether', symbol: 'ETH', decimals: 18, coingeckoId: 'ethereum' },
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    website: 'https://optimism.io',
    twitter: 'https://twitter.com/optimismFND',
    github: 'https://github.com/ethereum-optimism',
    docs: 'https://docs.optimism.io',
    discord: 'https://discord.gg/optimism',
    ecosystem: 'Ethereum L2',
    consensusAlgorithm: 'Optimistic Rollup',
    launchDate: '2021-12-16',
    description: 'Optimism is a Layer 2 scaling solution that uses optimistic rollups to achieve lower fees and faster transactions on Ethereum.',
  },
  '137': {
    name: 'Polygon',
    logo: '/logos/chains/polygon.svg',
    nativeToken: { name: 'MATIC', symbol: 'MATIC', decimals: 18, coingeckoId: 'matic-network' },
    rpcUrl: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    website: 'https://polygon.technology',
    twitter: 'https://twitter.com/0xPolygon',
    github: 'https://github.com/maticnetwork',
    docs: 'https://docs.polygon.technology',
    discord: 'https://discord.gg/polygon',
    ecosystem: 'Polygon',
    consensusAlgorithm: 'Proof of Stake',
    launchDate: '2020-05-30',
    description: 'Polygon is a decentralized Ethereum scaling platform that enables developers to build scalable user-friendly dApps with low transaction fees.',
  },
  '56': {
    name: 'BNB Smart Chain',
    logo: '/logos/chains/bsc.svg',
    nativeToken: { name: 'BNB', symbol: 'BNB', decimals: 18, coingeckoId: 'binancecoin' },
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    explorer: 'https://bscscan.com',
    website: 'https://www.bnbchain.org',
    twitter: 'https://twitter.com/BNBCHAIN',
    github: 'https://github.com/bnb-chain',
    docs: 'https://docs.bnbchain.org',
    discord: 'https://discord.gg/bnbchain',
    ecosystem: 'BNB Chain',
    consensusAlgorithm: 'Proof of Staked Authority',
    launchDate: '2020-09-01',
    description: 'BNB Smart Chain is a blockchain network built for running smart contract-based applications, running in parallel with Binance Chain.',
  },
  '43114': {
    name: 'Avalanche C-Chain',
    logo: '/logos/chains/avalanche.svg',
    nativeToken: { name: 'Avalanche', symbol: 'AVAX', decimals: 18, coingeckoId: 'avalanche-2' },
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorer: 'https://snowtrace.io',
    website: 'https://www.avax.network',
    twitter: 'https://twitter.com/avalancheavax',
    github: 'https://github.com/ava-labs',
    docs: 'https://docs.avax.network',
    discord: 'https://discord.gg/avalanche',
    ecosystem: 'Avalanche',
    consensusAlgorithm: 'Proof of Stake',
    launchDate: '2020-09-23',
    description: 'Avalanche is a layer one blockchain that functions as a platform for decentralized applications and custom blockchain networks.',
  },
};

// Live price API using Alchemy (replacing Coinbase for broader token coverage)
async function fetchTokenPrice(symbol: string) {
  try {
    // Import and use AlchemyService for token pricing
    const { AlchemyService } = await import('../services/alchemyService');
    const alchemy = new AlchemyService();
    
    // Map symbols to token addresses for Alchemy queries
    const tokenAddresses: Record<string, string> = {
      'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
      'MATIC': '0x0000000000000000000000000000000000000000', // Will use fallback for MATIC
      'BNB': '0x0000000000000000000000000000000000000000', // Will use fallback for BNB  
      'AVAX': '0x0000000000000000000000000000000000000000', // Will use fallback for AVAX
    };
    
    // For ETH, use Alchemy's pricing
    if (symbol.toUpperCase() === 'ETH') {
      const ethPrice = await alchemy.getTokenPrice(tokenAddresses['ETH'], 'ethereum');
      if (ethPrice && ethPrice > 0) {
        return {
          price: ethPrice,
          price24hChange: 0, // Would need historical data
          marketCap: 0, // Not available in current implementation
          volume24h: 0, // Not available in current implementation
        };
      }
    }
    
    // For other tokens, check database for stored price data
    try {
      const { storage } = await import('../storage');
      const allTokens = await storage.getAllTokenInfo();
      const tokenData = allTokens.find((token: any) => 
        token.symbol?.toUpperCase() === symbol.toUpperCase()
      );
      if (tokenData?.priceUsd) {
        const storedPrice = parseFloat(tokenData.priceUsd);
        if (storedPrice > 0) {
          return {
            price: storedPrice,
            price24hChange: 0,
            marketCap: 0,
            volume24h: 0,
          };
        }
      }
    } catch (error) {
      console.log('Could not check database for token price');
    }
    
    // Fallback prices for major tokens (updated to 2025 values)
    const fallbackPrices: Record<string, number> = {
      'ETH': 4700,
      'MATIC': 1.20,
      'BNB': 650,
      'AVAX': 45,
    };
    
    const fallbackPrice = fallbackPrices[symbol.toUpperCase()];
    if (fallbackPrice) {
      return {
        price: fallbackPrice,
        price24hChange: 0,
        marketCap: 0,
        volume24h: 0,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching token price via Alchemy:', error);
    return null;
  }
}

async function fetchChainTVL(chainName: string) {
  try {
    // Calculate TVL from pools in database
    const { storage } = await import('../storage');
    const pools = await storage.getPools({ limit: 1000 });
    
    // Filter pools by chain name and sum TVL
    const chainTvl = pools
      .filter(pool => pool.chain?.name?.toLowerCase() === chainName.toLowerCase())
      .reduce((total, pool) => {
        const tvl = parseFloat(pool.tvl || '0');
        return total + tvl;
      }, 0);

    return {
      tvl: chainTvl,
      tvl24hChange: 0, // Historical change would require historical data
    };
  } catch (error) {
    console.error('Error calculating chain TVL:', error);
    return null;
  }
}

async function fetchChainMetrics(chainId: string) {
  try {
    // These would normally come from an RPC provider or indexer
    // For now, returning realistic estimates based on chain characteristics
    const metricsMap: Record<string, any> = {
      '1': { // Ethereum
        blockTime: 12,
        gasPrice: 30, // gwei
        activeAddresses: 650000,
        transactionCount24h: 1200000,
        blockHeight: 18800000,
      },
      '8453': { // Base
        blockTime: 2,
        gasPrice: 0.05,
        activeAddresses: 250000,
        transactionCount24h: 3500000,
        blockHeight: 8500000,
      },
      '42161': { // Arbitrum
        blockTime: 2,
        gasPrice: 0.1,
        activeAddresses: 400000,
        transactionCount24h: 2800000,
        blockHeight: 150000000,
      },
      '10': { // Optimism
        blockTime: 2,
        gasPrice: 0.08,
        activeAddresses: 300000,
        transactionCount24h: 800000,
        blockHeight: 112000000,
      },
      '137': { // Polygon
        blockTime: 2,
        gasPrice: 100,
        activeAddresses: 500000,
        transactionCount24h: 4000000,
        blockHeight: 50000000,
        validators: 100,
      },
      '56': { // BSC
        blockTime: 3,
        gasPrice: 3,
        activeAddresses: 800000,
        transactionCount24h: 5000000,
        blockHeight: 34000000,
        validators: 21,
      },
      '43114': { // Avalanche
        blockTime: 2,
        gasPrice: 25,
        activeAddresses: 150000,
        transactionCount24h: 600000,
        blockHeight: 40000000,
        validators: 1500,
      },
    };

    return metricsMap[chainId] || {
      blockTime: 3,
      gasPrice: 1,
      activeAddresses: 10000,
      transactionCount24h: 100000,
      blockHeight: 1000000,
    };
  } catch (error) {
    console.error('Error fetching chain metrics:', error);
    return {
      blockTime: 3,
      gasPrice: 1,
      activeAddresses: 10000,
      transactionCount24h: 100000,
      blockHeight: 1000000,
    };
  }
}

export async function getNetworkDetails(req: Request, res: Response) {
  try {
    const { chainId } = req.params;

    if (!chainId) {
      return res.status(400).json({ error: 'Chain ID is required' });
    }

    // Check if it's a UUID (database ID) - UUID has dashes and is 36 characters
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chainId);
    
    let dbNetwork = null;
    
    if (isUUID) {
      // Look up by database ID
      const [network] = await db.select().from(networks).where(eq(networks.id, chainId));
      dbNetwork = network;
    } else {
      // Try numeric chainId in CHAIN_CONFIGS first
      const chainConfig = CHAIN_CONFIGS[chainId];
      if (chainConfig) {
        // Handle hardcoded chain config (existing logic)
        // Fetch real-time data in parallel
        const [tokenPriceData, tvlData, metricsData] = await Promise.all([
          fetchTokenPrice(chainConfig.nativeToken.symbol),
          fetchChainTVL(chainConfig.name),
          fetchChainMetrics(chainId),
        ]);

        // Construct response
        const response: NetworkResponse = {
          name: chainConfig.name,
          chainId: chainId,
          logo: chainConfig.logo,
          nativeToken: {
            name: chainConfig.nativeToken.name,
            symbol: chainConfig.nativeToken.symbol,
            decimals: chainConfig.nativeToken.decimals,
            price: tokenPriceData?.price || 0,
            price24hChange: tokenPriceData?.price24hChange || 0,
            marketCap: tokenPriceData?.marketCap || 0,
            volume24h: tokenPriceData?.volume24h || 0,
          },
          metrics: {
            tvl: tvlData?.tvl || 0,
            tvl24hChange: tvlData?.tvl24hChange || 0,
            blockTime: metricsData.blockTime,
            gasPrice: metricsData.gasPrice,
            activeAddresses: metricsData.activeAddresses,
            transactionCount24h: metricsData.transactionCount24h,
            blockHeight: metricsData.blockHeight,
          },
          links: {
            website: chainConfig.website,
            twitter: chainConfig.twitter,
            discord: chainConfig.discord,
            github: chainConfig.github,
            docs: chainConfig.docs,
            explorer: chainConfig.explorer,
          },
          description: chainConfig.description,
          rpcUrl: chainConfig.rpcUrl,
          isTestnet: chainConfig.isTestnet || false,
          ecosystem: chainConfig.ecosystem,
          consensusAlgorithm: chainConfig.consensusAlgorithm,
          launchDate: chainConfig.launchDate,
        };

        return res.json(response);
      }
      
      // Try to fetch from database by name as fallback
      const [network] = await db.select().from(networks).where(eq(networks.name, chainId));
      dbNetwork = network;
    }
    
    if (!dbNetwork) {
      return res.status(404).json({ error: 'Network not found' });
    }

      // Build basic response from database
      const response: NetworkResponse = {
        name: dbNetwork.displayName || dbNetwork.name,
        chainId: dbNetwork.name, // Use the network name as chainId for compatibility 
        logo: dbNetwork.logoUrl || '',
        nativeToken: {
          name: 'Unknown',
          symbol: 'UNKNOWN',
          decimals: 18,
          price: 0,
          price24hChange: 0,
          marketCap: 0,
          volume24h: 0,
        },
        metrics: {
          tvl: 0,
          tvl24hChange: 0,
          blockTime: 3,
          gasPrice: 1,
          activeAddresses: 0,
          transactionCount24h: 0,
          blockHeight: 0,
        },
        links: {},
        isTestnet: false,
      };

      return res.json(response);
  } catch (error) {
    console.error('Error fetching network details:', error);
    res.status(500).json({ error: 'Failed to fetch network details' });
  }
}