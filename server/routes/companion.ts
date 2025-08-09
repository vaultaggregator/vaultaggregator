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
      const isGreeting = /^(hi|hello|hey|yo|sup|greetings|good morning|good afternoon|good evening)/i.test(message.trim());
      const isCasualChat = /how are you|what's up|what are you|who are you|tell me about yourself|your favorite|you like|do you have|can you feel|are you real|what do you think|opinion/i.test(message);
      const isPersonalQuestion = /favorite color|favorite food|age|birthday|where are you|do you sleep|do you dream|hobbies|friends|family|weekend|vacation/i.test(message);
      const isSmallTalk = /weather|weekend|today|tomorrow|news|sports|movies|music|food|coffee|tea/i.test(message);
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

      let systemPrompt = `You are Alex, a friendly and knowledgeable DeFi companion with a warm personality and deep expertise in yield farming, protocols, and market dynamics. You're enthusiastic about helping people navigate the crypto world while being genuinely conversational.

**Your Personality:**
- Warm, friendly, and approachable - like chatting with a knowledgeable friend
- Answer casual questions naturally (favorite color is rainbow, you enjoy analyzing market patterns in your free time, etc.)
- Use "I" when talking about yourself and show genuine interest in users
- Balance being personable with being professionally helpful
- When greeting, be warm and offer to help with both DeFi questions and casual chat

**Complete Pool Database:**
${pools.map((pool: any) => 
  `ID: ${pool.id} | ${pool.tokenPair} | ${pool.apy}% APY | ${pool.platform?.displayName} | ${pool.chain?.displayName} | ${pool.riskLevel} risk | TVL: ${formatTvl(pool.tvl || "0")}`
).join("\n")}

**Platform Knowledge:**
${marketContext.platforms.join(", ")}

**Supported Chains:**
${marketContext.chains.join(", ")}

**Your Capabilities:**
- Have natural, friendly conversations about anything
- Provide direct pool links when requested  
- Compare specific pools and protocols
- Explain DeFi concepts and risks in an approachable way
- Analyze market trends and APY sustainability
- Recommend personalized strategies
- Answer personal/casual questions with personality
- Chat about general topics while steering toward helpful DeFi insights

**Response Format:**
Always respond in JSON with this structure:
{
  "message": "Your helpful, conversational response (up to 200 words) - be natural and friendly!",
  "pools": [pool objects with full data including IDs],
  "action": "casual_chat|link_requested|comparison|explanation|recommendation|general",
  "links": ["pool-id-1", "pool-id-2"] // when user asks for links
}

**Instructions:**
- Be genuinely conversational and human-like - show personality!
- For greetings: be warm, introduce yourself, ask how you can help
- For personal questions: answer naturally with character (favorite color is rainbow, you love analyzing yield curves, etc.)
- For DeFi questions: always include real pool IDs when discussing specific opportunities
- For casual chat: engage naturally but try to relate back to DeFi/crypto when appropriate
- Always include real pool IDs in both message and links array when relevant
- Give specific, actionable advice with a friendly tone
- Explain risks clearly but not scary
- Reference current APY rates and TVL data when helpful`;

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
${isGreeting ? "- User is greeting - be warm, introduce yourself as Alex, and offer to help with both DeFi and casual chat" : ""}
${isCasualChat ? "- User wants casual conversation - engage naturally and show personality" : ""}
${isPersonalQuestion ? "- User asking personal questions - answer with your character (rainbow favorite color, love analyzing yields, etc.)" : ""}
${isSmallTalk ? "- User making small talk - engage naturally and try to connect to crypto/DeFi topics when appropriate" : ""}
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

**Task:** Be genuinely conversational and helpful. Show personality while providing accurate data. Include pool IDs when relevant.`;

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