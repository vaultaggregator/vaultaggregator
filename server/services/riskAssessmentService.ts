import { db } from '../db';
import { pools, poolHistoricalData } from '@shared/schema';
import { eq, desc, gte } from 'drizzle-orm';

export interface RiskFactors {
  platformRisk: number; // 0-100 (0 = safest)
  tokenRisk: number; // 0-100 
  tvlRisk: number; // 0-100 
  apyVolatilityRisk: number; // 0-100
  operatingTimeRisk: number; // 0-100
}

export interface RiskAssessment {
  poolId: string;
  overallScore: number; // 0-100 (0 = safest)
  riskLevel: 'low' | 'medium' | 'high';
  factors: RiskFactors;
  reasoning: string[];
}

export class RiskAssessmentService {
  
  /**
   * Calculate comprehensive risk assessment for a pool
   */
  async assessPoolRisk(poolId: string): Promise<RiskAssessment> {
    try {
      console.log(`🔍 Calculating risk assessment for pool ${poolId}`);
      
      // Get pool data
      const [poolData] = await db
        .select()
        .from(pools)
        .where(eq(pools.id, poolId));
        
      if (!poolData) {
        throw new Error(`Pool ${poolId} not found`);
      }

      // Calculate individual risk factors
      const platformName = (poolData.rawData as any)?.platform || '';
      const platformRisk = this.assessPlatformRisk(platformName);
      const tokenRisk = this.assessTokenRisk(poolData.tokenPair || '');
      const tvlRisk = this.assessTvlRisk(parseFloat(poolData.tvl || '0'));
      const apyVolatilityRisk = await this.assessApyVolatilityRisk(poolId);
      const operatingTimeRisk = this.assessOperatingTimeRisk((poolData.rawData as any)?.count || 0);

      const factors: RiskFactors = {
        platformRisk,
        tokenRisk,
        tvlRisk,
        apyVolatilityRisk,
        operatingTimeRisk
      };

      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(factors);
      const riskLevel = this.determineRiskLevel(overallScore);
      const reasoning = this.generateReasoning(factors, poolData);

      console.log(`✅ Risk assessment completed for ${poolData.tokenPair}: ${riskLevel} (${overallScore.toFixed(1)})`);

      return {
        poolId,
        overallScore,
        riskLevel,
        factors,
        reasoning
      };
    } catch (error) {
      console.error(`❌ Error assessing risk for pool ${poolId}:`, error);
      // Return medium risk as fallback
      return {
        poolId,
        overallScore: 50,
        riskLevel: 'medium',
        factors: {
          platformRisk: 50,
          tokenRisk: 50,
          tvlRisk: 50,
          apyVolatilityRisk: 50,
          operatingTimeRisk: 50
        },
        reasoning: ['Risk assessment failed - using default medium risk']
      };
    }
  }

  /**
   * Assess platform-based risk
   */
  private assessPlatformRisk(platformName: string): number {
    const platform = platformName.toLowerCase();
    
    // Platform risk based on security track record and maturity
    if (platform.includes('lido')) {
      return 15; // Very established, audited, large TVL
    } else if (platform.includes('morpho')) {
      return 25; // Well-established protocol, good security
    } else if (platform.includes('aave')) {
      return 20; // Battle-tested, highly secure
    } else if (platform.includes('compound')) {
      return 20; // Long track record
    } else if (platform.includes('uniswap')) {
      return 30; // AMM risks
    } else {
      return 60; // Unknown/newer platforms get higher risk
    }
  }

  /**
   * Assess token-based risk
   */
  private assessTokenRisk(tokenPair: string): number {
    const token = tokenPair.toLowerCase();
    
    // Token risk based on stability and adoption
    if (token.includes('eth') || token.includes('steth') || token.includes('weth')) {
      return 10; // ETH is relatively stable
    } else if (token.includes('usdc') || token.includes('usdt') || token.includes('dai')) {
      return 15; // Stablecoins have depegging risk
    } else if (token.includes('wbtc') || token.includes('btc')) {
      return 25; // BTC volatility
    } else {
      return 45; // Altcoins have higher volatility risk
    }
  }

  /**
   * Assess TVL-based risk (larger TVL = lower risk)
   */
  private assessTvlRisk(tvl: number): number {
    if (tvl >= 1000000000) { // $1B+
      return 10;
    } else if (tvl >= 100000000) { // $100M+
      return 20;
    } else if (tvl >= 10000000) { // $10M+
      return 35;
    } else if (tvl >= 1000000) { // $1M+
      return 50;
    } else {
      return 70; // Low TVL pools are riskier
    }
  }

  /**
   * Assess APY volatility risk based on historical data
   */
  private async assessApyVolatilityRisk(poolId: string): Promise<number> {
    try {
      // Get last 30 days of APY data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const historicalData = await db
        .select()
        .from(poolHistoricalData)
        .where(
          eq(poolHistoricalData.poolId, poolId)
        )
        .orderBy(desc(poolHistoricalData.timestamp))
        .limit(30);

      if (historicalData.length < 5) {
        return 40; // Insufficient data = moderate risk
      }

      // Calculate APY standard deviation
      const apyValues = historicalData.map(d => parseFloat(d.apy || '0'));
      const mean = apyValues.reduce((a, b) => a + b, 0) / apyValues.length;
      const variance = apyValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / apyValues.length;
      const stdDev = Math.sqrt(variance);
      
      // Convert to risk score (higher volatility = higher risk)
      const volatilityRisk = Math.min(80, stdDev * 100); // Cap at 80
      
      return volatilityRisk;
    } catch (error) {
      console.warn(`⚠️ Could not assess APY volatility for pool ${poolId}:`, error);
      return 40; // Default moderate risk
    }
  }

  /**
   * Assess operating time risk (longer operation = lower risk)
   */
  private assessOperatingTimeRisk(operatingDays: number): number {
    if (operatingDays >= 1000) { // 3+ years
      return 10;
    } else if (operatingDays >= 365) { // 1+ year
      return 20;
    } else if (operatingDays >= 180) { // 6+ months
      return 35;
    } else if (operatingDays >= 90) { // 3+ months
      return 50;
    } else {
      return 70; // New pools are riskier
    }
  }

  /**
   * Calculate weighted overall risk score
   */
  private calculateOverallScore(factors: RiskFactors): number {
    // Weighted average with different importance for each factor
    const weights = {
      platformRisk: 0.3,      // Platform security is most important
      tokenRisk: 0.2,         // Token stability
      tvlRisk: 0.2,          // Size/liquidity
      apyVolatilityRisk: 0.2, // Yield stability
      operatingTimeRisk: 0.1  // Track record
    };

    return (
      factors.platformRisk * weights.platformRisk +
      factors.tokenRisk * weights.tokenRisk +
      factors.tvlRisk * weights.tvlRisk +
      factors.apyVolatilityRisk * weights.apyVolatilityRisk +
      factors.operatingTimeRisk * weights.operatingTimeRisk
    );
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    return 'high';
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(factors: RiskFactors, poolData: any): string[] {
    const reasoning: string[] = [];
    
    // Platform reasoning
    if (factors.platformRisk <= 20) {
      reasoning.push('Established platform with strong security track record');
    } else if (factors.platformRisk <= 40) {
      reasoning.push('Reputable platform with good security practices');
    } else {
      reasoning.push('Platform security requires additional due diligence');
    }

    // Token reasoning
    if (factors.tokenRisk <= 20) {
      reasoning.push('Stable, widely-adopted tokens');
    } else if (factors.tokenRisk <= 40) {
      reasoning.push('Standard crypto assets with moderate volatility');
    } else {
      reasoning.push('Higher volatility tokens increase risk exposure');
    }

    // TVL reasoning
    const tvl = parseFloat(poolData.tvl || '0');
    if (tvl >= 100000000) {
      reasoning.push('Large TVL provides good liquidity and confidence');
    } else if (tvl >= 10000000) {
      reasoning.push('Moderate TVL indicates reasonable adoption');
    } else {
      reasoning.push('Lower TVL may indicate liquidity constraints');
    }

    return reasoning;
  }

  /**
   * Assess risk for all pools and update database
   */
  async assessAllPools(): Promise<void> {
    console.log('🔍 Starting comprehensive risk assessment for all pools...');
    
    const allPools = await db.select().from(pools);
    
    for (const pool of allPools) {
      try {
        const assessment = await this.assessPoolRisk(pool.id);
        
        // Update pool with new risk level
        await db
          .update(pools)
          .set({ 
            riskLevel: assessment.riskLevel,
            lastUpdated: new Date()
          })
          .where(eq(pools.id, pool.id));
          
        console.log(`✅ Updated risk for ${pool.tokenPair}: ${assessment.riskLevel} (score: ${assessment.overallScore.toFixed(1)})`);
      } catch (error) {
        console.error(`❌ Failed to assess risk for pool ${pool.id}:`, error);
      }
    }
    
    console.log('✅ Completed risk assessment for all pools');
  }
}