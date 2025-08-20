# Overview

Vault Aggregator is a streamlined DeFi yield aggregation platform designed to help users discover, track, and compare yield farming opportunities across various blockchain networks and protocols. It provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments, focusing on core yield tracking and portfolio management. The project's ambition is to provide accurate, reliable DeFi data to empower user investment decisions, focusing on efficiency and a clean architecture by exclusively tracking core yield opportunities for two specific pools (STETH and STEAKUSDC) on two platforms (Lido and Morpho) on the Ethereum chain.

# User Preferences

**URL Routing & Pool Matching - CRITICAL FIXES APPLIED:**
- Fixed pool token matching logic to handle special characters (hyphens, spaces) consistently
- Server-side normalization removes both spaces and hyphens for comparison: "OEV-boosted USDC" → "oevboostedusdc"
- URL parsing converts hyphens to spaces: "oev-boosted-usdc" → "oev boosted usdc" → "oevboostedusdc"  
- Frontend routing supports both `/yield/` and `/pools/` URL patterns for SEO-friendly URLs
- Token matching uses three comparison methods: exact normalized match, cleaned comparison, space-to-hyphen conversion
- All pool detail pages now accessible via `/pools/:network/:protocol/:tokenPair` format

**Etherscan Integration - STANDARDIZED (DO NOT CHANGE):**
- All pools display Etherscan links when contract addresses are available
- Etherscan button appears above Visit Platform button for better user flow
- All 32 existing pools have proper contract addresses stored in database
- New pools will automatically show Etherscan links when pool_address is populated
- Uses standard token URL format: `https://etherscan.io/token/{contract_address}`
- **CRITICAL UI RULE**: Both Etherscan and Visit Platform buttons must remain on the left side, with Etherscan on top - do not change position or remove without explicit user request
- **Data Sync Status Positioning**: "Data synced just now" text must remain at bottom left of pool detail pages, positioned just before the footer - do not move unless explicitly requested

**Critical Data Methodology - DO NOT CHANGE:**
- Morpho STEAKUSDC APY: Live data from Morpho API (database-first system fetches real-time values)
- Morpho STEAKUSDC TVL: Use current calculation methodology - displays $314.8M matching Morpho website (user confirmed correct)
- Operating Since/Days: Use Etherscan-based contract creation date calculation instead of DeFi Llama count - displays ~592 days matching Etherscan "1 yr 227 days ago" (user confirmed correct)
- Holders Count: Use verified Etherscan data - displays 546 holders matching Etherscan exactly (user confirmed correct)
- Lido stETH: Use current methodology - currently displays 2.8% APY matching Lido website
- Single pool page data accuracy: All metrics verified as working correctly - user confirmed satisfaction
- Homepage and pool detail consistency: Both pages now display identical 546 holders matching Etherscan
- APY display consistency: Fixed single page to show same database APY as homepage - both now display 4.49% from live Morpho data
- Data consistency fixes: Eliminated all rawData dependencies - homepage and single page now use identical database-first values for APY, TVL, and holders
- Operating days consistency: Fixed homepage to calculate days from creation date instead of using cached rawData.count, ensuring consistency with single page
- Operating days consistency: Homepage and pool detail both show 591 days from Etherscan blockchain data
- Lido stETH operating days: Updated to accurate 1703 days (4 yrs 243 days) from Etherscan verified deployment date
- Homepage data consistency: User confirmed all metrics display correctly and match official sources
- Data synchronization: Implemented 10-minute comprehensive data sync for all website data (APY, TVL, token info) with 30-minute holder data updates
- Values can change naturally over time, but preserve the current calculation methods that ensure accuracy with official protocol websites
- Chart timeframes: Made "Max" timeframe dynamic based on actual pool operating days instead of hardcoded 730/1000 days
- Historical data collection: Made days parameter dynamic based on pool operating days instead of hardcoded 600 days

**Historical APY Calculation - FIXED TO USE 100% AUTHENTIC DATA:**
- CRITICAL FIX: Eliminated all synthetic multiplier calculations that violated authentic data requirement
- Current APY: Fetched live from database (Morpho API data)
- 7-Day Average: Calculated from real historical data points (last 7 days)
- 30-Day Average: Calculated from real historical data points (last 30 days) 
- 90-Day Average: Calculated from real historical data points (last 90 days)
- All-Time Average: Calculated from all 1175 comprehensive historical data points from DefiLlama
- NEW: historicalApyService.ts provides 100% authentic calculations using real database values
- NEW: /api/pools/:id/historical-averages endpoint serves authentic historical averages
- All calculations now use genuine historical data with no fallbacks, simulations, or synthetic values

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
- Image localization system automatically downloads external images to object storage with unique filenames
- Use `/public-objects/images/` paths for all platform logos and category icons after localization
- Always test functionality after implementation to verify it works correctly
- If something doesn't work during testing, fix it immediately before moving on
- No task is complete until it's been tested and confirmed working
- Category navigation: Horizontal layout with dropdown menus (established design - do not change without explicit request)
- Subcategories appear in dropdown menus when clicking parent categories with down arrows
- Maintain authentic token logos for USDC and stETH in category hierarchy
- Risk display: Simple text badges (Low/Medium/High) preferred over emoji-based indicators
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

The application prioritizes a consistent UI with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos. The dark theme is default. Risk display uses simple text badges (Low/Medium/High). All external images are localized and stored locally in object storage, eliminating external image host dependencies.

# External Dependencies

## Database Services

- **Neon PostgreSQL**: Serverless PostgreSQL database.

## UI and Design Libraries

- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI.
- **Lucide React**: Icon library.
- **Recharts**: For interactive data visualization charts.

## Key Integrations

- **Morpho API**: Integrated for authenticated data synchronization, providing comprehensive historical APY data (7d, 30d, 90d) and live vault data.
- **Alchemy API**: Used for direct analysis of Ethereum transfers.
- **Etherscan**: Used for accurate holder count data and contract creation dates.
- **Lido API**: Integrated for data fetching for Lido pools.
- **OpenAI Integration**: AI Market Insights generate 180-word comprehensive analyses with market predictions, sentiment analysis, and investment insights using GPT-4o model.