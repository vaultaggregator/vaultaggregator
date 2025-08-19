import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat completions endpoint
router.post("/openai/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    // Build conversation with system message and history
    const messages = [
      {
        role: "system" as const,
        content: "You are a helpful AI assistant for a DeFi yield aggregator platform. You can help with technical questions, data analysis, and general platform management tasks. Be concise and helpful."
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message
      }
    ];

    console.log(`🤖 Processing OpenAI chat request: "${message.substring(0, 50)}..."`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return res.status(500).json({ error: "No response from OpenAI" });
    }

    console.log(`✅ OpenAI response generated successfully`);

    res.json({
      message: response,
      usage: completion.usage,
      model: completion.model
    });

  } catch (error) {
    console.error("Error with OpenAI API:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({ error: "Invalid OpenAI API key" });
      }
      if (error.message.includes('quota')) {
        return res.status(429).json({ error: "OpenAI API quota exceeded" });
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

    const models = await openai.models.list();
    const chatModels = models.data
      .filter(model => model.id.includes('gpt'))
      .map(model => ({
        id: model.id,
        created: model.created,
        owned_by: model.owned_by
      }));

    res.json({ models: chatModels });
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

export default router;