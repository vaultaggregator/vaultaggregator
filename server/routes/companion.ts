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
        onlyVisible: true 
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

      // Analyze user intent for better responses
      const isGreeting = /^(hi|hello|hey|yo|sup)/i.test(message.trim());
      const asksForPools = /pool|yield|apy|return|invest|earn|farm/i.test(message);
      const asksForHighYield = /high|best|top|maximum/i.test(message);
      const asksForLowRisk = /safe|low.?risk|stable|secure/i.test(message);
      const asksForStablecoin = /stable|usdc|usdt|dai|stablecoin/i.test(message);

      let systemPrompt = `You are a witty, knowledgeable DeFi companion chatbot. 

**Available Data:**
${marketContext.topPools.map((pool: any, idx: number) => 
  `Pool ${idx + 1}: ${pool.tokenPair} - ${pool.apy}% APY on ${pool.platform} (${pool.riskLevel} risk, TVL: ${formatTvl(pool.tvl || "0")})`
).join("\n")}

**Instructions:**
- Be conversational and specific to user's question
- For greetings, be welcoming and offer help
- For pool requests, recommend 1-3 specific pools with real data
- Include pool IDs from the available data when recommending
- Be witty but accurate
- Keep responses under 150 words

Respond in JSON format:
{
  "message": "conversational response",
  "pools": [{"id": "real-pool-id", "tokenPair": "name", "apy": "rate", "platform": {"displayName": "platform"}, "chain": {"displayName": "chain"}, "tvl": "amount", "riskLevel": "level"}]
}`;

      let userPrompt = `User asks: "${message}"

${isGreeting ? "User is greeting - be welcoming and explain how you can help." : ""}
${asksForHighYield ? "User wants high yield opportunities - recommend top APY pools." : ""}
${asksForLowRisk ? "User wants low-risk options - recommend stable, established pools." : ""}
${asksForStablecoin ? "User wants stablecoin opportunities - recommend pools with stablecoins." : ""}
${asksForPools ? "User asks about pools - provide specific recommendations with real data." : ""}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 600,
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || "{}");

      // Return the response with pools data that matches our floating chat interface
      res.json({
        message: aiResponse.message || "I'm having trouble processing that request. Could you try rephrasing?",
        pools: aiResponse.pools || []
      });

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