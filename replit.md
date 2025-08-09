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
- **TOKEN INFORMATION REMOVED**: All token-specific functionality (holder analytics, token transfers, token info endpoints) has been completely removed per user request (August 2025)

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
- **Cross-Pool Analytics**: Advanced correlation analysis and MEV detection
- **Etherscan Integration**: Block data and ETH price feeds for enhanced analytics

#### Analytics Services
- **Cross-Pool Analysis Service**: Advanced analytics engine providing:
  - MEV (Maximal Extractable Value) detection and risk assessment
  - Pool correlation mapping and liquidity migration patterns
  - Network effects analysis and systemic risk scoring
  - Behavioral pattern recognition for institutional analysis
  - Social graph analysis for wallet connections
  - Comprehensive risk scoring based on historical vulnerabilities

#### Scheduled Operations
- DeFi Llama data sync: Every 10 minutes

## Data Storage Solutions

The database schema includes tables for Chains, Platforms, Pools, Notes, and Users, utilizing UUIDs for primary keys and proper foreign key relationships. Drizzle ORM ensures type-safe operations focused on pool and platform data.

## Authentication and Authorization

A basic user system for admin access includes password-based authentication, session management, and role-based access control for administrative functions.

## UI/UX Decisions

The application prioritizes a consistent UI architecture with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos (Lido, Morpho) based on official brand assets. The dark theme is set as default. Risk display uses simple text badges. Focus is on authentic DeFi pool data without token-specific analysis.

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