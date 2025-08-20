/**
 * Enhanced Search Component
 * Provides instant search with keyboard navigation and fuzzy matching
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, TrendingUp, Clock, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { formatNumber } from "@/lib/format";

interface SearchResult {
  id: string;
  type: 'pool' | 'platform' | 'chain' | 'token';
  title: string;
  subtitle?: string;
  apy?: string;
  tvl?: string;
  url: string;
  badges?: string[];
}

interface EnhancedSearchProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

export function EnhancedSearch({ 
  className, 
  placeholder = "Search pools, platforms, tokens...",
  autoFocus = false,
  onClose
}: EnhancedSearchProps) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search results
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      return formatSearchResults(data);
    },
    enabled: query.length >= 2,
    staleTime: 30000
  });

  // Get recent searches from localStorage
  const getRecentSearches = (): SearchResult[] => {
    try {
      const recent = localStorage.getItem('recentSearches');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  };

  // Save search to recent
  const saveToRecent = (result: SearchResult) => {
    try {
      const recent = getRecentSearches();
      const filtered = recent.filter(r => r.id !== result.id);
      const updated = [result, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Format search results from API
  const formatSearchResults = (data: any): SearchResult[] => {
    const results: SearchResult[] = [];
    
    // Format pools
    if (data.pools) {
      data.pools.forEach((pool: any) => {
        results.push({
          id: pool.id,
          type: 'pool',
          title: pool.tokenPair,
          subtitle: `${pool.platform.displayName} on ${pool.chain.displayName}`,
          apy: pool.apy,
          tvl: pool.tvl,
          url: `/yield/${pool.chain.name}/${pool.platform.slug}/${pool.id}`,
          badges: [pool.riskLevel]
        });
      });
    }
    
    // Format platforms
    if (data.platforms) {
      data.platforms.forEach((platform: any) => {
        results.push({
          id: platform.id,
          type: 'platform',
          title: platform.displayName,
          subtitle: 'DeFi Platform',
          url: `/dashboard?platform=${platform.slug}`,
          badges: ['Platform']
        });
      });
    }
    
    // Format chains
    if (data.chains) {
      data.chains.forEach((chain: any) => {
        results.push({
          id: chain.id,
          type: 'chain',
          title: chain.displayName,
          subtitle: 'Blockchain Network',
          url: `/chains?network=${chain.name}`,
          badges: ['Network']
        });
      });
    }
    
    return results;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    saveToRecent(result);
    navigate(result.url);
    handleClose();
  };

  // Handle close
  const handleClose = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(0);
    if (onClose) onClose();
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQuery(value);
    }, 300),
    []
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus on mount if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const displayResults = query.length >= 2 ? results : getRecentSearches();

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            debouncedSearch(value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          data-testid="search-input"
        />
        {query && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClose}
            data-testid="clear-search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (displayResults.length > 0 || query.length >= 2) && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
          {query.length < 2 && (
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <Clock className="inline h-3 w-3 mr-1" />
              Recent Searches
            </div>
          )}
          
          {displayResults.length === 0 && query.length >= 2 && !isLoading && (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )}
          
          {displayResults.map((result, index) => (
            <button
              key={result.id}
              className={cn(
                "w-full px-4 py-3 flex items-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left",
                selectedIndex === index && "bg-gray-50 dark:bg-gray-800"
              )}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              data-testid={`search-result-${index}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {result.title}
                  </span>
                  {result.badges?.map((badge, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
                {result.subtitle && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {result.subtitle}
                  </div>
                )}
                {(result.apy || result.tvl) && (
                  <div className="flex items-center gap-3 mt-1">
                    {result.apy && (
                      <span className="text-sm text-green-600 dark:text-green-400">
                        <TrendingUp className="inline h-3 w-3 mr-1" />
                        {result.apy}% APY
                      </span>
                    )}
                    {result.tvl && (
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {formatNumber(parseFloat(result.tvl), { currency: '$', maxDecimals: 2 })} TVL
                      </span>
                    )}
                  </div>
                )}
              </div>
              {result.type === 'pool' && (
                <Star className="h-4 w-4 text-gray-400 ml-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}