import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { DataTable, DataTableColumn, PillFilter } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { AnimatedPercentage, AnimatedCurrency, AnimatedNumber } from '@/components/animated-value';
import { formatTimeAgo } from '@/lib/utils';
import { formatHolders } from '@/lib/format';
import type { YieldOpportunity } from '@/types';

export default function Discover() {
  const [, setLocation] = useLocation();
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);
  const [tokenFilter, setTokenFilter] = useState<string | null>(null);

  // Set document title
  useEffect(() => {
    document.title = 'Discover Vaults - Vault Aggregator';
  }, []);

  // Fetch pools data
  const { data: pools = [], isLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools', { onlyVisible: true }],
    queryFn: async () => {
      const response = await fetch('/api/pools?onlyVisible=true');
      if (!response.ok) throw new Error('Failed to fetch pools');
      return response.json();
    },
    staleTime: 1000,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });

  // Extract unique filter options
  const chainOptions = Array.from(new Set(pools.map(p => p.chain?.displayName)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  const protocolOptions = Array.from(new Set(pools.map(p => p.platform?.displayName)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  const tokenOptions = Array.from(new Set(pools.map(p => p.tokenPair)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  // Apply filters
  const filteredPools = pools.filter(pool => {
    if (chainFilter && pool.chain?.displayName !== chainFilter) return false;
    if (protocolFilter && pool.platform?.displayName !== protocolFilter) return false;
    if (tokenFilter && pool.tokenPair !== tokenFilter) return false;
    return true;
  });

  // Define table columns
  const columns: DataTableColumn<YieldOpportunity>[] = [
    {
      key: 'tokenPair',
      header: 'Token',
      width: '200px',
      render: (pool) => (
        <div className="flex items-center gap-2">
          {pool.categories && pool.categories.length > 0 && (() => {
            const usdcCategory = pool.categories.find(cat => cat.name === 'USDC');
            const usdtCategory = pool.categories.find(cat => cat.name === 'USDT');
            const stethCategory = pool.categories.find(cat => cat.name === 'stETH');

            if (usdcCategory) {
              return (
                <img 
                  src="/public-objects/images/a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png"
                  alt="USDC"
                  className="w-5 h-5 rounded-full"
                />
              );
            } else if (usdtCategory) {
              return (
                <img 
                  src="/usdt-logo.png"
                  alt="USDT"
                  className="w-5 h-5 rounded-full"
                />
              );
            } else if (stethCategory) {
              return (
                <img 
                  src="/public-objects/images/ae7ab96520de3a18e5e111b5eaab095312d7fe84.png"
                  alt="stETH"
                  className="w-5 h-5 rounded-full"
                />
              );
            }
            return null;
          })()}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {pool.tokenPair}
          </span>
        </div>
      )
    },
    {
      key: 'platform',
      header: 'Protocol',
      width: '120px',
      render: (pool) => (
        <Badge variant="secondary" className="text-xs">
          {pool.platform?.displayName}
        </Badge>
      )
    },
    {
      key: 'chain',
      header: 'Chain',
      width: '100px',
      render: (pool) => (
        <Badge variant="outline" className="text-xs">
          {pool.chain?.displayName}
        </Badge>
      )
    },
    {
      key: 'apy',
      header: 'Net APY',
      width: '100px',
      align: 'right',
      sortable: true,
      render: (pool) => (
        <div className="text-green-600 dark:text-green-400 font-semibold">
          {pool.apy ? (
            <AnimatedPercentage 
              value={parseFloat(pool.apy)} 
              precision={2}
            />
          ) : 'N/A'}
        </div>
      )
    },
    {
      key: 'tvl',
      header: 'TVL',
      width: '120px',
      align: 'right',
      sortable: true,
      render: (pool) => (
        <div className="text-gray-900 dark:text-gray-100 font-medium">
          {pool.tvl ? (
            <AnimatedCurrency 
              value={parseFloat(pool.tvl)} 
              compact={true}
            />
          ) : 'N/A'}
        </div>
      )
    },
    {
      key: 'holdersCount',
      header: 'Holders',
      width: '100px',
      align: 'right',
      sortable: true,
      render: (pool) => (
        <div className="text-gray-600 dark:text-gray-400">
          {pool.holdersCount ? (
            <AnimatedNumber 
              value={pool.holdersCount} 
              formatter={(val) => formatHolders(val)}
              precision={0}
            />
          ) : 'N/A'}
        </div>
      )
    },
    {
      key: 'riskLevel',
      header: 'Risk',
      width: '80px',
      align: 'center',
      render: (pool) => {
        const riskColors = {
          low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        };
        return (
          <Badge 
            variant="secondary"
            className={cn("text-xs capitalize", riskColors[pool.riskLevel as keyof typeof riskColors])}
          >
            {pool.riskLevel}
          </Badge>
        );
      }
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      width: '100px',
      align: 'right',
      render: (pool) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {pool.updatedAt ? formatTimeAgo(new Date(pool.updatedAt).getTime()) : 'N/A'}
        </span>
      )
    }
  ];

  const handleRowClick = (pool: YieldOpportunity) => {
    // Navigate to pool detail page
    const url = `/yield/${pool.chain?.name?.toLowerCase()}/${pool.platform?.name?.toLowerCase()}/${pool.tokenPair?.toLowerCase()}`;
    setLocation(url);
  };

  return (
    <AppShell>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Discover Vaults
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore DeFi yield opportunities across multiple protocols and chains
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <PillFilter
            label="Chain"
            options={chainOptions}
            selected={chainFilter}
            onChange={setChainFilter}
          />
          <PillFilter
            label="Protocol"
            options={protocolOptions}
            selected={protocolFilter}
            onChange={setProtocolFilter}
          />
          <PillFilter
            label="Token"
            options={tokenOptions}
            selected={tokenFilter}
            onChange={setTokenFilter}
          />
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vaults...</p>
            </div>
          ) : (
            <DataTable
              data={filteredPools}
              columns={columns}
              onRowClick={handleRowClick}
              dense={true}
            />
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredPools.length} of {pools.length} vaults
        </div>
      </div>
    </AppShell>
  );
}

// Import cn utility
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}