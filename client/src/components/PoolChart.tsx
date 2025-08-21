import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { formatTvl } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

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

type TimeRange = '1H' | '1D' | '1W' | '1M' | '3M' | '1Y';
type ChartType = 'apy' | 'tvl';

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
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1W');
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

  // Create timeRange configs matching Pendle style
  const timeRangeConfigs = {
    '1H': { days: 0.042, label: '1H' }, // 1 hour
    '1D': { days: 1, label: '1D' },
    '1W': { days: 7, label: '1W' },
    '1M': { days: 30, label: '1M' },
    '3M': { days: 90, label: '3M' },
    '1Y': { days: 365, label: '1Y' }
  };

  // Fetch real historical data based on selected time range
  const config = timeRangeConfigs[selectedTimeRange];
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
    <Card className={cn('w-full bg-[#0b1217] border-[#1a2332]', className)}>
      <CardContent className="p-0">
        {/* Pendle-style header with large APY display */}
        <div className="p-6 pb-4 border-b border-[#1a2332]">
          <div className="flex items-start justify-between mb-4">
            {/* Left: Large APY display */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white">
                  {stats ? formatApy(stats.apy.current) : formatApy(currentApy)}
                </span>
                {stats && (
                  <span className={cn(
                    'text-sm font-medium flex items-center gap-1',
                    stats.apy.change > 0 ? 'text-green-400' : stats.apy.change < 0 ? 'text-red-400' : 'text-gray-400'
                  )}>
                    {stats.apy.change > 0 && <TrendingUp className="w-3 h-3" />}
                    {stats.apy.change < 0 && <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stats.apy.change).toFixed(2)}% (Past {selectedTimeRange})
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {tokenPair} APY
              </p>
            </div>

            {/* Right: Chart type selector */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('apy')}
                className={cn(
                  "text-xs font-medium px-3 py-1 h-7",
                  chartType === 'apy' 
                    ? "bg-[#1a2332] text-cyan-400 hover:bg-[#1a2332]" 
                    : "text-gray-400 hover:text-white hover:bg-[#1a2332]"
                )}
              >
                APY
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChartType('tvl')}
                className={cn(
                  "text-xs font-medium px-3 py-1 h-7",
                  chartType === 'tvl' 
                    ? "bg-[#1a2332] text-cyan-400 hover:bg-[#1a2332]" 
                    : "text-gray-400 hover:text-white hover:bg-[#1a2332]"
                )}
              >
                TVL
              </Button>
            </div>
          </div>

          {/* Time range selector - Pendle style */}
          <div className="flex items-center gap-1">
            {(Object.keys(timeRangeConfigs) as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
                className={cn(
                  "text-xs font-medium px-2 py-1 h-6",
                  selectedTimeRange === range 
                    ? "text-cyan-400 bg-cyan-400/10" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {timeRangeConfigs[range].label}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart area - Pendle style dual chart */}
        <div className="p-6 pt-4">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'apy' ? (
                <ComposedChart data={displayData}>
                  <defs>
                    <linearGradient id="apyLineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid with dark theme */}
                  <CartesianGrid 
                    strokeDasharray="1 0" 
                    stroke="#1a2332"
                    verticalPoints={[0]}
                    horizontalPoints={[0, 0.25, 0.5, 0.75, 1]}
                  />
                  
                  {/* X Axis */}
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#4a5568"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#1a2332' }}
                  />
                  
                  {/* Left Y Axis for APY */}
                  <YAxis 
                    yAxisId="apy"
                    orientation="right"
                    stroke="#4a5568"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  />
                  
                  {/* Tooltip */}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0b1217',
                      border: '1px solid #1a2332',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'apy') return [formatApy(value), 'APY'];
                      return [value, name];
                    }}
                    labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                  />
                  
                  {/* APY Line */}
                  <Line
                    yAxisId="apy"
                    type="monotone"
                    dataKey="apy"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    dot={false}
                  />
                  
                  {/* TVL Bars at bottom if available */}
                  {stats?.tvl && (
                    <>
                      <YAxis 
                        yAxisId="tvl"
                        orientation="left"
                        hide={true}
                        domain={[0, 'dataMax']}
                      />
                      <Bar
                        yAxisId="tvl"
                        dataKey="tvl"
                        fill="#00d4ff"
                        opacity={0.2}
                        radius={[2, 2, 0, 0]}
                      />
                    </>
                  )}
                </ComposedChart>
            ) : (
              <BarChart data={displayData}>
                {/* Grid with dark theme */}
                <CartesianGrid 
                  strokeDasharray="1 0" 
                  stroke="#1a2332"
                  verticalPoints={[0]}
                  horizontalPoints={[0, 0.25, 0.5, 0.75, 1]}
                />
                
                {/* X Axis */}
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#4a5568"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#1a2332' }}
                />
                
                {/* Y Axis for TVL */}
                <YAxis 
                  orientation="right"
                  stroke="#4a5568"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatTvl}
                />
                
                {/* Tooltip */}
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0b1217',
                    border: '1px solid #1a2332',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value: number) => [formatTvl(value), 'TVL']}
                  labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullDate || label}
                />
                
                {/* TVL Bars */}
                <Bar
                  dataKey="tvl"
                  fill="#00d4ff"
                  opacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}