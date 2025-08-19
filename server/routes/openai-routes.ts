import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available models with capabilities
const AVAILABLE_MODELS = [
  { id: "gpt-4o", name: "GPT-4o (Latest)", description: "Most capable model with vision, code, and reasoning", maxTokens: 4096 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Faster and more cost-effective", maxTokens: 16384 },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "High performance with large context", maxTokens: 4096 },
  { id: "gpt-4", name: "GPT-4", description: "Reliable general purpose model", maxTokens: 8192 },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and efficient for most tasks", maxTokens: 4096 }
];

// System prompts for different use cases
const SYSTEM_PROMPTS = {
  default: "You are a helpful AI assistant for a DeFi yield aggregator platform. You can help with technical questions, data analysis, and general platform management tasks. Be concise and helpful.",
  defi_expert: "You are a DeFi expert assistant with deep knowledge of yield farming, liquidity protocols, smart contracts, and blockchain technology. Provide detailed technical analysis and recommendations for the yield aggregator platform.",
  data_analyst: "You are a data analyst specializing in DeFi metrics, APY calculations, TVL analysis, and market trends. Help analyze pool performance, user behavior, and platform optimization opportunities.",
  developer: "You are a senior full-stack developer assistant specializing in TypeScript, React, Node.js, PostgreSQL, and DeFi protocols. Provide technical guidance, code reviews, and architecture recommendations.",
  security_auditor: "You are a blockchain security expert focused on smart contract auditing, risk assessment, and DeFi protocol security. Analyze potential vulnerabilities and provide security recommendations."
};

// Advanced chat completions endpoint with streaming support
router.post("/openai/chat", async (req, res) => {
  try {
    const { 
      message, 
      conversationHistory = [], 
      model = "gpt-4o",
      systemPrompt = "default",
      temperature = 0.7,
      maxTokens = 2000,
      stream = false,
      includeContext = false
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    // Get system prompt
    const systemPromptContent = SYSTEM_PROMPTS[systemPrompt as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    // Add platform context if requested
    let contextualSystemPrompt = systemPromptContent;
    if (includeContext) {
      try {
        const { storage } = await import("../storage");
        const pools = await storage.getAllPools();
        const activePools = pools.filter(p => p.isVisible);
        
        contextualSystemPrompt += `\n\nCurrent Platform Context:
- Total active pools: ${activePools.length}
- Available pools: ${activePools.map(p => `${p.tokenPair} on ${p.platform.displayName} (APY: ${p.apy}%)`).join(", ")}
- Platform focus: Yield aggregation for STETH and STEAKUSDC pools
- Real-time data sync every 5 minutes`;
      } catch (error) {
        console.warn("Could not fetch platform context:", error);
      }
    }

    // Build conversation with system message and history
    const messages = [
      {
        role: "system" as const,
        content: contextualSystemPrompt
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message
      }
    ];

    console.log(`🤖 Processing OpenAI chat request: "${message.substring(0, 50)}..." (Model: ${model}, Temperature: ${temperature})`);

    if (stream) {
      // Streaming response
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      try {
        const completion = await openai.chat.completions.create({
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: temperature,
          stream: true,
        });

        let fullResponse = "";
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ content: "", done: true, fullResponse, usage: null })}\n\n`);
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: "Streaming failed", done: true })}\n\n`);
        res.end();
      }
    } else {
      // Regular response
      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        return res.status(500).json({ error: "No response from OpenAI" });
      }

      console.log(`✅ OpenAI response generated successfully`);

      res.json({
        message: response,
        usage: completion.usage,
        model: completion.model,
        systemPrompt: systemPrompt,
        temperature: temperature
      });
    }

  } catch (error) {
    console.error("Error with OpenAI API:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({ error: "Invalid OpenAI API key" });
      }
      if (error.message.includes('quota')) {
        return res.status(429).json({ error: "OpenAI API quota exceeded" });
      }
      if (error.message.includes('model')) {
        return res.status(400).json({ error: "Invalid model selected" });
      }
    }
    
    res.status(500).json({ error: "Failed to process chat request" });
  }
});

// Get available models endpoint
router.get("/openai/models", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    res.json({ 
      models: AVAILABLE_MODELS,
      systemPrompts: Object.keys(SYSTEM_PROMPTS).map(key => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: SYSTEM_PROMPTS[key as keyof typeof SYSTEM_PROMPTS].substring(0, 100) + "..."
      }))
    });
  } catch (error) {
    console.error("Error fetching OpenAI models:", error);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

// Test OpenAI connection endpoint
router.get("/openai/test", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        connected: false, 
        error: "OpenAI API key not configured" 
      });
    }

    // Simple test request
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello! Just testing the connection." }],
      max_tokens: 10,
    });

    res.json({
      connected: true,
      model: completion.model,
      message: "OpenAI API connection successful"
    });

  } catch (error) {
    console.error("OpenAI connection test failed:", error);
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Platform data analysis endpoint
router.post("/openai/analyze", async (req, res) => {
  try {
    const { analysisType, data } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    // Get current platform data for context
    const { storage } = await import("../storage");
    const pools = await storage.getAllPools();
    const activePools = pools.filter(p => p.isVisible);
    
    const platformData = {
      pools: activePools.map(p => ({
        name: p.tokenPair,
        platform: p.platform.displayName,
        apy: p.apy,
        tvl: p.tvl,
        risk: p.riskLevel,
        chain: p.chain.displayName
      })),
      totalTVL: activePools.reduce((sum, p) => sum + parseFloat(p.tvl || "0"), 0),
      averageAPY: activePools.reduce((sum, p) => sum + parseFloat(p.apy || "0"), 0) / activePools.length
    };

    let analysisPrompt = "";
    switch (analysisType) {
      case "performance":
        analysisPrompt = `Analyze the performance of our DeFi yield aggregator platform. Current data: ${JSON.stringify(platformData)}. Provide insights on APY trends, TVL distribution, and recommendations for optimization.`;
        break;
      case "risk":
        analysisPrompt = `Perform a risk analysis of our DeFi pools. Current data: ${JSON.stringify(platformData)}. Assess risk levels, diversification, and provide risk management recommendations.`;
        break;
      case "market":
        analysisPrompt = `Analyze market positioning and competitive advantages. Current data: ${JSON.stringify(platformData)}. Compare against market standards and suggest strategic improvements.`;
        break;
      default:
        analysisPrompt = `Analyze the provided data: ${JSON.stringify(data || platformData)}. Provide comprehensive insights and actionable recommendations.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a DeFi expert and data analyst. Provide detailed, actionable insights based on the platform data. Use specific numbers and metrics in your analysis."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more factual analysis
    });

    const analysis = completion.choices[0]?.message?.content;

    res.json({
      analysis,
      analysisType,
      timestamp: new Date().toISOString(),
      usage: completion.usage,
      dataAnalyzed: platformData
    });

  } catch (error) {
    console.error("Error with OpenAI analysis:", error);
    res.status(500).json({ error: "Failed to generate analysis" });
  }
});

// Export conversations endpoint
router.get("/openai/export", async (req, res) => {
  try {
    const { format = "json" } = req.query;
    
    // For now, return a template - in a full implementation, 
    // you would fetch from a conversations database
    const exportData = {
      platform: "Vault Aggregator DeFi Platform",
      exportDate: new Date().toISOString(),
      conversations: [],
      note: "Conversation persistence not yet implemented - this is a template for export functionality"
    };

    if (format === "json") {
      res.json(exportData);
    } else if (format === "csv") {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="chatgpt-conversations.csv"');
      res.send("timestamp,role,message,model,tokens\n# No conversations to export yet");
    } else {
      res.status(400).json({ error: "Unsupported export format" });
    }

  } catch (error) {
    console.error("Error exporting conversations:", error);
    res.status(500).json({ error: "Failed to export conversations" });
  }
});

export default router;