import { Request, Response } from 'express';
import { db } from '../db';
import { chains } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock data structure for now - will integrate with real APIs
interface TokenResponse {
  name: string;
  symbol: string;
  address: string;
  chainId: string;
  chainName: string;
  logo: string;
  decimals: number;
  price: number;
  price24hChange: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  holderCount: number;
  topHolders: Array<{
    address: string;
    balance: number;
    share: number;
    label?: string;
  }>;
  recentTransfers: Array<{
    from: string;
    to: string;
    amount: number;
    value: number;
    timestamp: number;
    txHash: string;
    explorerUrl: string;
  }>;
  protocols: Array<{
    name: string;
    type: string;
    tvl: number;
    apy?: number;
    logo?: string;
  }>;
  description?: string;
  website?: string;
  coingeckoId?: string;
}

// Etherscan API endpoints for different chains
const ETHERSCAN_APIS: Record<string, { url: string; apiKey?: string }> = {
  'ethereum': { url: 'https://api.etherscan.io/api' },
  'base': { url: 'https://api.basescan.org/api' },
  'arbitrum': { url: 'https://api.arbiscan.io/api' },
  'optimism': { url: 'https://api-optimistic.etherscan.io/api' },
  'polygon': { url: 'https://api.polygonscan.com/api' },
  'bsc': { url: 'https://api.bscscan.com/api' },
};

// Removed CoinGecko API - now using Alchemy

async function fetchTokenFromAlchemy(chainId: string, tokenAddress: string) {
  try {
    // Import Alchemy service
    const { AlchemyService } = await import('../services/alchemyService');
    const alchemy = new AlchemyService();
    
    // Map chain IDs to network names
    const networkMap: Record<string, string> = {
      'ethereum': 'ethereum',
      'base': 'base',
    };

    const network = networkMap[chainId] || 'ethereum';

    // Get token metadata from Alchemy
    const metadata = await alchemy.getTokenMetadata(tokenAddress, network);
    if (!metadata) return null;

    // Get live price using Alchemy service
    const price = await alchemy.getTokenPrice(tokenAddress, network);

    return {
      name: metadata.name || '',
      symbol: metadata.symbol?.toUpperCase() || '',
      logo: metadata.logo || '',
      price: price,
      price24hChange: 0, // Not available from Alchemy
      marketCap: 0, // Not available from Alchemy
      totalSupply: 0, // Not available from Alchemy
      circulatingSupply: 0, // Not available from Alchemy
      description: '',
      website: '',
    };
  } catch (error) {
    console.error('Error fetching from Alchemy:', error);
    return null;
  }
}

// Removed DefiLlama API integration - now using platform-specific APIs

async function fetchTokenFromEtherscan(chainId: string, tokenAddress: string) {
  try {
    const etherscanConfig = ETHERSCAN_APIS[chainId];
    if (!etherscanConfig) return null;

    // Fetch token info
    const tokenInfoUrl = `${etherscanConfig.url}?module=token&action=tokeninfo&contractaddress=${tokenAddress}`;
    const tokenResponse = await fetch(tokenInfoUrl);
    
    if (!tokenResponse.ok) {
      console.log(`Etherscan API returned ${tokenResponse.status}`);
      return null;
    }

    const tokenData = await tokenResponse.json();
    
    // Fetch token holders (limited data without API key)
    const holdersUrl = `${etherscanConfig.url}?module=token&action=tokenholderlist&contractaddress=${tokenAddress}&page=1&offset=10`;
    const holdersResponse = await fetch(holdersUrl);
    
    let topHolders: any[] = [];
    if (holdersResponse.ok) {
      const holdersData = await holdersResponse.json();
      if (holdersData.status === '1' && holdersData.result) {
        topHolders = holdersData.result.slice(0, 10).map((holder: any) => ({
          address: holder.TokenHolderAddress,
          balance: parseFloat(holder.TokenHolderQuantity) / Math.pow(10, parseInt(tokenData.result?.decimals || '18')),
          share: parseFloat(holder.TokenHolderQuantity) / parseFloat(tokenData.result?.totalSupply || '1') * 100,
        }));
      }
    }

    return {
      name: tokenData.result?.name,
      symbol: tokenData.result?.symbol,
      decimals: parseInt(tokenData.result?.decimals || '18'),
      totalSupply: parseFloat(tokenData.result?.totalSupply || '0') / Math.pow(10, parseInt(tokenData.result?.decimals || '18')),
      topHolders,
    };
  } catch (error) {
    console.error('Error fetching from Etherscan:', error);
    return null;
  }
}

async function fetchProtocolsUsingToken(tokenAddress: string, tokenSymbol: string) {
  try {
    // Return empty array for now - will integrate with platform-specific APIs later
    // This would fetch from our database or direct platform APIs (Morpho, Lido, etc.)
    return [];
  } catch (error) {
    console.error('Error fetching protocols:', error);
    return [];
  }
}

export async function getTokenDetails(req: Request, res: Response) {
  try {
    const { chainId, tokenAddress } = req.params;

    if (!chainId || !tokenAddress) {
      return res.status(400).json({ error: 'Chain ID and token address are required' });
    }

    // Get chain info from database
    const [chain] = await db.select().from(chains).where(eq(chains.name, chainId));
    const chainName = chain?.name || chainId;

    // Fetch token data from multiple sources in parallel
    const [coinGeckoData, etherscanData] = await Promise.all([
      fetchTokenFromAlchemy(chainId, tokenAddress),
      fetchTokenFromEtherscan(chainId, tokenAddress),
    ]);

    // Merge data from different sources (prioritize Alchemy for most fields)
    const tokenData: any = coinGeckoData || {};

    // Override with Etherscan data if available
    if (etherscanData) {
      tokenData.name = tokenData.name || etherscanData.name;
      tokenData.symbol = tokenData.symbol || etherscanData.symbol;
      tokenData.decimals = etherscanData.decimals || tokenData.decimals;
      tokenData.totalSupply = etherscanData.totalSupply || tokenData.totalSupply;
      tokenData.topHolders = etherscanData.topHolders || [];
    }

    // Fetch protocols using this token
    const protocols = await fetchProtocolsUsingToken(tokenAddress, tokenData.symbol);

    // Generate mock recent transfers for now (would integrate with Etherscan/Alchemy in production)
    const recentTransfers = [];
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 5; i++) {
      const amount = Math.random() * 10000;
      recentTransfers.push({
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        amount: parseFloat(amount.toFixed(2)),
        value: amount * (tokenData.price || 0),
        timestamp: now - (i * 3600), // 1 hour apart
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        explorerUrl: `${ETHERSCAN_APIS[chainId]?.url?.replace('/api', '')}/tx/0x${Math.random().toString(16).substr(2, 64)}`,
      });
    }

    // Construct response
    const response: TokenResponse = {
      name: tokenData.name || 'Unknown Token',
      symbol: tokenData.symbol || 'UNKNOWN',
      address: tokenAddress,
      chainId,
      chainName,
      logo: tokenData.logo || '',
      decimals: tokenData.decimals || 18,
      price: tokenData.price || 0,
      price24hChange: tokenData.price24hChange || 0,
      marketCap: tokenData.marketCap || 0,
      totalSupply: tokenData.totalSupply || 0,
      circulatingSupply: tokenData.circulatingSupply || 0,
      holderCount: tokenData.topHolders?.length || 0,
      topHolders: tokenData.topHolders || [],
      recentTransfers,
      protocols,
      description: tokenData.description,
      website: tokenData.website,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching token details:', error);
    res.status(500).json({ error: 'Failed to fetch token details' });
  }
}