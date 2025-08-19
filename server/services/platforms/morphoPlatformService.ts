import { BasePlatformService } from './basePlatformService';
import type { ApiCallResult, PlatformDataResponse } from './basePlatformService';

export class MorphoPlatformService extends BasePlatformService {
  async fetchLiveData(): Promise<ApiCallResult> {
    const startTime = Date.now();
    
    try {
      this.handleRateLimit();
      
      const endpoints = this.config.endpoints as any;
      if (!endpoints?.vaults) {
        throw new Error('Morpho vaults endpoint not configured');
      }

      const response = await this.makeApiCall(endpoints.vaults);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return this.createResult(
          false, 
          undefined, 
          `Morpho API responded with ${response.status}: ${response.statusText}`,
          responseTime,
          response.status
        );
      }

      const data = await response.json();
      
      // Extract relevant data from Morpho API response
      const platformData: PlatformDataResponse = {
        vaultInfo: data,
        metadata: {
          source: 'morpho_api',
          timestamp: new Date().toISOString(),
          endpoint: endpoints.vaults,
        }
      };

      // If we have vault data, extract APY and TVL
      if (data && Array.isArray(data)) {
        const vault = data[0]; // Assuming we're interested in the first vault
        if (vault) {
          platformData.apy = vault.apy || vault.netApy || vault.supplyApy;
          platformData.tvl = vault.tvl || vault.totalSupply;
        }
      }

      return this.createResult(true, platformData, undefined, responseTime, response.status);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return this.createResult(
        false, 
        undefined, 
        this.extractErrorMessage(error),
        responseTime
      );
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const endpoints = this.config.endpoints as any;
      if (!endpoints?.vaults) {
        return false;
      }

      const response = await this.makeApiCall(endpoints.vaults, { method: 'HEAD' });
      return response.ok;
    } catch (error: any) {
      console.error(`Morpho config validation failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    try {
      const result = await this.fetchLiveData();
      return result.success ? 'healthy' : 'unhealthy';
    } catch (error: any) {
      console.error(`Morpho health check failed: ${error.message}`);
      return 'unhealthy';
    }
  }

  // Morpho-specific methods
  async fetchVaultByAddress(vaultAddress: string): Promise<ApiCallResult> {
    const startTime = Date.now();
    
    try {
      const endpoints = this.config.endpoints as any;
      const vaultEndpoint = endpoints?.vault || `/vaults/${vaultAddress}`;
      
      const response = await this.makeApiCall(vaultEndpoint);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return this.createResult(
          false, 
          undefined, 
          `Morpho vault API responded with ${response.status}: ${response.statusText}`,
          responseTime,
          response.status
        );
      }

      const data = await response.json();
      
      const platformData: PlatformDataResponse = {
        vaultInfo: data,
        apy: data.apy || data.netApy || data.supplyApy,
        tvl: data.tvl || data.totalSupply,
        metadata: {
          source: 'morpho_api',
          vaultAddress,
          timestamp: new Date().toISOString(),
        }
      };

      return this.createResult(true, platformData, undefined, responseTime, response.status);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return this.createResult(
        false, 
        undefined, 
        this.extractErrorMessage(error),
        responseTime
      );
    }
  }
}