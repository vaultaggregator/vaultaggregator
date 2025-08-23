import { InsertServiceConfiguration } from "@shared/schema";

/**
 * Default service configurations - used for initial seeding
 */
export const DEFAULT_SERVICE_CONFIGS: Record<string, Omit<InsertServiceConfiguration, 'id' | 'createdAt' | 'updatedAt'>> = {
  poolDataSync: {
    serviceName: "poolDataSync",
    displayName: "Pool Data Sync",
    description: "Synchronizes APY and TVL data from Morpho and Lido APIs",
    intervalMinutes: 5,
    isEnabled: true,
    category: "sync",
    priority: 1,
  },
  
  
  morphoApiSync: {
    serviceName: "morphoApiSync",
    displayName: "Morpho API Sync", 
    description: "Fast sync for Morpho protocol data",
    intervalMinutes: 3,
    isEnabled: true,
    category: "sync",
    priority: 1,
  },
  
  aiOutlookGeneration: {
    serviceName: "aiOutlookGeneration",
    displayName: "AI Market Insights",
    description: "Generates AI-powered market predictions and insights",
    intervalMinutes: 1440, // 24 hours
    isEnabled: true,
    category: "ai",
    priority: 3,
  },
  
  cleanup: {
    serviceName: "cleanup",
    displayName: "Database Cleanup",
    description: "Removes old data and optimizes database performance",
    intervalMinutes: 86400, // 60 days 
    isEnabled: false, // Disabled due to database errors
    category: "cleanup",
    priority: 3,
  },
  
  etherscanScraper: {
    serviceName: "etherscanScraper",
    displayName: "Etherscan Scraper",
    description: "Scrapes contract creation dates from Etherscan",
    intervalMinutes: 30,
    isEnabled: true,
    category: "sync",
    priority: 2,
  },
  
  tokenPriceSync: {
    serviceName: "tokenPriceSync",
    displayName: "Token Price Sync",
    description: "Updates token pricing information",
    intervalMinutes: 10,
    isEnabled: true,
    category: "sync",
    priority: 2,
  },
  
  historicalDataSync: {
    serviceName: "historicalDataSync",
    displayName: "Historical Data Sync",
    description: "Syncs historical APY and TVL data",
    intervalMinutes: 60,
    isEnabled: true,
    category: "sync",
    priority: 2,
  },
  
  alchemyHealthCheck: {
    serviceName: "alchemyHealthCheck",
    displayName: "Alchemy Health Check",
    description: "Monitors Alchemy API health and connectivity",
    intervalMinutes: 2,
    isEnabled: true,
    category: "monitoring",
    priority: 1,
  },
  
  
  poolHoldersSync: {
    serviceName: "poolHoldersSync",
    displayName: "Pool Holders Sync", 
    description: "Fetches individual pool holder addresses from Moralis and balances from Alchemy (max 15 holders per pool)",
    intervalMinutes: 30,
    isEnabled: true,
    category: "sync",
    priority: 2,
  },
};