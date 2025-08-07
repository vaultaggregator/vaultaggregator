import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Chain, FilterOptions, Category } from "@/types";

interface NetworkSelectorProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function NetworkSelector({ filters, onFilterChange }: NetworkSelectorProps) {
  const [showCategories, setShowCategories] = useState(false);
  
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-sm font-semibold text-gray-700 mr-4">Networks:</h2>
            
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

            {/* Filter Status */}
            <div className="flex items-center space-x-3">
              {(filters.chainId || filters.categoryId) && (
                <Badge variant="secondary" className="px-3 py-1">
                  {[filters.chainId, filters.categoryId].filter(Boolean).length} filter{[filters.chainId, filters.categoryId].filter(Boolean).length === 1 ? '' : 's'} active
                </Badge>
              )}
            </div>
          </div>
          {/* Categories Section */}
          <div className="w-full">
            <Collapsible open={showCategories} onOpenChange={setShowCategories}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto font-medium text-gray-700 hover:text-blue-600 border-t border-gray-100"
                  data-testid="button-toggle-categories"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Categories</span>
                    {filters.categoryId && (
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === filters.categoryId)?.displayName || '1 selected'}
                      </Badge>
                    )}
                  </div>
                  {showCategories ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pb-4 px-4">
                <div className="flex flex-wrap gap-2 pt-2">
                  {categories.filter(cat => cat.isActive).map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      variant={filters.categoryId === category.id ? "default" : "outline"}
                      size="sm"
                      className={`
                        flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-200
                        ${filters.categoryId === category.id 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }
                      `}
                      data-testid={`button-category-${category.slug}`}
                    >
                      {category.iconUrl ? (
                        <img
                          src={category.iconUrl}
                          alt={category.displayName}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="font-medium text-sm">{category.displayName}</span>
                      {category.poolCount > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {category.poolCount}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </section>
  );
}