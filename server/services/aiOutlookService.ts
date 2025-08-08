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
   * Calculate dynamic confidence score based on market data
   * Factors: TVL stability, volatility, APY history, data availability, market conditions
   */
  private calculateConfidenceScore(pool: any): number {
    let confidence = 50; // Base confidence

    // 1. TVL Stability Factor (0-25 points)
    const tvl = parseFloat(pool.tvl || "0");
    if (tvl > 100000000) confidence += 25; // >$100M TVL: very stable
    else if (tvl > 10000000) confidence += 20; // >$10M TVL: stable  
    else if (tvl > 1000000) confidence += 15; // >$1M TVL: moderate
    else if (tvl > 100000) confidence += 10; // >$100K TVL: low
    else confidence += 5; // <$100K TVL: very low

    // 2. Volatility Factor (-15 to +15 points)
    const volatility = (pool.rawData as any)?.sigma || 0;
    if (volatility < 0.05) confidence += 15; // Low volatility: predictable
    else if (volatility < 0.1) confidence += 10; // Moderate volatility
    else if (volatility < 0.2) confidence += 5; // High volatility
    else if (volatility < 0.4) confidence -= 5; // Very high volatility
    else confidence -= 15; // Extreme volatility: unpredictable

    // 3. APY History Factor (0-20 points)
    const currentApy = parseFloat(pool.apy || "0");
    const apy30d = (pool.rawData as any)?.apyMean30d;
    if (apy30d && currentApy > 0) {
      const apyStability = Math.abs(currentApy - apy30d) / currentApy;
      if (apyStability < 0.1) confidence += 20; // Very stable APY
      else if (apyStability < 0.2) confidence += 15; // Stable APY
      else if (apyStability < 0.4) confidence += 10; // Moderate APY variation
      else if (apyStability < 0.6) confidence += 5; // High APY variation
      else confidence -= 5; // Extreme APY variation
    }

    // 4. Data Quality Factor (0-15 points)
    let dataPoints = 0;
    if ((pool.rawData as any)?.count) dataPoints++; // Operating days
    if ((pool.rawData as any)?.apyMean30d) dataPoints++; // 30d APY
    if ((pool.rawData as any)?.sigma) dataPoints++; // Volatility
    if ((pool.rawData as any)?.volumeUsd7d) dataPoints++; // Volume
    if ((pool.rawData as any)?.apyPct7D) dataPoints++; // 7d trend
    confidence += dataPoints * 3; // 3 points per data metric

    // 5. Risk Level Factor (-10 to +10 points)
    switch (pool.riskLevel?.toLowerCase()) {
      case 'low': confidence += 10; break;
      case 'medium': confidence += 5; break;
      case 'high': confidence -= 5; break;
      case 'extreme': confidence -= 10; break;
    }

    // 6. Platform Maturity Factor (0-10 points)
    const operatingDays = (pool.rawData as any)?.count || 0;
    if (operatingDays > 365) confidence += 10; // >1 year: mature
    else if (operatingDays > 180) confidence += 8; // >6 months: established
    else if (operatingDays > 90) confidence += 6; // >3 months: growing
    else if (operatingDays > 30) confidence += 4; // >1 month: new
    else confidence += 2; // <1 month: very new

    // 7. APY Reasonableness Factor (-5 to +5 points)
    if (currentApy > 0) {
      if (currentApy < 50) confidence += 5; // Reasonable APY
      else if (currentApy < 100) confidence += 2; // High but possible
      else if (currentApy < 200) confidence -= 2; // Very high APY
      else confidence -= 5; // Unreasonably high APY
    }

    // Ensure confidence is between 1-100
    return Math.max(1, Math.min(100, Math.round(confidence)));
  }

  private async getCurrentMarketContext(): Promise<string> {
    try {
      // This would be where we'd integrate real-time market data APIs
      // For now, we'll provide comprehensive market context based on current conditions
      const marketContext = `
Current Global Context:
- Federal Reserve policy: Interest rates affecting DeFi yields and institutional adoption
- Geopolitical tensions: Eastern Europe conflict impacting global risk appetite and crypto flows
- Regulatory landscape: SEC enforcement actions and upcoming legislation affecting DeFi protocols
- Institutional adoption: Major banks and corporations entering crypto markets
- Macroeconomic factors: Inflation data, employment figures, and traditional market volatility
- Regional developments: Asian market dynamics, European regulatory changes, and emerging market trends
- Tech sector performance: AI boom affecting crypto valuations and venture capital flows
- Energy markets: Crypto mining costs and sustainability concerns affecting network security
- Political climate: Election cycles, policy uncertainty, and government crypto initiatives
- Market sentiment: Fear & Greed Index, social media trends, and institutional investor positioning
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

**COMPREHENSIVE ANALYSIS FRAMEWORK:**

${globalMarketContext}

**Protocol-Specific Data Analysis:**
- DeFi lending rates (Aave/Morpho/Compound) and utilization trends
- Cross-chain yield competition and capital migration patterns
- Smart contract security audits and exploit risk assessments
- Regulatory compliance and upcoming legal challenges
- Institutional vs retail investor flow patterns
- Market maker activity and liquidity provision dynamics

**Geopolitical & Macroeconomic Factors:**
- Central bank policies and interest rate decisions impacting yield expectations
- International sanctions affecting crypto adoption and trading volumes
- War and conflict zones creating flight-to-safety or risk-on behavior
- Energy crises affecting mining costs and network sustainability
- Political elections and regulatory uncertainty in major markets
- Trade wars and currency devaluation impacting global liquidity flows

**Required Output (185 words exactly):**
1. **Short-term APY prediction** (next 2-4 weeks) with specific percentage and detailed reasoning
2. **Long-term APY forecast** (1-3 months) with specific percentage and market-driven rationale
3. **Geopolitical impact analysis** - how current wars, politics, and macro events affect this specific yield opportunity
4. **Institutional flow predictions** - where smart money is moving and why
5. **Risk assessment** - what could go catastrophically wrong (be savage and honest)
6. **Competitive landscape** - how this vault stacks against alternatives
7. **Regulatory threats** - upcoming legal risks that could crush yields
8. **Market manipulation concerns** - whales, bots, and institutional games

**Tone Requirements:**
- Savage, direct, no-bullshit analysis that impresses sophisticated investors
- Use "you," brief phrases, specific numbers, and insider-level insights
- Include concrete percentages, precise dates, and market-moving events
- Be controversial when data supports it - institutional investors want edge, not safe takes
- Reference specific geopolitical events, Fed policies, and macro trends
- Call out obvious market manipulation and yield farming ponzinomics when relevant

**IMPORTANT: Use the calculated confidence of ${calculatedConfidence}% in your response (not any other number).**

Respond with JSON in this exact format:
{
  "outlook": "Your savage 185-word analysis with specific APY predictions, geopolitical insights, and institutional-grade market intelligence here",
  "sentiment": "bullish|bearish|neutral", 
  "confidence": ${calculatedConfidence},
  "marketFactors": ["factor1", "factor2", "factor3", "factor4", "factor5", "factor6"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an elite institutional DeFi analyst with insider access to geopolitical intelligence, central bank policies, and whale wallet movements. Provide savage, no-bullshit analysis that impresses sophisticated investors. Include specific APY predictions with exact percentages, reference current wars/politics/macro events, and call out market manipulation when you see it. Always respond with valid JSON and exactly 185 words of institutional-grade intelligence."
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