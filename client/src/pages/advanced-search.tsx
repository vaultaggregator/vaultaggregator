import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, SlidersHorizontal, X, TrendingUp, Shield, DollarSign } from "lucide-react";
import YieldOpportunityCard from "@/components/yield-opportunity-card";
import type { YieldOpportunity, Chain, Category } from "@/types";

interface AdvancedFilters {
  query?: string;
  chainIds?: string[];
  categoryIds?: string[];
  minApy?: number;
  maxApy?: number;
  minTvl?: number;
  maxTvl?: number;
  riskLevels?: string[];
  platforms?: string[];
  hasAudit?: boolean;
  minOperatingDays?: number;
}

export default function AdvancedSearch() {
  const [filters, setFilters] = useState<AdvancedFilters>({
    minApy: 0,
    maxApy: 100,
    minTvl: 0,
    maxTvl: 10000000000, // 10B
    minOperatingDays: 0
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: AdvancedFilters }[]>([]);
  const [filterName, setFilterName] = useState("");

  // Fetch data
  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ['/api/chains'],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: pools = [], isLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools', 'advanced-search', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        onlyVisible: 'true',
        limit: '100'
      });
      
      if (filters.query) params.append('search', filters.query);
      if (filters.chainIds?.length) params.append('chainIds', filters.chainIds.join(','));
      if (filters.categoryIds?.length) params.append('categoryIds', filters.categoryIds.join(','));
      if (filters.minApy) params.append('minApy', filters.minApy.toString());
      if (filters.maxApy && filters.maxApy !== 100) params.append('maxApy', filters.maxApy.toString());
      if (filters.minTvl) params.append('minTvl', filters.minTvl.toString());
      if (filters.maxTvl && filters.maxTvl !== 10000000000) params.append('maxTvl', filters.maxTvl.toString());
      if (filters.riskLevels?.length) params.append('riskLevels', filters.riskLevels.join(','));
      if (filters.platforms?.length) params.append('platforms', filters.platforms.join(','));
      if (filters.hasAudit) params.append('hasAudit', 'true');
      if (filters.minOperatingDays) params.append('minOperatingDays', filters.minOperatingDays.toString());

      const response = await fetch(`/api/pools/advanced-search?${params}`);
      if (!response.ok) throw new Error('Failed to fetch pools');
      return response.json();
    },
  });

  const updateFilter = (key: keyof AdvancedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      minApy: 0,
      maxApy: 100,
      minTvl: 0,
      maxTvl: 10000000000,
      minOperatingDays: 0
    });
  };

  const saveFilter = () => {
    if (!filterName.trim()) return;
    setSavedFilters(prev => [...prev, { name: filterName, filters: { ...filters } }]);
    setFilterName("");
  };

  const loadFilter = (savedFilter: { name: string; filters: AdvancedFilters }) => {
    setFilters(savedFilter.filters);
  };

  const removeFilter = (index: number) => {
    setSavedFilters(prev => prev.filter((_, i) => i !== index));
  };

  // Get unique platforms from pools for filtering
  const platforms = Array.from(new Set(pools.map(p => p.platform.name)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-advanced-search-title">
              Advanced Search & Filtering
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2" data-testid="text-advanced-search-subtitle">
              Find the perfect yield opportunities with powerful search and filtering tools
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Filter className="w-5 h-5 mr-2" />
                      Filters
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      data-testid="button-toggle-advanced"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Search Query */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <div className="relative">
                      <Input
                        placeholder="Search pools, platforms..."
                        value={filters.query || ""}
                        onChange={(e) => updateFilter('query', e.target.value)}
                        className="pl-10"
                        data-testid="input-search-query"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  {/* Networks */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Networks</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {chains.filter(c => c.isActive).map((chain) => (
                        <div key={chain.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`chain-${chain.id}`}
                            checked={filters.chainIds?.includes(chain.id) || false}
                            onCheckedChange={(checked) => {
                              const current = filters.chainIds || [];
                              updateFilter('chainIds', 
                                checked 
                                  ? [...current, chain.id]
                                  : current.filter(id => id !== chain.id)
                              );
                            }}
                            data-testid={`checkbox-chain-${chain.name}`}
                          />
                          <label htmlFor={`chain-${chain.id}`} className="text-sm">
                            {chain.displayName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* APY Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      APY Range: {filters.minApy}% - {filters.maxApy}%
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Min APY</label>
                        <Slider
                          value={[filters.minApy || 0]}
                          onValueChange={([value]) => updateFilter('minApy', value)}
                          max={50}
                          step={0.5}
                          className="w-full"
                          data-testid="slider-min-apy"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Max APY</label>
                        <Slider
                          value={[filters.maxApy || 100]}
                          onValueChange={([value]) => updateFilter('maxApy', value)}
                          max={100}
                          step={0.5}
                          className="w-full"
                          data-testid="slider-max-apy"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TVL Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      TVL Range: ${(filters.minTvl || 0).toLocaleString()} - ${(filters.maxTvl || 10000000000).toLocaleString()}
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Min TVL</label>
                        <Slider
                          value={[Math.log10((filters.minTvl || 1) + 1)]}
                          onValueChange={([value]) => updateFilter('minTvl', Math.pow(10, value) - 1)}
                          max={10}
                          step={0.1}
                          className="w-full"
                          data-testid="slider-min-tvl"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Max TVL</label>
                        <Slider
                          value={[Math.log10((filters.maxTvl || 10000000000) + 1)]}
                          onValueChange={([value]) => updateFilter('maxTvl', Math.pow(10, value) - 1)}
                          max={10}
                          step={0.1}
                          className="w-full"
                          data-testid="slider-max-tvl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk Levels */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Risk Levels</label>
                    <div className="space-y-2">
                      {['Low', 'Medium', 'High'].map((risk) => (
                        <div key={risk} className="flex items-center space-x-2">
                          <Checkbox
                            id={`risk-${risk}`}
                            checked={filters.riskLevels?.includes(risk) || false}
                            onCheckedChange={(checked) => {
                              const current = filters.riskLevels || [];
                              updateFilter('riskLevels',
                                checked
                                  ? [...current, risk]
                                  : current.filter(r => r !== risk)
                              );
                            }}
                            data-testid={`checkbox-risk-${risk.toLowerCase()}`}
                          />
                          <label htmlFor={`risk-${risk}`} className="text-sm flex items-center">
                            <Shield className={`w-3 h-3 mr-1 ${
                              risk === 'Low' ? 'text-green-500' :
                              risk === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                            }`} />
                            {risk}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {showAdvanced && (
                    <>
                      {/* Categories */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Categories</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {categories.filter(c => c.isActive).map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={filters.categoryIds?.includes(category.id) || false}
                                onCheckedChange={(checked) => {
                                  const current = filters.categoryIds || [];
                                  updateFilter('categoryIds',
                                    checked
                                      ? [...current, category.id]
                                      : current.filter(id => id !== category.id)
                                  );
                                }}
                                data-testid={`checkbox-category-${category.name}`}
                              />
                              <label htmlFor={`category-${category.id}`} className="text-sm">
                                {category.displayName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Platforms */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Platforms</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {platforms.map((platform) => (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`platform-${platform}`}
                                checked={filters.platforms?.includes(platform) || false}
                                onCheckedChange={(checked) => {
                                  const current = filters.platforms || [];
                                  updateFilter('platforms',
                                    checked
                                      ? [...current, platform]
                                      : current.filter(p => p !== platform)
                                  );
                                }}
                                data-testid={`checkbox-platform-${platform.toLowerCase()}`}
                              />
                              <label htmlFor={`platform-${platform}`} className="text-sm">
                                {platform}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Operating Days */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Minimum Operating Days: {filters.minOperatingDays || 0}
                        </label>
                        <Slider
                          value={[filters.minOperatingDays || 0]}
                          onValueChange={([value]) => updateFilter('minOperatingDays', value)}
                          max={365}
                          step={1}
                          className="w-full"
                          data-testid="slider-min-operating-days"
                        />
                      </div>

                      {/* Audit Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has-audit"
                          checked={filters.hasAudit || false}
                          onCheckedChange={(checked) => updateFilter('hasAudit', checked)}
                          data-testid="checkbox-has-audit"
                        />
                        <label htmlFor="has-audit" className="text-sm">
                          Only audited protocols
                        </label>
                      </div>
                    </>
                  )}

                  {/* Filter Actions */}
                  <div className="space-y-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="w-full"
                      data-testid="button-clear-filters"
                    >
                      Clear All Filters
                    </Button>
                    
                    {/* Save Filter */}
                    <div className="space-y-2">
                      <Input
                        placeholder="Filter name..."
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        size="sm"
                        data-testid="input-filter-name"
                      />
                      <Button
                        size="sm"
                        onClick={saveFilter}
                        disabled={!filterName.trim()}
                        className="w-full"
                        data-testid="button-save-filter"
                      >
                        Save Filter
                      </Button>
                    </div>

                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Saved Filters</label>
                        {savedFilters.map((saved, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => loadFilter(saved)}
                              className="text-xs flex-1 justify-start"
                              data-testid={`button-load-filter-${index}`}
                            >
                              {saved.name}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFilter(index)}
                              className="text-xs p-1"
                              data-testid={`button-remove-filter-${index}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold" data-testid="text-results-count">
                    {isLoading ? "Searching..." : `${pools.length} pools found`}
                  </h2>
                  {Object.keys(filters).some(key => {
                    const value = filters[key as keyof AdvancedFilters];
                    return value && (Array.isArray(value) ? value.length > 0 : 
                      (key === 'minApy' ? (typeof value === 'number' && value > 0) :
                       key === 'maxApy' ? (typeof value === 'number' && value < 100) :
                       key === 'minTvl' ? (typeof value === 'number' && value > 0) :
                       key === 'maxTvl' ? (typeof value === 'number' && value < 10000000000) :
                       key === 'minOperatingDays' ? (typeof value === 'number' && value > 0) : true));
                  }) && (
                    <Badge variant="secondary" className="flex items-center">
                      <Filter className="w-3 h-3 mr-1" />
                      Filters Active
                    </Badge>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : pools.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No pools found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Try adjusting your search criteria or clearing some filters
                    </p>
                    <Button variant="outline" onClick={clearAllFilters} data-testid="button-clear-no-results">
                      Clear All Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pools.map((pool) => (
                    <YieldOpportunityCard key={pool.id} {...pool} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}