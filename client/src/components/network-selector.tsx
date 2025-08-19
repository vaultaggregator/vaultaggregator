import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Chain, FilterOptions, Category } from "@/types";
import { getChainIcon } from "@/components/chain-icons";
import { getCategoryIcon } from "@/components/category-icons";
import { ChevronDown } from "lucide-react";

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

  const handleCategoryClick = (categoryId: string | null) => {
    // Toggle category selection - if already selected, deselect it, or if null, clear selection
    const isCurrentlySelected = filters.categoryId === categoryId;
    onFilterChange({ 
      ...filters, 
      categoryId: (isCurrentlySelected || categoryId === null) ? undefined : categoryId 
    });
  };



  // Render chain icon component
  const renderChainIcon = (chain: Chain) => {
    const ChainIcon = getChainIcon(chain.name);
    return <ChainIcon size={16} className="flex-shrink-0" />;
  };

  // Render category icon component
  const renderCategoryIcon = (category: Category) => {
    // Use localized logos for specific tokens
    if (category.name === 'USDC') {
      return (
        <img 
          src="/public-objects/images/a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png"
          alt="USDC"
          className="w-4 h-4 flex-shrink-0 rounded-full"
          data-testid="logo-usdc-category"
        />
      );
    } else if (category.name === 'stETH') {
      return (
        <img 
          src="/public-objects/images/ae7ab96520de3a18e5e111b5eaab095312d7fe84.png"
          alt="stETH"
          className="w-4 h-4 flex-shrink-0 rounded-full"
          data-testid="logo-steth-category"
        />
      );
    } else if (category.name === 'USDT') {
      return (
        <img 
          src="/usdt-logo.png"
          alt="USDT"
          className="w-4 h-4 flex-shrink-0 rounded-full"
          data-testid="logo-usdt-category"
        />
      );
    }
    
    // Fall back to SVG icons for other categories
    const CategoryIcon = getCategoryIcon(category.name);
    return <CategoryIcon size={16} className="flex-shrink-0" />;
  };

  return (
    <section className="bg-card dark:bg-card shadow-sm py-3 sm:py-6 border-b border-border overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="space-y-3 sm:space-y-6">
          {/* Networks Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              {/* Networks Label and Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-base sm:text-lg">🌐</span>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Networks:</h2>
                </div>
                
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {/* All Networks Button */}
                  <Button
                    onClick={clearAllFilters}
                    variant={!filters.chainId ? "default" : "outline"}
                    size="sm"
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                      ${!filters.chainId 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                        : 'bg-card dark:bg-card text-foreground border-2 border-border hover:border-blue-300 hover:text-blue-600'
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
                          : 'bg-card dark:bg-card text-foreground border-2 border-border hover:border-blue-300 hover:text-blue-600'
                        }
                      `}
                      data-testid={`button-network-${chain.name}`}
                    >
                      {renderChainIcon(chain)}
                      <span className="font-medium">{chain.displayName}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Filter Status */}
              {(filters.chainId || filters.categoryId) && (
                <Badge variant="secondary" className="px-3 py-1">
                  {[filters.chainId, filters.categoryId].filter(Boolean).length} filter{[filters.chainId, filters.categoryId].filter(Boolean).length === 1 ? '' : 's'} active
                </Badge>
              )}
            </div>
          </div>

          {/* Categories Section */}
          {categories.filter(cat => cat.isActive).length > 0 && (
            <div>
              <div className="flex items-center space-x-4 flex-wrap">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📂</span>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Categories:</h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* All Categories Button */}
                  <Button
                    onClick={() => handleCategoryClick(null)}
                    variant={!filters.categoryId ? "default" : "outline"}
                    size="sm"
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                      ${!filters.categoryId 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                        : 'bg-card dark:bg-card text-foreground border-2 border-border hover:border-blue-300 hover:text-blue-600'
                      }
                    `}
                    data-testid="button-category-all"
                  >
                    <span className="text-lg">📂</span>
                    <span className="font-medium">All</span>
                  </Button>

                  {/* Categories with Dropdown Menus */}
                  {categories.filter(cat => cat.isActive && !cat.parentId).map((category) => (
                    <div key={category.id} className="relative">
                      {/* Category with Dropdown if it has subcategories */}
                      {category.subcategories && category.subcategories.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant={
                                filters.categoryId === category.id || 
                                category.subcategories?.some(sub => sub.id === filters.categoryId) 
                                  ? "default" : "outline"
                              }
                              size="sm"
                              className={`
                                flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                                ${(filters.categoryId === category.id || 
                                   category.subcategories?.some(sub => sub.id === filters.categoryId))
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                                  : 'bg-card dark:bg-card text-foreground border-2 border-border hover:border-blue-300 hover:text-blue-600'
                                }
                              `}
                              data-testid={`button-category-${category.slug}`}
                            >
                              {renderCategoryIcon(category)}
                              <span className="font-medium">{category.displayName}</span>
                              <ChevronDown size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {/* Parent Category Option */}
                            <DropdownMenuItem
                              onClick={() => handleCategoryClick(category.id)}
                              className={`flex items-center space-x-2 cursor-pointer ${
                                filters.categoryId === category.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                              data-testid={`dropdown-category-${category.slug}`}
                            >
                              {renderCategoryIcon(category)}
                              <span className="font-medium">All {category.displayName}</span>
                            </DropdownMenuItem>
                            
                            {/* Subcategories */}
                            {category.subcategories.filter(sub => sub.isActive).map((subcategory) => (
                              <DropdownMenuItem
                                key={subcategory.id}
                                onClick={() => handleCategoryClick(subcategory.id)}
                                className={`flex items-center space-x-2 cursor-pointer ${
                                  filters.categoryId === subcategory.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                                data-testid={`dropdown-subcategory-${subcategory.slug}`}
                              >
                                {renderCategoryIcon(subcategory)}
                                <span>{subcategory.displayName}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        /* Category without subcategories - regular button */
                        <Button
                          onClick={() => handleCategoryClick(category.id)}
                          variant={filters.categoryId === category.id ? "default" : "outline"}
                          size="sm"
                          className={`
                            flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
                            ${filters.categoryId === category.id 
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                              : 'bg-card dark:bg-card text-foreground border-2 border-border hover:border-blue-300 hover:text-blue-600'
                            }
                          `}
                          data-testid={`button-category-${category.slug}`}
                        >
                          {renderCategoryIcon(category)}
                          <span className="font-medium">{category.displayName}</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}