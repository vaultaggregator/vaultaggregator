import { Router } from "express";
import OpenAI from "openai";
import { IStorage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface InvestmentRequest {
  amount: number;
  duration: number;
  expectedReturn: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  strategy: string;
}

interface RecommendedPool {
  id: string;
  tokenPair: string;
  apy: string;
  tvl: string;
  platform: { displayName: string };
  chain: { displayName: string };
  riskLevel: string;
  allocation: number;
  reason: string;
  projectedReturn: number;
}

interface InvestmentResponse {
  summary: string;
  totalProjectedReturn: number;
  riskAssessment: string;
  recommendations: RecommendedPool[];
  timeline: {
    timeframe: string;
    expectedValue: number;
    description: string;
  }[];
  warnings: string[];
  confidence: number;
}

export function createInvestmentRoutes(storage: IStorage): Router {
  const router = Router();

  router.post("/analyze", async (req, res) => {
    try {
      const { amount, duration, expectedReturn, riskTolerance, strategy }: InvestmentRequest = req.body;

      if (!amount || !duration || !expectedReturn || !riskTolerance || !strategy) {
        return res.status(400).json({ error: "All investment parameters are required" });
      }

      // Get available pools for analysis
      const pools = await storage.getPools({ 
        limit: 100, 
        offset: 0,
        onlyVisible: true 
      });

      if (pools.length === 0) {
        return res.status(400).json({ error: "No pools available for analysis" });
      }

      // Filter pools based on risk tolerance
      const filteredPools = pools.filter((pool: any) => {
        const poolRisk = pool.riskLevel?.toLowerCase();
        const apy = parseFloat(pool.apy || "0");
        
        switch (riskTolerance) {
          case "conservative":
            return (poolRisk === "low" || poolRisk === "medium") && apy <= 15;
          case "moderate":
            return poolRisk !== "extreme" && apy <= 30;
          case "aggressive":
            return apy > 0; // All pools allowed for aggressive strategy
          default:
            return true;
        }
      });

      // Prepare comprehensive pool data for AI analysis
      const poolData = filteredPools.map((pool: any) => ({
        id: pool.id,
        tokenPair: pool.tokenPair,
        apy: pool.apy,
        tvl: pool.tvl,
        platform: pool.platform?.displayName || "Unknown",
        chain: pool.chain?.displayName || "Unknown",
        riskLevel: pool.riskLevel,
        operatingDays: (pool.rawData as any)?.count || 0,
        volatility: (pool.rawData as any)?.sigma || 0,
        volume: (pool.rawData as any)?.volumeUsd7d || 0
      }));

      const systemPrompt = `You are an expert DeFi investment advisor with deep knowledge of yield farming, risk management, and portfolio optimization.

**Available Pools for Analysis:**
${poolData.map(pool => 
  `ID: ${pool.id} | ${pool.tokenPair} | ${pool.apy}% APY | ${pool.platform} (${pool.chain}) | ${pool.riskLevel} risk | TVL: ${pool.tvl} | Days: ${pool.operatingDays}`
).join("\n")}

**Your Task:**
Create a comprehensive investment strategy that allocates the user's funds across the most suitable pools based on their preferences.

**Requirements:**
1. **Pool Selection**: Choose 2-5 pools that best match the user's risk tolerance and expected returns
2. **Allocation Strategy**: Distribute the investment amount strategically across selected pools
3. **Risk Assessment**: Provide detailed risk analysis and warnings
4. **Timeline Projections**: Create realistic timeline with expected values
5. **Educational Content**: Explain your reasoning clearly

**Response Format:**
Respond with JSON in this exact structure:
{
  "summary": "2-3 paragraph strategy explanation with specific reasoning",
  "totalProjectedReturn": number,
  "riskAssessment": "Detailed risk analysis paragraph",
  "recommendations": [
    {
      "id": "pool-id",
      "tokenPair": "token pair",
      "apy": "apy rate",
      "tvl": "tvl amount", 
      "platform": {"displayName": "platform name"},
      "chain": {"displayName": "chain name"},
      "riskLevel": "risk level",
      "allocation": number (percentage),
      "reason": "specific reason for choosing this pool",
      "projectedReturn": number (dollar amount)
    }
  ],
  "timeline": [
    {
      "timeframe": "3 months",
      "expectedValue": number,
      "description": "what to expect"
    }
  ],
  "warnings": ["important risk warning", "market consideration"],
  "confidence": number (1-100)
}

**Key Guidelines:**
- Allocations must total 100%
- Be realistic with projections considering DeFi volatility
- Include specific warnings about impermanent loss, smart contract risks, etc.
- Reference actual pool data in your analysis
- Confidence should reflect market uncertainty and strategy complexity`;

      const userPrompt = `**Investment Parameters:**
- Amount: $${amount.toLocaleString()}
- Duration: ${duration} months
- Expected Annual Return: ${expectedReturn}%
- Risk Tolerance: ${riskTolerance}
- Strategy: "${strategy}"

**Analysis Required:**
Create a detailed investment strategy that:
1. Selects the best pools from the available options
2. Allocates funds strategically based on risk tolerance
3. Provides realistic return projections
4. Includes comprehensive risk assessment
5. Creates timeline with milestone expectations

**Special Considerations:**
- ${riskTolerance === "conservative" ? "Focus on established protocols with low volatility and proven track records" : ""}
- ${riskTolerance === "moderate" ? "Balance yield potential with reasonable risk management" : ""}
- ${riskTolerance === "aggressive" ? "Maximize yield potential while acknowledging higher risks" : ""}
- Consider the ${duration}-month timeframe for compound growth calculations
- Account for DeFi market volatility and potential risks`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
        max_tokens: 2000
      });

      const aiResult = JSON.parse(response.choices[0].message.content || "{}");

      // Validate and process the AI response
      if (!aiResult.recommendations || !Array.isArray(aiResult.recommendations)) {
        throw new Error("Invalid AI response: missing recommendations");
      }

      // Ensure all recommended pools exist in our database
      const validRecommendations = aiResult.recommendations.filter((rec: any) => 
        poolData.some(pool => pool.id === rec.id)
      );

      if (validRecommendations.length === 0) {
        throw new Error("No valid pool recommendations generated");
      }

      // Calculate total projected return based on allocations
      const totalProjectedReturn = validRecommendations.reduce((total: number, rec: any) => {
        const allocation = (amount * rec.allocation) / 100;
        const annualReturn = allocation * (parseFloat(rec.apy) / 100);
        const periodReturn = (annualReturn * duration) / 12;
        return total + allocation + periodReturn;
      }, 0);

      const result: InvestmentResponse = {
        summary: aiResult.summary || "Investment strategy generated based on your parameters.",
        totalProjectedReturn: Math.round(totalProjectedReturn),
        riskAssessment: aiResult.riskAssessment || "Standard DeFi risks apply.",
        recommendations: validRecommendations.map((rec: any) => ({
          ...rec,
          projectedReturn: Math.round(((amount * rec.allocation) / 100) * (1 + (parseFloat(rec.apy) / 100) * (duration / 12)))
        })),
        timeline: aiResult.timeline || [
          {
            timeframe: `${duration} months`,
            expectedValue: Math.round(totalProjectedReturn),
            description: "Final expected portfolio value"
          }
        ],
        warnings: aiResult.warnings || ["DeFi investments carry inherent risks including smart contract vulnerabilities and market volatility."],
        confidence: Math.min(95, Math.max(60, aiResult.confidence || 75))
      };

      res.json(result);

    } catch (error) {
      console.error("Investment analysis error:", error);
      res.status(500).json({ 
        error: "Failed to generate investment strategy. Please try again." 
      });
    }
  });

  return router;
}