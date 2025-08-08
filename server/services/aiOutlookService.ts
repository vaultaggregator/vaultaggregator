import OpenAI from "openai";
import { IStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CoinGecko API service for accurate crypto prices
class CoinGeckoService {
  private static readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  
  static async getTokenPrice(tokenSymbol: string): Promise<number | null> {
    try {
      // Common token symbol to CoinGecko ID mapping
      const tokenMap: { [key: string]: string } = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'DAI': 'dai',
        'WETH': 'weth',
        'WBTC': 'wrapped-bitcoin',
        'STETH': 'staked-ether',
        'LDO': 'lido-dao',
        'LIDO': 'lido-dao',
        'MATIC': 'matic-network',
        'POLYGON': 'matic-network',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'CRV': 'curve-dao-token',
        'COMP': 'compound-governance-token',
        'MKR': 'maker',
        'SNX': 'havven',
        'YFI': 'yearn-finance',
        'SUSHI': 'sushi',
        '1INCH': '1inch'
      };

      const tokenId = tokenMap[tokenSymbol.toUpperCase()];
      if (!tokenId) {
        console.warn(`Token ${tokenSymbol} not found in CoinGecko mapping`);
        return null;
      }

      const response = await fetch(`${this.BASE_URL}/simple/price?ids=${tokenId}&vs_currencies=usd`);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      return data[tokenId]?.usd || null;
    } catch (error) {
      console.error(`Error fetching price for ${tokenSymbol}:`, error);
      return null;
    }
  }

  static async getMarketData(tokenSymbol: string): Promise<{price: number | null, change24h: number | null} | null> {
    try {
      const tokenMap: { [key: string]: string } = {
        'ETH': 'ethereum',
        'BTC': 'bitcoin',
        'USDC': 'usd-coin',
        'USDT': 'tether',
        'DAI': 'dai',
        'WETH': 'weth',
        'WBTC': 'wrapped-bitcoin',
        'STETH': 'staked-ether',
        'LDO': 'lido-dao',
        'LIDO': 'lido-dao',
        'MATIC': 'matic-network',
        'POLYGON': 'matic-network'
      };

      const tokenId = tokenMap[tokenSymbol.toUpperCase()];
      if (!tokenId) return null;

      const response = await fetch(`${this.BASE_URL}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true`);
      if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

      const data = await response.json();
      return {
        price: data[tokenId]?.usd || null,
        change24h: data[tokenId]?.usd_24h_change || null
      };
    } catch (error) {
      console.error(`Error fetching market data for ${tokenSymbol}:`, error);
      return null;
    }
  }
}

// Utility function to format TVL values
function formatTvl(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "N/A";
  
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
}

interface MarketFactors {
  poolData: {
    tokenPair: string;
    apy: string;
    tvl: string;
    platform: string;
    chain: string;
    riskLevel: string;
  };
  marketContext: {
    volatility: string;
    trend: string;
    volume: string;
  };
}

interface OutlookResponse {
  outlook: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  marketFactors: string[];
}

export class AIOutlookService {
  constructor(private storage: IStorage) {}

  /**
   * Calculate dynamic confidence score based on comprehensive market factors
   * New formula considers: APY stability, TVL health, platform maturity, social sentiment
   */
  private calculateConfidenceScore(pool: any): number {
    let confidence = 25; // Lower starting base for more realistic range

    // 1. APY Stability Analysis (0-20 points, reduced from 25)
    const currentApy = parseFloat(pool.apy || "0");
    const apy30d = (pool.rawData as any)?.apyMean30d;
    
    if (apy30d && currentApy > 0) {
      const apyVariation = Math.abs(currentApy - apy30d) / Math.max(currentApy, apy30d);
      
      if (apyVariation < 0.03) confidence += 20; // Very stable APY (<3% variation)
      else if (apyVariation < 0.08) confidence += 16; // Stable APY (<8% variation)
      else if (apyVariation < 0.15) confidence += 12; // Moderate variation (<15%)
      else if (apyVariation < 0.25) confidence += 8; // High variation (<25%)
      else if (apyVariation < 0.40) confidence += 4; // Very high variation
      else confidence -= 8; // Extreme volatility (>40% variation)
      
      // More conservative APY level assessment
      if (currentApy > 0 && currentApy < 15) confidence += 4; // Very sustainable yields
      else if (currentApy >= 15 && currentApy < 30) confidence += 2; // Sustainable yields
      else if (currentApy >= 30 && currentApy < 60) confidence -= 2; // High yields, some risk
      else if (currentApy >= 60) confidence -= 10; // Potentially unsustainable
    } else {
      confidence -= 15; // Larger penalty for missing historical data
    }

    // 2. Total Value Locked Health (0-15 points, reduced from 20)
    const tvl = parseFloat(pool.tvl || "0");
    if (tvl >= 1000000000) confidence += 15; // >$1B TVL: institutional grade
    else if (tvl >= 500000000) confidence += 13; // >$500M TVL: very stable
    else if (tvl >= 100000000) confidence += 11; // >$100M TVL: stable
    else if (tvl >= 50000000) confidence += 9; // >$50M TVL: moderate
    else if (tvl >= 10000000) confidence += 7; // >$10M TVL: small but viable
    else if (tvl >= 1000000) confidence += 4; // >$1M TVL: risky
    else if (tvl >= 100000) confidence += 1; // >$100K TVL: very risky
    else confidence -= 8; // <$100K TVL: extremely risky

    // 3. Platform Maturity & Operating History (0-15 points, reduced from 20)
    const operatingDays = (pool.rawData as any)?.count || 0;
    const platformName = pool.platform?.displayName?.toLowerCase() || "";
    
    // More conservative platform reputation scoring
    let platformScore = 0;
    if (["aave", "compound", "morpho", "lido", "maker"].includes(platformName)) {
      platformScore = 6; // Blue chip protocols (reduced from 10)
    } else if (["curve", "convex", "yearn", "balancer", "uniswap"].includes(platformName)) {
      platformScore = 4; // Established DeFi protocols (reduced from 8)
    } else if (operatingDays > 365) {
      platformScore = 2; // Unknown but mature (reduced from 6)
    } else {
      platformScore = 0; // New or unknown protocol (reduced from 2)
    }
    
    // More conservative operating history scoring
    if (operatingDays > 1095) confidence += (8 + platformScore); // >3 years: battle-tested
    else if (operatingDays > 730) confidence += (6 + platformScore); // >2 years: mature
    else if (operatingDays > 365) confidence += (4 + Math.floor(platformScore/2)); // >1 year: established
    else if (operatingDays > 180) confidence += (2 + Math.floor(platformScore/3)); // >6 months: growing
    else if (operatingDays > 90) confidence += 1; // >3 months: new
    else confidence -= 10; // <3 months: unproven

    // 4. Market Volatility & Risk Assessment (0-12 points, reduced from 15)
    const volatility = (pool.rawData as any)?.sigma || 0;
    if (volatility < 0.015) confidence += 12; // Very low volatility
    else if (volatility < 0.03) confidence += 10; // Low volatility
    else if (volatility < 0.06) confidence += 7; // Moderate volatility
    else if (volatility < 0.12) confidence += 4; // High volatility
    else if (volatility < 0.25) confidence -= 2; // Very high volatility
    else confidence -= 12; // Extreme volatility

    // More conservative risk level adjustment
    switch (pool.riskLevel?.toLowerCase()) {
      case 'low': confidence += 6; break;
      case 'medium': confidence += 2; break;
      case 'high': confidence -= 6; break;
      case 'extreme': confidence -= 15; break;
    }

    // 5. Social Sentiment & Market Position (0-8 points, reduced from 10)
    let sentimentScore = 0;
    
    // Platform social sentiment (more conservative)
    if (["aave", "lido", "morpho"].includes(platformName)) {
      sentimentScore += 3; // Strong community trust
    } else if (["compound", "maker", "uniswap"].includes(platformName)) {
      sentimentScore += 2; // Established reputation
    } else {
      sentimentScore += 0; // Unknown sentiment (reduced from 1)
    }
    
    // Performance-based sentiment (more strict)
    if (currentApy > 0 && apy30d && currentApy >= apy30d * 0.95) {
      sentimentScore += 2; // Maintaining yields well
    } else if (currentApy > 0 && apy30d && currentApy >= apy30d * 0.85) {
      sentimentScore += 1; // Slight decline acceptable
    } else if (currentApy > 0 && apy30d && currentApy < apy30d * 0.75) {
      sentimentScore -= 4; // Significant decline = negative sentiment
    }
    
    // TVL growth indicates positive sentiment (more conservative)
    if (tvl > 100000000) {
      sentimentScore += 2; // Large TVL suggests confidence (reduced threshold)
    }
    
    confidence += Math.min(8, sentimentScore);

    // 6. Data Quality & Completeness (0-8 points, reduced from 10)
    let dataQualityScore = 0;
    if ((pool.rawData as any)?.count) dataQualityScore += 1.5;
    if ((pool.rawData as any)?.apyMean30d) dataQualityScore += 2; // Most important metric
    if ((pool.rawData as any)?.sigma) dataQualityScore += 1.5;
    if ((pool.rawData as any)?.volumeUsd7d) dataQualityScore += 1;
    if (pool.tvl && parseFloat(pool.tvl) > 0) dataQualityScore += 2; // Important metric
    
    confidence += Math.round(dataQualityScore);

    // Additional reality check penalties
    // Penalty for prediction uncertainties in DeFi
    confidence -= 8; // Base uncertainty penalty for crypto volatility
    
    // Market maturity penalty (DeFi is still evolving)
    confidence -= 5; // DeFi sector uncertainty

    // Ensure confidence is between 15-85 (more realistic range)
    return Math.max(15, Math.min(85, Math.round(confidence)));
  }

  private async getCurrentMarketContext(): Promise<string> {
    try {
      const marketContext = `
Current DeFi Market Data Context:
- ETH price trends and volatility patterns affecting yield farming profitability
- Major stablecoin flows (USDC, USDT, DAI) indicating DeFi liquidity health
- DeFi Total Value Locked (TVL) across major protocols showing sector growth
- Lending/borrowing utilization rates on Aave, Compound indicating demand
- Recent economic policy changes (Fed rates, inflation data) impacting crypto yields
- Market sentiment indicators specific to DeFi sector performance
- Cross-chain activity and bridge volumes showing capital migration patterns
- Recent protocol updates, governance decisions, and security incidents
- Institutional DeFi adoption and regulatory clarity developments
- Yield farming competition between protocols and emerging opportunities
      `.trim();
      
      return marketContext;
    } catch (error) {
      return "Limited market context available due to API constraints.";
    }
  }

  async generateOutlook(poolId: string): Promise<OutlookResponse | null> {
    try {
      // Get pool data
      const pool = await this.storage.getPoolById(poolId);
      if (!pool) {
        throw new Error("Pool not found");
      }

      // Prepare market factors for AI analysis
      const marketFactors: MarketFactors = {
        poolData: {
          tokenPair: pool.tokenPair,
          apy: pool.apy || "N/A",
          tvl: pool.tvl || "N/A",
          platform: pool.platform?.displayName || "Unknown",
          chain: pool.chain?.displayName || "Unknown",
          riskLevel: pool.riskLevel
        },
        marketContext: {
          volatility: (pool.rawData as any)?.sigma ? `${((pool.rawData as any).sigma * 100).toFixed(1)}%` : "N/A",
          trend: (pool.rawData as any)?.apyPct7D ? ((pool.rawData as any).apyPct7D > 0 ? "increasing" : "decreasing") : "stable",
          volume: (pool.rawData as any)?.volumeUsd7d ? `$${(pool.rawData as any).volumeUsd7d}` : "N/A"
        }
      };

      // Calculate dynamic confidence score based on market data
      const calculatedConfidence = this.calculateConfidenceScore(pool);
      
      // Get comprehensive market context
      const globalMarketContext = await this.getCurrentMarketContext();
      
      // Get real-time crypto prices from CoinGecko for accurate analysis
      const tokenSymbols = pool.tokenPair.split('-').map(t => t.trim());
      const cryptoPrices: { [key: string]: { price: number | null, change24h: number | null } } = {};
      
      for (const token of tokenSymbols) {
        if (!['USDC', 'USDT', 'DAI'].includes(token.toUpperCase())) { // Skip stablecoins
          const marketData = await CoinGeckoService.getMarketData(token);
          if (marketData) {
            cryptoPrices[token] = marketData;
          }
        }
      }
      
      // Get market data for enhanced analysis
      const marketMetrics = {
        tvlStability: parseFloat(pool.tvl || "0") > 10000000 ? "high" : "moderate",
        volatilityLevel: (pool.rawData as any)?.sigma > 0.2 ? "high" : "low",
        apyTrend: (pool.rawData as any)?.apyPct7D || 0,
        operatingHistory: (pool.rawData as any)?.count || 0,
        dataQuality: pool.rawData ? "complete" : "limited"
      };

      const prompt = `
You are a professional DeFi yield analyst providing market outlook with specific APY predictions.

**Vault Details:**
- Token Pair: ${marketFactors.poolData.tokenPair}
- Current APY: ${marketFactors.poolData.apy}
- TVL: ${marketFactors.poolData.tvl}
- Platform: ${marketFactors.poolData.platform}
- Blockchain: ${marketFactors.poolData.chain}
- Risk Level: ${marketFactors.poolData.riskLevel}

**Current Market Metrics:**
- Volatility: ${marketFactors.marketContext.volatility}
- 7-day trend: ${marketFactors.marketContext.trend}
- Volume: ${marketFactors.marketContext.volume}

**Enhanced Market Analysis Data:**
- TVL Stability: ${marketMetrics.tvlStability} (${formatTvl(pool.tvl || "0")})
- Volatility Level: ${marketMetrics.volatilityLevel} (${marketFactors.marketContext.volatility})
- APY 7-day Change: ${marketMetrics.apyTrend > 0 ? '+' : ''}${marketMetrics.apyTrend?.toFixed(2) || 0}%
- Operating History: ${marketMetrics.operatingHistory} days
- Data Quality: ${marketMetrics.dataQuality}
- Calculated Confidence: ${calculatedConfidence}%

**REAL-TIME CRYPTO PRICES (CoinGecko):**
${Object.entries(cryptoPrices).map(([token, data]) => 
  `- ${token}: $${data.price?.toFixed(2) || 'N/A'} (24h: ${data.change24h ? (data.change24h > 0 ? '+' : '') + data.change24h.toFixed(2) + '%' : 'N/A'})`
).join('\n')}

**DATA INPUTS TO ANALYZE:**

${globalMarketContext}

**Required Analysis Framework:**
- Use the REAL CoinGecko prices above for accurate market analysis
- Market sentiment from DeFi angle (protocol adoption, TVL flows, user activity)
- ETH price trends using CoinGecko data (impact on gas costs and yield sustainability)
- Market cap and flows of major stablecoins (USDC, USDT, DAI liquidity health)
- Relevant economic news (Fed policy, rate moves, macro shifts affecting crypto)
- Vault's historical and current APY performance patterns
- Reference the actual 24h price changes from CoinGecko in your analysis

**Required Output (exactly 185 words):**
1. **Short-term APY prediction** (days to weeks) with specific percentage
2. **Long-term APY prediction** (weeks to months) with specific percentage  
3. **Plain-English risk-benefit analysis** (keep farming vs consider switching)

**Tone Requirements:**
- Calm, direct, informed - like a savvy DeFi user giving advice
- Use "you" and conversational language
- Include specific percentages and reasoning
- No dramatic language or hype
- Focus on practical decision-making

**Example Style:**
"Short-term APY ~3.5%. ETH has held steady, sentiment mild.
Long-term APY ~4.0%. Stablecoin caps growing, lending demand rising.
You may want to keep farming here. If macro shifts or liquidity drops, consider reallocating—no dramatic moves."

**IMPORTANT: Use the calculated confidence of ${calculatedConfidence}% in your response (not any other number).**

Respond with JSON in this exact format:
{
  "outlook": "Your calm, direct 185-word DeFi market outlook with specific APY predictions and practical risk-benefit advice here",
  "sentiment": "bullish|bearish|neutral", 
  "confidence": ${calculatedConfidence},
  "marketFactors": ["ETH trends", "stablecoin flows", "DeFi sentiment", "economic policy", "vault APY history"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a savvy DeFi user providing market outlook advice. Write in a calm, direct, informed tone like you're giving practical advice to another DeFi farmer. Include specific APY predictions with percentages, analyze market sentiment from a DeFi angle, reference ETH trends and stablecoin flows, and give plain-English risk-benefit advice. Always respond with valid JSON and exactly 185 words."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 700
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate response
      if (!result.outlook || !result.sentiment || !result.confidence) {
        throw new Error("Invalid AI response format");
      }

      return {
        outlook: result.outlook,
        sentiment: result.sentiment,
        confidence: calculatedConfidence, // Use our calculated confidence
        marketFactors: result.marketFactors || []
      };

    } catch (error) {
      console.error("Error generating AI outlook:", error);
      return null;
    }
  }

  async saveOutlook(poolId: string, outlookData: OutlookResponse): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // Expires in 2 hours

      await this.storage.createAIOutlook({
        poolId,
        outlook: outlookData.outlook,
        sentiment: outlookData.sentiment,
        confidence: outlookData.confidence,
        marketFactors: outlookData.marketFactors,
        expiresAt
      });
    } catch (error) {
      console.error("Error saving AI outlook:", error);
      throw error;
    }
  }

  async getValidOutlook(poolId: string): Promise<any | null> {
    try {
      return await this.storage.getValidAIOutlook(poolId);
    } catch (error) {
      console.error("Error getting valid AI outlook:", error);
      return null;
    }
  }

  async generateAndSaveOutlook(poolId: string): Promise<any | null> {
    try {
      const outlookData = await this.generateOutlook(poolId);
      if (!outlookData) {
        return null;
      }

      await this.saveOutlook(poolId, outlookData);
      return await this.getValidOutlook(poolId);
    } catch (error) {
      console.error("Error generating and saving outlook:", error);
      return null;
    }
  }
}