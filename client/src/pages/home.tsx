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
import { Plus } from "lucide-react";

export default function Home() {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [page, setPage] = useState(0);
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
        {isLoading && page === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                    <div className="text-center">
                      <Skeleton className="h-3 w-12 mb-1 mx-auto" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-3 w-12 mb-1 mx-auto" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-3 w-8 mb-1 mx-auto" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="text-center">
                      <Skeleton className="h-3 w-16 mb-1 mx-auto" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <Skeleton className="h-3 w-8 mb-2 mx-auto" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
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
            <div className="space-y-4">
              {pools.map((pool) => (
                <YieldOpportunityCard key={pool.id} opportunity={pool} />
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
