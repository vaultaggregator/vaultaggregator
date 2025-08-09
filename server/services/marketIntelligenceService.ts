import { storage } from "../storage";
import type { Pool } from "@shared/schema";

/**
 * Market Intelligence Service
 * Provides market-wide analytics and insights
 */
export class MarketIntelligenceService {

  /**
   * Get comprehensive market overview
   */
  async getMarketOverview() {
    try {
      const [pools, chains, platforms, categories] = await Promise.all([
        storage.getPools({ onlyVisible: true, limit: 1000 }),
        storage.getAllChains(),
        storage.getAllPlatforms(),
        storage.getAllCategories()
      ]);

      const marketMetrics = this.calculateMarketMetrics(pools);
      const chainAnalysis = this.analyzeChainDistribution(pools, chains);
      const platformAnalysis = this.analyzePlatformDistribution(pools, platforms);
      const categoryAnalysis = this.analyzeCategoryDistribution(pools, categories);
      const riskAnalysis = this.analyzeMarketRisk(pools);
      const opportunities = this.identifyMarketOpportunities(pools);

      return {
        overview: {
          timestamp: new Date().toISOString(),
          totalPools: pools.length,
          totalTvl: marketMetrics.totalTvl,
          averageApy: marketMetrics.averageApy,
          medianApy: marketMetrics.medianApy
        },
        metrics: marketMetrics,
        distribution: {
          chains: chainAnalysis,
          platforms: platformAnalysis,
          categories: categoryAnalysis
        },
        risk: riskAnalysis,
        opportunities,
        trends: await this.analyzeMarketTrends(pools)
      };

    } catch (error) {
      console.error("Error generating market overview:", error);
      throw error;
    }
  }

  /**
   * Get top performing pools across metrics
   */
  async getTopPerformers() {
    try {
      const pools = await storage.getPools({ onlyVisible: true, limit: 1000 });

      return {
        highestApy: this.getTopPoolsByMetric(pools, 'apy', 10),
        highestTvl: this.getTopPoolsByMetric(pools, 'tvl', 10),
        bestRiskAdjusted: this.getBestRiskAdjustedPools(pools, 10),
        mostStable: this.getMostStablePools(pools, 10),
        trending: this.getTrendingPools(pools, 10)
      };

    } catch (error) {
      console.error("Error getting top performers:", error);
      throw error;
    }
  }

  /**
   * Get market sentiment and trends
   */
  async getMarketSentiment() {
    try {
      const pools = await storage.getPools({ onlyVisible: true, limit: 100 });
      
      // Analyze overall market sentiment based on pool performance
      const sentimentMetrics = this.calculateSentimentMetrics(pools);
      
      return {
        overall: sentimentMetrics.overall,
        breakdown: sentimentMetrics.breakdown,
        confidence: sentimentMetrics.confidence,
        factors: sentimentMetrics.factors,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error("Error calculating market sentiment:", error);
      throw error;
    }
  }

  // Private helper methods

  private calculateMarketMetrics(pools: Pool[]) {
    if (pools.length === 0) {
      return {
        totalTvl: 0,
        averageApy: 0,
        medianApy: 0,
        totalPools: 0,
        apyDistribution: { low: 0, medium: 0, high: 0 },
        tvlDistribution: { small: 0, medium: 0, large: 0 }
      };
    }

    const apyValues = pools.map(p => parseFloat(p.apy || '0')).filter(apy => apy > 0);
    const tvlValues = pools.map(p => parseFloat(p.tvl || '0')).filter(tvl => tvl > 0);

    const totalTvl = tvlValues.reduce((sum, tvl) => sum + tvl, 0);
    const averageApy = apyValues.length > 0 ? apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length : 0;
    
    // Calculate median APY
    const sortedApys = [...apyValues].sort((a, b) => a - b);
    const medianApy = sortedApys.length > 0 ? 
      sortedApys.length % 2 === 0 
        ? (sortedApys[sortedApys.length / 2 - 1] + sortedApys[sortedApys.length / 2]) / 2
        : sortedApys[Math.floor(sortedApys.length / 2)]
      : 0;

    return {
      totalTvl,
      averageApy,
      medianApy,
      totalPools: pools.length,
      apyDistribution: this.calculateApyDistribution(apyValues),
      tvlDistribution: this.calculateTvlDistribution(tvlValues)
    };
  }

  private calculateApyDistribution(apyValues: number[]) {
    return {
      low: apyValues.filter(apy => apy < 5).length,
      medium: apyValues.filter(apy => apy >= 5 && apy < 15).length,
      high: apyValues.filter(apy => apy >= 15).length
    };
  }

  private calculateTvlDistribution(tvlValues: number[]) {
    return {
      small: tvlValues.filter(tvl => tvl < 1000000).length, // < $1M
      medium: tvlValues.filter(tvl => tvl >= 1000000 && tvl < 10000000).length, // $1M-$10M
      large: tvlValues.filter(tvl => tvl >= 10000000).length // > $10M
    };
  }

  private analyzeChainDistribution(pools: Pool[], chains: any[]) {
    const chainCounts = new Map<string, { count: number; totalTvl: number; averageApy: number }>();
    
    pools.forEach(pool => {
      const chainName = pool.chain?.name || 'Unknown';
      const tvl = parseFloat(pool.tvl || '0');
      const apy = parseFloat(pool.apy || '0');
      
      if (!chainCounts.has(chainName)) {
        chainCounts.set(chainName, { count: 0, totalTvl: 0, averageApy: 0 });
      }
      
      const chain = chainCounts.get(chainName)!;
      chain.count++;
      chain.totalTvl += tvl;
      chain.averageApy = (chain.averageApy * (chain.count - 1) + apy) / chain.count;
    });

    return Array.from(chainCounts.entries()).map(([name, data]) => ({
      name,
      poolCount: data.count,
      totalTvl: data.totalTvl,
      averageApy: data.averageApy,
      marketShare: pools.length > 0 ? (data.count / pools.length) * 100 : 0
    })).sort((a, b) => b.poolCount - a.poolCount);
  }

  private analyzePlatformDistribution(pools: Pool[], platforms: any[]) {
    const platformCounts = new Map<string, { count: number; totalTvl: number; averageApy: number }>();
    
    pools.forEach(pool => {
      const platformName = pool.platform?.name || 'Unknown';
      const tvl = parseFloat(pool.tvl || '0');
      const apy = parseFloat(pool.apy || '0');
      
      if (!platformCounts.has(platformName)) {
        platformCounts.set(platformName, { count: 0, totalTvl: 0, averageApy: 0 });
      }
      
      const platform = platformCounts.get(platformName)!;
      platform.count++;
      platform.totalTvl += tvl;
      platform.averageApy = (platform.averageApy * (platform.count - 1) + apy) / platform.count;
    });

    return Array.from(platformCounts.entries()).map(([name, data]) => ({
      name,
      poolCount: data.count,
      totalTvl: data.totalTvl,
      averageApy: data.averageApy,
      marketShare: pools.length > 0 ? (data.count / pools.length) * 100 : 0
    })).sort((a, b) => b.totalTvl - a.totalTvl);
  }

  private analyzeCategoryDistribution(pools: Pool[], categories: any[]) {
    // Since pools don't directly have categories in the current schema,
    // we'll analyze by risk level as a proxy
    const riskDistribution = new Map<string, { count: number; totalTvl: number; averageApy: number }>();
    
    pools.forEach(pool => {
      const risk = pool.riskLevel || 'medium';
      const tvl = parseFloat(pool.tvl || '0');
      const apy = parseFloat(pool.apy || '0');
      
      if (!riskDistribution.has(risk)) {
        riskDistribution.set(risk, { count: 0, totalTvl: 0, averageApy: 0 });
      }
      
      const riskData = riskDistribution.get(risk)!;
      riskData.count++;
      riskData.totalTvl += tvl;
      riskData.averageApy = (riskData.averageApy * (riskData.count - 1) + apy) / riskData.count;
    });

    return Array.from(riskDistribution.entries()).map(([risk, data]) => ({
      name: risk,
      poolCount: data.count,
      totalTvl: data.totalTvl,
      averageApy: data.averageApy,
      marketShare: pools.length > 0 ? (data.count / pools.length) * 100 : 0
    }));
  }

  private analyzeMarketRisk(pools: Pool[]) {
    const riskLevels = pools.map(p => p.riskLevel).filter(Boolean);
    const apyValues = pools.map(p => parseFloat(p.apy || '0')).filter(apy => apy > 0);
    
    const highRiskCount = riskLevels.filter(r => r === 'high').length;
    const mediumRiskCount = riskLevels.filter(r => r === 'medium').length;
    const lowRiskCount = riskLevels.filter(r => r === 'low').length;

    const averageApy = apyValues.length > 0 ? apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length : 0;
    const highApyCount = apyValues.filter(apy => apy > 20).length;

    let overallRisk = 'medium';
    if (highRiskCount / pools.length > 0.4 || highApyCount / pools.length > 0.3) {
      overallRisk = 'high';
    } else if (lowRiskCount / pools.length > 0.6 && averageApy < 10) {
      overallRisk = 'low';
    }

    return {
      overall: overallRisk,
      distribution: {
        high: highRiskCount,
        medium: mediumRiskCount,
        low: lowRiskCount
      },
      indicators: {
        averageApy,
        highApyPools: highApyCount,
        riskWarnings: highApyCount > pools.length * 0.2 ? ['High APY concentration detected'] : []
      }
    };
  }

  private identifyMarketOpportunities(pools: Pool[]) {
    const opportunities = [];

    // High APY with low risk
    const lowRiskHighApy = pools.filter(p => 
      p.riskLevel === 'low' && parseFloat(p.apy || '0') > 8
    );
    if (lowRiskHighApy.length > 0) {
      opportunities.push({
        type: 'low_risk_high_yield',
        title: 'Low Risk, High Yield Opportunities',
        description: `${lowRiskHighApy.length} pools offering >8% APY with low risk`,
        pools: lowRiskHighApy.slice(0, 3).map(p => ({
          id: p.id,
          name: p.platform?.name || 'Unknown',
          apy: p.apy,
          tvl: p.tvl
        }))
      });
    }

    // High TVL growth opportunities
    const highTvlPools = pools.filter(p => parseFloat(p.tvl || '0') > 50000000);
    if (highTvlPools.length > 0) {
      opportunities.push({
        type: 'institutional_grade',
        title: 'Institutional Grade Pools',
        description: `${highTvlPools.length} pools with >$50M TVL`,
        pools: highTvlPools.slice(0, 3).map(p => ({
          id: p.id,
          name: p.platform?.name || 'Unknown',
          apy: p.apy,
          tvl: p.tvl
        }))
      });
    }

    // Emerging opportunities (medium risk, good APY)
    const emergingPools = pools.filter(p => 
      p.riskLevel === 'medium' && 
      parseFloat(p.apy || '0') > 12 && 
      parseFloat(p.tvl || '0') > 1000000
    );
    if (emergingPools.length > 0) {
      opportunities.push({
        type: 'emerging_opportunities',
        title: 'Emerging DeFi Opportunities',
        description: `${emergingPools.length} pools with balanced risk-reward profile`,
        pools: emergingPools.slice(0, 3).map(p => ({
          id: p.id,
          name: p.platform?.name || 'Unknown',
          apy: p.apy,
          tvl: p.tvl
        }))
      });
    }

    return opportunities;
  }

  private async analyzeMarketTrends(pools: Pool[]) {
    // For now, provide basic trend analysis
    // In the future, this would analyze historical data
    
    const apyValues = pools.map(p => parseFloat(p.apy || '0')).filter(apy => apy > 0);
    const tvlValues = pools.map(p => parseFloat(p.tvl || '0')).filter(tvl => tvl > 0);

    const averageApy = apyValues.length > 0 ? apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length : 0;
    const totalTvl = tvlValues.reduce((sum, tvl) => sum + tvl, 0);

    return {
      apy: {
        current: averageApy,
        trend: averageApy > 10 ? 'increasing' : averageApy > 5 ? 'stable' : 'decreasing',
        outlook: this.getApyOutlook(averageApy)
      },
      tvl: {
        current: totalTvl,
        trend: 'stable', // Would be calculated from historical data
        outlook: 'Market showing healthy liquidity levels'
      },
      adoption: {
        trend: 'growing',
        indicators: ['Increasing pool diversity', 'Growing cross-chain adoption']
      }
    };
  }

  private getApyOutlook(averageApy: number): string {
    if (averageApy > 15) return 'High yield environment, monitor for sustainability';
    if (averageApy > 8) return 'Healthy yield environment with good opportunities';
    if (averageApy > 5) return 'Moderate yield environment, focus on stability';
    return 'Low yield environment, prioritize capital preservation';
  }

  private getTopPoolsByMetric(pools: Pool[], metric: 'apy' | 'tvl', limit: number) {
    return pools
      .filter(p => parseFloat(p[metric] || '0') > 0)
      .sort((a, b) => parseFloat(b[metric] || '0') - parseFloat(a[metric] || '0'))
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.platform?.name || 'Unknown',
        tokenPair: p.tokenPair,
        apy: p.apy,
        tvl: p.tvl,
        riskLevel: p.riskLevel,
        chain: p.chain?.name
      }));
  }

  private getBestRiskAdjustedPools(pools: Pool[], limit: number) {
    return pools
      .filter(p => parseFloat(p.apy || '0') > 0 && p.riskLevel)
      .map(p => ({
        ...p,
        riskScore: this.calculateRiskAdjustedScore(p)
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.platform?.name || 'Unknown',
        tokenPair: p.tokenPair,
        apy: p.apy,
        tvl: p.tvl,
        riskLevel: p.riskLevel,
        riskAdjustedScore: p.riskScore,
        chain: p.chain?.name
      }));
  }

  private getMostStablePools(pools: Pool[], limit: number) {
    // For now, consider low risk + reasonable TVL as stability indicators
    return pools
      .filter(p => p.riskLevel === 'low' && parseFloat(p.tvl || '0') > 1000000)
      .sort((a, b) => parseFloat(b.tvl || '0') - parseFloat(a.tvl || '0'))
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.platform?.name || 'Unknown',
        tokenPair: p.tokenPair,
        apy: p.apy,
        tvl: p.tvl,
        riskLevel: p.riskLevel,
        chain: p.chain?.name
      }));
  }

  private getTrendingPools(pools: Pool[], limit: number) {
    // For now, use a combination of high APY and reasonable TVL
    // In the future, this would use actual trending data
    return pools
      .filter(p => 
        parseFloat(p.apy || '0') > 8 && 
        parseFloat(p.tvl || '0') > 5000000 &&
        p.riskLevel !== 'high'
      )
      .sort((a, b) => {
        const scoreA = parseFloat(a.apy || '0') * Math.log(parseFloat(a.tvl || '1'));
        const scoreB = parseFloat(b.apy || '0') * Math.log(parseFloat(b.tvl || '1'));
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.platform?.name || 'Unknown',
        tokenPair: p.tokenPair,
        apy: p.apy,
        tvl: p.tvl,
        riskLevel: p.riskLevel,
        chain: p.chain?.name
      }));
  }

  private calculateRiskAdjustedScore(pool: Pool): number {
    const apy = parseFloat(pool.apy || '0');
    const tvl = parseFloat(pool.tvl || '0');
    
    let riskMultiplier = 1;
    switch (pool.riskLevel) {
      case 'low': riskMultiplier = 1.2; break;
      case 'medium': riskMultiplier = 1.0; break;
      case 'high': riskMultiplier = 0.7; break;
    }

    const tvlFactor = Math.min(1.5, Math.log10(tvl / 1000000) * 0.2 + 1);
    
    return apy * riskMultiplier * tvlFactor;
  }

  private calculateSentimentMetrics(pools: Pool[]) {
    const apyValues = pools.map(p => parseFloat(p.apy || '0')).filter(apy => apy > 0);
    const avgApy = apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length;
    
    const highApyCount = apyValues.filter(apy => apy > 15).length;
    const lowRiskCount = pools.filter(p => p.riskLevel === 'low').length;
    const highTvlCount = pools.filter(p => parseFloat(p.tvl || '0') > 10000000).length;

    // Simple sentiment calculation
    let sentimentScore = 50; // Neutral baseline
    
    if (avgApy > 12) sentimentScore += 15;
    else if (avgApy > 8) sentimentScore += 10;
    else if (avgApy < 5) sentimentScore -= 10;
    
    if (lowRiskCount / pools.length > 0.4) sentimentScore += 10;
    if (highTvlCount / pools.length > 0.3) sentimentScore += 10;
    if (highApyCount / pools.length > 0.3) sentimentScore -= 5; // Too much high APY might indicate risk

    let overall = 'neutral';
    if (sentimentScore > 70) overall = 'bullish';
    else if (sentimentScore > 55) overall = 'optimistic';
    else if (sentimentScore < 40) overall = 'bearish';
    else if (sentimentScore < 50) overall = 'cautious';

    return {
      overall,
      breakdown: {
        yield: avgApy > 10 ? 'positive' : avgApy > 6 ? 'neutral' : 'negative',
        liquidity: highTvlCount / pools.length > 0.3 ? 'positive' : 'neutral',
        risk: lowRiskCount / pools.length > 0.4 ? 'positive' : 'neutral'
      },
      confidence: Math.min(95, Math.max(60, sentimentScore + 20)),
      factors: [
        `Average APY: ${avgApy.toFixed(1)}%`,
        `${lowRiskCount} low-risk pools`,
        `${highTvlCount} high-TVL pools`,
        `${pools.length} total opportunities`
      ]
    };
  }
}