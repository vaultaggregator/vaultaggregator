import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Chain, FilterOptions, Category } from "@/types";

interface NetworkSelectorProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function NetworkSelector({ filters, onFilterChange }: NetworkSelectorProps) {

  
  // Fetch chains
  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ['/api/chains'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const handleChainClick = (chainId: string) => {
    // Toggle chain selection - if already selected, deselect it
    const isCurrentlySelected = filters.chainId === chainId;
    onFilterChange({ 
      ...filters, 
      chainId: isCurrentlySelected ? undefined : chainId 
    });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const handleCategoryClick = (categoryId: string) => {
    // Toggle category selection - if already selected, deselect it
    const isCurrentlySelected = filters.categoryId === categoryId;
    onFilterChange({ 
      ...filters, 
      categoryId: isCurrentlySelected ? undefined : categoryId 
    });
  };

  // Get network icon/logo based on chain name
  const getNetworkIcon = (chainName: string) => {
    const name = chainName.toLowerCase();
    if (name.includes('ethereum') || name.includes('eth')) return '⟠';
    if (name.includes('base')) return '🔵';
    if (name.includes('arbitrum')) return '🔺';
    if (name.includes('optimism')) return '🔴';
    if (name.includes('polygon') || name.includes('matic')) return '🟣';
    if (name.includes('avalanche') || name.includes('avax')) return '❄️';
    if (name.includes('bsc') || name.includes('binance')) return '🟡';
    if (name.includes('fantom')) return '👻';
    if (name.includes('solana')) return '🌟';
    return '🔗';
  };

  return (
    <section className="bg-white shadow-sm py-6 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {/* Network Selection */}
          <div className="flex items-start justify-between gap-8">
            {/* Left side - Networks */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h2 className="text-sm font-semibold text-gray-700 mr-4">Networks:</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* All Networks Button */}
                <Button
                  onClick={clearAllFilters}
                  variant={!filters.chainId ? "default" : "outline"}
                  size="sm"
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                    ${!filters.chainId 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                    }
                  `}
                  data-testid="button-all-networks"
                >
                  <span className="text-sm">🌐</span>
                  <span className="font-medium">All</span>
                </Button>

                {/* Individual Network Buttons */}
                {chains.map((chain) => (
                  <Button
                    key={chain.id}
                    onClick={() => handleChainClick(chain.id)}
                    variant={filters.chainId === chain.id ? "default" : "outline"}
                    size="sm"
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                      ${filters.chainId === chain.id 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }
                    `}
                    data-testid={`button-network-${chain.name}`}
                  >
                    {(chain as any).iconUrl ? (
                      <img 
                        src={(chain as any).iconUrl} 
                        alt={chain.displayName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm">{getNetworkIcon(chain.displayName)}</span>
                    )}
                    <span className="font-medium">{chain.displayName}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Right side - Categories */}
            {categories.filter(cat => cat.isActive).length > 0 && (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Categories:</h2>
                  {/* Filter Status */}
                  <div className="flex items-center space-x-3">
                    {(filters.chainId || filters.categoryId) && (
                      <Badge variant="secondary" className="px-3 py-1">
                        {[filters.chainId, filters.categoryId].filter(Boolean).length} filter{[filters.chainId, filters.categoryId].filter(Boolean).length === 1 ? '' : 's'} active
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(cat => cat.isActive).map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      variant={filters.categoryId === category.id ? "default" : "outline"}
                      size="sm"
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                        ${filters.categoryId === category.id 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }
                      `}
                      data-testid={`button-category-${category.slug}`}
                    >
                      {category.iconUrl ? (
                        <img
                          src={category.iconUrl}
                          alt={category.displayName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-medium" 
                          style={{ backgroundColor: category.color }}
                        >
                          {category.displayName.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{category.displayName}</span>
                      {category.poolCount > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {category.poolCount}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}