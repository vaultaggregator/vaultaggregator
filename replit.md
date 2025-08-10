# Overview

Vault Aggregator is a DeFi yield aggregation platform designed to help users discover, track, and compare yield farming opportunities across various blockchain networks and protocols. It provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments.

The platform features a modern React frontend with shadcn/ui components and a Node.js/Express backend, using PostgreSQL with Drizzle ORM. It integrates with DeFi Llama's API for automated data synchronization and includes an admin panel for data management. Its ambition is to provide comprehensive coverage of DeFi lending and yield opportunities.

# User Preferences

Preferred communication style: Simple, everyday language.

**Logo Implementation:**
- Always use Trust Wallet GitHub repository for token logos: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/{chain}/assets/{contract_address}/logo.png`
- Never use CryptoLogos.cc (returns 403 errors)
- Example working URLs:
  - USDC: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png`
  - stETH: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png`

**Development Approach:**
- Always test functionality after implementation to verify it works correctly
- If something doesn't work during testing, fix it immediately before moving on
- No task is complete until it's been tested and confirmed working

**Token Flow Analysis (Updated: August 2025):**
- Fixed protocol-aware flow detection for multiple DeFi protocols
- Added Morpho protocol addresses for accurate steakUSDC flow analysis
- Lido protocol addresses already functioning correctly for stETH analysis
- Flow analysis now provides authentic data showing real inflow/outflow metrics across all time periods

**Data Synchronization Issues (Resolved: August 2025):**
- Fixed critical sync failure where pool data wasn't updating every 10 minutes as scheduled
- Root cause: Database defiLlamaId mismatch prevented pool updates during sync
- Solution: Updated steakUSDC pool's defiLlamaId from null to proper UUID value
- Fixed platform mapping case sensitivity issue ("Lido"/"Morpho" vs "lido"/"morpho-blue")
- Added comprehensive platform name mapping to handle DeFi Llama naming variations
- Corrected storage method usage in sync process (upsertPool handles visibility preservation automatically)
- Sync process now successfully updates lastUpdated timestamps to current dates

**Pool Detail Page Data Issues (Fixed: August 2025):**
- Resolved critical issue where pool detail pages showed no token transfer, holder, or analytics data
- Root cause: DeFi Llama provided zero address (0x000...000) instead of actual token contract addresses
- Solution: Implemented intelligent token address mapping system for known tokens:
  - STETH → 0xae7ab96520de3a18e5e111b5eaab095312d7fe84 (stETH contract)
  - STEAKUSDC → 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC contract)
  - Applied to all token-related endpoints: token-transfers, token-info, holder-analytics, holder-history
- Pool detail pages now display authentic blockchain data: 544,192+ holders, real transfers, analytics

**API Rate Limiting Best Practices (Updated: August 2025):**
- Etherscan API: 5 calls/second limit with intelligent queuing and 1-second intervals
- Exponential backoff retry: 3s, 6s, 12s delays on rate limit errors
- Smart caching: 5-minute cache for transfers, 1-minute for token info
- Graceful degradation: Returns cached data when API consistently fails
- Request queuing prevents concurrent API abuse and ensures proper rate limiting

**UI/UX Preferences:**
- Category navigation: Horizontal layout with dropdown menus (established design - do not change without explicit request)
- Subcategories appear in dropdown menus when clicking parent categories with down arrows
- Maintain authentic token logos for USDC and stETH in category hierarchy
- Risk display: Simple text badges (Low/Medium/High) preferred over emoji-based indicators

**Data Integrity Requirements:**
- Never use fake, mock, or placeholder data for yield information (APY, TVL, operating days)
- Always display "N/A" when authentic data is not available
- Users rely on accurate data for investment decisions
- Use correct field mappings: 24h APY = "apyBase", 30d APY = "apyMean30d", TVL = "tvlUsd", Operating = "count"

# System Architecture

## Frontend Architecture

The client is built with React 18 and TypeScript, using:
- **UI Framework**: shadcn/ui components (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Build Tool**: Vite

The frontend has a modular structure with reusable components, custom hooks, and type-safe interfaces.

## Backend Architecture

The server is built with Express.js, following a layered architecture:
- **API Layer**: RESTful endpoints for data and admin functions
- **Storage Layer**: Abstracted data access via an `IStorage` interface (Drizzle-based)
- **Service Layer**: External API integration and comprehensive data analysis
- **Database**: PostgreSQL with Drizzle ORM

### Enhanced Data Collection & Analysis System

The backend now implements a comprehensive multi-source data collection and analysis system:

#### Data Collection Services (Updated: August 2025)
- **DeFi Llama Sync**: Pool data, TVL, APY updates every 10 minutes
- **Holder Data Sync**: Token holder analytics from Etherscan every 6 hours  
- **Token Info Sync**: Comprehensive token data with 24-hour caching
- **AI Outlook Generation**: Market predictions every 2 hours
- **Token Transfer Analysis**: Protocol-aware flow analysis with accurate inflow/outflow calculations for complex DeFi protocols like Lido
- **Enhanced API Resilience**: Intelligent rate limiting (5 calls/sec), exponential backoff retry logic (3-6-12s), smart caching (5min for transfers), and graceful degradation with stale data fallbacks

#### Analytics Services
- **Data Analysis Service**: Comprehensive pool analytics combining all data sources
- **Market Intelligence Service**: Market-wide analytics, sentiment analysis, and trend identification
- **Holder Analytics**: Advanced holder distribution analysis and growth tracking
- **Flow Analysis**: Sophisticated protocol-aware token flow analysis distinguishing between actual staking/unstaking activities vs regular user transfers, providing accurate inflow/outflow metrics for investment decisions
- **Cross-Pool Analysis Service**: Revolutionary analytics engine providing:
  - MEV (Maximal Extractable Value) detection and risk assessment
  - Gas optimization intelligence with best interaction times
  - Pool correlation mapping and liquidity migration patterns
  - Network effects analysis and systemic risk scoring
  - Behavioral pattern recognition and AI predictions
  - Social graph analysis for wallet connections
  - Comprehensive risk scoring based on historical vulnerabilities

#### Scheduled Operations
- DeFi Llama data sync: Every 10 minutes
- AI outlook generation: Every 2 hours  
- Holder data sync: Every 6 hours
- Data cleanup tasks: Every hour

## Data Storage Solutions

The database schema includes tables for Chains, Platforms, Tokens, Pools, Notes, and Users, utilizing UUIDs for primary keys and proper foreign key relationships. Drizzle ORM ensures type-safe operations. Token information is stored in a `tokenInfo` table and cached for 24 hours to improve performance.

## Authentication and Authorization

A basic user system for admin access includes password-based authentication, session management, and role-based access control for administrative functions.

## UI/UX Decisions

The application prioritizes a consistent UI architecture with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos (Lido, Morpho) based on official brand assets. The dark theme is set as default. AI-powered market outlooks are generated with a calm, DeFi-savvy tone. Risk display uses simple text badges.

# External Dependencies

## Third-Party Services

**DeFi Llama API**: The primary and sole data source for yield farming opportunities, providing real-time APY, TVL, and pool metadata.

## Database Services

**Neon PostgreSQL**: Serverless PostgreSQL database for optimal performance.

## UI and Design Libraries

- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI.
- **Lucide React**: Icon library.

## Key Integrations

The application integrates with DeFi Llama's yields API for automated data synchronization, which automatically creates and updates chain, platform, and pool records. A background scheduler runs every 10 minutes to maintain data synchronization.