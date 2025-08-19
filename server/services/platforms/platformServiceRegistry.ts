import { BasePlatformService } from './basePlatformService';
import { MorphoPlatformService } from './morphoPlatformService';
import { LidoPlatformService } from './lidoPlatformService';
import type { PlatformApiConfig } from '@shared/schema';

export type PlatformServiceConstructor = new (
  config: PlatformApiConfig, 
  platformId: string, 
  platformName: string
) => BasePlatformService;

export class PlatformServiceRegistry {
  private static services: Map<string, PlatformServiceConstructor> = new Map();

  static {
    // Register built-in platform services
    this.registerService('morpho', MorphoPlatformService);
    this.registerService('lido', LidoPlatformService);
  }

  static registerService(apiType: string, serviceClass: PlatformServiceConstructor): void {
    this.services.set(apiType.toLowerCase(), serviceClass);
  }

  static createService(
    config: PlatformApiConfig, 
    platformId: string, 
    platformName: string
  ): BasePlatformService | null {
    const ServiceClass = this.services.get(config.apiType.toLowerCase());
    
    if (!ServiceClass) {
      console.warn(`No service registered for API type: ${config.apiType}`);
      return null;
    }

    return new ServiceClass(config, platformId, platformName);
  }

  static getSupportedTypes(): string[] {
    return Array.from(this.services.keys());
  }

  static isSupported(apiType: string): boolean {
    return this.services.has(apiType.toLowerCase());
  }

  static getServiceInfo(): Array<{ type: string; description: string }> {
    return [
      {
        type: 'morpho',
        description: 'Morpho Protocol API integration for vault data and APY information'
      },
      {
        type: 'lido',
        description: 'Lido Finance API integration for staking data and rewards'
      }
    ];
  }
}

// Example configurations for different platform types
export const defaultConfigurations = {
  morpho: {
    name: 'Morpho Main API',
    apiType: 'morpho',
    baseUrl: 'https://blue-api.morpho.org',
    endpoints: {
      vaults: '/graphql',
      vault: '/vaults/{address}',
      rewards: '/rewards',
    },
    headers: {
      'Content-Type': 'application/json',
    },
    rateLimit: 60,
    timeout: 30000,
  },
  lido: {
    name: 'Lido Main API',
    apiType: 'lido',
    baseUrl: 'https://eth-api.lido.fi',
    endpoints: {
      staking: '/v1/protocol/steth/apr/sma',
      stats: '/v1/protocol/steth/stats',
    },
    headers: {
      'Content-Type': 'application/json',
    },
    rateLimit: 60,
    timeout: 30000,
  },
};