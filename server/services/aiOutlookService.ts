import OpenAI from "openai";
import { IStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    let confidence = 40; // Lower base confidence for more dynamic range

    // 1. APY Stability Analysis (0-25 points)
    const currentApy = parseFloat(pool.apy || "0");
    const apy30d = (pool.rawData as any)?.apyMean30d;
    
    if (apy30d && currentApy > 0) {
      const apyVariation = Math.abs(currentApy - apy30d) / Math.max(currentApy, apy30d);
      
      if (apyVariation < 0.05) confidence += 25; // Very stable APY (<5% variation)
      else if (apyVariation < 0.15) confidence += 20; // Stable APY (<15% variation)
      else if (apyVariation < 0.30) confidence += 15; // Moderate variation (<30%)
      else if (apyVariation < 0.50) confidence += 10; // High variation (<50%)
      else if (apyVariation < 0.75) confidence += 5; // Very high variation
      else confidence -= 5; // Extreme volatility (>75% variation)
      
      // Bonus for reasonable APY levels
      if (currentApy > 0 && currentApy < 25) confidence += 5; // Sustainable yields
      else if (currentApy >= 25 && currentApy < 50) confidence += 2; // High but possible
      else if (currentApy >= 50) confidence -= 8; // Potentially unsustainable
    } else {
      confidence -= 10; // Penalty for missing historical data
    }

    // 2. Total Value Locked Health (0-20 points)
    const tvl = parseFloat(pool.tvl || "0");
    if (tvl >= 500000000) confidence += 20; // >$500M TVL: institutional grade
    else if (tvl >= 100000000) confidence += 18; // >$100M TVL: very stable
    else if (tvl >= 50000000) confidence += 15; // >$50M TVL: stable
    else if (tvl >= 10000000) confidence += 12; // >$10M TVL: moderate
    else if (tvl >= 1000000) confidence += 8; // >$1M TVL: small but viable
    else if (tvl >= 100000) confidence += 4; // >$100K TVL: risky
    else confidence -= 5; // <$100K TVL: very risky

    // 3. Platform Maturity & Operating History (0-20 points)
    const operatingDays = (pool.rawData as any)?.count || 0;
    const platformName = pool.platform?.displayName?.toLowerCase() || "";
    
    // Platform reputation scoring
    let platformScore = 0;
    if (["aave", "compound", "morpho", "lido", "maker", "uniswap"].includes(platformName)) {
      platformScore = 10; // Blue chip protocols
    } else if (["curve", "convex", "yearn", "balancer"].includes(platformName)) {
      platformScore = 8; // Established DeFi protocols
    } else if (operatingDays > 365) {
      platformScore = 6; // Unknown but mature
    } else {
      platformScore = 2; // New or unknown protocol
    }
    
    // Operating history scoring
    if (operatingDays > 730) confidence += (10 + platformScore); // >2 years: battle-tested
    else if (operatingDays > 365) confidence += (8 + platformScore); // >1 year: mature
    else if (operatingDays > 180) confidence += (6 + Math.floor(platformScore/2)); // >6 months: established
    else if (operatingDays > 90) confidence += (4 + Math.floor(platformScore/2)); // >3 months: growing
    else if (operatingDays > 30) confidence += 2; // >1 month: new
    else confidence -= 5; // <1 month: unproven

    // 4. Market Volatility & Risk Assessment (0-15 points)
    const volatility = (pool.rawData as any)?.sigma || 0;
    if (volatility < 0.02) confidence += 15; // Very low volatility
    else if (volatility < 0.05) confidence += 12; // Low volatility
    else if (volatility < 0.10) confidence += 8; // Moderate volatility
    else if (volatility < 0.20) confidence += 4; // High volatility
    else if (volatility < 0.40) confidence -= 2; // Very high volatility
    else confidence -= 8; // Extreme volatility

    // Risk level adjustment
    switch (pool.riskLevel?.toLowerCase()) {
      case 'low': confidence += 8; break;
      case 'medium': confidence += 4; break;
      case 'high': confidence -= 4; break;
      case 'extreme': confidence -= 12; break;
    }

    // 5. Social Sentiment & Market Position (0-10 points)
    // Simulated social sentiment based on platform reputation and performance
    let sentimentScore = 0;
    
    // Platform social sentiment (simplified scoring)
    if (["aave", "lido", "morpho"].includes(platformName)) {
      sentimentScore += 4; // Strong community trust
    } else if (["compound", "maker", "uniswap"].includes(platformName)) {
      sentimentScore += 3; // Established reputation
    } else {
      sentimentScore += 1; // Unknown sentiment
    }
    
    // Performance-based sentiment
    if (currentApy > 0 && apy30d && currentApy >= apy30d * 0.9) {
      sentimentScore += 3; // Maintaining yields = positive sentiment
    } else if (currentApy > 0 && apy30d && currentApy < apy30d * 0.7) {
      sentimentScore -= 2; // Declining yields = negative sentiment
    }
    
    // TVL growth indicates positive sentiment
    if (tvl > 10000000) {
      sentimentScore += 3; // Large TVL suggests community confidence
    }
    
    confidence += Math.min(10, sentimentScore);

    // 6. Data Quality & Completeness (0-10 points)
    let dataQualityScore = 0;
    if ((pool.rawData as any)?.count) dataQualityScore += 2;
    if ((pool.rawData as any)?.apyMean30d) dataQualityScore += 2;
    if ((pool.rawData as any)?.sigma) dataQualityScore += 2;
    if ((pool.rawData as any)?.volumeUsd7d) dataQualityScore += 2;
    if (pool.tvl && parseFloat(pool.tvl) > 0) dataQualityScore += 2;
    
    confidence += dataQualityScore;

    // Ensure confidence is between 1-100
    return Math.max(1, Math.min(100, Math.round(confidence)));
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

**DATA INPUTS TO ANALYZE:**

${globalMarketContext}

**Required Analysis Framework:**
- Market sentiment from DeFi angle (protocol adoption, TVL flows, user activity)
- ETH price and recent trends (impact on gas costs and yield sustainability)
- Market cap and flows of major stablecoins (USDC, USDT, DAI liquidity health)
- Relevant economic news (Fed policy, rate moves, macro shifts affecting crypto)
- Vault's historical and current APY performance patterns

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