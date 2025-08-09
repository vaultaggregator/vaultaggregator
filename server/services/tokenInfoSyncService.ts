import { storage } from "../storage";
import type { InsertTokenInfo } from "@shared/schema";

export class TokenInfoSyncService {
  private etherscanApiKey: string;

  constructor() {
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY || "demo";
  }

  async syncTokenInfo(poolId: string, rawData: any): Promise<void> {
    try {
      // Extract underlying token address from pool raw data
      const underlyingToken = rawData.underlyingToken || rawData.underlyingTokens?.[0];
      
      // Special handling for known pools
      if (poolId === 'd6a1f6b8-a970-4cc0-9f02-14da0152738e') {
        // Steakhouse pool
        const tokenAddress = '0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB';
        await this.fetchAndStoreTokenInfo(poolId, tokenAddress);
        return;
      }
      
      if (!underlyingToken) {
        console.log(`No underlying token found for pool ${poolId}`);
        return;
      }

      await this.fetchAndStoreTokenInfo(poolId, underlyingToken);
    } catch (error) {
      console.error(`Error syncing token info for pool ${poolId}:`, error);
    }
  }

  private async fetchAndStoreTokenInfo(poolId: string, tokenAddress: string): Promise<void> {
    try {
      // Check if token info already exists and is recent (updated within 24 hours)
      const existingTokenInfo = await storage.getTokenInfoByAddress(tokenAddress);
      if (existingTokenInfo && existingTokenInfo.lastUpdated) {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (existingTokenInfo.lastUpdated > dayAgo) {
          console.log(`Token info for ${tokenAddress} is up to date`);
          // Update pool to link to existing token info
          await this.linkPoolToTokenInfo(poolId, existingTokenInfo.id);
          return;
        }
      }

      // Fetch token information from Etherscan
      const tokenInfo = await this.fetchTokenInfoFromEtherscan(tokenAddress);
      if (!tokenInfo) {
        console.log(`Could not fetch token info for ${tokenAddress}`);
        return;
      }

      // Store or update token information
      const savedTokenInfo = await storage.upsertTokenInfo(tokenAddress, tokenInfo);
      
      // Link pool to token information
      await this.linkPoolToTokenInfo(poolId, savedTokenInfo.id);
      
      console.log(`Successfully synced token info for ${tokenAddress}`);
    } catch (error) {
      console.error(`Error fetching and storing token info for ${tokenAddress}:`, error);
    }
  }

  private async fetchTokenInfoFromEtherscan(address: string): Promise<InsertTokenInfo | null> {
    try {
      // First try the Etherscan API
      const apiTokenInfo = await this.fetchFromEtherscanAPI(address);
      if (apiTokenInfo) {
        return apiTokenInfo;
      }

      // If API fails, use web scraping as fallback
      return await this.scrapeTokenInfoFromEtherscan(address);
    } catch (error) {
      console.error(`Error fetching token info for ${address}:`, error);
      return null;
    }
  }

  private async fetchFromEtherscanAPI(address: string): Promise<InsertTokenInfo | null> {
    try {
      const baseUrl = "https://api.etherscan.io/api";
      
      // Get basic token info
      const tokenInfoUrl = `${baseUrl}?module=token&action=tokeninfo&contractaddress=${address}&apikey=${this.etherscanApiKey}`;
      const response = await fetch(tokenInfoUrl);
      const data = await response.json();
      
      if (data.status !== "1") {
        console.log(`Etherscan API failed for ${address}: ${data.message}`);
        return null;
      }
      
      const result = data.result[0];
      if (!result) {
        return null;
      }

      return {
        address,
        name: result.tokenName || "Unknown Token",
        symbol: result.symbol || "UNKNOWN",
        decimals: result.divisor || "18",
        totalSupply: result.totalSupply || "0",
        holdersCount: parseInt(result.holdersCount || "0"),
      };
    } catch (error) {
      console.error(`Etherscan API error for ${address}:`, error);
      return null;
    }
  }

  private async scrapeTokenInfoFromEtherscan(address: string): Promise<InsertTokenInfo | null> {
    try {
      const url = `https://etherscan.io/token/${address}`;
      console.log(`Scraping token data from: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log('Scraping failed: Response not OK');
        return null;
      }
      
      const html = await response.text();
      
      // Extract token name and symbol from page title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      let name = "Unknown Token";
      let symbol = "UNKNOWN";
      
      if (titleMatch) {
        const title = titleMatch[1];
        const tokenMatch = title.match(/(.+?)\s+\(([^)]+)\)/);
        if (tokenMatch) {
          name = tokenMatch[1].replace(/^.+?\s+/, '').trim(); // Remove "Token" prefix
          symbol = tokenMatch[2].trim();
        }
      }
      
      // Extract holders count
      const holdersMatch = html.match(/Holders[^>]*?(\d{1,3}(?:,\d{3})*)/);
      const holdersCount = holdersMatch ? parseInt(holdersMatch[1].replace(/,/g, '')) : 0;
      
      // Extract total supply
      const supplyMatch = html.match(/Max Total Supply[^>]*?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/);
      let totalSupply = "0";
      if (supplyMatch) {
        const supplyValue = supplyMatch[1].replace(/,/g, '');
        // Convert to wei (assuming 18 decimals)
        const parts = supplyValue.split('.');
        const wholePart = parts[0];
        const decimalPart = (parts[1] || '').padEnd(18, '0').slice(0, 18);
        totalSupply = wholePart + decimalPart;
      }
      
      // Extract decimals
      const decimalsMatch = html.match(/(\d+)\s+Decimals/);
      const decimals = decimalsMatch ? decimalsMatch[1] : "18";
      
      console.log(`Scraped data: name=${name}, symbol=${symbol}, holders=${holdersCount}, decimals=${decimals}`);
      
      return {
        address,
        name,
        symbol,
        decimals,
        totalSupply,
        holdersCount,
      };
    } catch (error) {
      console.log('Web scraping failed:', error);
      return null;
    }
  }

  private async linkPoolToTokenInfo(poolId: string, tokenInfoId: string): Promise<void> {
    try {
      await storage.updatePool(poolId, { tokenInfoId });
    } catch (error) {
      console.error(`Error linking pool ${poolId} to token info ${tokenInfoId}:`, error);
    }
  }
}