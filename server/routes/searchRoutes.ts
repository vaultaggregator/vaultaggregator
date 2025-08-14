/**
 * Search API Routes
 * Provides fast, fuzzy search across pools, platforms, chains, and tokens
 */

import { Router } from 'express';
import { db } from '../db';
import { pools, platforms, chains, tokenInfo } from '@shared/schema';
import { like, or, and, eq, sql } from 'drizzle-orm';

const router = Router();

/**
 * Fuzzy search implementation
 */
function createSearchPattern(query: string): string {
  // Create a fuzzy search pattern
  return `%${query.toLowerCase().replace(/\s+/g, '%')}%`;
}

/**
 * Score search results for relevance
 */
function scoreResult(item: any, query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  
  // Exact match gets highest score
  if (item.name?.toLowerCase() === q || item.displayName?.toLowerCase() === q) {
    score += 100;
  }
  // Starting with query gets high score
  else if (item.name?.toLowerCase().startsWith(q) || item.displayName?.toLowerCase().startsWith(q)) {
    score += 50;
  }
  // Contains query gets medium score
  else if (item.name?.toLowerCase().includes(q) || item.displayName?.toLowerCase().includes(q)) {
    score += 25;
  }
  
  // Bonus for popular items (high TVL)
  if (item.tvl) {
    const tvlNum = parseFloat(item.tvl);
    if (tvlNum > 1000000000) score += 20; // $1B+
    else if (tvlNum > 100000000) score += 15; // $100M+
    else if (tvlNum > 10000000) score += 10; // $10M+
  }
  
  // Bonus for high APY
  if (item.apy) {
    const apyNum = parseFloat(item.apy);
    if (apyNum > 20) score += 15;
    else if (apyNum > 10) score += 10;
    else if (apyNum > 5) score += 5;
  }
  
  return score;
}

/**
 * Main search endpoint
 */
router.get('/api/search', async (req, res) => {
  try {
    const { q, limit = '10', type } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ pools: [], platforms: [], chains: [], tokens: [] });
    }
    
    const searchPattern = createSearchPattern(q);
    const maxResults = Math.min(parseInt(limit as string) || 10, 50);
    const results: any = {};
    
    // Search pools
    if (!type || type === 'pools') {
      const poolResults = await db
        .select({
          id: pools.id,
          tokenPair: pools.tokenPair,
          apy: pools.apy,
          tvl: pools.tvl,
          riskLevel: pools.riskLevel,
          platform: {
            id: platforms.id,
            name: platforms.name,
            displayName: platforms.displayName,
            slug: platforms.slug
          },
          chain: {
            id: chains.id,
            name: chains.name,
            displayName: chains.displayName
          }
        })
        .from(pools)
        .leftJoin(platforms, eq(pools.platformId, platforms.id))
        .leftJoin(chains, eq(pools.chainId, chains.id))
        .where(
          and(
            eq(pools.isVisible, true),
            or(
              like(sql`LOWER(${pools.tokenPair})`, searchPattern),
              like(sql`LOWER(${platforms.displayName})`, searchPattern),
              like(sql`LOWER(${chains.displayName})`, searchPattern)
            )
          )
        )
        .limit(maxResults);
      
      // Score and sort results
      results.pools = poolResults
        .map(pool => ({
          ...pool,
          score: scoreResult({ ...pool, name: pool.tokenPair }, q as string)
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...pool }) => pool);
    }
    
    // Search platforms
    if (!type || type === 'platforms') {
      const platformResults = await db
        .select()
        .from(platforms)
        .where(
          and(
            eq(platforms.isActive, true),
            or(
              like(sql`LOWER(${platforms.name})`, searchPattern),
              like(sql`LOWER(${platforms.displayName})`, searchPattern)
            )
          )
        )
        .limit(maxResults);
      
      results.platforms = platformResults
        .map(platform => ({
          ...platform,
          score: scoreResult(platform, q as string)
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...platform }) => platform);
    }
    
    // Search chains
    if (!type || type === 'chains') {
      const chainResults = await db
        .select()
        .from(chains)
        .where(
          and(
            eq(chains.isActive, true),
            or(
              like(sql`LOWER(${chains.name})`, searchPattern),
              like(sql`LOWER(${chains.displayName})`, searchPattern)
            )
          )
        )
        .limit(maxResults);
      
      results.chains = chainResults
        .map(chain => ({
          ...chain,
          score: scoreResult(chain, q as string)
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...chain }) => chain);
    }
    
    // Search tokens
    if (!type || type === 'tokens') {
      const tokenResults = await db
        .select()
        .from(tokenInfo)
        .where(
          or(
            like(sql`LOWER(${tokenInfo.symbol})`, searchPattern),
            like(sql`LOWER(${tokenInfo.name})`, searchPattern),
            like(sql`LOWER(${tokenInfo.address})`, searchPattern)
          )
        )
        .limit(maxResults);
      
      results.tokens = tokenResults
        .map(token => ({
          ...token,
          score: scoreResult({ ...token, displayName: token.symbol }, q as string)
        }))
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...token }) => token);
    }
    
    // Add search analytics (optional)
    console.log(`🔍 Search query: "${q}" returned ${
      (results.pools?.length || 0) + 
      (results.platforms?.length || 0) + 
      (results.chains?.length || 0) + 
      (results.tokens?.length || 0)
    } results`);
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * Get search suggestions (autocomplete)
 */
router.get('/api/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 1) {
      return res.json({ suggestions: [] });
    }
    
    const searchPattern = `${q.toLowerCase()}%`;
    const suggestions = new Set<string>();
    
    // Get pool token pairs
    const poolSuggestions = await db
      .select({ tokenPair: pools.tokenPair })
      .from(pools)
      .where(
        and(
          eq(pools.isVisible, true),
          like(sql`LOWER(${pools.tokenPair})`, searchPattern)
        )
      )
      .limit(5);
    
    poolSuggestions.forEach(p => suggestions.add(p.tokenPair));
    
    // Get platform names
    const platformSuggestions = await db
      .select({ displayName: platforms.displayName })
      .from(platforms)
      .where(
        and(
          eq(platforms.isActive, true),
          like(sql`LOWER(${platforms.displayName})`, searchPattern)
        )
      )
      .limit(5);
    
    platformSuggestions.forEach(p => suggestions.add(p.displayName));
    
    // Get chain names
    const chainSuggestions = await db
      .select({ displayName: chains.displayName })
      .from(chains)
      .where(
        and(
          eq(chains.isActive, true),
          like(sql`LOWER(${chains.displayName})`, searchPattern)
        )
      )
      .limit(5);
    
    chainSuggestions.forEach(c => suggestions.add(c.displayName));
    
    res.json({ suggestions: Array.from(suggestions).slice(0, 10) });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * Get trending searches
 */
router.get('/api/search/trending', async (req, res) => {
  try {
    // Get top pools by TVL as trending
    const trending = await db
      .select({
        id: pools.id,
        tokenPair: pools.tokenPair,
        apy: pools.apy,
        tvl: pools.tvl,
        platform: platforms.displayName,
        chain: chains.displayName
      })
      .from(pools)
      .leftJoin(platforms, eq(pools.platformId, platforms.id))
      .leftJoin(chains, eq(pools.chainId, chains.id))
      .where(eq(pools.isVisible, true))
      .orderBy(sql`CAST(${pools.tvl} AS DECIMAL) DESC`)
      .limit(5);
    
    res.json({ trending });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to get trending' });
  }
});

export default router;