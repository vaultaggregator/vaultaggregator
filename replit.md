# Overview

Vault Aggregator is a streamlined DeFi yield aggregation platform designed to help users discover, track, and compare yield farming opportunities. It provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments, focusing on core yield tracking and portfolio management. The project's ambition is to provide accurate, reliable DeFi data to empower user investment decisions, focusing on efficiency and a clean architecture by exclusively tracking core yield opportunities for two specific pools (STETH and STEAKUSDC) on two platforms (Lido and Morpho) on the Ethereum chain.

## Recent Changes (August 22, 2025)

- **Pool Creation Fix & Spark USDC Vault Activation**: Resolved "Invalid chain ID" error in admin pool creation
  - Fixed authentication middleware preventing new pool creation through admin interface
  - Successfully enabled Spark USDC Vault on Base network (6.09% APY, $611M TVL)
  - Enhanced Morpho scraper with proper Base network chain mapping (chainId: 8453)
  - Added debugging capabilities for chain/platform validation issues
  - Successfully created "Usual Boosted USDC" pool (0xd63070114470f685b75B74D60EEc7c1113d33a3D)
  - System now supports adding new pools on both Ethereum and Base networks
- **Trash Bin System Fix**: Fixed critical bug in admin trash bin functionality where deleted pools couldn't be displayed
  - Resolved Drizzle ORM query error with LEFT JOINs returning null values
  - Modified getTrashedPools() method to properly handle null platform/chain relationships
  - Added fallback values for missing joined records to prevent "Cannot convert undefined or null to object" errors
  - Trash bin now correctly displays deleted pools with 60-day automatic cleanup
- **Pool Data Sync Repair**: Fixed poolDataSync refresh button in admin services panel
  - Changed INNER JOIN to LEFT JOIN for chains table to handle mismatched chain IDs
  - System now successfully scrapes and updates all 44 pools from Morpho/Lido APIs
  - Manual refresh properly updates APY values from live API data (e.g., MEV Capital USDC: 9.73% → 9.59%)
- **Complete Cache System Removal**: Eliminated all caching infrastructure from the platform
  - Removed cache service files (admin-cache.ts, cache-stats.ts, cacheService.ts)
  - Removed cache routes and references from server/routes.ts  
  - Removed cacheCleanup service from admin services panel
  - System now operates 100% cache-free with direct API calls to Morpho, Lido, and Etherscan

## Previous Changes (August 21, 2025)

- **Automatic Holder Sync for New Pools**: Implemented automatic holder data synchronization when pools are created or updated
  - When a new pool is created with a contract address, holder sync automatically triggers via Moralis API
  - When an existing pool's contract address is updated, holder sync runs automatically in the background
  - Pool_metrics_current table is updated immediately after holder sync completes
  - Ensures consistent holder counts between homepage and pool detail pages from the moment a pool is added
- **Performance Optimizations**: Major improvements to reduce slow request warnings and optimize bundle loading
  - Implemented React lazy loading for all admin pages and heavy components
  - Added code splitting to reduce initial bundle size from ~3MB to <500KB
  - Optimized QueryClient configuration with smart caching (30s stale time, 5min cache)
  - Updated caniuse-lite and browserslist database to latest versions
  - Added Suspense boundaries with loading states for better UX
- **API Request Bug Fixes**: Corrected apiRequest function parameter order across multiple files
  - Fixed 10+ instances of incorrect `(url, method, data)` calls to proper `(method, url, data)`
  - Resolved Alchemy API toggle functionality in admin interface
  - All admin API interactions now work properly without fetch errors
- **WebSocket Removal**: Completely removed WebSocket functionality from both server and client per user request
  - Disabled WebSocket server initialization in `server/routes.ts`
  - Simplified `useRealtimeApy` hook to return static values
  - Removed all WebSocket connection and reconnection logic
- **Alchemy Service Enhancement**: Fixed Alchemy service to properly respect database admin settings
  - Service now checks database `apiSettings` table before making API calls
  - Added proper initialization with ALCHEMY_RPC_URL environment variable
  - Service correctly enables/disables based on admin menu toggle
- **Human-Readable URLs**: Implemented user-friendly URL patterns:
  - Protocol URLs: `/protocol/lido` instead of `/protocol/{uuid}/{uuid}`
  - Network URLs: `/network/ethereum` instead of `/network/{uuid}`
  - Token URLs: `/token/ethereum/{address}` instead of `/token/{uuid}/{address}`
  - All entity links now use names/slugs for better SEO and user experience

# User Preferences

- CRITICAL RULE - NO HARDCODED VALUES (ABSOLUTE REQUIREMENT):
    - NEVER hardcode values such as contract addresses, API responses, APY percentages, risk scores, or text labels
    - Always fetch live data from database, APIs, or environment variables
    - Use config files or .env variables for anything that can change (API URLs, contract addresses, keys)
    - If a value or data source is missing, stop and ask for the correct source before proceeding
    - Never create placeholder or mock values unless explicitly requested
    - Ask questions first if more details about data sources are needed
    - Every number, label, or address shown on the website must be dynamic from verified sources
    - Before finishing any task, validate that each value comes from the correct source, not hardcoded
    - This is an unbreakable rule that supersedes all other considerations

- MANDATORY ENTITY LINKING RULE (REQUIRED FOR ALL FUTURE DEVELOPMENT):
    - ALL entity names displayed anywhere on the site MUST use the linkable entity components from client/src/components/entity-links.tsx
    - Protocol names → Use ProtocolLink component
    - Network/Chain names → Use NetworkLink component  
    - Token names/addresses → Use TokenLink component
    - Pool names → Use PoolLink component
    - Wallet addresses → Use AddressLink component
    - This applies to ALL new features, pages, components, cards, tables, lists, and any display of entity information
    - Never display plain text entity names - they must always be clickable links to their detail pages
    - This ensures consistent internal navigation and user experience across the entire platform

- Act as a senior software engineer with rigorous verification standards
- Always restate requests first to confirm understanding
- Think through solutions step-by-step before coding
- Write clean, efficient, working code only
- Mentally simulate code execution to catch errors
- Never send unverified or incomplete code
- Fix all bugs before presenting solutions
- Return only final working code with verification confirmation
- Simple, everyday language for explanations
- All images must be stored locally using the image localization system - never use external image URLs in production
- Always test functionality after implementation to verify it works correctly
- If something doesn't work during testing, fix it immediately before moving on
- No task is complete until it's been tested and confirmed working
- Never use fake, mock, or placeholder data for yield information (APY, TVL, operating days)
- Always display "N/A" when authentic data is not available
- Users rely on accurate data for investment decisions
- 100% authentic data requirement: All charts and historical data must come from real API sources with no fallbacks, simulations, or synthetic values
- Use correct field mappings: 24h APY = "apyBase", 30d APY = "apyMean30d", TVL = "tvlUsd", Operating = "count"

# System Architecture

The application features a modern React frontend and a Node.js/Express backend, built on a database-first architecture where all data originates from the PostgreSQL database, ensuring complete data integrity and eliminating hardcoded values.

## Frontend Architecture

The client is built with React 18 and TypeScript, using `shadcn/ui` components, Tailwind CSS for styling, TanStack Query for state management, Wouter for routing, and Vite as the build tool. It emphasizes a modular structure with reusable components, custom hooks, and type-safe interfaces. Key features include comprehensive entity linking (ProtocolLink, NetworkLink, TokenLink, PoolLink, AddressLink) for consistent navigation and interactive chart components (Recharts) visualizing historical APY and TVL data with multi-timeframe navigation. The default chart timeframe is 1 year. The profile page focuses on DeFi positions and wallet assets, excluding NFT data.

## Backend Architecture

The server is built with Express.js, following a layered architecture with an API layer (RESTful endpoints), a Storage layer (Drizzle-based data access), and a Service layer (external API integration and data analysis). PostgreSQL with Drizzle ORM is used for data persistence. The backend includes a comprehensive multi-source data collection and analysis system, with services for synchronizing pool data and token information. It features enhanced API resilience with intelligent rate limiting, exponential backoff, and self-healing mechanisms for error recovery. Data is collected via a modular scraper system from real APIs (Morpho, Lido) every 5 minutes and stored in the database. An automatic API registration system allows new APIs to be defined in a central config and auto-synced to the database.

## Data Storage Solutions

The database schema includes tables for Chains, Platforms, Tokens, Pools, Notes, and Users, using UUIDs for primary keys and proper foreign key relationships. Drizzle ORM ensures type-safe operations. A `tokenInfo` table stores and caches token information. The system also implements comprehensive soft deletion with a "Trash Bin" system and 60-day automatic cleanup.

## UI/UX Decisions

The application prioritizes a consistent UI with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos. The dark theme is default. Risk display uses simple text badges (Low/Medium/High). All external images are localized and stored locally, eliminating external image host dependencies. Category navigation uses a horizontal layout with dropdown menus. Admin interface is streamlined, focusing on core system management (Overview, System, Content, Security) with a comprehensive 5-tab monitoring system (Overview, API Health, Services, Performance, Live Monitoring) with real-time charts.

# External Dependencies

## Database Services

- **Neon PostgreSQL**: Serverless PostgreSQL database.

## UI and Design Libraries

- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI.
- **Lucide React**: Icon library.
- **Recharts**: For interactive data visualization charts.

## Key Integrations

- **Alchemy API**: Used for token metadata, pricing, holder tracking, and contract information (currently temporarily disabled).
- **Morpho API**: Integrated for authenticated data synchronization, providing comprehensive historical APY data and live vault data.
- **Etherscan**: Used as fallback for contract creation dates.
- **Lido API**: Integrated for data fetching for Lido pools.
- **OpenAI Integration**: Used for AI Market Insights, generating comprehensive analyses with market predictions, sentiment analysis, and investment insights using the GPT-4o model.