import { useState } from "react";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import FilterControls from "@/components/filter-controls";
import YieldOpportunityCard from "@/components/yield-opportunity-card";
import AdminPanel from "@/components/admin-panel";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import type { YieldOpportunity, FilterOptions } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";

export default function Home() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<'apy' | 'apy30d' | 'tvl' | 'operatingSince' | 'risk' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 12;

  const { data: pools = [], isLoading, error, refetch } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools', filters, page],
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
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSort = (field: 'apy' | 'apy30d' | 'tvl' | 'operatingSince' | 'risk') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedPools = pools.sort((a, b) => {
    if (!sortBy) return 0;
    
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'apy':
        aValue = parseFloat(a.apy);
        bValue = parseFloat(b.apy);
        break;
      case 'apy30d':
        aValue = a.rawData?.apyMean30d || 0;
        bValue = b.rawData?.apyMean30d || 0;
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
        const riskOrder = { low: 3, medium: 2, high: 1 };
        aValue = riskOrder[a.riskLevel];
        bValue = riskOrder[b.riskLevel];
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const SortHeader = ({ field, children }: { field: 'apy' | 'apy30d' | 'tvl' | 'operatingSince' | 'risk', children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">Failed to load yield opportunities. Please try again.</p>
          <Button onClick={() => refetch()} data-testid="button-retry">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAdminClick={() => {}} />
      <HeroSection />
      <FilterControls filters={filters} onFilterChange={handleFilterChange} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Table Header */}
        <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0">
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50 rounded-t-xl">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="w-12"></div> {/* Space for logo */}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-gray-700">Platform & Token Pair</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 mx-6">
              <SortHeader field="apy">24h APY</SortHeader>
              <SortHeader field="apy30d">30d APY</SortHeader>
              <SortHeader field="tvl">TVL</SortHeader>
              <SortHeader field="operatingSince">Operating Since</SortHeader>
            </div>
            
            <div className="flex items-center space-x-4">
              <SortHeader field="risk">Risk</SortHeader>
              <div className="w-24 text-center">
                <span className="font-semibold text-gray-700">Actions</span>
              </div>
            </div>
          </div>
        </div>

        {isLoading && page === 0 ? (
          <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 mx-6">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Yield Opportunities Found</h3>
              <p className="text-gray-600 mb-4">
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
        ) : (
          <>
            <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl overflow-hidden">
              {sortedPools.map((opportunity, index) => (
                <div key={opportunity.id} className={`border-b border-gray-100 last:border-b-0 ${index === sortedPools.length - 1 ? 'rounded-b-xl' : ''}`}>
                  <YieldOpportunityCard 
                    opportunity={opportunity} 
                    showHeaders={false}
                  />
                </div>
              ))}
            </div>

            {pools.length === limit && (
              <div className="text-center mt-12">
                <Button 
                  onClick={loadMore}
                  className="bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium"
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
