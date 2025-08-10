# Overview

Vault Aggregator is a DeFi yield aggregation platform designed to help users discover, track, and compare yield farming opportunities across various blockchain networks and protocols. It provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments. The platform features a modern React frontend and a Node.js/Express backend, integrating with DeFi Llama's API for automated data synchronization. Its ambition is to provide comprehensive coverage of DeFi lending and yield opportunities.

# User Preferences

Preferred communication style: Simple, everyday language.

**Recent Major Achievement (August 2025):**
Successfully simplified the DeFi yield aggregator interface by removing complex analytical sections per user request. Cleaned up TypeScript errors and streamlined the user experience by focusing on core yield data rather than advanced analytics.

**Major UI Simplification (August 10, 2025):**
SUCCESSFULLY STREAMLINED INTERFACE BY REMOVING COMPLEX ANALYTICAL SECTIONS. Simplified user experience by focusing on core functionality:
- ✅ **Removed Token Flow Analysis**: Eliminated 422-line section with whale activity tracking and smart money detection
- ✅ **Removed Advanced Analytics Dashboard**: Eliminated Cross-Pool Analytics with influence scores and systemic risk metrics  
- ✅ **Removed AI Market Outlook**: Eliminated AI companion component for cleaner interface
- ✅ **Removed Holder Analytics**: Eliminated detailed holder tracking charts and historical analysis
- ✅ **Fixed All TypeScript Errors**: Cleaned up 32+ LSP diagnostics caused by removed analytical components
- ✅ **Focused on Core Data**: Interface now emphasizes APY, TVL, and basic pool information
- ✅ **Improved Performance**: Reduced API calls and data processing overhead

**Logo Implementation:**
- Always use Trust Wallet GitHub repository for token logos: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/{chain}/assets/{contract_address}/logo.png`
- Never use CryptoLogos.cc (returns 403 errors)

**Logo Implementation:**
- Always use Trust Wallet GitHub repository for token logos: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/{chain}/assets/{contract_address}/logo.png`
- Never use CryptoLogos.cc (returns 403 errors)

**Development Approach:**
- Always test functionality after implementation to verify it works correctly
- If something doesn't work during testing, fix it immediately before moving on
- No task is complete until it's been tested and confirmed working

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

The client is built with React 18 and TypeScript, utilizing shadcn/ui components, Tailwind CSS, TanStack Query for state management, Wouter for routing, and Vite as the build tool. It features a modular structure with reusable components, custom hooks, and type-safe interfaces.

## Backend Architecture

The server is built with Express.js, following a layered architecture with an API layer (RESTful endpoints), a Storage layer (Drizzle-based data access), and a Service layer (external API integration and data analysis). PostgreSQL with Drizzle ORM is used for the database.

### Enhanced Data Collection & Analysis System

The backend implements a comprehensive multi-source data collection and analysis system, including:

#### Data Collection Services
- **DeFi Llama Sync**: Pool data, TVL, APY updates.
- **Holder Data Sync**: Token holder analytics from Etherscan.
- **Token Info Sync**: Comprehensive token data with caching.
- **AI Outlook Generation**: Market predictions.
- **Token Transfer Analysis**: Advanced protocol-aware flow analysis with 15,000+ transfer processing, 90-day historical coverage, and accurate inflow/outflow calculations supporting both Alchemy (decimal) and Etherscan (wei) data formats.
- **Enhanced API Resilience**: Intelligent rate limiting, exponential backoff retry logic, smart caching, and graceful degradation with stale data fallbacks.

#### Analytics Services
- **Data Analysis Service**: Comprehensive pool analytics.
- **Market Intelligence Service**: Market-wide analytics, sentiment analysis, and trend identification.
- **Historical Holder Analysis Service**: **BREAKTHROUGH SYSTEM** - Reconstructs authentic holder timelines from 4,781+ real blockchain transfers over 90+ days, generating accurate daily snapshots without projections.
- **Holder Analytics**: Advanced holder distribution analysis and growth tracking using authentic blockchain data.
- **Flow Analysis**: Sophisticated protocol-aware token flow analysis for accurate inflow/outflow metrics.
- **Cross-Pool Analysis Service**: Analytics engine for MEV detection, gas optimization intelligence, pool correlation mapping, network effects analysis, systemic risk scoring, behavioral pattern recognition, AI predictions, social graph analysis, and comprehensive risk scoring.

#### Scheduled Operations
- DeFi Llama data sync: Every 10 minutes.
- AI outlook generation: Every 2 hours.
- Holder data sync: Every 6 hours.
- Data cleanup tasks: Every hour.

## Data Storage Solutions

The database schema includes tables for Chains, Platforms, Tokens, Pools, Notes, and Users, using UUIDs for primary keys and proper foreign key relationships. Drizzle ORM ensures type-safe operations. Token information is stored in a `tokenInfo` table and cached for 24 hours.

## Authentication and Authorization

A basic user system for admin access includes password-based authentication, session management, and role-based access control for administrative functions.

## UI/UX Decisions

The application prioritizes a consistent UI architecture with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos. The dark theme is set as default. AI-powered market outlooks are generated with a calm, DeFi-savvy tone. Risk display uses simple text badges.

# External Dependencies

## Third-Party Services

**DeFi Llama API**: The primary data source for yield farming opportunities, providing real-time APY, TVL, and pool metadata.

## Database Services

**Neon PostgreSQL**: Serverless PostgreSQL database.

## UI and Design Libraries

- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI.
- **Lucide React**: Icon library.

## Key Integrations

The application integrates with DeFi Llama's yields API for automated data synchronization, which automatically creates and updates chain, platform, and pool records. A background scheduler runs every 10 minutes to maintain data synchronization.