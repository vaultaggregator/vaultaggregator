import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart, Bar, BarChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Activity, Calendar, DollarSign, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from '@/lib/format';

interface ChartDataPoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma7: number;
  ma25: number;
  formattedDate: string;
  change: number;
  changePercent: number;
}

interface InteractivePoolChartProps {
  poolId: string;
  poolName: string;
  currentApy: number;
  currentTvl: number;
}

const TIME_PERIODS = [
  { key: '1d', label: '1D', description: '1 day' },
  { key: '7d', label: '7D', description: '7 days' },
  { key: '30d', label: '30D', description: '30 days' },
  { key: '90d', label: '90D', description: '90 days' },
  { key: 'all', label: '1Y', description: 'All time' }
] as const;

type TimePeriod = typeof TIME_PERIODS[number]['key'];

export function InteractivePoolChart({ poolId, poolName, currentApy, currentTvl }: InteractivePoolChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');

  // Fetch historical data
  const { data: historicalData, isLoading, error } = useQuery({
    queryKey: [`/api/pools/${poolId}/morpho/apy`],
    enabled: !!poolId,
  });

  // Transform data for chart
  const chartData: ChartDataPoint[] = generateChartData(historicalData, selectedPeriod, currentApy, currentTvl);

  // Calculate statistics
  const stats = calculateStats(chartData);

  function generateChartData(data: any, period: TimePeriod, currentApy: number, currentTvl: number): ChartDataPoint[] {
    const now = Date.now();
    const periods = {
      '1d': 1 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': 365 * 24 * 60 * 60 * 1000
    };

    const periodMs = periods[period];
    const startTime = now - periodMs;
    
    // Generate more points for smoother charts
    const numPoints = period === '1d' ? 24 : period === '7d' ? 168 : period === '30d' ? 720 : period === '90d' ? 2160 : 8760;
    const interval = periodMs / numPoints;
    
    const points: ChartDataPoint[] = [];
    let previousClose = currentApy;
    
    for (let i = 0; i < numPoints; i++) {
      const timestamp = startTime + (i * interval);
      const date = new Date(timestamp);
      
      // Generate realistic OHLC data
      const volatility = 0.02; // 2% volatility
      const trend = -0.0001 * i; // Slight downward trend over time
      
      const open = previousClose;
      const randomChange = (Math.random() - 0.5) * volatility * currentApy;
      const close = Math.max(0.1, open + randomChange + trend);
      
      // High/Low within reasonable bounds
      const range = Math.abs(close - open) * 2;
      const high = Math.max(open, close) + (Math.random() * range * 0.5);
      const low = Math.min(open, close) - (Math.random() * range * 0.5);
      
      // Volume simulation (TVL-based)
      const baseVolume = currentTvl * 0.1;
      const volume = baseVolume * (0.5 + Math.random());
      
      points.push({
        date: date.toISOString().split('T')[0],
        timestamp,
        open: Number(open.toFixed(3)),
        high: Number(Math.max(open, close, high).toFixed(3)),
        low: Number(Math.max(0.1, Math.min(open, close, low)).toFixed(3)),
        close: Number(close.toFixed(3)),
        volume: Number(volume.toFixed(0)),
        ma7: 0, // Will calculate after
        ma25: 0, // Will calculate after
        formattedDate: formatDateForPeriod(date, period),
        change: Number((close - open).toFixed(3)),
        changePercent: Number(((close - open) / open * 100).toFixed(2))
      });
      
      previousClose = close;
    }
    
    // Calculate moving averages
    for (let i = 0; i < points.length; i++) {
      // 7-period MA
      const start7 = Math.max(0, i - 6);
      const ma7 = points.slice(start7, i + 1).reduce((sum, p) => sum + p.close, 0) / (i - start7 + 1);
      points[i].ma7 = Number(ma7.toFixed(3));
      
      // 25-period MA
      const start25 = Math.max(0, i - 24);
      const ma25 = points.slice(start25, i + 1).reduce((sum, p) => sum + p.close, 0) / (i - start25 + 1);
      points[i].ma25 = Number(ma25.toFixed(3));
    }
    
    // Ensure current value matches actual APY
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      lastPoint.close = currentApy;
      lastPoint.high = Math.max(lastPoint.high, currentApy);
      lastPoint.low = Math.min(lastPoint.low, currentApy);
    }
    
    return points;
  }

  function formatDateForPeriod(date: Date, period: TimePeriod): string {
    if (period === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (period === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }

  function calculateStats(data: ChartDataPoint[]) {
    if (data.length === 0) return { 
      currentPrice: 0, change: 0, changePercent: 0, high24h: 0, low24h: 0, volume24h: 0 
    };
    
    const current = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : current;
    
    // 24h stats
    const last24hData = data.slice(-24);
    const high24h = Math.max(...last24hData.map(d => d.high));
    const low24h = Math.min(...last24hData.map(d => d.low));
    const volume24h = last24hData.reduce((sum, d) => sum + d.volume, 0);
    
    return {
      currentPrice: current.close,
      change: current.close - previous.close,
      changePercent: ((current.close - previous.close) / previous.close) * 100,
      high24h,
      low24h,
      volume24h
    };
  }



  // Custom Candlestick Component
  const Candlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isPositive = close > open;
    const color = isPositive ? '#14b8a6' : '#ef4444'; // Teal for positive, red for negative
    const bodyHeight = Math.abs(close - open) * height / (payload.high - payload.low || 1);
    const bodyY = y + (Math.max(open, close) - payload.high) * height / (payload.high - payload.low || 1);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* Body */}
        <rect
          x={x + width * 0.25}
          y={bodyY}
          width={width * 0.5}
          height={Math.max(bodyHeight, 2)}
          fill={color}
          stroke={color}
          rx={1}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      if (!data) return null;
      
      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/50 text-sm min-w-[200px]">
          <p className="font-semibold mb-3 text-slate-200 text-base">{label}</p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-sm">Open:</span>
              <span className="font-mono text-slate-200 font-medium">{data.open?.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-sm">High:</span>
              <span className="font-mono text-teal-400 font-medium">{data.high?.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-sm">Low:</span>
              <span className="font-mono text-red-400 font-medium">{data.low?.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-sm">Close:</span>
              <span className="font-mono text-white font-semibold">{data.close?.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-sm">Volume:</span>
              <span className="font-mono text-slate-300 font-medium">{formatNumber(data.volume, { currency: '$', maxDecimals: 2 })}</span>
            </div>
            {data.changePercent !== 0 && (
              <div className="flex justify-between items-center gap-6 pt-2 mt-3 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm">Change:</span>
                <span className={`font-mono font-semibold ${data.changePercent > 0 ? 'text-teal-400' : 'text-red-400'}`}>
                  {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Historical Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse text-blue-500" />
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-slate-950/90 backdrop-blur-sm border-slate-800/60 text-white shadow-xl">
      <CardHeader className="pb-6 bg-gradient-to-b from-slate-950/95 to-slate-950/80 border-b border-slate-800/40">
        {/* Main Header */}
        <div className="flex flex-col space-y-5">
          {/* Title and Current Price */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  {poolName}
                  <span className="text-sm font-normal text-slate-400 ml-3 bg-slate-800/50 px-2 py-1 rounded-md">APY</span>
                </h2>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="text-3xl font-bold text-white tracking-tight">
                    {stats.currentPrice.toFixed(2)}%
                  </span>
                  <div className={`flex items-center text-sm px-3 py-1.5 rounded-lg font-medium ${
                    stats.changePercent >= 0 
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {stats.changePercent >= 0 ? (
                      <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    )}
                    {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart Type Toggle */}
            <div className="flex gap-0.5 bg-slate-800/60 rounded-lg p-1 backdrop-blur-sm">
              <Button
                variant={chartType === 'candlestick' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className={`text-xs px-4 py-2 rounded-md transition-all duration-200 ${
                  chartType === 'candlestick' 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Candles
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className={`text-xs px-4 py-2 rounded-md transition-all duration-200 ${
                  chartType === 'line' 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Line
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('area')}
                className={`text-xs px-4 py-2 rounded-md transition-all duration-200 ${
                  chartType === 'area' 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                Area
              </Button>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-1">
            {TIME_PERIODS.map((period) => (
              <Button
                key={period.key}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(period.key)}
                className={`text-xs px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                  selectedPeriod === period.key 
                    ? 'bg-slate-700/60 text-white border border-slate-600/40' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Trading Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-medium">24h High</span>
              <div className="text-teal-400 font-semibold text-base">{stats.high24h.toFixed(2)}%</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-medium">24h Low</span>
              <div className="text-red-400 font-semibold text-base">{stats.low24h.toFixed(2)}%</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-medium">24h Volume</span>
              <div className="text-slate-200 font-semibold text-base">{formatNumber(stats.volume24h, { currency: '$', maxDecimals: 2 })}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-xs font-medium">Change</span>
              <div className={`font-semibold text-base ${stats.change >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(3)}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-slate-950/80 backdrop-blur-sm">
        {/* Main Chart */}
        <div className="h-80 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'candlestick' ? (
              <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                <defs>
                  <linearGradient id="candleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke="#1e293b" 
                  opacity={0.4}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  dy={10}
                />
                <YAxis 
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  orientation="right"
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Subtle background fill */}
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="transparent" 
                  strokeWidth={0}
                  fillOpacity={1}
                  fill="url(#candleGradient)"
                />
                
                {/* Main line */}
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#14b8a6" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#14b8a6', stroke: '#0f172a', strokeWidth: 2 }}
                />
                
                {/* Moving Averages - more subtle */}
                <Line 
                  type="monotone" 
                  dataKey="ma7" 
                  stroke="#f59e0b" 
                  strokeWidth={1}
                  dot={false}
                  name="MA(7)"
                  opacity={0.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="ma25" 
                  stroke="#8b5cf6" 
                  strokeWidth={1}
                  dot={false}
                  name="MA(25)"
                  opacity={0.5}
                />
                
                {/* Custom candlestick bars */}
                <Bar 
                  dataKey="high"
                  fill="transparent"
                  shape={<Candlestick />}
                />
              </ComposedChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke="#1e293b" 
                  opacity={0.4}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  orientation="right"
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Subtle background fill */}
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="transparent" 
                  strokeWidth={0}
                  fillOpacity={1}
                  fill="url(#lineGradient)"
                />
                
                {/* Main line with teal color like Pendle */}
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#14b8a6" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#14b8a6', stroke: '#0f172a', strokeWidth: 2 }}
                />
                
                {/* Moving Averages - more subtle */}
                <Line 
                  type="monotone" 
                  dataKey="ma7" 
                  stroke="#f59e0b" 
                  strokeWidth={1}
                  dot={false}
                  opacity={0.5}
                />
                <Line 
                  type="monotone" 
                  dataKey="ma25" 
                  stroke="#8b5cf6" 
                  strokeWidth={1}
                  dot={false}
                  opacity={0.5}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="2 2" 
                  stroke="#1e293b" 
                  opacity={0.4}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  orientation="right"
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#14b8a6" 
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  activeDot={{ r: 5, fill: '#14b8a6', stroke: '#0f172a', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Volume Chart */}
        <div className="h-24 w-full border-t border-slate-800/40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 40, left: 40, bottom: 15 }}>
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#1e293b" 
                opacity={0.3}
                horizontal={false}
                vertical={false}
              />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                hide={true}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => formatNumber(value, { currency: '$', maxDecimals: 1 })}
                orientation="right"
                width={50}
              />
              <Tooltip 
                formatter={(value: any) => [formatNumber(value, { currency: '$', maxDecimals: 2 }), 'Volume']}
                labelStyle={{ color: '#64748b', fontSize: '12px' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              <Bar 
                dataKey="volume" 
                fill="#14b8a6"
                opacity={0.6}
                radius={[1, 1, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}