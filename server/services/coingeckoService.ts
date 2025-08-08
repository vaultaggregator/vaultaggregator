/**
 * CoinGecko API Service
 * Provides comprehensive cryptocurrency market data, prices, and analytics
 */

interface CoinGeckoTokenPrice {
  usd: number;
  usd_market_cap: number;
  usd_24h_vol: number;
  usd_24h_change: number;
  last_updated_at: number;
}

interface CoinGeckoTokenInfo {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
}

interface CoinGeckoMarketChart {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
  };
}

export class CoinGeckoService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly apiKey = process.env.COINGECKO_API_KEY || '';
  private rateLimitDelay = 1100; // CoinGecko free tier: 10-30 calls/minute
  private lastRequestTime = 0;

  /**
   * Rate limiting to respect API limits
   */
  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Make API request with rate limiting
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    try {
      await this.enforceRateLimit();
      
      const queryParams = new URLSearchParams(params);
      if (this.apiKey) {
        queryParams.append('x_cg_demo_api_key', this.apiKey);
      }
      
      const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
      console.log(`Fetching CoinGecko data from: ${endpoint}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('CoinGecko API request failed:', error);
      return null;
    }
  }

  /**
   * Get current price for multiple tokens by contract addresses
   */
  async getTokenPrices(contractAddresses: string[], platform: string = 'ethereum'): Promise<Record<string, CoinGeckoTokenPrice> | null> {
    if (!contractAddresses.length) return null;
    
    const addresses = contractAddresses.join(',');
    return this.makeRequest(`/simple/token_price/${platform}`, {
      contract_addresses: addresses,
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_vol: 'true',
      include_24hr_change: 'true',
      include_last_updated_at: 'true'
    });
  }

  /**
   * Get detailed token information by CoinGecko ID
   */
  async getTokenDetails(coinId: string): Promise<any> {
    return this.makeRequest(`/coins/${coinId}`, {
      localization: 'false',
      tickers: 'true',
      market_data: 'true',
      community_data: 'true',
      developer_data: 'true',
      sparkline: 'false'
    });
  }

  /**
   * Get token information by contract address
   */
  async getTokenByContract(contractAddress: string, platform: string = 'ethereum'): Promise<any> {
    return this.makeRequest(`/coins/${platform}/contract/${contractAddress}`);
  }

  /**
   * Get market chart data for a token
   */
  async getMarketChart(coinId: string, days: number = 30): Promise<CoinGeckoMarketChart | null> {
    return this.makeRequest(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days.toString(),
      interval: days > 90 ? 'daily' : 'hourly'
    });
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins(): Promise<{ coins: TrendingCoin[] } | null> {
    return this.makeRequest('/search/trending');
  }

  /**
   * Get global market data
   */
  async getGlobalData(): Promise<any> {
    return this.makeRequest('/global');
  }

  /**
   * Get top coins by market cap
   */
  async getTopCoins(limit: number = 100): Promise<CoinGeckoTokenInfo[] | null> {
    return this.makeRequest('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'false',
      price_change_percentage: '1h,24h,7d,30d'
    });
  }

  /**
   * Get DeFi market data
   */
  async getDefiData(): Promise<any> {
    return this.makeRequest('/global/decentralized_finance_defi');
  }

  /**
   * Search for coins
   */
  async searchCoins(query: string): Promise<any> {
    return this.makeRequest('/search', { query });
  }

  /**
   * Get historical price at a specific date
   */
  async getHistoricalPrice(coinId: string, date: string): Promise<any> {
    return this.makeRequest(`/coins/${coinId}/history`, {
      date, // format: dd-mm-yyyy
      localization: 'false'
    });
  }

  /**
   * Get OHLC data
   */
  async getOHLCData(coinId: string, days: number = 7): Promise<any> {
    const validDays = [1, 7, 14, 30, 90, 180, 365];
    const closestDays = validDays.reduce((prev, curr) => 
      Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev
    );
    
    return this.makeRequest(`/coins/${coinId}/ohlc`, {
      vs_currency: 'usd',
      days: closestDays.toString()
    });
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(): Promise<any> {
    return this.makeRequest('/exchange_rates');
  }
}

// Export singleton instance
export const coingeckoService = new CoinGeckoService();