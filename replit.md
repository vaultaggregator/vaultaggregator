# Overview

Vault Aggregator is a streamlined DeFi yield aggregation platform designed to help users discover, track, and compare yield farming opportunities across various blockchain networks and protocols. It provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments, focusing on core yield tracking and portfolio management. The project's ambition is to provide accurate, reliable DeFi data to empower user investment decisions, focusing on efficiency and a clean architecture by exclusively tracking core yield opportunities for two specific pools (STETH and STEAKUSDC) on two platforms (Lido and Morpho) on the Ethereum chain.

# Recent Changes (August 21, 2025)

**CRITICAL DATABASE MIGRATION COMPLETED:**
- Fixed pools foreign key constraints - migrated from old "chains" table to "networks" table
- Updated all 44 pools to use correct network IDs (43 for Ethereum, 1 for Base)
- Updated all pools to use correct protocol IDs from protocols table
- Fixed pools API route to join with protocols and networks tables (was using old platforms/chains)
- All entities now properly linked with valid foreign key relationships
- Protocol API now functional at /api/protocols/:chainId/:protocolId
- Pools now correctly display platform (Morpho/Lido) and network (Ethereum/Base) information

**NETWORK DETAIL PAGE ADDED:**
- Created comprehensive network/chain details page at /network/:chainId route
- Displays network logo, name, chainId, native token symbol and pricing data
- Shows real-time metrics: TVL from DefiLlama, gas prices, block time, active addresses, transaction counts
- Includes social links (website, Twitter, Discord, GitHub, docs, explorer)
- Fetches data from CoinGecko (token prices), DefiLlama (TVL), and chain-specific metrics
- Consistent Tailwind/shadcn dark theme with loading and error states

**TOKEN DETAIL PAGE COMPLETED:**
- Built comprehensive token details page at /token/:chainId/:tokenAddress route
- Displays token name, symbol, logo, price, 24h change, market cap, total supply, holder count
- Shows top holders list, recent transfers, and protocols using the token
- Backend fetches real data from CoinGecko, DefiLlama, and Etherscan APIs
- Integrated with existing site theme using Tailwind/shadcn components

**CHART DEFAULT TIMEFRAME UPDATED:**
- Changed default chart timeframe to 1 year (1Y) for all chart components
- InteractivePoolChart now defaults to 'all' (1 year view) instead of 30 days
- PoolChart now defaults to '1Y' (365 days) instead of 1 week
- Users see comprehensive long-term data by default on all pool charts

**PROFILE PAGE NFT SECTION REMOVED (COMPLETED):**
- Removed NFTs tab from wallet profile page per user request
- Simplified tab navigation to 3 tabs: Portfolio, Wallet, History
- Profile page now focuses on DeFi positions and wallet assets without NFT data

# Recent Changes (August 21, 2025)

**ADMIN INTERFACE STREAMLINED (COMPLETED):**
- Completely removed admin-content functionality and all related components per user request
- Removed admin-content page component, routing, imports, and navigation links
- Streamlined admin header navigation by eliminating content management section
- Confirmed no server-side API routes existed for content management - was frontend-only functionality
- Admin interface now focuses on core system management: Overview, System, Content (pools/platforms/networks), Security

**MAJOR ADMIN CLEANUP (COMPLETED):**
- Removed entire admin pages (/admin-users, /admin-security, /admin-monitoring) with all associated routing and navigation
- Updated App.tsx routing and admin-header navigation to reflect all interface changes
- Verified no dedicated server-side API routes existed for removed pages - functionality was frontend-only

**ANALYTICS SECTION REFINEMENT (COMPLETED):**
- Removed pools and platforms sections from admin-analytics page while preserving other analytics functionality
- Updated analytics interface to focus on overview, system monitoring, and error tracking
- Streamlined tabs from 5 sections to 3 core sections: Overview, System, Errors

**COMPREHENSIVE ADMIN SERVICES OVERHAUL (COMPLETED):**
- Fixed all admin services to perform authentic operations instead of returning fake success messages
- DeFi Llama Sync now triggers real scraper collecting data from Morpho and Lido APIs (44 pools updated)
- Holder Data Sync properly handles disabled Alchemy API with informative error messaging and graceful fallback
- Database Cleanup Service performs real cleanup operations (expired AI predictions, old data, stale records)
- AI Generation Service confirmed working with authentic OpenAI API integration generating 180-word market insights
- Created robust service pattern template for future service additions ensuring proper error handling and real functionality
- All services now use try/catch blocks, check prerequisites, and provide detailed success/failure reporting

**ENHANCED SYSTEM STATUS MONITORING (NEW):**
- Completely rebuilt admin-system.tsx with comprehensive 5-tab monitoring system (Overview, API Health, Services, Performance, Live Monitoring)
- Added real-time visualization with live charts for memory usage, cache performance, and system health trends 
- Implemented sophisticated gradient cards with professional DeFi-style design and intelligent status indicators
- Enhanced monitoring capabilities with real-time performance analytics, system stability scoring, and automated alerts
- Added comprehensive error detection and notification system with memory usage warnings and cache optimization alerts
- Integrated responsive charts using Recharts library with 20-point rolling data collection for performance tracking

**ADMIN HEADER REORGANIZATION:**
- Reorganized crowded admin navigation into grouped dropdown sections: Overview, System, Content, Security
- Added responsive mobile navigation with hamburger menu for better mobile experience
- Ensured all admin pages have consistent AdminHeader component usage
- Standardized admin page layout structure with proper wrapper divs and background styling
- Future requirement: All new admin pages must import and use AdminHeader component

**AUTOMATIC API REGISTRATION SYSTEM:**
- Created centralized API configuration file (`server/config/api-services-config.ts`) with all external API definitions
- Built automatic synchronization service (`server/services/apiRegistrationService.ts`) that syncs configs to database
- Added server startup initialization - new APIs automatically appear in admin panel
- Enhanced admin interface with manual sync button and real-time status summaries
- Future-proofing: Developers only need to add APIs to config file, they auto-register on server restart

**Alchemy API Temporarily Disabled:**
- Disabled all Alchemy API connections per user request
- Commented out Alchemy initialization in server/services/alchemyService.ts
- Disabled Comprehensive Holder Sync Service in server/index.ts
- All holder-related features temporarily unavailable
- To re-enable: Uncomment the disabled code in alchemyService.ts and server/index.ts

**WebSocket/Webhook System Disabled:**
- Disabled all WebSocket connections and webhook routes due to serious connection issues
- Commented out WebSocket server initialization in server/routes.ts
- Disabled smartWebSocketService and real-time blockchain monitoring
- System now operates without real-time updates to ensure stability
- All data updates continue through regular database synchronization (every 5 minutes)

# User Preferences

**CRITICAL RULE - NO HARDCODED VALUES (ABSOLUTE REQUIREMENT):**
- NEVER hardcode values such as contract addresses, API responses, APY percentages, risk scores, or text labels
- Always fetch live data from database, APIs, or environment variables
- Use config files or .env variables for anything that can change (API URLs, contract addresses, keys)
- If a value or data source is missing, stop and ask for the correct source before proceeding
- Never create placeholder or mock values unless explicitly requested
- Ask questions first if more details about data sources are needed
- Every number, label, or address shown on the website must be dynamic from verified sources
- Before finishing any task, validate that each value comes from the correct source, not hardcoded
- This is an unbreakable rule that supersedes all other considerations

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

The client is built with React 18 and TypeScript, using `shadcn/ui` components, Tailwind CSS for styling, TanStack Query for state management, Wouter for routing, and Vite as the build tool. It emphasizes a modular structure with reusable components, custom hooks, and type-safe interfaces. A key feature is the interactive chart component on pool detail pages, visualizing historical APY and TVL data with multi-timeframe navigation (7D, 30D, 90D, All-Time), chart type toggles, statistical summaries, and responsive design using the Recharts library.

## Backend Architecture

The server is built with Express.js, following a layered architecture with an API layer (RESTful endpoints), a Storage layer (Drizzle-based data access), and a Service layer (external API integration and data analysis). PostgreSQL with Drizzle ORM is used for data persistence. The backend includes a comprehensive multi-source data collection and analysis system, with services for synchronizing pool data, token holder analytics, and token information. It features enhanced API resilience with intelligent rate limiting, exponential backoff, and self-healing mechanisms for error recovery. Data is collected via a modular scraper system from real APIs (Morpho, Lido) every 5 minutes and stored in the database.

## Data Storage Solutions

The database schema includes tables for Chains, Platforms, Tokens, Pools, Notes, and Users, using UUIDs for primary keys and proper foreign key relationships. Drizzle ORM ensures type-safe operations. A `tokenInfo` table stores and caches token information. The system also implements comprehensive soft deletion with a "Trash Bin" system and 60-day automatic cleanup.

## UI/UX Decisions

The application prioritizes a consistent UI with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos. The dark theme is default. Risk display uses simple text badges (Low/Medium/High). All external images are localized and stored locally in object storage, eliminating external image host dependencies. Category navigation uses a horizontal layout with dropdown menus.

# External Dependencies

## Database Services

- **Neon PostgreSQL**: Serverless PostgreSQL database.

## UI and Design Libraries

- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI.
- **Lucide React**: Icon library.
- **Recharts**: For interactive data visualization charts.

## Key Integrations

- **Alchemy API**: Primary service for token metadata, pricing, holder tracking, and contract information.
- **Morpho API**: Integrated for authenticated data synchronization, providing comprehensive historical APY data and live vault data.
- **Etherscan**: Used as fallback for contract creation dates and when Alchemy data unavailable.
- **Lido API**: Integrated for data fetching for Lido pools.
- **OpenAI Integration**: AI Market Insights generate 180-word comprehensive analyses with market predictions, sentiment analysis, and investment insights using GPT-4o model.