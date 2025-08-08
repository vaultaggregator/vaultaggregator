# Overview

Vault Aggregator is a DeFi yield aggregation platform that allows users to discover, track, and compare yield farming opportunities across multiple blockchain networks and protocols. The application provides real-time data on APY rates, TVL (Total Value Locked), and risk assessments for various liquidity pools and yield farming opportunities.

The platform features a modern React frontend with shadcn/ui components and a Node.js/Express backend, using PostgreSQL with Drizzle ORM for data persistence. It integrates with DeFi Llama's API to automatically sync yield data and includes an admin panel for data management.

## Recent Changes (August 2025)
- **Removed web scraping functionality**: Eliminated all "Fetch Latest Data" features including the button, scraping endpoints, and web scraper service per user request
- **Simplified UI**: Pool detail pages now focus on core yield data from the DeFi Llama API without additional scraping capabilities
- **Cleaner codebase**: Removed unused imports, interfaces, and server endpoints related to web scraping
- **Complete API System**: Implemented secure API key authentication system with protected endpoints, admin management interface, and rate limiting
- **Network Selector UI**: Fixed network selector to display networks horizontally next to "Networks:" label for better visual layout
- **Dark Theme Improvements**: Enhanced hero section gradient for dark mode and set dark theme as the default application theme
- **Morpho Integration**: Successfully integrated Morpho GraphQL API with automated data synchronization for vaults and markets across Ethereum, Arbitrum, Base, and Polygon networks
- **Dual Data Sources**: Platform now aggregates yield opportunities from both DeFi Llama and Morpho APIs, providing comprehensive coverage of DeFi lending and yield opportunities
- **Enhanced API Documentation**: Added new endpoints for Morpho-specific data including vault details, market information, and historical APY charts
- **Checkbox Filters**: Replaced dropdown filters with checkbox-based multi-select filters in admin panel for better UX and multiple selection capabilities
- **Data Source Filtering**: Fixed Morpho pool identification to properly distinguish between DeFi Llama and Morpho data sources using project field
- **Duplicate Pool Cleanup**: Removed 200 duplicate pools that had empty defi_llama_id fields, ensuring data consistency and eliminating vault duplication in the admin panel
- **Simplified Data Architecture**: Removed all Lido and Morpho data sources to use exclusively DeFi Llama APIs as single source of truth
- **Streamlined Admin Panel**: Removed data source filtering UI and related components, focusing on core pool management functionality
- **Simplified Synchronization**: Removed multi-source sync complexity in favor of single DeFi Llama API integration for cleaner architecture
- **AI-Powered Market Outlook**: Implemented complete AI prediction system with OpenAI gpt-4o-mini integration, generating 185-word market outlooks with calm, DeFi-savvy tone including specific APY predictions, stablecoin flow analysis, and practical risk-benefit advice
- **Enhanced Confidence Formula**: Redesigned confidence calculation system using 6 comprehensive factors: APY stability (30d vs current), TVL health assessment, platform maturity scoring, market volatility analysis, social sentiment simulation, and data quality metrics for more accurate prediction confidence
- **CoinGecko Price Integration**: Integrated real-time cryptocurrency prices from CoinGecko API into AI Market Outlook generation to ensure accurate price references and market analysis based on current market conditions rather than outdated or incorrect price data
- **Advanced AI Tools Suite**: Built comprehensive AI-powered investment assistance tools including Portfolio Optimizer for personalized asset allocation, Yield Predictor for ML-based trend forecasting, and Risk Analyzer for comprehensive security assessment using GPT-4o models
- **Professional Brand Assets**: Integrated official blockchain network SVG icons from CryptoLogos.cc replacing emoji icons with scalable vector graphics for Ethereum, Arbitrum, Polygon, Avalanche, BSC, Optimism, Base, Fantom, and Solana networks
- **Official Platform Icons**: Researched and integrated authentic DeFi platform logos based on official brand guidelines from Uniswap, Aave, Compound, Curve, SushiSwap, PancakeSwap, SpookySwap, and other major protocols, replacing generic placeholder icons with professional SVG designs that match official brand colors and visual identity
- **AI Advisor Simplified**: Removed "Investment Strategy & Goals" text field from AI Investment Advisor form to streamline user experience and reduce friction in the investment analysis process
- **AI Market Outlook Auto-Refresh**: Removed manual refresh button from AI Market Outlook component and implemented automatic refresh every 2 hours with improved user interface showing last update timestamp
- **SEO-Friendly URL Structure**: Implemented descriptive URL patterns (/yield/{network}/{protocol}/{poolId}/{slug}) with automatic meta tag generation, breadcrumb navigation, and backward compatibility for improved search engine optimization
- **Smart Companion Intelligence Upgrade**: Completely redesigned companion chatbot with comprehensive site knowledge base, intelligent query understanding, proper "I don't know" responses instead of incorrect answers, and admin error reporting system for unknown queries to continuously improve accuracy
- **Knowledge Management System**: Built sophisticated knowledge base service with 12 comprehensive site topics including AI tools, platform features, supported networks, data sources, and admin functions with confidence scoring and contextual responses
- **Admin Knowledge Center**: Created dedicated admin panel for managing unknown queries with resolution tracking, frequency analysis, and knowledge base enhancement capabilities to ensure companion accuracy improves over time
- **Advanced Market Intelligence Suite**: Implemented comprehensive AI-powered market analysis system with sentiment analysis, whale movement tracking, protocol health scoring, and ML-powered yield forecasting using GPT-4o models for sophisticated DeFi market intelligence
- **Consistent UI Architecture**: Ensured all pages follow standardized header/footer layout pattern with proper navigation structure, responsive design, and consistent branding across the entire application

# User Preferences

Preferred communication style: Simple, everyday language.

**Data Integrity Requirements:**
- Never use fake, mock, or placeholder data for yield information (APY, TVL, operating days)
- Always display "N/A" when authentic data is not available
- Users rely on accurate data for investment decisions
- Use correct field mappings: 24h APY = "apyBase", 30d APY = "apyMean30d", TVL = "tvlUsd", Operating = "count"

# System Architecture

## Frontend Architecture

The client application is built with React 18 and TypeScript, utilizing a component-based architecture with the following key decisions:

- **UI Framework**: shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with CSS variables for theming and design consistency
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a modular structure with reusable components, custom hooks, and type-safe interfaces. Components are organized into UI primitives, feature-specific components, and page-level components.

## Backend Architecture

The server is built with Express.js and follows a layered architecture pattern:

- **API Layer**: RESTful endpoints for pools, chains, platforms, and administrative functions
- **Storage Layer**: Abstracted data access through an `IStorage` interface implemented by a Drizzle-based storage class
- **Service Layer**: External API integration services (DeFi Llama) and background scheduling
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

The backend implements automatic data synchronization with DeFi Llama's yield API, running scheduled updates every 10 minutes to keep yield data current.

## Data Storage Solutions

**Database Schema Design**:
- **Chains**: Blockchain networks with display metadata and active status
- **Platforms**: DeFi protocols with branding and website information  
- **Tokens**: Digital assets linked to specific chains
- **Pools**: Yield opportunities with APY, TVL, risk levels, and visibility controls
- **Notes**: User or admin annotations for pools with public/private visibility
- **Users**: Admin user accounts with authentication

The schema uses UUIDs for primary keys and includes proper foreign key relationships. Drizzle ORM provides type-safe database queries and migrations.

## Authentication and Authorization

Currently implements a basic user system with:
- Password-based authentication for admin users
- Session management for maintaining admin login state
- Role-based access control for administrative functions

The authentication is minimal and focused on admin panel access rather than end-user accounts.

# External Dependencies

## Third-Party Services

**DeFi Llama API**: Primary and only data source for yield farming opportunities, providing real-time APY, TVL, and pool metadata across multiple DeFi protocols and blockchains. Simplified architecture ensures data consistency and maintainability.

## Database Services

**Neon PostgreSQL**: Serverless PostgreSQL database using Neon's connection pooling and WebSocket-based connections for optimal performance in serverless environments.

## UI and Design

**Radix UI**: Headless UI primitives for building accessible components
**shadcn/ui**: Pre-built component library based on Radix UI with Tailwind CSS styling
**Lucide React**: Consistent icon library for the user interface

## Development Tools

**Replit Integration**: Custom vite plugins for development environment integration and error handling
**TypeScript**: Full type safety across frontend and backend with shared schema types
**Drizzle Kit**: Database migration and schema management tools

## Key Integrations

The application maintains real-time data accuracy through automated synchronization with DeFi Llama's yields API, automatically creating and updating chain, platform, and pool records. The background scheduler runs every 10 minutes to keep data synchronized. The admin panel provides visibility controls for managing which opportunities are displayed to users.