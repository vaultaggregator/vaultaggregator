# Comprehensive Service API Documentation

## Overview
This document provides a complete inventory of all services in the Vault Aggregator platform, detailing the APIs they call and their purposes.

---

## 1. Pool Data Sync Service (`poolDataSync`)
**Interval:** Every 1 minute  
**Purpose:** Synchronizes pool APY, TVL, and other metrics from various DeFi protocols

### API Calls:
- **Morpho API** (`https://api.morpho.org/vaults/{address}`)
  - Fetches vault details (name, symbol, APY, TVL)
- **Morpho GraphQL** (`https://blue-api.morpho.org/graphql`)
  - Gets comprehensive vault state and market data
- **Lido API** (`https://stake.lido.fi/api/sma-steth-apy`)
  - Fetches stETH APY data
- **Etherscan/Basescan API** (`https://api.etherscan.io/v2/api`)
  - Gets contract creation dates for operating days calculation
  - Fetches contract metadata

**Description:** Main service that keeps all pool data fresh by fetching latest APY, TVL, and operating days from multiple sources.

---

## 2. Morpho API Sync Service (`morphoApiSync`)
**Interval:** Every 5 minutes  
**Purpose:** Dedicated Morpho vault synchronization

### API Calls:
- **Morpho GraphQL** (`https://blue-api.morpho.org/graphql`)
  - Query: `GetMorphoVaults` - Fetches all vaults with state
  - Query: `GetMorphoMarkets` - Fetches market data
  - Query: `GetVaultHistory` - Fetches historical APY/TVL data
- **Morpho REST API** (`https://api.morpho.org/vaults`)
  - Individual vault fetching by address
  - Bulk vault data retrieval

**Description:** Specialized service for Morpho protocol that fetches vault data, historical metrics, and market states.

---

## 3. Holder Data Sync Service (`holderDataSync`)
**Interval:** Every 10 minutes  
**Purpose:** Updates token holder counts and analyzes holder distributions

### API Calls:
- **Etherscan Web Scraping** (`https://etherscan.io/token/{address}`)
  - Scrapes holder count from token pages
- **Basescan Web Scraping** (`https://basescan.org/token/{address}`)
  - Scrapes holder count for Base chain tokens
- **Alchemy API** (`via SDK`)
  - `getAssetTransfers` - Analyzes token transfers
  - `getTokenBalances` - Gets holder balances
  - Transfer event logs analysis

**Description:** Tracks the number of holders for each pool by scraping blockchain explorers and analyzing on-chain data.

---

## 4. AI Market Insights Service (`aiMarketInsights`)
**Interval:** Every 24 hours (1440 minutes)  
**Purpose:** Generates AI-powered market predictions and analysis

### API Calls:
- **OpenAI API** (`https://api.openai.com/v1/chat/completions`)
  - Model: GPT-4o
  - Generates market predictions
  - Analyzes risk factors
  - Creates sentiment scores
  - Provides investment recommendations

**Description:** Uses OpenAI's GPT-4o model to generate comprehensive market analysis, predictions, and investment insights for each pool.

---

## 5. Alchemy Health Check Service (`alchemyHealthCheck`)
**Interval:** Every 2 minutes  
**Purpose:** Monitors Alchemy API availability and performance

### API Calls:
- **Alchemy SDK**
  - `eth_blockNumber` - Tests API connectivity
  - Network status checks for Ethereum and Base

**Description:** Continuously monitors the health and availability of Alchemy API endpoints to ensure data reliability.

---

## 6. Historical Data Sync Service (`historicalDataSync`)
**Interval:** Every 5 minutes  
**Purpose:** Collects and stores historical APY and TVL data

### API Calls:
- **Morpho GraphQL** (`https://blue-api.morpho.org/graphql`)
  - Historical vault snapshots
  - Time-series APY data
- **Lido API** (`https://stake.lido.fi/api/sma-steth-apy`)
  - Historical stETH APY data

**Description:** Builds historical datasets for charting and trend analysis by collecting time-series data from various protocols.

---

## 7. Token Price Sync Service (`tokenPriceSync`)
**Interval:** Every 10 minutes  
**Purpose:** Updates token prices and metadata

### API Calls:
- **Alchemy SDK**
  - `getTokenMetadata` - Fetches token details
  - Token price feeds
- **CoinGecko API** (if configured)
  - Token price data
  - Market cap information

**Description:** Maintains up-to-date token prices and metadata for accurate TVL calculations and portfolio valuations.

---

## 8. Etherscan Scraper Service (`etherscanScraper`)
**Interval:** Every 10 minutes  
**Purpose:** Fallback service for blockchain data

### API Calls:
- **Etherscan API** (`https://api.etherscan.io/api`)
  - `getcontractcreation` - Contract creation dates
  - `tokentx` - Token transfer history
  - `getblockreward` - Block timestamps
- **Web Scraping**
  - Direct page scraping when API limits hit
  - Holder count extraction from HTML

**Description:** Provides blockchain data when primary sources are unavailable, including contract ages and holder counts.

---

## 9. Database Cleanup Service (`databaseCleanup`)
**Interval:** Daily (86400 minutes)  
**Purpose:** Maintains database health and removes old data

### API Calls:
- None (internal database operations only)

**Description:** Removes expired data, cleans up old errors, and maintains database performance.

---

## Additional Services (Not Scheduled)

### 10. Alchemy Service (`alchemyService`)
**Purpose:** Core service for blockchain data access

### API Calls:
- **Alchemy SDK** (Ethereum & Base networks)
  - `getTokenMetadata` - Token information
  - `getAssetTransfers` - Transfer history
  - `getTokenBalances` - Balance queries
  - `getTransactionReceipts` - Transaction details
  - `getBlockNumber` - Current block
  - `getLogs` - Event logs

**Description:** Central service providing comprehensive blockchain data access through Alchemy's infrastructure.

---

### 11. Enhanced Transfers Service
**Purpose:** Advanced transaction analysis

### API Calls:
- **Alchemy SDK**
  - Complete transaction history retrieval
  - Internal transaction analysis
  - Cross-chain transfer tracking
  - Yield performance calculations

**Description:** Provides deep transaction analysis including internal transfers, cross-chain movements, and yield calculations.

---

### 12. Cross Pool Analysis Service
**Purpose:** Advanced DeFi analytics

### API Calls:
- Internal data analysis only (no external APIs)
- Uses aggregated data from other services

**Description:** Analyzes wallet behaviors across pools, finds correlations, detects MEV activity, and provides risk assessments.

---

### 13. Lido Historical Service
**Purpose:** Lido-specific data collection

### API Calls:
- **Lido API** (`https://stake.lido.fi/api/`)
  - `/sma-steth-apy` - stETH APY data
  - Historical APY endpoints
  - Staking statistics

**Description:** Specialized service for collecting and processing Lido staking data.

---

### 14. Image Localization Service
**Purpose:** Downloads and stores external images locally

### API Calls:
- External image URLs (various sources)
- Downloads and caches images locally

**Description:** Ensures all images are stored locally to avoid external dependencies.

---

### 15. Self-Healing Service
**Purpose:** Automatic error recovery and retry logic

### API Calls:
- Wraps other API calls with retry logic
- No direct API calls

**Description:** Provides automatic retry, exponential backoff, and error recovery for all API interactions.

---

### 16. System Monitor Service
**Purpose:** Platform health monitoring

### API Calls:
- Internal system metrics only
- Database performance queries
- Memory and CPU monitoring

**Description:** Tracks system performance, API response times, and service health metrics.

---

## API Rate Limits & Optimization

### Rate Limits:
- **Etherscan**: 5 calls/second (with API key)
- **Morpho**: No documented limit (uses caching)
- **Alchemy**: 330 compute units/second
- **OpenAI**: 500 requests/minute (GPT-4o)
- **Lido**: No documented limit

### Optimization Strategies:
1. **Request Deduplication**: Prevents duplicate simultaneous requests
2. **Caching**: 5-minute cache for most data
3. **Batch Processing**: Groups multiple requests where possible
4. **Exponential Backoff**: Automatic retry with increasing delays
5. **Fallback Sources**: Uses alternative data sources when primary fails
6. **Contract Date Storage**: Stores immutable contract creation dates to avoid repeated API calls

---

## Error Handling

All services implement:
- Comprehensive error logging to database
- Automatic retry mechanisms
- Fallback data sources
- Health status tracking
- Alert generation for critical failures

---

## Service Dependencies

```
┌─────────────────────┐
│   Alchemy Service   │ ← Core blockchain data provider
└──────────┬──────────┘
           │
    ┌──────┴───────┬─────────────┬──────────────┐
    │              │             │              │
┌───▼────┐  ┌─────▼─────┐  ┌───▼────┐  ┌──────▼──────┐
│ Holder │  │   Token   │  │Transfer│  │   Price     │
│  Sync  │  │ Metadata  │  │Analysis│  │    Sync     │
└────────┘  └───────────┘  └────────┘  └─────────────┘

┌─────────────────────┐
│   Morpho Service    │ ← Protocol-specific data
└──────────┬──────────┘
           │
    ┌──────┴───────┬──────────────┐
    │              │              │
┌───▼────┐  ┌─────▼──────┐  ┌───▼─────┐
│  Pool  │  │ Historical │  │ Market  │
│  Sync  │  │    Data    │  │Analysis │
└────────┘  └────────────┘  └─────────┘
```

---

## Recent Optimizations (August 22, 2025)

1. **Contract Creation Date Caching**: Now stores contract creation dates in the database (`contract_created_at` field) to eliminate repeated Etherscan API calls for operating days calculation.

2. **API Cost Reduction**: Completely eliminated dependencies on:
   - DefiLlama API
   - Moralis API
   - Unnecessary caching layers

3. **Direct Source Integration**: All data now comes directly from protocol APIs (Morpho, Lido) or blockchain (via Alchemy/Etherscan).

---

## Monitoring & Observability

Each service reports:
- Last run timestamp
- Success/failure status
- Error counts and types
- API response times
- Data freshness metrics

Access monitoring at: `/admin/services/monitor`

---

## Future Enhancements

1. **WebSocket Integration**: Real-time data updates for active pools
2. **Cross-chain Expansion**: Support for more blockchain networks
3. **Advanced MEV Detection**: Real-time sandwich attack detection
4. **Social Sentiment Analysis**: Integration with social media APIs
5. **Automated Trading Signals**: AI-powered trade recommendations

---

*Last Updated: August 22, 2025*