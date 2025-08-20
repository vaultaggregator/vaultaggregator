import { useState, useEffect } from "react";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import NetworkSelector from "@/components/network-selector";
import YieldOpportunityCard from "@/components/yield-opportunity-card";
import AdminPanel from "@/components/admin-panel";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import type { YieldOpportunity, FilterOptions } from "@/types";
import { DeFiTooltip } from "@/components/metric-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, ChevronUp, ChevronDown, Search, TrendingUp, Shield, Users } from "lucide-react";
import { YieldCardSkeleton, PoolDataLoading } from "@/components/loading-animations";
import { CryptoLoader } from "@/components/crypto-loader";
import { EnhancedSearch } from "@/components/enhanced-search";
import { useRealtimeApy } from "@/hooks/useRealtimeApy";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'apy' | 'operatingDays' | 'tvl' | 'operatingSince' | 'risk' | 'holders' | null>('tvl');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 12;
  
  // Initialize WebSocket connection for real-time updates
  const { isConnected, lastUpdate } = useRealtimeApy();
  
  // Debug: Log when WebSocket updates are received
  useEffect(() => {
    console.log('🏠 Homepage WebSocket status:', { isConnected, lastUpdate });
  }, [isConnected, lastUpdate]);
  

  


  const { data: pools = [], isLoading, error, refetch } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools', filters, page, lastUpdate], // Include lastUpdate to trigger refetch on WebSocket updates
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        onlyVisible: 'true',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      const response = await fetch(`/api/pools?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }
      return response.json();
    },
    staleTime: 1000, // Consider data stale after 1 second to allow frequent updates
    refetchOnWindowFocus: true, // Refetch when window regains focus
    placeholderData: (previousData) => previousData, // Keep showing old data while new data loads
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSort = (field: 'name' | 'apy' | 'operatingDays' | 'tvl' | 'operatingSince' | 'risk' | 'holders') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc'); // Default to ascending for name
    }
  };

  // Filter pools based on search term
  const filteredPools = pools.filter((pool: YieldOpportunity) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const poolName = pool.tokenPair?.toLowerCase() || '';
    const platformName = pool.platform?.displayName?.toLowerCase() || '';
    const chainName = pool.chain?.displayName?.toLowerCase() || '';
    
    return poolName.includes(searchLower) || 
           platformName.includes(searchLower) ||
           chainName.includes(searchLower) ||
           `${platformName} ${poolName}`.includes(searchLower);
  });

  const sortedPools = [...filteredPools].sort((a: YieldOpportunity, b: YieldOpportunity) => {
    if (!sortBy) return 0;
    
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = `${a.platform.displayName} ${a.tokenPair}`;
        bValue = `${b.platform.displayName} ${b.tokenPair}`;
        break;
      case 'apy':
        aValue = parseFloat(a.apy);
        bValue = parseFloat(b.apy);
        break;
      case 'operatingDays':
        aValue = a.rawData?.count || 0;
        bValue = b.rawData?.count || 0;
        break;
      case 'tvl':
        aValue = parseFloat(a.tvl);
        bValue = parseFloat(b.tvl);
        break;
      case 'operatingSince':
        aValue = a.rawData?.count || 0;
        bValue = b.rawData?.count || 0;
        break;
      case 'risk':
        const riskOrder: { [key: string]: number } = { low: 3, medium: 2, high: 1 };
        aValue = riskOrder[a.riskLevel];
        bValue = riskOrder[b.riskLevel];
        break;
      case 'holders':
        aValue = a.holdersCount || 0;
        bValue = b.holdersCount || 0;
        break;
      default:
        return 0;
    }
    
    if (sortBy === 'name') {
      // String comparison for name sorting
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      // Numeric comparison for other fields
      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    }
  });

  const SortHeader = ({ field, children }: { field: 'name' | 'apy' | 'operatingDays' | 'tvl' | 'operatingSince' | 'risk' | 'holders', children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center justify-center space-x-1 text-sm font-semibold text-foreground hover:text-blue-600 transition-colors w-full"
      data-testid={`sort-${field}`}
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
      )}
    </button>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Error Loading Data</h2>
          <p className="text-muted-foreground mb-4">Failed to load yield opportunities. Please try again.</p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      <HeroSection />
      <NetworkSelector filters={filters} onFilterChange={handleFilterChange} />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Search Box */}
        <div className="mb-6">
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search pools by name, protocol, or network..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              data-testid="search-pools"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                data-testid="clear-search"
              >
                <span className="text-muted-foreground hover:text-foreground">✕</span>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="text-center mt-2 text-sm text-muted-foreground">
              Found {filteredPools.length} {filteredPools.length === 1 ? 'pool' : 'pools'} matching "{searchTerm}"
            </div>
          )}
        </div>

        {/* Table Header - Hidden on mobile */}
        <div className="bg-card rounded-t-xl shadow-sm border border-border border-b-0 hidden sm:block">
          <div className="px-3 sm:px-4 py-4 bg-muted/50 rounded-t-xl border-b border-border/50">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
              {/* Left section - perfectly aligned with data rows */}
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-6 h-6"></div> {/* Space for token icon */}
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-foreground">Pool Name</span>
                  </div>
                </div>
                {/* Protocol header - center aligned */}
                <div className="flex items-center justify-center space-x-2 flex-shrink-0">
                  <SortHeader field="name">
                    <span className="text-sm font-semibold text-foreground">Protocol</span>
                  </SortHeader>
                </div>
                {/* Network header - center aligned */}
                <div className="flex items-center justify-center space-x-2 flex-shrink-0 w-24">
                  <span className="text-sm font-semibold text-foreground">Network</span>
                </div>
              </div>

              {/* Metrics section - exactly matches card grid */}
              <div className="hidden sm:grid sm:grid-cols-9 sm:gap-4 sm:items-center sm:flex-1 sm:max-w-2xl">
                <div className="col-span-2 text-center">
                  <SortHeader field="apy">
                    <span className="text-sm font-semibold text-foreground">APY</span>
                  </SortHeader>
                </div>
                
                <div className="text-center">
                  <SortHeader field="operatingDays">
                    <span className="text-sm font-semibold text-foreground">Days</span>
                  </SortHeader>
                </div>
                
                <div className="col-span-2 text-center">
                  <SortHeader field="tvl">
                    <span className="text-sm font-semibold text-foreground">TVL</span>
                  </SortHeader>
                </div>
                
                <div className="col-span-2 text-center">
                  <SortHeader field="holders">
                    <span className="text-sm font-semibold text-foreground">Holders</span>
                  </SortHeader>
                </div>
                
                <div className="text-center">
                  <SortHeader field="risk">
                    <span className="text-sm font-semibold text-foreground">Risk</span>
                  </SortHeader>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sort Options */}
        <div className="sm:hidden bg-card rounded-t-xl shadow-sm border border-border border-b-0 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSort('apy')}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full flex items-center gap-1"
            >
              APY {sortBy === 'apy' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('tvl')}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full flex items-center gap-1"
            >
              TVL {sortBy === 'tvl' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('risk')}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full flex items-center gap-1"
            >
              Risk {sortBy === 'risk' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('holders')}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full flex items-center gap-1"
            >
              Holders {sortBy === 'holders' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {pools.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Yield Opportunities Found</h3>
              <p className="text-muted-foreground mb-4">
                {Object.keys(filters).length > 0 
                  ? "Try adjusting your filters to find more opportunities."
                  : "No yield opportunities are currently available. Please check back later."
                }
              </p>
              {Object.keys(filters).length > 0 && (
                <Button 
                  onClick={() => handleFilterChange({})}
                  variant="outline"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : pools.length === 0 && isLoading ? (
          <div className="bg-card border border-border border-t-0 rounded-b-xl p-12">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Discovering yield opportunities across DeFi protocols...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border border-t-0 sm:rounded-b-xl rounded-b-lg overflow-hidden space-y-2 sm:space-y-0">
              {sortedPools.map((opportunity, index) => (
                <div key={opportunity.id} className={`sm:border-b sm:border-border last:border-b-0 ${index === sortedPools.length - 1 ? 'sm:rounded-b-xl' : ''} rounded-lg sm:rounded-none mb-2 sm:mb-0 shadow-sm sm:shadow-none`}>
                  <YieldOpportunityCard 
                    opportunity={opportunity} 
                    showHeaders={false}
                    showNetworkName={!filters.chainId}
                  />
                </div>
              ))}
            </div>

            {pools.length === limit && (
              <div className="text-center mt-12">
                <Button 
                  onClick={loadMore}
                  className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 font-medium"
                  disabled={isLoading}
                  data-testid="button-load-more"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? 'Loading...' : 'Load More Opportunities'}
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      
      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}
