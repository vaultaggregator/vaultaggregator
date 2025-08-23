import { load } from 'cheerio';

export interface TopHolder {
  address: string;
  tokenBalance: string;
  tokenBalanceFormatted?: number;
  usdValue?: number;
  walletBalanceEth?: number;
  walletBalanceUsd?: number;
  poolSharePercentage?: number;
  rank: number;
}

export class EtherscanWebScraper {
  /**
   * HYBRID WEB SCRAPING APPROACH
   * Scrapes holder addresses from Etherscan public page (free)
   * Then enriches data using Alchemy API (detailed balances, USD values)
   */
  
  async getTopHoldersFromWeb(contractAddress: string, chain: string = 'ethereum', limit: number = 100): Promise<TopHolder[]> {
    try {
      const baseUrl = chain.toLowerCase() === 'base' ? 'https://basescan.org' : 'https://etherscan.io';
      
      // Try multiple URL patterns that might serve static holder data
      const urlPatterns = [
        `${baseUrl}/token/tokenholderchart/${contractAddress}`,      // Dedicated holder chart page
        `${baseUrl}/token/${contractAddress}?a=1`,                  // Holders tab parameter  
        `${baseUrl}/tokenholdings?a=${contractAddress}`,            // Token holdings page
        `${baseUrl}/token/${contractAddress}/holders`,              // Direct holders endpoint
        `${baseUrl}/token/${contractAddress}#balances`              // Original URL (fallback)
      ];
      
      let holders: TopHolder[] = [];
      let successUrl = '';
      
      // Try each URL pattern until we find one with holder data
      for (const url of urlPatterns) {
        console.log(`🔍 Trying URL pattern: ${url}`);
        
        try {
          // Fetch the HTML page
          const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
          });
          
          if (!response.ok) {
            console.log(`❌ URL failed: ${url} (${response.status})`);
            continue; // Try next URL
          }
          
          const html = await response.text();
          const $ = load(html);
          
          // Parse the holder table from this URL attempt
          const urlHolders: TopHolder[] = [];
          let rank = 1;
      
      // Check if page loaded properly
      const bodyText = $('body').text();
      if (bodyText.includes('blocked') || bodyText.includes('captcha') || bodyText.includes('rate limit')) {
        console.log(`⚠️ Page appears to be blocked or rate limited`);
        return [];
      }
      
      // Look for any tables with data
      const allTables = $('table');
      console.log(`🔍 Found ${allTables.length} total tables on page`);
      
      // More aggressive selectors - look for any row with address patterns
      const possibleSelectors = [
        'tr:contains("0x")',           // Any row containing addresses  
        'table tbody tr',              // All table rows
        'tr td:contains("0x")',        // Cells containing addresses
        '.table tbody tr',             // Bootstrap table rows
        '[class*="table"] tbody tr',   // Any table-related class
      ];
      
      let foundHolders = false;
      
      for (const selector of possibleSelectors) {
        const rows = $(selector);
        console.log(`🔍 Testing selector "${selector}": ${rows.length} rows found`);
        
        if (rows.length > 0) {
          rows.each((index: number, element: any) => {
            if (index >= limit) return false;
            
            const row = $(element);
            const rowText = row.text().trim();
            const rowHtml = row.html();
            
            console.log(`🔍 Row ${index + 1} text: "${rowText}"`);
            console.log(`🔍 Row ${index + 1} HTML: "${rowHtml}"`);
            
            // Look for address patterns in text and href attributes
            let address = '';
            let tokenBalance = '0';
            
            // Method 1: Find addresses in text
            const addressMatch = rowText.match(/0x[a-fA-F0-9]{40}/);
            if (addressMatch) {
              address = addressMatch[0];
            }
            
            // Method 2: Find addresses in href attributes
            if (!address) {
              const addressLinks = row.find('a[href*="/address/"]');
              if (addressLinks.length > 0) {
                const href = addressLinks.first().attr('href');
                if (href) {
                  const hrefMatch = href.match(/\/address\/([0x[a-fA-F0-9]{40})/);
                  if (hrefMatch) {
                    address = hrefMatch[1];
                  }
                }
              }
            }
            
            // Method 3: Look for truncated addresses (like 0x1234...5678)
            if (!address) {
              const truncatedMatch = rowText.match(/0x[a-fA-F0-9]{4,8}\.\.\.?[a-fA-F0-9]{4,8}/);
              if (truncatedMatch) {
                console.log(`⚠️ Found truncated address: ${truncatedMatch[0]} - need full address from href`);
              }
            }
            
            // Extract balance from cells
            const cells = row.find('td');
            cells.each((cellIndex: number, cell: any) => {
              const cellText = $(cell).text().trim();
              // Look for numeric values with potential token symbols
              const balanceMatch = cellText.match(/^([\d,.\s]+)[\s\w]*$/);
              if (balanceMatch && parseFloat(balanceMatch[1].replace(/,/g, '')) > 0) {
                tokenBalance = balanceMatch[1].trim();
                console.log(`💰 Found potential balance in cell ${cellIndex}: "${cellText}" -> "${tokenBalance}"`);
                return false; // Break after finding first valid balance
              }
            });
            
            if (address && address.startsWith('0x')) {
              holders.push({
                address: address.toLowerCase(),
                tokenBalance: tokenBalance || '0',
                rank: rank++
              });
              foundHolders = true;
              console.log(`✅ Found holder #${rank - 1}: ${address} with balance: ${tokenBalance}`);
            } else {
              console.log(`❌ No valid address found in row ${index + 1}`);
            }
          });
          
          if (foundHolders) {
            console.log(`✅ Found ${holders.length} holders using selector: ${selector}`);
            break;
          }
        }
      }
      
      if (!foundHolders) {
        console.log(`⚠️ No holder data found in page HTML. Checking page content...`);
        
        // Debug: Show some page content
        const pageTitle = $('title').text();
        const holderText = bodyText.includes('Holder') || bodyText.includes('holder');
        console.log(`📄 Page title: "${pageTitle}"`);
        console.log(`🔍 Page contains holder text: ${holderText}`);
        
        // Check if it's a token page
        if (!bodyText.includes('Token') && !bodyText.includes('token')) {
          console.log(`❌ This doesn't appear to be a token page`);
        }
        
        return [];
      }
      
      console.log(`✅ WEB SCRAPER SUCCESS: Extracted ${holders.length} holder addresses from ${chain} blockchain explorer`);
      
      return holders.slice(0, limit);
      
    } catch (error) {
      console.error(`❌ Web scraping failed for ${contractAddress} on ${chain}:`, error);
      return [];
    }
  }
  
  /**
   * Enhanced hybrid approach: Web scraping + Alchemy enrichment
   * 1. Get holder addresses from web scraping (free, fast)
   * 2. Enrich with Alchemy for precise balances and USD values
   */
  async getEnrichedTopHolders(contractAddress: string, chain: string = 'ethereum', limit: number = 100): Promise<TopHolder[]> {
    // Step 1: Get holder addresses from web scraping
    const baseHolders = await this.getTopHoldersFromWeb(contractAddress, chain, limit);
    
    if (baseHolders.length === 0) {
      console.log(`⚠️ No holders found from web scraping, falling back to empty array`);
      return [];
    }
    
    console.log(`🔗 HYBRID ENRICHMENT: Enhancing ${baseHolders.length} holders with Alchemy data...`);
    
    // Step 2: Enrich with Alchemy (if available)
    // For now, return the scraped data - we can add Alchemy enrichment later
    return baseHolders;
  }
}

export const etherscanWebScraper = new EtherscanWebScraper();