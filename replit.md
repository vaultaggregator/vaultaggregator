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
- **Lido API Integration**: Added Lido as a third data source for stETH staking APR data, including both SMA (7-day average) and latest APR endpoints

# User Preferences

Preferred communication style: Simple, everyday language.

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

**DeFi Llama API**: Primary data source for yield farming opportunities, providing real-time APY, TVL, and pool metadata across multiple DeFi protocols and blockchains.

**Morpho GraphQL API**: Secondary data source specifically for Morpho protocol vaults and markets, providing authenticated yield data, vault allocations, and historical APY information across supported networks (Ethereum, Arbitrum, Base, Polygon).

**Lido API**: Third data source for Ethereum liquid staking protocol, providing stETH staking APR data with both 7-day Simple Moving Average (SMA) and latest APR values for comprehensive staking yield information.

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

The application maintains real-time data accuracy through automated synchronization with DeFi Llama's yields API, Morpho's GraphQL API, and Lido's staking API, automatically creating and updating chain, platform, and pool records. The background scheduler runs every 10 minutes to keep all data sources synchronized. The admin panel provides visibility controls for managing which opportunities are displayed to users.