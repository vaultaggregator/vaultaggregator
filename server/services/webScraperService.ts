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
      
      // Try multiple patterns to extract APY since DeFi Llama pages vary
      const apyPatterns = [
        /APY[:\s]*(\d+\.?\d*)\s*%/i,
        /(\d+\.?\d*)\s*%\s*APY/i,
        /"apy":(\d+\.?\d*)/i,
        /current.*?(\d+\.?\d*)\s*%/i
      ];
      let apy = 0;
      for (const pattern of apyPatterns) {
        const apyText = this.extractTextByPattern(document, pattern);
        if (apyText && parseFloat(apyText) > 0) {
          apy = parseFloat(apyText);
          break;
        }
      }
      
      // Extract 30d Average APY with multiple patterns
      const avgApyPatterns = [
        /30d\s*(?:avg|average)[:\s]*(\d+\.?\d*)\s*%/i,
        /average[:\s]*(\d+\.?\d*)\s*%/i
      ];
      let avgApy30d: number | undefined;
      for (const pattern of avgApyPatterns) {
        const avgApyText = this.extractTextByPattern(document, pattern);
        if (avgApyText && parseFloat(avgApyText) > 0) {
          avgApy30d = parseFloat(avgApyText);
          break;
        }
      }
      
      // Extract TVL with multiple patterns
      const tvlPatterns = [
        /TVL[:\s]*\$?([\d,.]+[bkmBKM]?)/i,
        /Total\s*Value\s*Locked[:\s]*\$?([\d,.]+[bkmBKM]?)/i,
        /"tvlUsd":(\d+\.?\d*)/i,
        /\$\s*([\d,.]+[bkmBKM]?)\s*TVL/i
      ];
      let tvl = '0';
      for (const pattern of tvlPatterns) {
        const tvlText = this.extractTextByPattern(document, pattern);
        if (tvlText && tvlText !== '0') {
          tvl = this.normalizeTVL(tvlText);
          break;
        }
      }
      
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
    const cleanTvl = tvlString.replace(/[$,]/g, '').trim();
    
    if (!cleanTvl) return '0';
    
    const lastChar = cleanTvl.slice(-1).toLowerCase();
    const numberStr = cleanTvl.slice(0, -1);
    const number = parseFloat(numberStr);
    
    if (isNaN(number)) return cleanTvl;
    
    switch (lastChar) {
      case 'k':
        return (number * 1000).toString();
      case 'm':
        return (number * 1000000).toString();
      case 'b':
        return (number * 1000000000).toString();
      default:
        // If no suffix, try to parse the whole string as a number
        const fullNumber = parseFloat(cleanTvl);
        return isNaN(fullNumber) ? '0' : fullNumber.toString();
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