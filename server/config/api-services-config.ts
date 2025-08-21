import { type InsertApiSettings } from "@shared/schema";

/**
 * Centralized configuration for all external API services
 * Add new APIs here and they will automatically appear in the admin panel
 */
export const API_SERVICES_CONFIG: Record<string, Omit<InsertApiSettings, 'id' | 'createdAt' | 'updatedAt'>> = {
  // Blockchain Data APIs
  alchemy_api: {
    serviceName: "alchemy_api",
    displayName: "Alchemy API",
    description: "Blockchain data provider for token holders, metadata, and balances",
    baseUrl: "https://eth-mainnet.g.alchemy.com/v2/",
    isEnabled: true,
    category: "blockchain",
    priority: 1,
    rateLimitRpm: 300,
    healthStatus: "healthy",
  },
  
  etherscan_api: {
    serviceName: "etherscan_api",
    displayName: "Etherscan API",
    description: "Ethereum blockchain explorer API for contract info and transaction data",
    baseUrl: "https://api.etherscan.io/api",
    isEnabled: true,
    category: "blockchain",
    priority: 1,
    rateLimitRpm: 200,
    healthStatus: "healthy",
  },

  // DeFi Protocol APIs
  morpho_api: {
    serviceName: "morpho_api",
    displayName: "Morpho API",
    description: "GraphQL API for Morpho pool APY and TVL data",
    baseUrl: "https://api.morpho.org/graphql",
    isEnabled: true,
    category: "data",
    priority: 1,
    rateLimitRpm: 30,
    healthStatus: "healthy",
  },
  
  lido_api: {
    serviceName: "lido_api",
    displayName: "Lido API",
    description: "Official Lido API for stETH APR data",
    baseUrl: "https://eth-api.lido.fi/v1",
    isEnabled: true,
    category: "data",
    priority: 1,
    rateLimitRpm: 60,
    healthStatus: "healthy",
  },

  // AI/ML APIs
  openai_api: {
    serviceName: "openai_api",
    displayName: "OpenAI API",
    description: "AI-powered market predictions and insights using GPT models",
    baseUrl: "https://api.openai.com/v1",
    isEnabled: true,
    category: "ai",
    priority: 2,
    rateLimitRpm: 60,
    healthStatus: "healthy",
  },

  // Token Data APIs
  moralis_api: {
    serviceName: "moralis_api",
    displayName: "Moralis API",
    description: "Cost-effective blockchain data provider for token holders and on-chain analytics",
    baseUrl: "https://deep-index.moralis.io/api/v2.2",
    isEnabled: true,
    category: "blockchain",
    priority: 1,
    rateLimitRpm: 3000, // Moralis has higher rate limits
    healthStatus: "healthy",
  },

  // Future APIs can be added here:
  // Example:
  // coingecko_api: {
  //   serviceName: "coingecko_api",
  //   displayName: "CoinGecko API",
  //   description: "Cryptocurrency price and market data",
  //   baseUrl: "https://api.coingecko.com/api/v3",
  //   isEnabled: true,
  //   category: "data",
  //   priority: 2,
  //   rateLimitRpm: 100,
  //   healthStatus: "healthy",
  // },
};

/**
 * Get all configured API services
 */
export function getAllApiServicesConfig(): Record<string, Omit<InsertApiSettings, 'id' | 'createdAt' | 'updatedAt'>> {
  return API_SERVICES_CONFIG;
}

/**
 * Get API service config by service name
 */
export function getApiServiceConfig(serviceName: string): Omit<InsertApiSettings, 'id' | 'createdAt' | 'updatedAt'> | undefined {
  return API_SERVICES_CONFIG[serviceName];
}

/**
 * Get all service names
 */
export function getAllServiceNames(): string[] {
  return Object.keys(API_SERVICES_CONFIG);
}

/**
 * Check if a service is configured
 */
export function isServiceConfigured(serviceName: string): boolean {
  return serviceName in API_SERVICES_CONFIG;
}