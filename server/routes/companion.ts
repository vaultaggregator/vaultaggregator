import { Router } from "express";
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

      // Enhanced user intent analysis
      const isGreeting = /^(hi|hello|hey|yo|sup|greetings)/i.test(message.trim());
      const asksForPools = /pool|yield|apy|return|invest|earn|farm|opportunity/i.test(message);
      const asksForHighYield = /high|best|top|maximum|highest|premium/i.test(message);
      const asksForLowRisk = /safe|low.?risk|stable|secure|conservative|protect/i.test(message);
      const asksForStablecoin = /stable|usdc|usdt|dai|stablecoin/i.test(message);
      const asksForLink = /link|url|visit|go to|open|navigate|direct/i.test(message);
      const asksForSpecificToken = pools.some((p: any) => 
        message.toLowerCase().includes(p.tokenPair.toLowerCase()) ||
        p.tokenPair.split('-').some((token: string) => message.toLowerCase().includes(token.toLowerCase()))
      );
      const asksForPlatform = /platform|protocol|morpho|lido|aave|compound|uniswap|curve/i.test(message);
      const asksForChain = /ethereum|polygon|arbitrum|base|chain|network/i.test(message);
      const asksForComparison = /compare|vs|versus|difference|better|worse/i.test(message);
      const asksForExplanation = /what|how|why|explain|tell me|describe/i.test(message);

      // Find specific pools that match user queries
      const findMatchingPools = (criteria: any) => {
        return pools.filter((pool: any) => {
          if (criteria.token) {
            return pool.tokenPair.toLowerCase().includes(criteria.token.toLowerCase());
          }
          if (criteria.platform) {
            return pool.platform?.displayName.toLowerCase().includes(criteria.platform.toLowerCase());
          }
          if (criteria.chain) {
            return pool.chain?.displayName.toLowerCase().includes(criteria.chain.toLowerCase());
          }
          if (criteria.highYield) {
            return parseFloat(pool.apy || "0") > 8;
          }
          if (criteria.lowRisk) {
            return pool.riskLevel === 'low' || pool.riskLevel === 'medium';
          }
          if (criteria.stablecoin) {
            return /usdc|usdt|dai|stable/i.test(pool.tokenPair);
          }
          return true;
        }).slice(0, 3);
      };

      let systemPrompt = `You are an expert DeFi companion with deep knowledge of yield farming, protocols, and market dynamics.

**Complete Pool Database:**
${pools.map((pool: any) => 
  `ID: ${pool.id} | ${pool.tokenPair} | ${pool.apy}% APY | ${pool.platform?.displayName} | ${pool.chain?.displayName} | ${pool.riskLevel} risk | TVL: ${formatTvl(pool.tvl || "0")}`
).join("\n")}

**Platform Knowledge:**
${marketContext.platforms.join(", ")}

**Supported Chains:**
${marketContext.chains.join(", ")}

**Your Capabilities:**
- Provide direct pool links when requested
- Compare specific pools and protocols
- Explain DeFi concepts and risks
- Analyze market trends and APY sustainability
- Recommend personalized strategies
- Answer technical questions about yield farming

**Response Format:**
Always respond in JSON with this structure:
{
  "message": "Your helpful, knowledgeable response (up to 200 words)",
  "pools": [pool objects with full data including IDs],
  "action": "link_requested|comparison|explanation|recommendation|general",
  "links": ["pool-id-1", "pool-id-2"] // when user asks for links
}

**Instructions:**
- Be conversational but authoritative
- Always include real pool IDs when discussing specific opportunities
- For link requests, provide the pool IDs in both message and links array
- Give specific, actionable advice
- Explain risks clearly
- Reference current APY rates and TVL data`;

      // Generate enhanced context based on user intent
      let contextualInfo = "";
      
      if (asksForSpecificToken) {
        const tokenPools = findMatchingPools({ token: message });
        contextualInfo += `\nToken-specific pools found: ${tokenPools.length}`;
      }
      
      if (asksForPlatform) {
        const platformMatch = marketContext.platforms.find(p => 
          message.toLowerCase().includes(p.toLowerCase())
        );
        if (platformMatch) {
          const platformPools = findMatchingPools({ platform: platformMatch });
          contextualInfo += `\n${platformMatch} pools available: ${platformPools.length}`;
        }
      }

      let userPrompt = `User Query: "${message}"

**Context Analysis:**
${isGreeting ? "- User is greeting - be welcoming and showcase your capabilities" : ""}
${asksForLink ? "- User wants direct links to pools - provide pool IDs and mention links" : ""}
${asksForHighYield ? "- User wants high yield opportunities - recommend top APY pools with warnings" : ""}
${asksForLowRisk ? "- User wants low-risk options - recommend established, safe pools" : ""}
${asksForStablecoin ? "- User wants stablecoin opportunities - find stable pair pools" : ""}
${asksForComparison ? "- User wants to compare options - provide detailed comparison" : ""}
${asksForExplanation ? "- User wants explanations - provide educational content" : ""}
${asksForSpecificToken ? "- User mentioned specific tokens - focus on those pools" : ""}
${asksForPlatform ? "- User interested in specific platforms - highlight those protocols" : ""}
${asksForChain ? "- User asking about blockchains - explain chain-specific benefits" : ""}
${contextualInfo}

**Task:** Provide a helpful, accurate response with real data. Include pool IDs when relevant.`;

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

      // Enhanced response processing
      const processedResponse = {
        message: aiResponse.message || "I'm having trouble processing that request. Could you try rephrasing?",
        pools: aiResponse.pools || [],
        action: aiResponse.action || "general",
        links: aiResponse.links || []
      };

      // Return the enhanced response
      res.json(processedResponse);

    } catch (error) {
      console.error("Companion chat error:", error);
      res.status(500).json({ 
        error: "My circuits are a bit fried right now. Try again in a moment!" 
      });
    }
  });

  return router;
}