import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterOptions, Chain, Platform } from "@/types";

interface PlatformWithVisibility extends Platform {
  hasVisiblePools?: boolean;
}

interface FilterControlsProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function FilterControls({ filters, onFilterChange }: FilterControlsProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch chains
  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ['/api/chains'],
  });

  // Fetch platforms - only show visible ones
  const { data: allPlatforms = [] } = useQuery<PlatformWithVisibility[]>({
    queryKey: ['/api/platforms'],
  });
  
  // Filter to only show platforms with visible pools
  const platforms = allPlatforms.filter(platform => platform.hasVisiblePools);

  // Update last updated time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchTerm.trim() || undefined });
  };

  const handleChainChange = (chainId: string) => {
    onFilterChange({ 
      ...filters, 
      chainId: chainId === 'all' ? undefined : chainId 
    });
  };

  const handlePlatformChange = (platformId: string) => {
    onFilterChange({ 
      ...filters, 
      platformId: platformId === 'all' ? undefined : platformId 
    });
  };

  const handleSortChange = (sortBy: string) => {
    onFilterChange({ 
      ...filters, 
      sortBy: sortBy === 'default' ? undefined : sortBy as 'apy' | 'tvl' | 'platform' 
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFilterChange({});
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <section className="bg-white shadow-sm py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select onValueChange={handleChainChange} value={filters.chainId || 'all'}>
              <SelectTrigger className="w-[140px]" data-testid="select-chain">
                <SelectValue placeholder="All Chains" />
                <ChevronDown className="w-4 h-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                {chains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select onValueChange={handlePlatformChange} value={filters.platformId || 'all'}>
              <SelectTrigger className="w-[140px]" data-testid="select-platform">
                <SelectValue placeholder="All Platforms" />
                <ChevronDown className="w-4 h-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform.id} value={platform.id}>
                    {platform.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="text"
                placeholder="Search platforms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
                data-testid="input-search"
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            </form>

            {Object.keys(filters).length > 0 && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                data-testid="button-clear-filters"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Sort and Last Updated */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500" data-testid="text-last-updated">
              <RotateCcw className="w-4 h-4 inline mr-1" />
              Last updated: {getTimeAgo(lastUpdated)}
            </div>
            
            <Select onValueChange={handleSortChange} value={filters.sortBy || 'default'}>
              <SelectTrigger className="w-[140px]" data-testid="select-sort">
                <SelectValue placeholder="Sort by APY" />
                <ChevronDown className="w-4 h-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sort by APY</SelectItem>
                <SelectItem value="apy">Sort by APY</SelectItem>
                <SelectItem value="tvl">Sort by TVL</SelectItem>
                <SelectItem value="platform">Sort by Platform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}
