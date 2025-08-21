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

// CoinGecko API base URL
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// DefiLlama API base URL
const DEFILLAMA_API = 'https://api.llama.fi';

async function fetchTokenFromCoinGecko(chainId: string, tokenAddress: string) {
  try {
    // Map chain IDs to CoinGecko platform IDs
    const platformMap: Record<string, string> = {
      'ethereum': 'ethereum',
      'base': 'base',
      'arbitrum': 'arbitrum-one',
      'optimism': 'optimistic-ethereum',
      'polygon': 'polygon-pos',
      'bsc': 'binance-smart-chain',
    };

    const platform = platformMap[chainId] || 'ethereum';
    
    // Fetch token info from CoinGecko with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `${COINGECKO_API}/coins/${platform}/contract/${tokenAddress.toLowerCase()}`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      console.log(`CoinGecko API returned ${response.status} for token ${tokenAddress}`);
      return null;
    }

    const data = await response.json();
    
    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      logo: data.image?.large || data.image?.small,
      price: data.market_data?.current_price?.usd || 0,
      price24hChange: data.market_data?.price_change_percentage_24h || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      totalSupply: data.market_data?.total_supply || 0,
      circulatingSupply: data.market_data?.circulating_supply || 0,
      description: data.description?.en,
      website: data.links?.homepage?.[0],
      coingeckoId: data.id,
    };
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    return null;
  }
}

async function fetchTokenFromDefiLlama(chainId: string, tokenAddress: string) {
  try {
    // Map chain IDs to DefiLlama chain names
    const chainMap: Record<string, string> = {
      'ethereum': 'ethereum',
      'base': 'base',
      'arbitrum': 'arbitrum',
      'optimism': 'optimism',
      'polygon': 'polygon',
      'bsc': 'bsc',
    };

    const chain = chainMap[chainId] || 'ethereum';
    
    // Fetch current price from DefiLlama with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const priceResponse = await fetch(
      `${DEFILLAMA_API}/coins/prices/current/${chain}:${tokenAddress}`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timeout));

    if (!priceResponse.ok) {
      console.log(`DefiLlama price API returned ${priceResponse.status}`);
      return null;
    }

    const priceData = await priceResponse.json();
    const tokenKey = `${chain}:${tokenAddress}`;
    const tokenInfo = priceData.coins?.[tokenKey];

    if (!tokenInfo) return null;

    return {
      price: tokenInfo.price || 0,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals || 18,
    };
  } catch (error) {
    console.error('Error fetching from DefiLlama:', error);
    return null;
  }
}

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
    // Get TVL data from DefiLlama for protocols using this token
    const response = await fetch(`${DEFILLAMA_API}/protocols`);
    
    if (!response.ok) {
      console.log(`DefiLlama protocols API returned ${response.status}`);
      return [];
    }

    const protocols = await response.json();
    
    // Filter protocols that might use this token (simplified logic)
    // In production, you'd need more sophisticated matching
    const relevantProtocols = protocols
      .filter((p: any) => {
        const hasToken = p.symbol?.toLowerCase() === tokenSymbol?.toLowerCase() ||
                        p.name?.toLowerCase().includes(tokenSymbol?.toLowerCase());
        return hasToken && p.tvl > 0;
      })
      .slice(0, 6)
      .map((p: any) => ({
        name: p.name,
        type: p.category || 'DeFi',
        tvl: p.tvl || 0,
        logo: p.logo,
      }));

    return relevantProtocols;
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
    const [coinGeckoData, defiLlamaData, etherscanData] = await Promise.all([
      fetchTokenFromCoinGecko(chainId, tokenAddress),
      fetchTokenFromDefiLlama(chainId, tokenAddress),
      fetchTokenFromEtherscan(chainId, tokenAddress),
    ]);

    // Merge data from different sources (prioritize CoinGecko for most fields)
    const tokenData: any = coinGeckoData || {};
    
    // Override with DefiLlama data if available
    if (defiLlamaData) {
      tokenData.price = defiLlamaData.price || tokenData.price;
      tokenData.symbol = tokenData.symbol || defiLlamaData.symbol;
      tokenData.decimals = defiLlamaData.decimals || tokenData.decimals || 18;
    }

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
      coingeckoId: tokenData.coingeckoId,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching token details:', error);
    res.status(500).json({ error: 'Failed to fetch token details' });
  }
}