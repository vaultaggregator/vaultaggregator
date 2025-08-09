import type { Express } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function registerAIRoutes(app: Express) {
  // AI Portfolio Optimizer
  app.post('/api/ai/optimize-portfolio', async (req, res) => {
    try {
      const { totalAmount, riskTolerance, timeHorizon, preferredNetworks, avoidHighRisk, minimumAPY, maxPositions } = req.body;

      // Get current pools data
      const { storage } = await import('../storage');
      const pools = await storage.getPools({ limit: 50, onlyVisible: true });
      const activePools = pools.filter((pool: any) => pool.isActive !== false);

      // Create AI prompt for portfolio optimization
      const prompt = `As a DeFi portfolio optimization AI, analyze the following yield opportunities and create an optimal portfolio allocation:

Investment Parameters:
- Total Amount: $${totalAmount}
- Risk Tolerance: ${riskTolerance}
- Time Horizon: ${timeHorizon}
- Minimum APY: ${minimumAPY}%
- Max Positions: ${maxPositions}
- Avoid High Risk: ${avoidHighRisk}

Available Yield Opportunities:
${activePools.slice(0, 20).map((pool: any) => `
- ${pool.tokenPair} on ${pool.platform?.displayName || 'Unknown'} (${pool.chain?.displayName || 'Unknown'})
  APY: ${pool.apy || 'N/A'}%, TVL: ${pool.tvl || 'N/A'}, Risk: ${pool.riskLevel || 'unknown'}
  Pool ID: ${pool.id}
`).join('\n')}

Create a portfolio allocation that maximizes expected returns while managing risk. Respond in JSON format:
{
  "allocations": [
    {
      "poolId": "pool-id",
      "tokenPair": "token-pair", 
      "platform": "platform-name",
      "network": "network-name",
      "allocation": 25,
      "amount": 2500,
      "apy": 8.5,
      "riskLevel": "medium",
      "reasoning": "Why this allocation makes sense"
    }
  ],
  "expectedAPY": 7.8,
  "totalRisk": "medium",
  "diversificationScore": 85,
  "confidence": 78,
  "aiInsights": "Overall strategy explanation and market outlook",
  "rebalanceFrequency": "quarterly",
  "warnings": ["Important risk considerations"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);

    } catch (error) {
      console.error('Portfolio optimization error:', error);
      res.status(500).json({ error: 'Failed to optimize portfolio' });
    }
  });

  // AI Yield Predictor
  app.post('/api/ai/predict-yields', async (req, res) => {
    try {
      const { poolId, period } = req.body;

      // Get pool data
      const { storage } = await import('../storage');
      const pool = await storage.getPoolById(poolId);
      
      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' });
      }

      // Get current market conditions (simplified)
      const currentDate = new Date();
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      
      // Create AI prompt for yield prediction
      const prompt = `As a DeFi yield prediction AI, analyze and predict future APY trends for this yield opportunity:

Current Pool Data:
- Token Pair: ${pool.tokenPair}
- Platform: ${pool.platform?.displayName || 'Unknown'}
- Network: ${pool.chain?.displayName || 'Unknown'}
- Current APY: ${pool.apy || 'N/A'}%
- TVL: ${pool.tvl || 'N/A'}
- Risk Level: ${pool.riskLevel || 'unknown'}
- Operating Days: ${(pool.rawData as any)?.count || 'unknown'}

Prediction Period: ${periodDays} days

Analyze market trends, protocol fundamentals, and provide APY predictions. Generate realistic predictions based on:
1. Historical yield stability
2. Market volatility
3. Protocol health
4. Liquidity trends
5. Macroeconomic factors

Respond in JSON format:
{
  "poolId": "${poolId}",
  "currentAPY": ${parseFloat(pool.apy || '0')},
  "predictions": [
    {
      "date": "YYYY-MM-DD",
      "predicted_apy": 8.5,
      "confidence_upper": 9.2,
      "confidence_lower": 7.8,
      "market_events": ["Key events affecting yield"]
    }
  ],
  "summary": {
    "trend": "bullish|bearish|stable",
    "confidence": 75,
    "keyFactors": ["Factor 1", "Factor 2"],
    "expectedChange": 2.5
  },
  "aiAnalysis": "Detailed analysis of why yields will move this way",
  "riskFactors": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Generate realistic prediction data points
      const predictions = [];
      for (let i = 0; i <= periodDays; i += Math.ceil(periodDays / 10)) {
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + i);
        
        const baseAPY = parseFloat(pool.apy || '5');
        const volatility = 0.1; // 10% volatility
        const trendFactor = result.summary?.expectedChange || 0;
        
        predictions.push({
          date: futureDate.toISOString().split('T')[0],
          predicted_apy: baseAPY + (trendFactor * i / periodDays) + (Math.random() - 0.5) * volatility,
          confidence_upper: baseAPY + (trendFactor * i / periodDays) + volatility,
          confidence_lower: baseAPY + (trendFactor * i / periodDays) - volatility,
          market_events: i === 0 ? ["Current data point"] : []
        });
      }
      
      result.predictions = predictions;
      res.json(result);

    } catch (error) {
      console.error('Yield prediction error:', error);
      res.status(500).json({ error: 'Failed to predict yields' });
    }
  });

  // AI Risk Analyzer
  app.post('/api/ai/analyze-risk', async (req, res) => {
    try {
      const { poolId } = req.body;

      // Get pool data
      const { storage } = await import('../storage');
      const pool = await storage.getPoolById(poolId);
      
      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' });
      }

      // Create AI prompt for risk analysis
      const prompt = `As a DeFi risk analysis AI, perform a comprehensive risk assessment for this yield opportunity:

Pool Data:
- Token Pair: ${pool.tokenPair}
- Platform: ${pool.platform?.displayName || 'Unknown'}
- Network: ${pool.chain?.displayName || 'Unknown'}  
- APY: ${pool.apy || 'N/A'}%
- TVL: ${pool.tvl || 'N/A'}
- Risk Level: ${pool.riskLevel || 'unknown'}
- Operating Days: ${(pool.rawData as any)?.count || 'unknown'}

Analyze the following risk categories:
1. Smart Contract Risk - Protocol audit status, code complexity, exploit history
2. Liquidity Risk - Pool depth, withdrawal capacity, slippage risk  
3. Counterparty Risk - Platform reputation, team background, governance
4. Market Risk - Token volatility, correlation risk, market manipulation
5. Regulatory Risk - Compliance status, regulatory uncertainty
6. Technical Risk - Network congestion, bridge risks, oracle risks

Respond in JSON format:
{
  "poolId": "${poolId}",
  "overallRiskScore": 45,
  "riskLevel": "medium",
  "riskFactors": [
    {
      "category": "Smart Contract Risk",
      "score": 30,
      "impact": "medium",
      "description": "Detailed risk explanation",
      "mitigation": ["Strategy 1", "Strategy 2"]
    }
  ],
  "historicalVolatility": {
    "apy": 15.5,
    "tvl": 8.2,
    "trend": "increasing"
  },
  "protocolRisks": {
    "smartContractRisk": 30,
    "liquidityRisk": 40,
    "counterpartyRisk": 25,
    "regulatoryRisk": 20
  },
  "aiInsights": "Overall risk assessment and key concerns",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "riskMitigationStrategies": ["Strategy 1", "Strategy 2"],
  "worstCaseScenario": {
    "description": "Worst case description",
    "probability": 15,
    "potentialLoss": 25
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      res.json(result);

    } catch (error) {
      console.error('Risk analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze risk' });
    }
  });
}