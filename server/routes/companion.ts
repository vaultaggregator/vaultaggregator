import { Router } from "express";
import OpenAI from "openai";
import { IStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ChatRequest {
  message: string;
  context?: {
    availablePools: number;
    totalTvl: number;
    activePools: number;
  };
}

interface CompanionResponse {
  message: string;
  insights?: string[];
  recommendedPools?: Array<{
    id: string;
    tokenPair: string;
    apy: string;
    tvl: string;
    platform: string;
    reason: string;
  }>;
  marketTip?: string;
}

export function createCompanionRoutes(storage: IStorage): Router {
  const router = Router();

  router.post("/chat", async (req, res) => {
    try {
      const { message, context }: ChatRequest = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get current pools data for context
      const pools = await storage.getPools({ 
        limit: 50, 
        offset: 0,
        isVisible: true 
      });

      // Prepare market context
      const marketContext = {
        totalPools: pools.length,
        avgApy: pools.reduce((sum: number, pool: any) => sum + parseFloat(pool.apy || "0"), 0) / pools.length,
        topPools: pools
          .sort((a: any, b: any) => parseFloat(b.apy || "0") - parseFloat(a.apy || "0"))
          .slice(0, 5)
          .map((pool: any) => ({
            tokenPair: pool.tokenPair,
            apy: pool.apy,
            tvl: pool.tvl,
            platform: pool.platform?.displayName || "Unknown",
            riskLevel: pool.riskLevel,
          })),
        platforms: Array.from(new Set(pools.map((p: any) => p.platform?.displayName).filter(Boolean))),
        chains: Array.from(new Set(pools.map((p: any) => p.chain?.displayName).filter(Boolean))),
      };

      // Create AI prompt for witty, personalized responses
      const prompt = `
You are a witty, knowledgeable DeFi companion chatbot helping users with yield farming and crypto investments.

**Your Personality:**
- Witty and engaging, but never at the expense of accuracy
- Use occasional crypto slang and emojis appropriately
- Provide actionable insights, not just generic advice
- Be encouraging but realistic about risks
- Make complex concepts accessible

**Current Market Data:**
- Available pools: ${marketContext.totalPools}
- Average APY: ${marketContext.avgApy.toFixed(2)}%
- Top platforms: ${marketContext.platforms.join(", ")}
- Active chains: ${marketContext.chains.join(", ")}

**Top Performing Pools:**
${marketContext.topPools.map((pool: any) => 
  `• ${pool.tokenPair}: ${pool.apy}% APY on ${pool.platform} (${pool.riskLevel} risk)`
).join("\n")}

**User Message:** "${message}"

**Response Guidelines:**
1. Address the user's specific question with relevant data
2. Include 2-3 witty but informative insights
3. Recommend specific pools when appropriate (max 3)
4. Add a practical market tip
5. Keep responses conversational and under 200 words

Respond with JSON in this format:
{
  "message": "Your main witty response here",
  "insights": ["insight1", "insight2", "insight3"],
  "recommendedPools": [
    {
      "id": "pool-id",
      "tokenPair": "TOKEN-PAIR", 
      "apy": "X.XX",
      "tvl": "formatted-tvl",
      "platform": "Platform Name",
      "reason": "Why this pool fits their request"
    }
  ],
  "marketTip": "Practical tip for the current market"
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a witty DeFi companion providing personalized yield farming advice. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 800,
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || "{}");

      // Enhance recommended pools with real data
      if (aiResponse.recommendedPools) {
        aiResponse.recommendedPools = aiResponse.recommendedPools.map((rec: any) => {
          const realPool = pools.find((p: any) => 
            p.tokenPair.toLowerCase().includes(rec.tokenPair.toLowerCase()) ||
            p.platform?.displayName.toLowerCase() === rec.platform.toLowerCase()
          );
          
          if (realPool) {
            return {
              id: realPool.id,
              tokenPair: realPool.tokenPair,
              apy: realPool.apy || "0",
              tvl: formatTvl(realPool.tvl || "0"),
              platform: realPool.platform?.displayName || "Unknown",
              reason: rec.reason || "Matches your criteria"
            };
          }
          return rec;
        }).filter(Boolean);
      }

      const companionResponse: CompanionResponse = {
        message: aiResponse.message || "I'm having trouble processing that request. Could you try rephrasing?",
        insights: aiResponse.insights || [],
        recommendedPools: aiResponse.recommendedPools || [],
        marketTip: aiResponse.marketTip || "Always DYOR (Do Your Own Research) before investing!"
      };

      res.json(companionResponse);

    } catch (error) {
      console.error("Companion chat error:", error);
      res.status(500).json({ 
        error: "My circuits are a bit fried right now. Try again in a moment!" 
      });
    }
  });

  return router;
}

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