import { useQuery } from "@tanstack/react-query";
import type { AppStats } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeroSection() {
  const { data: stats, isLoading } = useQuery<AppStats>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  return (
    <section className="gradient-bg py-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-hero-title">
            Discover High-Yield DeFi Opportunities
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Track and compare yield farming opportunities across multiple chains and protocols in real-time.
          </p>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mx-auto mb-2 bg-white/20" />
                  <Skeleton className="h-4 w-20 mx-auto bg-white/20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="stat-total-pools">
                    {stats?.totalPools || 0}
                  </div>
                  <div className="text-gray-200">Active Pools</div>
                </>
              )}
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-16 mx-auto mb-2 bg-white/20" />
                  <Skeleton className="h-4 w-16 mx-auto bg-white/20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-success-400" data-testid="stat-avg-apy">
                    {stats?.avgApy ? `${stats.avgApy.toFixed(2)}%` : '0%'}
                  </div>
                  <div className="text-gray-200">Avg APY</div>
                </>
              )}
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mx-auto mb-2 bg-white/20" />
                  <Skeleton className="h-4 w-16 mx-auto bg-white/20" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="stat-total-tvl">
                    ${stats?.totalTvl || '0'}
                  </div>
                  <div className="text-gray-200">Total TVL</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
