import OpenAI from 'openai';
import { db } from '../db';
import { aiOutlooks, pools, platforms, chains } from '@shared/schema';
import { eq, and, gt, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIPredictionService {
  private static instance: AIPredictionService;
  private isConfigured: boolean = false;

  constructor() {
    // Check if OpenAI API key is configured
    this.isConfigured = !!process.env.OPENAI_API_KEY;
    if (!this.isConfigured) {
      console.warn('⚠️ OpenAI API key not configured. AI predictions will be unavailable.');
    }
  }

  static getInstance(): AIPredictionService {
    if (!AIPredictionService.instance) {
      AIPredictionService.instance = new AIPredictionService();
    }
    return AIPredictionService.instance;
  }

  async getPrediction(poolId: string): Promise<any> {
    try {
      // Check if OpenAI is configured
      if (!this.isConfigured) {
        return this.getFallbackPrediction(poolId);
      }

      // Check if we have a valid cached prediction (less than 24 hours old)
      const existingPrediction = await db
        .select()
        .from(aiOutlooks)
        .where(
          and(
            eq(aiOutlooks.poolId, poolId),
            gt(aiOutlooks.expiresAt, new Date())
          )
        )
        .orderBy(desc(aiOutlooks.generatedAt))
        .limit(1);

      if (existingPrediction.length > 0) {
        console.log(`🤖 Using cached AI prediction for pool ${poolId}`);
        return existingPrediction[0];
      }

      // Generate new prediction
      console.log(`🤖 Generating new AI prediction for pool ${poolId}`);
      return await this.generatePrediction(poolId);
    } catch (error) {
      console.error('Error getting AI prediction:', error);
      return this.getFallbackPrediction(poolId);
    }
  }

  private getFallbackPrediction(poolId: string): any {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Shorter expiry for fallback

    return {
      id: 'fallback',
      poolId,
      outlook: 'AI analysis is temporarily unavailable. Please check back later for detailed market insights and predictions.',
      sentiment: 'neutral',
      confidence: 0,
      marketFactors: ['Analysis pending'],
      generatedAt: new Date(),
      expiresAt,
    };
  }

  async generatePrediction(poolId: string): Promise<any> {
    try {
      if (!this.isConfigured) {
        return this.getFallbackPrediction(poolId);
      }

      // Fetch pool data with relations
      const poolData = await db
        .select({
          pool: pools,
          platform: platforms,
          chain: chains,
        })
        .from(pools)
        .leftJoin(platforms, eq(pools.platformId, platforms.id))
        .leftJoin(chains, eq(pools.chainId, chains.id))
        .where(eq(pools.id, poolId))
        .limit(1);

      if (!poolData[0]) {
        return this.getFallbackPrediction(poolId);
      }

      const { pool, platform, chain } = poolData[0];

      // Create a prompt for GPT-4o (note: this is the latest model)
      const prompt = `You are a DeFi analyst providing insights for yield farming opportunities. Analyze this pool and provide a market outlook in exactly 100 words:

Pool: ${pool.tokenPair}
Platform: ${platform?.displayName || 'Unknown'}
Blockchain: ${chain?.displayName || 'Unknown'}
Current APY: ${pool.apy}%
TVL: $${parseFloat(pool.tvl || '0').toLocaleString()}
Risk Level: ${pool.riskLevel}

Consider these factors:
1. Current market conditions and DeFi trends
2. Platform reputation and security
3. APY sustainability
4. TVL trends and liquidity
5. Smart contract risks

Provide:
- A 100-word outlook (be concise and specific)
- Sentiment: bullish, bearish, or neutral
- Confidence score: 1-100
- Top 3 market factors affecting this pool

Format response as JSON with: outlook, sentiment, confidence, marketFactors (array of 3 strings)`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional DeFi analyst. Provide data-driven insights based on current market conditions. Be specific and actionable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 300,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      // Save to database with 24-hour expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const [savedPrediction] = await db
        .insert(aiOutlooks)
        .values({
          poolId,
          outlook: result.outlook || 'Analysis pending',
          sentiment: result.sentiment || 'neutral',
          confidence: Math.min(100, Math.max(1, result.confidence || 50)),
          marketFactors: result.marketFactors || [],
          expiresAt,
        })
        .returning();

      console.log(`✅ AI prediction generated and saved for pool ${poolId}`);
      return savedPrediction;
    } catch (error: any) {
      console.error('Error generating AI prediction:', error.message || error);
      return this.getFallbackPrediction(poolId);
    }
  }

  // Bulk update predictions for all pools (called by scheduler)
  async updateAllPredictions(): Promise<void> {
    try {
      console.log('🤖 Starting bulk AI prediction update...');
      
      const allPools = await db
        .select({ id: pools.id })
        .from(pools)
        .where(eq(pools.isVisible, true));

      let successCount = 0;
      let errorCount = 0;

      // Process in batches to avoid rate limits
      for (const pool of allPools) {
        try {
          await this.generatePrediction(pool.id);
          successCount++;
          
          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Failed to generate prediction for pool ${pool.id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ AI predictions update completed: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error('Error updating all predictions:', error);
    }
  }
}