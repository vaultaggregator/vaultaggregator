import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface ChartDataPoint {
  timestamp: number;
  date: string;
  apy: number;
  tvl: number | null;
  formattedDate: string;
  fullDate: string;
}

interface PoolChartProps {
  poolId: string;
  currentApy: number;
  currentTvl: number;
  tokenPair: string;
  className?: string;
}

type TimeRange = '24H' | '7D' | '1M' | '3M' | '1Y' | 'Max';
type ChartType = 'apy' | 'tvl' | 'both';

// Fetch real historical data from API
const useHistoricalData = (poolId: string, days: number) => {
  return useQuery<ChartDataPoint[]>({
    queryKey: ['/api/pools', poolId, 'historical-data', days],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const response = await fetch(`/api/pools/${poolId}/historical-data?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Dynamic timeRange configs are now created inside the component based on actual pool data

export function PoolChart({ poolId, currentApy, currentTvl, tokenPair, className }: PoolChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('7D');
  const [chartType, setChartType] = useState<ChartType>('apy');

  // Fetch pool data to get actual operating days for dynamic "Max" timeframe
  const { data: poolData } = useQuery({
    queryKey: ['/api/pools', poolId],
    queryFn: async () => {
      const response = await fetch(`/api/pools/${poolId}`);
      if (!response.ok) throw new Error('Failed to fetch pool data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create dynamic timeRange configs based on actual pool operating days
  const dynamicTimeRangeConfigs = useMemo(() => {
    const operatingDays = poolData?.operatingDays || 730; // fallback if data not loaded
    return {
      '24H': { days: 1, label: '24H' },
      '7D': { days: 7, label: '7D' },
      '1M': { days: 30, label: '1M' },
      '3M': { days: 90, label: '3M' },
      '1Y': { days: 365, label: '1Y' },
      'Max': { days: Math.max(operatingDays + 10, 400), label: 'Max' } // Use actual operating days + buffer
    };
  }, [poolData?.operatingDays]);

  // Fetch real historical data based on selected time range
  const config = dynamicTimeRangeConfigs[selectedTimeRange];
  const { data: historicalData, isLoading, error } = useHistoricalData(poolId, config.days);

  // Process historical data for display - 100% authentic data only
  const displayData = useMemo(() => {
    console.log('📊 Chart Debug - historicalData length:', historicalData?.length);
    
    if (!historicalData || historicalData.length === 0) {
      console.log('❌ Chart Debug - No historical data available');
      return [];
    }
    
    console.log(`📊 Chart Debug [${poolId}] - Data conversion check:`, {
      rawAPY: historicalData[0]?.apy,
      rawType: typeof historicalData[0]?.apy,
      convertedAPY: (historicalData[0]?.apy as number) * 100,
      shouldMultiply: (historicalData[0]?.apy as number) < 1,
      totalPoints: historicalData.length,
      firstThreeRaw: historicalData.slice(0, 3).map(p => p.apy)
    });
    
    // Only use authentic historical data - convert APY from decimal to percentage  
    console.log(`📊 Chart Debug [${poolId}] - Starting data filtering...`);
    
    const processedData = historicalData
      .filter((point, index) => {
        // APY is required, TVL is optional (Lido historical data doesn't include TVL)
        const hasValidApy = point.apy !== null && point.apy !== undefined && !isNaN(point.apy);
        const hasValidTvl = point.tvl === null || (point.tvl !== undefined && !isNaN(point.tvl));
        const isValid = hasValidApy && hasValidTvl;
        
        console.log(`📊 Chart Debug [${poolId}] - Point ${index}:`, {
          point,
          hasValidApy,
          hasValidTvlCheck: {
            isNull: point.tvl === null,
            isNotUndefined: point.tvl !== undefined,
            isNotNaN: point.tvl !== null ? !isNaN(point.tvl) : 'N/A (null)',
            finalTvlValid: hasValidTvl
          },
          isValid
        });
        
        if (!isValid) {
          console.log('❌ Chart Debug - FILTERED OUT point:', point, { hasValidApy, hasValidTvl });
        }
        return isValid;
      })
      .map(point => ({
        ...point,
        apy: parseFloat(
          (point.apy as number) < 1 
            ? ((point.apy as number) * 100).toFixed(2)  // Convert decimal: 0.0438 -> 4.38%
            : (point.apy as number).toFixed(2)          // Already percentage: 11.00 -> 11.00%
        ),
        tvl: point.tvl !== null ? parseFloat((point.tvl as number).toFixed(2)) : null, // Handle null TVL for Lido
        timestamp: point.timestamp,
        date: point.date,
        formattedDate: point.formattedDate,
        fullDate: point.fullDate
      }));
    
    console.log(`📊 Chart Debug [${poolId}] - Processed data:`, {
      sample: processedData.slice(0, 2),
      totalPoints: processedData.length,
      firstThreeProcessed: processedData.slice(0, 3).map(p => ({ apy: p.apy, tvl: p.tvl }))
    });
    
    // Reverse the data order to show most recent data on the left (horizontal inversion)
    return processedData.reverse();
  }, [historicalData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (displayData.length === 0) return null;
    
    const apyValues = displayData.map(d => d.apy);
    const nonNullTvlValues = displayData.map(d => d.tvl).filter((tvl): tvl is number => tvl !== null);
    
    return {
      apy: {
        current: apyValues[apyValues.length - 1],
        avg: apyValues.reduce((a, b) => a + b, 0) / apyValues.length,
        min: Math.min(...apyValues),
        max: Math.max(...apyValues),
        change: apyValues[apyValues.length - 1] - apyValues[0]
      },
      tvl: nonNullTvlValues.length > 0 ? {
        current: displayData[displayData.length - 1].tvl,
        avg: nonNullTvlValues.reduce((a, b) => a + b, 0) / nonNullTvlValues.length,
        min: Math.min(...nonNullTvlValues),
        max: Math.max(...nonNullTvlValues),
        change: nonNullTvlValues.length > 1 ? 
          (displayData[displayData.length - 1].tvl || 0) - (displayData[0].tvl || 0) : 0
      } : null
    };
  }, [displayData]);

  const formatTvl = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatApy = (value: number): string => `${value.toFixed(2)}%`;

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-3"></div>
              <p className="text-lg font-medium">Loading Chart Data</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Fetching historical data for {tokenPair}...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state  
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <p className="text-lg font-medium text-red-600 dark:text-red-400">Chart Error</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no data state
  if (displayData.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No Chart Data</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              No historical data available for {selectedTimeRange} period
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Raw data length: {historicalData?.length || 0}, Processed: {displayData.length}
            </p>
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Sample raw data: {JSON.stringify(historicalData?.slice(0, 1))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 13.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-medium">Chart Data Error</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Failed to load historical data for {tokenPair}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayData.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No Chart Data Available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Historical data for {tokenPair} is not available yet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        {/* Header with current values and change */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tokenPair} Performance
            </h3>
            
            {/* Chart Type Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={chartType === 'apy' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('apy')}
                className="text-xs"
              >
                APY
              </Button>
              <Button
                variant={chartType === 'tvl' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('tvl')}
                className="text-xs"
              >
                TVL
              </Button>
              <Button
                variant={chartType === 'both' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('both')}
                className="text-xs"
              >
                Both
              </Button>
            </div>
          </div>

          {/* Current values and statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {(chartType === 'apy' || chartType === 'both') && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                  <div className="text-sm text-green-700 dark:text-green-300 mb-1">Current APY</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatApy(stats.apy.current)}
                  </div>
                  <div className={cn('text-sm flex items-center', getChangeColor(stats.apy.change))}>
                    {getChangeIcon(stats.apy.change)} {Math.abs(stats.apy.change).toFixed(2)}% ({selectedTimeRange})
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Avg: {formatApy(stats.apy.avg)} | Range: {formatApy(stats.apy.min)} - {formatApy(stats.apy.max)}
                  </div>
                </div>
              )}

              {(chartType === 'tvl' || chartType === 'both') && stats.tvl && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Current TVL</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatTvl(stats.tvl.current)}
                  </div>
                  <div className={cn('text-sm flex items-center', getChangeColor(stats.tvl.change))}>
                    {getChangeIcon(stats.tvl.change)} {formatTvl(Math.abs(stats.tvl.change))} ({selectedTimeRange})
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Avg: {formatTvl(stats.tvl.avg)} | Range: {formatTvl(stats.tvl.min)} - {formatTvl(stats.tvl.max)}
                  </div>
                </div>
              )}
              
              {(chartType === 'tvl' || chartType === 'both') && !stats.tvl && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg p-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">TVL Data</div>
                  <div className="text-lg text-gray-500 dark:text-gray-400">
                    Historical TVL not available for this platform
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline buttons - CoinGecko style */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(Object.keys(dynamicTimeRangeConfigs) as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
                className="text-xs font-medium px-3 py-1"
              >
                {dynamicTimeRangeConfigs[range].label}
              </Button>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Data: {displayData.length} points
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'apy' ? (
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="apyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatApy}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  formatter={(value: number) => [formatApy(value), 'APY']}
                  labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                />
                <Area
                  type="monotone"
                  dataKey="apy"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#apyGradient)"
                />
              </AreaChart>
            ) : chartType === 'tvl' ? (
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatTvl}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  formatter={(value: number) => [formatTvl(value), 'TVL']}
                  labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#tvlGradient)"
                />
              </AreaChart>
            ) : (
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="apy"
                  orientation="left"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatApy}
                />
                <YAxis 
                  yAxisId="tvl"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={formatTvl}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'apy' ? formatApy(value) : formatTvl(value),
                    name === 'apy' ? 'APY' : 'TVL'
                  ]}
                  labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                />
                <Line
                  yAxisId="apy"
                  type="monotone"
                  dataKey="apy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="tvl"
                  type="monotone"
                  dataKey="tvl"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Timeline scrubber */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Timeline</div>
          <div className="h-12 bg-gray-50 dark:bg-gray-800 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
              {displayData.length > 0 && (
                <span>
                  {displayData[0].formattedDate} ← {displayData[displayData.length - 1].formattedDate}
                </span>
              )}
            </div>
            {/* Timeline visualization */}
            <div className="absolute bottom-0 left-0 right-0 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                  <Area
                    type="monotone"
                    dataKey={chartType === 'tvl' ? 'tvl' : 'apy'}
                    stroke="none"
                    fill={chartType === 'tvl' ? '#3b82f6' : '#10b981'}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>


      </CardContent>
    </Card>
  );
}