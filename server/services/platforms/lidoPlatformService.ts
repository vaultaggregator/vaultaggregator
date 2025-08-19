import { BasePlatformService } from './basePlatformService';
import type { ApiCallResult, PlatformDataResponse } from './basePlatformService';

export class LidoPlatformService extends BasePlatformService {
  async fetchLiveData(): Promise<ApiCallResult> {
    const startTime = Date.now();
    
    try {
      this.handleRateLimit();
      
      const endpoints = this.config.endpoints as any;
      if (!endpoints?.staking) {
        throw new Error('Lido staking endpoint not configured');
      }

      const response = await this.makeApiCall(endpoints.staking);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return this.createResult(
          false, 
          undefined, 
          `Lido API responded with ${response.status}: ${response.statusText}`,
          responseTime,
          response.status
        );
      }

      const data = await response.json();
      
      // Extract relevant data from Lido API response
      const platformData: PlatformDataResponse = {
        vaultInfo: data,
        metadata: {
          source: 'lido_api',
          timestamp: new Date().toISOString(),
          endpoint: endpoints.staking,
        }
      };

      // Extract APY and TVL from Lido response
      if (data) {
        platformData.apy = data.apr || data.apy || data.stakingApr;
        platformData.tvl = data.totalStaked || data.tvl;
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
      if (!endpoints?.staking) {
        return false;
      }

      const response = await this.makeApiCall(endpoints.staking, { method: 'HEAD' });
      return response.ok;
    } catch (error: any) {
      console.error(`Lido config validation failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<'healthy' | 'unhealthy' | 'unknown'> {
    try {
      const result = await this.fetchLiveData();
      return result.success ? 'healthy' : 'unhealthy';
    } catch (error: any) {
      console.error(`Lido health check failed: ${error.message}`);
      return 'unhealthy';
    }
  }

  // Lido-specific methods
  async fetchStakingInfo(): Promise<ApiCallResult> {
    const startTime = Date.now();
    
    try {
      const endpoints = this.config.endpoints as any;
      const stakingEndpoint = endpoints?.staking || '/staking/stats';
      
      const response = await this.makeApiCall(stakingEndpoint);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        return this.createResult(
          false, 
          undefined, 
          `Lido staking API responded with ${response.status}: ${response.statusText}`,
          responseTime,
          response.status
        );
      }

      const data = await response.json();
      
      const platformData: PlatformDataResponse = {
        vaultInfo: data,
        apy: data.apr || data.apy || data.stakingApr,
        tvl: data.totalStaked || data.tvl,
        metadata: {
          source: 'lido_api',
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