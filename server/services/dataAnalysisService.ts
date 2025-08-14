import { storage } from "../storage";
import { EtherscanTokenService } from "./etherscanTokenService";
import type { Pool, HolderHistory } from "@shared/schema";

/**
 * Enhanced Data Analysis Service
 * Provides comprehensive analytics across all data sources
 */
export class DataAnalysisService {
  private etherscanService: EtherscanTokenService;

  constructor() {
    this.etherscanService = new EtherscanTokenService();
  }

  /**
   * Generate comprehensive pool analytics
   */
  async getPoolAnalytics(poolId: string) {
    try {
      const pool = await storage.getPoolById(poolId);
      if (!pool) throw new Error("Pool not found");

      // Get all data sources for this pool
      const [
        basicMetrics,
        riskMetrics,
        holderMetrics,
        marketMetrics,
        performanceMetrics
      ] = await Promise.all([
        this.getBasicPoolMetrics(pool),
        this.getRiskAnalysis(pool),
        this.getHolderAnalysis(pool),
        this.getMarketAnalysis(pool),
        this.getPerformanceAnalysis(pool)
      ]);

      return {
        poolId,
        analysis: {
          basic: basicMetrics,
          risk: riskMetrics,
          holders: holderMetrics,
          market: marketMetrics,
          performance: performanceMetrics
        },
        timestamp: new Date().toISOString(),
        summary: this.generateAnalysisSummary({
          basicMetrics,
          riskMetrics,
          holderMetrics,
          marketMetrics,
          performanceMetrics
        })
      };

    } catch (error) {
      console.error(`Error generating pool analytics for ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Basic pool metrics from multiple data sources
   */
  private async getBasicPoolMetrics(pool: Pool) {
    const rawData: any = pool.rawData || {};
    
    return {
      tvl: {
        current: rawData.tvlUsd || pool.tvl,
        change24h: rawData.change1d || null,
        change7d: rawData.change7d || null,
        trend: this.calculateTrend(rawData.change1d, rawData.change7d)
      },
      apy: {
        base: rawData.apyBase || pool.apy,
        reward: rawData.apyReward || null,
        total: (rawData.apyBase || 0) + (rawData.apyReward || 0),
        mean30d: rawData.apyMean30d || null
      },
      volume: {
        daily: rawData.volumeUsd1d || null,
        weekly: rawData.volumeUsd7d || null
      },
      operationalMetrics: {
        poolAge: rawData.count ? `${rawData.count} days` : 'Unknown',
        lastUpdate: pool.lastUpdated,
        dataSource: pool.project || 'Unknown'
      }
    };
  }

  /**
   * Risk analysis combining multiple factors
   */
  private async getRiskAnalysis(pool: Pool) {
    const rawData: any = pool.rawData || {};
    
    // Get stored risk scores if available
    // TODO: Implement risk scoring system
    
    const riskFactors = {
      tvlRisk: this.assessTvlRisk(rawData.tvlUsd),
      apyRisk: this.assessApyRisk(rawData.apyBase),
      platformRisk: this.assessPlatformRisk(pool.platform),
      liquidityRisk: this.assessLiquidityRisk(rawData.volumeUsd1d, rawData.tvlUsd),
      volatilityRisk: this.assessVolatilityRisk(rawData.change1d, rawData.change7d)
    };

    const overallRisk = this.calculateOverallRisk(riskFactors);

    return {
      overall: overallRisk,
      factors: riskFactors,
      recommendation: this.getRiskRecommendation(overallRisk),
      warnings: this.identifyRiskWarnings(riskFactors)
    };
  }

  /**
   * Enhanced holder analysis
   */
  private async getHolderAnalysis(pool: Pool) {
    const rawData: any = pool.rawData || {};
    let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
    
    // Handle special cases - use actual vault contract addresses for holder data
    if (pool.id === 'd6a1f6b8-a970-4cc0-9f02-14da0152738e') {
      underlyingToken = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB'; // steakUSDC vault contract
    }

    if (!underlyingToken) {
      return {
        available: false,
        reason: "No underlying token found"
      };
    }

    try {
      const [holderAnalytics, holderHistory] = await Promise.all([
        storage.getHolderAnalytics(underlyingToken),
        storage.getHolderHistory(underlyingToken, 30)
      ]);

      const distribution = await this.analyzeHolderDistribution(underlyingToken);
      const concentration = this.calculateHolderConcentration(distribution);

      return {
        available: true,
        current: holderAnalytics.current,
        trends: {
          change7d: holderAnalytics.change7d,
          change30d: holderAnalytics.change30d,
          changeAllTime: holderAnalytics.changeAllTime
        },
        distribution,
        concentration,
        insights: this.generateHolderInsights(holderAnalytics, holderHistory)
      };

    } catch (error) {
      console.error(`Error analyzing holders for ${underlyingToken}:`, error);
      return {
        available: false,
        reason: "Error fetching holder data"
      };
    }
  }

  /**
   * Market analysis combining external data
   */
  private async getMarketAnalysis(pool: Pool) {
    const rawData: any = pool.rawData || {};
    
    return {
      position: {
        rank: rawData.rank || null,
        category: pool.category || 'Unknown',
        chain: pool.chain || 'Unknown'
      },
      competition: {
        // TODO: Find similar pools for comparison
        similarPools: [],
        marketShare: null
      },
      sentiment: {
        // Get AI outlook if available
        aiOutlook: await this.getPoolSentiment(pool.id),
        marketTrend: this.analyzeMarketTrend(rawData)
      }
    };
  }

  /**
   * Performance analysis over time
   */
  private async getPerformanceAnalysis(pool: Pool) {
    const rawData: any = pool.rawData || {};
    
    return {
      stability: {
        apyStability: this.calculateApyStability(rawData),
        tvlStability: this.calculateTvlStability(rawData),
        overall: this.calculateOverallStability(rawData)
      },
      growth: {
        tvlGrowth: this.calculateTvlGrowth(rawData),
        holderGrowth: await this.calculateHolderGrowth(pool),
        consistencyScore: this.calculateConsistencyScore(rawData)
      },
      efficiency: {
        rewardEfficiency: this.calculateRewardEfficiency(rawData),
        capitalEfficiency: this.calculateCapitalEfficiency(rawData)
      }
    };
  }

  /**
   * Generate analysis summary with key insights
   */
  private generateAnalysisSummary(analytics: any) {
    const insights = [];
    const warnings = [];
    const opportunities = [];

    // APY Analysis
    const totalApy = analytics.basicMetrics.apy.total;
    if (totalApy > 20) {
      warnings.push("High APY may indicate higher risk");
    } else if (totalApy > 10) {
      insights.push("Competitive APY with moderate risk profile");
    }

    // TVL Analysis
    const tvlUsd = analytics.basicMetrics.tvl.current;
    if (tvlUsd > 100000000) { // > $100M
      insights.push("High TVL indicates strong market confidence");
    } else if (tvlUsd < 1000000) { // < $1M
      warnings.push("Low TVL may indicate liquidity concerns");
    }

    // Risk Analysis
    const riskLevel = analytics.risk.overall.level;
    if (riskLevel === 'high') {
      warnings.push("High risk profile requires careful consideration");
    } else if (riskLevel === 'low') {
      opportunities.push("Low risk profile suitable for conservative strategies");
    }

    // Holder Analysis
    if (analytics.holders.available) {
      const holderTrend = analytics.holders.trends.change7d;
      if (holderTrend && holderTrend.percentage > 5) {
        opportunities.push("Growing holder base indicates increasing adoption");
      } else if (holderTrend && holderTrend.percentage < -5) {
        warnings.push("Declining holder count may signal concerns");
      }
    }

    return {
      insights,
      warnings,
      opportunities,
      overallScore: this.calculateOverallScore(analytics),
      recommendation: this.generateRecommendation(analytics)
    };
  }

  // Helper methods for analysis calculations

  private calculateTrend(change1d: number | null, change7d: number | null): string {
    if (!change1d || !change7d) return 'unknown';
    if (change1d > 0 && change7d > 0) return 'bullish';
    if (change1d < 0 && change7d < 0) return 'bearish';
    return 'mixed';
  }

  private assessTvlRisk(tvl: number | null): { level: string; score: number; reason: string } {
    if (!tvl) return { level: 'unknown', score: 50, reason: 'No TVL data available' };
    
    if (tvl > 100000000) return { level: 'low', score: 20, reason: 'Very high TVL (>$100M)' };
    if (tvl > 10000000) return { level: 'low', score: 30, reason: 'High TVL (>$10M)' };
    if (tvl > 1000000) return { level: 'medium', score: 50, reason: 'Moderate TVL (>$1M)' };
    return { level: 'high', score: 80, reason: 'Low TVL (<$1M)' };
  }

  private assessApyRisk(apy: number | null): { level: string; score: number; reason: string } {
    if (!apy) return { level: 'unknown', score: 50, reason: 'No APY data available' };
    
    if (apy > 50) return { level: 'high', score: 90, reason: 'Extremely high APY (>50%)' };
    if (apy > 25) return { level: 'high', score: 75, reason: 'Very high APY (>25%)' };
    if (apy > 15) return { level: 'medium', score: 60, reason: 'High APY (>15%)' };
    if (apy > 5) return { level: 'medium', score: 40, reason: 'Moderate APY (5-15%)' };
    return { level: 'low', score: 20, reason: 'Conservative APY (<5%)' };
  }

  private assessPlatformRisk(platform: string | null): { level: string; score: number; reason: string } {
    if (!platform) return { level: 'unknown', score: 50, reason: 'Unknown platform' };
    
    const establishedPlatforms = ['aave', 'compound', 'lido', 'uniswap', 'curve'];
    const platformLower = platform.toLowerCase();
    
    if (establishedPlatforms.some(p => platformLower.includes(p))) {
      return { level: 'low', score: 25, reason: 'Established DeFi platform' };
    }
    
    return { level: 'medium', score: 55, reason: 'Platform risk assessment needed' };
  }

  private assessLiquidityRisk(volume: number | null, tvl: number | null): { level: string; score: number; reason: string } {
    if (!volume || !tvl) return { level: 'unknown', score: 50, reason: 'Insufficient liquidity data' };
    
    const volumeToTvlRatio = volume / tvl;
    if (volumeToTvlRatio > 0.1) return { level: 'low', score: 25, reason: 'High liquidity (volume/TVL > 10%)' };
    if (volumeToTvlRatio > 0.01) return { level: 'medium', score: 45, reason: 'Moderate liquidity' };
    return { level: 'high', score: 75, reason: 'Low liquidity concerns' };
  }

  private assessVolatilityRisk(change1d: number | null, change7d: number | null): { level: string; score: number; reason: string } {
    if (!change1d || !change7d) return { level: 'unknown', score: 50, reason: 'No volatility data' };
    
    const volatility = Math.abs(change1d) + Math.abs(change7d);
    if (volatility > 20) return { level: 'high', score: 80, reason: 'High volatility detected' };
    if (volatility > 10) return { level: 'medium', score: 55, reason: 'Moderate volatility' };
    return { level: 'low', score: 30, reason: 'Low volatility' };
  }

  private calculateOverallRisk(factors: any): { level: string; score: number; details: string } {
    const scores = Object.values(factors).map((f: any) => f.score);
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    
    let level = 'medium';
    if (avgScore < 35) level = 'low';
    else if (avgScore > 65) level = 'high';
    
    return {
      level,
      score: Math.round(avgScore),
      details: `Based on ${scores.length} risk factors`
    };
  }

  private getRiskRecommendation(risk: any): string {
    switch (risk.level) {
      case 'low': return 'Suitable for conservative investors seeking stable returns';
      case 'medium': return 'Balanced risk-reward profile, suitable for moderate investors';
      case 'high': return 'High risk, only suitable for experienced investors';
      default: return 'Risk assessment incomplete, proceed with caution';
    }
  }

  private identifyRiskWarnings(factors: any): string[] {
    const warnings = [];
    
    if (factors.tvlRisk.level === 'high') warnings.push('Low TVL liquidity concerns');
    if (factors.apyRisk.level === 'high') warnings.push('Unusually high APY may indicate risk');
    if (factors.liquidityRisk.level === 'high') warnings.push('Limited trading liquidity');
    if (factors.volatilityRisk.level === 'high') warnings.push('High price volatility');
    
    return warnings;
  }

  private async analyzeHolderDistribution(tokenAddress: string) {
    try {
      const topHolders = await this.etherscanService.getTopHolders(tokenAddress, 50);
      
      if (!topHolders || topHolders.length === 0) {
        return { available: false, reason: 'No holder data available' };
      }

      const totalSupply = topHolders.reduce((sum, holder) => sum + parseFloat(holder.balance), 0);
      
      return {
        available: true,
        top10Share: this.calculateTopHoldersShare(topHolders.slice(0, 10), totalSupply),
        top50Share: this.calculateTopHoldersShare(topHolders, totalSupply),
        whaleCount: topHolders.filter(h => parseFloat(h.share) > 1).length,
        totalHolders: topHolders.length
      };
    } catch (error) {
      return { available: false, reason: 'Error fetching holder distribution' };
    }
  }

  private calculateTopHoldersShare(holders: any[], totalSupply: number): number {
    const topHoldersBalance = holders.reduce((sum, holder) => sum + parseFloat(holder.balance), 0);
    return totalSupply > 0 ? (topHoldersBalance / totalSupply) * 100 : 0;
  }

  private calculateHolderConcentration(distribution: any) {
    if (!distribution.available) return { level: 'unknown', risk: 'unknown' };
    
    const top10Share = distribution.top10Share;
    
    if (top10Share > 80) return { level: 'very_high', risk: 'high' };
    if (top10Share > 60) return { level: 'high', risk: 'medium-high' };
    if (top10Share > 40) return { level: 'medium', risk: 'medium' };
    if (top10Share > 20) return { level: 'low', risk: 'low-medium' };
    return { level: 'very_low', risk: 'low' };
  }

  private generateHolderInsights(analytics: any, history: HolderHistory[]): string[] {
    const insights = [];
    
    if (analytics.change7d && analytics.change7d.percentage > 5) {
      insights.push(`Holder count increased by ${analytics.change7d.percentage.toFixed(1)}% this week`);
    }
    
    if (analytics.change30d && analytics.change30d.percentage > 10) {
      insights.push(`Strong 30-day growth of ${analytics.change30d.percentage.toFixed(1)}% in holder count`);
    }
    
    if (history.length > 7) {
      const recentGrowth = this.calculateRecentGrowthPattern(history);
      if (recentGrowth.pattern === 'accelerating') {
        insights.push('Accelerating holder growth indicates increasing adoption');
      }
    }
    
    return insights;
  }

  private calculateRecentGrowthPattern(history: HolderHistory[]) {
    // Implementation for growth pattern analysis
    return { pattern: 'stable' }; // Simplified for now
  }

  private async getPoolSentiment(poolId: string) {
    // Sentiment analysis temporarily disabled
    return null;
  }

  private analyzeMarketTrend(rawData: any): string {
    const change1d = rawData.change1d || 0;
    const change7d = rawData.change7d || 0;
    
    if (change1d > 2 && change7d > 5) return 'strong_bullish';
    if (change1d > 0 && change7d > 0) return 'bullish';
    if (change1d < -2 && change7d < -5) return 'strong_bearish';
    if (change1d < 0 && change7d < 0) return 'bearish';
    return 'neutral';
  }

  // Performance calculation methods (simplified implementations)
  private calculateApyStability(rawData: any): { score: number; level: string } {
    // TODO: Implement APY stability calculation based on historical data
    return { score: 75, level: 'stable' };
  }

  private calculateTvlStability(rawData: any): { score: number; level: string } {
    const change1d = Math.abs(rawData.change1d || 0);
    const change7d = Math.abs(rawData.change7d || 0);
    
    const instability = change1d * 2 + change7d;
    if (instability < 5) return { score: 90, level: 'very_stable' };
    if (instability < 15) return { score: 70, level: 'stable' };
    if (instability < 30) return { score: 50, level: 'moderate' };
    return { score: 30, level: 'volatile' };
  }

  private calculateOverallStability(rawData: any): { score: number; level: string } {
    const apyStability = this.calculateApyStability(rawData);
    const tvlStability = this.calculateTvlStability(rawData);
    
    const avgScore = (apyStability.score + tvlStability.score) / 2;
    
    let level = 'moderate';
    if (avgScore > 80) level = 'very_stable';
    else if (avgScore > 60) level = 'stable';
    else if (avgScore < 40) level = 'volatile';
    
    return { score: Math.round(avgScore), level };
  }

  private calculateTvlGrowth(rawData: any): { rate: number; trend: string } {
    const change7d = rawData.change7d || 0;
    let trend = 'neutral';
    
    if (change7d > 10) trend = 'strong_growth';
    else if (change7d > 3) trend = 'growth';
    else if (change7d < -10) trend = 'strong_decline';
    else if (change7d < -3) trend = 'decline';
    
    return { rate: change7d, trend };
  }

  private async calculateHolderGrowth(pool: Pool): Promise<{ rate: number; trend: string }> {
    // Get holder analytics to determine growth
    const rawData: any = pool.rawData || {};
    let underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
    
    if (pool.id === 'd6a1f6b8-a970-4cc0-9f02-14da0152738e') {
      underlyingToken = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';
    }

    if (!underlyingToken) return { rate: 0, trend: 'unknown' };

    try {
      const analytics = await storage.getHolderAnalytics(underlyingToken);
      const change7d = analytics.change7d?.percentage || 0;
      
      let trend = 'neutral';
      if (change7d > 5) trend = 'growth';
      else if (change7d > 15) trend = 'strong_growth';
      else if (change7d < -5) trend = 'decline';
      else if (change7d < -15) trend = 'strong_decline';
      
      return { rate: change7d, trend };
    } catch (error) {
      return { rate: 0, trend: 'unknown' };
    }
  }

  private calculateConsistencyScore(rawData: any): number {
    // Simple consistency score based on volatility
    const change1d = Math.abs(rawData.change1d || 0);
    const change7d = Math.abs(rawData.change7d || 0);
    
    const volatility = change1d + change7d;
    return Math.max(0, 100 - volatility * 2);
  }

  private calculateRewardEfficiency(rawData: any): { score: number; analysis: string } {
    const apyBase = rawData.apyBase || 0;
    const apyReward = rawData.apyReward || 0;
    const total = apyBase + apyReward;
    
    if (total === 0) return { score: 0, analysis: 'No yield data available' };
    
    const rewardRatio = apyReward / total;
    let analysis = 'Primarily base yield';
    let score = 70;
    
    if (rewardRatio > 0.5) {
      analysis = 'High reward token dependency';
      score = 60;
    } else if (rewardRatio > 0.2) {
      analysis = 'Balanced yield composition';
      score = 85;
    }
    
    return { score, analysis };
  }

  private calculateCapitalEfficiency(rawData: any): { score: number; analysis: string } {
    const apy = (rawData.apyBase || 0) + (rawData.apyReward || 0);
    const tvl = rawData.tvlUsd || 0;
    
    if (tvl === 0) return { score: 0, analysis: 'No TVL data available' };
    
    // Higher APY with stable TVL indicates good capital efficiency
    let score = Math.min(100, apy * 3); // Simple scoring
    let analysis = 'Standard capital efficiency';
    
    if (apy > 15 && tvl > 10000000) {
      analysis = 'High efficiency with substantial capital';
      score = Math.min(100, score + 20);
    } else if (apy > 20) {
      analysis = 'High yield but assess sustainability';
      score = Math.min(100, score - 10);
    }
    
    return { score: Math.round(score), analysis };
  }

  private calculateOverallScore(analytics: any): number {
    const scores = [];
    
    // Risk score (inverted - lower risk = higher score)
    scores.push(100 - analytics.risk.overall.score);
    
    // Performance scores
    if (analytics.performance.stability.overall.score) {
      scores.push(analytics.performance.stability.overall.score);
    }
    
    if (analytics.performance.growth.consistencyScore) {
      scores.push(analytics.performance.growth.consistencyScore);
    }
    
    if (analytics.performance.efficiency.rewardEfficiency.score) {
      scores.push(analytics.performance.efficiency.rewardEfficiency.score);
    }
    
    return scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 50;
  }

  private generateRecommendation(analytics: any): string {
    const score = this.calculateOverallScore(analytics);
    const riskLevel = analytics.risk.overall.level;
    const apy = analytics.basicMetrics.apy.total || 0;
    
    if (score > 80 && riskLevel === 'low') {
      return 'Highly recommended for conservative portfolios';
    } else if (score > 70 && riskLevel === 'medium') {
      return 'Good option for balanced risk-reward strategies';
    } else if (score > 60 && apy > 15) {
      return 'High yield opportunity with elevated risk';
    } else if (score < 40) {
      return 'Proceed with caution - significant risks identified';
    } else {
      return 'Moderate opportunity requiring careful evaluation';
    }
  }
}