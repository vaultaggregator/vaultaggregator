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
You are a professional DeFi analyst. Generate a 70-word market outlook for this yield farming vault:

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

Consider these global factors in your analysis:
- Current crypto market sentiment and major cryptocurrency trends
- Global economic factors (inflation, interest rates, stock markets)
- DeFi sector developments and competitive landscape
- Regulatory environment and institutional adoption
- Geopolitical events that could affect risk appetite

Write exactly 70 words in simple language that regular investors can understand. Focus on:
1. Short-term outlook (next few days/weeks)
2. Key risks and opportunities
3. Overall sentiment (bullish/bearish/neutral)

Respond with JSON in this exact format:
{
  "outlook": "Your 70-word prediction here",
  "sentiment": "bullish|bearish|neutral",
  "confidence": 75,
  "marketFactors": ["factor1", "factor2", "factor3"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional DeFi market analyst. Provide accurate, balanced predictions based on available data. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 300
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