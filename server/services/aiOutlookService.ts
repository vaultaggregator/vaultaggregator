import OpenAI from "openai";
import { IStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
          volatility: pool.rawData?.sigma ? `${(pool.rawData.sigma * 100).toFixed(1)}%` : "N/A",
          trend: pool.rawData?.apyPct7D ? (pool.rawData.apyPct7D > 0 ? "increasing" : "decreasing") : "stable",
          volume: pool.rawData?.volumeUsd7d ? `$${pool.rawData.volumeUsd7d}` : "N/A"
        }
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

**Analysis Framework - Consider These Data Inputs:**
- Crypto market state: volatility, recent liquidations
- Aave/Morpho lending and borrowing rates, utilization trends
- Market sentiment (DeFi-focused indicators)
- Vault's historical APY trends and patterns

**Required Output (125 words exactly):**
1. **Short-term APY estimate** (next 2-4 weeks) with specific percentage and reasoning
2. **Long-term APY estimate** (1-3 months) with specific percentage and reasoning  
3. Market analysis including volatility, utilization, sentiment factors
4. Use direct, actionable language with "you"
5. Include specific numbers and data patterns
6. No fluff - be concise and data-driven

**Tone Requirements:**
- Direct and actionable
- Use "you," brief phrases
- Include concrete percentages and trends
- Example format: "Short-term: 3.8% APY, stable. Volatility low, borrowing up 5%. Long-term: 4.2% APY, rising. Utilization growth, sentiment improving."

Respond with JSON in this exact format:
{
  "outlook": "Your 125-word analysis with APY predictions here",
  "sentiment": "bullish|bearish|neutral", 
  "confidence": 75,
  "marketFactors": ["factor1", "factor2", "factor3", "factor4"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional DeFi market analyst specializing in APY predictions. Provide specific, actionable predictions with concrete percentages based on market data patterns. Always respond with valid JSON and exactly 125 words."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate response
      if (!result.outlook || !result.sentiment || !result.confidence) {
        throw new Error("Invalid AI response format");
      }

      return {
        outlook: result.outlook,
        sentiment: result.sentiment,
        confidence: Math.max(1, Math.min(100, result.confidence)),
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