import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Chain, FilterOptions } from "@/types";

interface NetworkSelectorProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export default function NetworkSelector({ filters, onFilterChange }: NetworkSelectorProps) {
  // Fetch chains
  const { data: chains = [] } = useQuery<Chain[]>({
    queryKey: ['/api/chains'],
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
        <div className="flex items-center justify-between">
          {/* Network Selection */}
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
                <span className="text-sm">{getNetworkIcon(chain.displayName)}</span>
                <span className="font-medium">{chain.displayName}</span>
              </Button>
            ))}
          </div>

          {/* Filter Status */}
          <div className="flex items-center space-x-3">
            {filters.chainId && (
              <Badge variant="secondary" className="px-3 py-1">
                1 filter active
              </Badge>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}