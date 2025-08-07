import { JSDOM } from 'jsdom';

export interface ScrapedPoolData {
  name: string;
  apy: number;
  avgApy30d?: number;
  tvl: string;
  riskRating?: string;
  category?: string;
  audited?: boolean;
  website?: string;
  twitter?: string;
  outlook?: string;
  confidence?: string;
}

export class WebScraperService {
  
  async scrapeDefiLlamaPool(poolId: string): Promise<ScrapedPoolData | null> {
    try {
      const url = `https://defillama.com/yields/pool/${poolId}`;
      console.log(`Scraping DeFi Llama pool: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch page: ${response.status}`);
        return null;
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Extract pool name from title or heading
      const titleElement = document.querySelector('h1') || document.querySelector('title');
      const name = titleElement?.textContent?.trim() || 'Unknown Pool';
      
      // Extract APY - look for percentage values
      const apyText = this.extractTextByPattern(document, /APY(\s*)([\d.]+)%/i);
      const apy = apyText ? parseFloat(apyText) : 0;
      
      // Extract 30d Average APY
      const avgApyText = this.extractTextByPattern(document, /30d\s+Avg\s+APY(\s*)([\d.]+)%/i);
      const avgApy30d = avgApyText ? parseFloat(avgApyText) : undefined;
      
      // Extract TVL
      const tvlText = this.extractTextByPattern(document, /Total\s+Value\s+Locked(\s*)\$?([\d.]+[bkmBKM]?)/i);
      const tvl = tvlText ? this.normalizeTVL(tvlText) : '0';
      
      // Extract risk rating
      const riskText = this.extractTextByPattern(document, /Risk\s+Rating(\s*)([A-F][+-]?)/i);
      const riskRating = riskText || undefined;
      
      // Extract category
      const categoryText = this.extractTextByPattern(document, /Category:?\s*([^\\n]+)/i);
      const category = categoryText?.trim() || undefined;
      
      // Check for audits
      const auditText = document.body.textContent || '';
      const audited = /Audits:?\s*Yes/i.test(auditText);
      
      // Extract website and twitter links
      const website = this.extractLink(document, 'Website');
      const twitter = this.extractLink(document, 'Twitter');
      
      // Extract outlook information
      const outlookText = this.extractTextByPattern(document, /Outlook(.{0,200})/i);
      const outlook = outlookText?.substring(0, 200) || undefined;
      
      // Extract confidence
      const confidenceText = this.extractTextByPattern(document, /Confidence:\s*(\w+)/i);
      const confidence = confidenceText || undefined;
      
      const scrapedData: ScrapedPoolData = {
        name,
        apy,
        avgApy30d,
        tvl,
        riskRating,
        category,
        audited,
        website,
        twitter,
        outlook,
        confidence
      };
      
      console.log('Scraped data:', scrapedData);
      return scrapedData;
      
    } catch (error) {
      console.error('Error scraping DeFi Llama pool:', error);
      return null;
    }
  }
  
  private extractTextByPattern(document: Document, pattern: RegExp): string | null {
    const bodyText = document.body.textContent || '';
    const match = bodyText.match(pattern);
    return match ? (match[2] || match[1]) : null;
  }
  
  private extractLink(document: Document, linkText: string): string | undefined {
    const links = Array.from(document.querySelectorAll('a'));
    const link = links.find(a => a.textContent?.toLowerCase().includes(linkText.toLowerCase()));
    return link?.href || undefined;
  }
  
  private normalizeTVL(tvlString: string): string {
    // Convert abbreviated numbers to full format
    const cleanTvl = tvlString.replace(/\$/, '').trim();
    const lastChar = cleanTvl.slice(-1).toLowerCase();
    const number = parseFloat(cleanTvl.slice(0, -1));
    
    switch (lastChar) {
      case 'k':
        return (number * 1000).toString();
      case 'm':
        return (number * 1000000).toString();
      case 'b':
        return (number * 1000000000).toString();
      default:
        return cleanTvl;
    }
  }
  
  async scrapeMultiplePools(poolIds: string[]): Promise<Record<string, ScrapedPoolData | null>> {
    const results: Record<string, ScrapedPoolData | null> = {};
    
    // Process pools in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < poolIds.length; i += batchSize) {
      const batch = poolIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (poolId) => {
        const data = await this.scrapeDefiLlamaPool(poolId);
        return { poolId, data };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ poolId, data }) => {
        results[poolId] = data;
      });
      
      // Add delay between batches to be respectful
      if (i + batchSize < poolIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export const webScraperService = new WebScraperService();