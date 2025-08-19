import type { PlatformApiConfig, ApiResponseHistory, ApiCallLog } from "@shared/schema";

export interface PlatformDataResponse {
  apy?: number;
  tvl?: number;
  vaultInfo?: any;
  tokenInfo?: any;
  metadata?: any;
}

export interface ApiCallResult {
  success: boolean;
  data?: PlatformDataResponse;
  error?: string;
  responseTime: number;
  statusCode?: number;
}

export abstract class BasePlatformService {
  protected config: PlatformApiConfig;
  protected platformId: string;
  protected platformName: string;

  constructor(config: PlatformApiConfig, platformId: string, platformName: string) {
    this.config = config;
    this.platformId = platformId;
    this.platformName = platformName;
  }

  // Abstract methods that each platform must implement
  abstract fetchLiveData(): Promise<ApiCallResult>;
  abstract validateConfig(): Promise<boolean>;
  abstract getHealthStatus(): Promise<'healthy' | 'unhealthy' | 'unknown'>;

  // Common methods for all platforms
  async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = this.buildUrl(endpoint);
    const headers = {
      ...this.getDefaultHeaders(),
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  protected buildUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1) 
      : this.config.baseUrl;
    const cleanEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
  }

  protected getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Vault-Aggregator/1.0',
    };

    // Add custom headers from config
    if (this.config.headers) {
      Object.assign(headers, this.config.headers);
    }

    // Add credentials if available
    if (this.config.credentials) {
      const creds = this.config.credentials as any;
      if (creds.apiKey) {
        headers['Authorization'] = `Bearer ${creds.apiKey}`;
      }
      if (creds.xApiKey) {
        headers['X-API-Key'] = creds.xApiKey;
      }
    }

    return headers;
  }

  protected handleRateLimit(): void {
    // Basic rate limiting implementation
    const rateLimit = this.config.rateLimit || 60;
    // This is a simple implementation - in production you'd want more sophisticated rate limiting
    console.log(`Rate limit for ${this.platformName}: ${rateLimit} requests/minute`);
  }

  protected extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // Utility method to create API call result
  protected createResult(
    success: boolean, 
    data?: PlatformDataResponse, 
    error?: string, 
    responseTime: number = 0,
    statusCode?: number
  ): ApiCallResult {
    return {
      success,
      data,
      error,
      responseTime,
      statusCode,
    };
  }
}