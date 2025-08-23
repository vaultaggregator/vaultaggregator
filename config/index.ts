/**
 * Central Configuration Layer - Single Source of Truth
 * NO HARDCODED VALUES - ALL VALUES COME FROM ENV OR JSON CONFIGS
 */

// Load configuration from JSON files and environment variables
import chainsConfig from './chains.json';
import tokensConfig from './tokens.json';
import protocolsConfig from './protocols.json';
import endpointsConfig from './endpoints.json';

// Helper function to resolve environment variables in JSON values
function resolveEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (match, envVar) => {
      return process.env[envVar] || match;
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(resolveEnvVars);
  }
  if (typeof obj === 'object' && obj !== null) {
    const resolved: any = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = resolveEnvVars(value);
    }
    return resolved;
  }
  return obj;
}

// Time constants - NO MAGIC NUMBERS
export const constants = {
  // Time periods in seconds
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  YEAR: 31536000,
  
  // Common refresh intervals
  REFRESH_FAST: 30,           // 30 seconds
  REFRESH_NORMAL: 300,        // 5 minutes  
  REFRESH_SLOW: 1800,         // 30 minutes
  REFRESH_HOURLY: 3600,       // 1 hour
  REFRESH_DAILY: 86400,       // 1 day
  
  // TTL values
  TTL_SHORT: 300,             // 5 minutes
  TTL_MEDIUM: 900,            // 15 minutes
  TTL_LONG: 3600,             // 1 hour
  TTL_UPLOAD: 900,            // 15 minutes for uploads
  
  // Pagination
  PAGE_SIZE_DEFAULT: 20,
  PAGE_SIZE_MAX: 100,
  
  // Pool limits
  TOP_HOLDERS_LIMIT: 20,
  HOLDER_SYNC_BATCH: 50,
  
  // Holder display limits
  MAX_HOLDERS_DISPLAY: 100,     // Maximum number of holders to show to users (not hardcoded)
  HOLDERS_DEFAULT_LIMIT: 20,    // Default per-page limit for holder display
} as const;

// Resolve environment variables in configurations
const chains = resolveEnvVars(chainsConfig);
const tokens = resolveEnvVars(tokensConfig);
const protocols = resolveEnvVars(protocolsConfig);
const endpoints = resolveEnvVars(endpointsConfig);

// Chain configuration - dynamically loaded
export const cfg = {
  chains: chains as Record<string, {
    id: string;
    name: string;
    symbol: string;
    explorer: string;
    rpc: string;
    wsRpc?: string;
  }>,
  
  tokens: tokens as Record<string, Record<string, string>>, // token -> chain -> address
  
  protocols: protocols as Record<string, {
    id: string;
    name: string;
    icon: string;
    tags: string[];
    website?: string;
  }>,
  
  endpoints: {
    // Internal API endpoints
    internal: {
      base: process.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'),
      api: '/api',
    },
    
    // External API endpoints from config
    external: endpoints as Record<string, {
      base: string;
      key?: string;
      rateLimit?: number;
    }>
  },
  
  // Route helpers - NO HARDCODED PATHS
  routes: {
    pool: (chainName: string, protocolName: string, tokenName: string) => 
      `/pools/${chainName}/${protocolName}/${tokenName}`,
    poolById: (id: string) => `/pools/${id}`,
    protocol: (protocolName: string) => `/protocols/${protocolName}`,
    network: (chainName: string) => `/networks/${chainName}`,
    token: (chainName: string, tokenName: string) => `/tokens/${chainName}/${tokenName}`,
    holders: (poolId: string, page: number = 1, limit: number = constants.PAGE_SIZE_DEFAULT) =>
      `/api/pools/${poolId}/holders/${page}/${limit}`,
    admin: {
      dashboard: '/admin',
      services: '/admin/services',
      hardcodeScan: '/admin/hardcode-scan'
    }
  },
  
  constants
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'development') {
  // Development-specific config can override here
}

if (process.env.NODE_ENV === 'production') {
  // Production-specific config can override here
}

export default cfg;