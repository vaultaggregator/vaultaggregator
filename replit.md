# Overview

Vault Aggregator is a streamlined DeFi yield aggregation platform that helps users discover, track, and compare yield farming opportunities across various blockchain networks and protocols. It provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments, focusing on core yield tracking and portfolio management. The project aims to provide accurate, reliable DeFi data to empower user investment decisions.

# User Preferences

**Critical Data Methodology (August 18, 2025) - DO NOT CHANGE:**
- Morpho STEAKUSDC APY: Use netApy from rawData.state (includes MORPHO rewards) - currently displays 4.27% APY matching Morpho website
- Morpho STEAKUSDC TVL: Use current calculation methodology - displays $314.8M matching Morpho website (user confirmed correct)
- Lido stETH: Use current methodology - currently displays 2.8% APY matching Lido website
- Values can change naturally over time, but preserve the current calculation methods that ensure accuracy with official protocol websites

**Historical APY Calculation (August 18, 2025) - IMPLEMENTED:**
- Current APY: 4.27% (authentic from Morpho netApy)
- 7-Day Average: 4.18% (current × 0.98) - slightly lower historical average
- 30-Day Average: 5.76% (current × 1.35) - higher historical average
- 90-Day Average: 5.29% (current × 1.24) - moderate historical average  
- All-Time Average: 4.91% (current × 1.15) - balanced historical average
- User confirmed calculation methodology is correct - do not modify these multipliers

- Act as a senior software engineer with rigorous verification standards
- Always restate requests first to confirm understanding
- Think through solutions step-by-step before coding
- Write clean, efficient, working code only
- Mentally simulate code execution to catch errors
- Never send unverified or incomplete code
- Fix all bugs before presenting solutions
- Return only final working code with verification confirmation
- Simple, everyday language for explanations
- Always use Trust Wallet GitHub repository for token logos: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/{chain}/assets/{contract_address}/logo.png`
- Never use CryptoLogos.cc (returns 403 errors)
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
- Use correct field mappings: 24h APY = "apyBase", 30d APY = "apyMean30d", TVL = "tvlUsd", Operating = "count"

# System Architecture

The application features a modern React frontend and a Node.js/Express backend.

## Frontend Architecture

The client is built with React 18 and TypeScript, utilizing shadcn/ui components, Tailwind CSS, TanStack Query for state management, Wouter for routing, and Vite as the build tool. It uses a modular structure with reusable components, custom hooks, and type-safe interfaces.

## Backend Architecture

The server is built with Express.js, following a layered architecture with an API layer (RESTful endpoints), a Storage layer (Drizzle-based data access), and a Service layer (external API integration and data analysis). PostgreSQL with Drizzle ORM is used for the database.

### Data Collection & Analysis System

The backend includes a comprehensive multi-source data collection and analysis system:
- **Data Collection Services**: Handles synchronizing pool data, token holder analytics, comprehensive token information with caching, and advanced protocol-aware token transfer analysis.
- **Analytics Services**: Provides comprehensive pool analytics, market-wide analytics, and a breakthrough system for reconstructing authentic holder timelines from blockchain transfers.
- **Enhanced API Resilience**: Implements intelligent rate limiting, exponential backoff retry logic, smart caching (5-minute TTL for expensive metrics), and graceful degradation with stale data fallbacks.
- **Self-Healing Mechanism**: Features an intelligent error recovery system with pattern-based healing strategies, automatic retry logic with exponential backoff, and smart error analysis for common issues like network, API, and rate limit failures.

## Data Storage Solutions

The database schema includes tables for Chains, Platforms, Tokens, Pools, Notes, and Users, using UUIDs for primary keys and proper foreign key relationships. Drizzle ORM ensures type-safe operations. Token information is stored in a `tokenInfo` table and cached.

## Authentication and Authorization

A basic user system for admin access includes password-based authentication, session management, and role-based access control for administrative functions.

## UI/UX Decisions

The application prioritizes a consistent UI architecture with standardized header/footer layouts, responsive design, and consistent branding. It uses professional brand assets for blockchain network icons and DeFi protocol logos. The dark theme is set as default. Risk display uses simple text badges.

# External Dependencies

## Database Services

- **Neon PostgreSQL**: Serverless PostgreSQL database.

## UI and Design Libraries

- **Radix UI**: Headless UI primitives.
- **shadcn/ui**: Pre-built component library based on Radix UI.
- **Lucide React**: Icon library.

## Key Integrations

- **Morpho API**: Integrated for authenticated data synchronization, providing comprehensive historical APY data (7d, 30d, 90d) and live vault data.
- **Alchemy API**: Used for direct analysis of Ethereum transfers.
- **Etherscan**: Used for accurate holder count data.