import { useState, useMemo } from "react";
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ChartDataPoint {
  date: string;
  apy: number;
  tvl: number;
  timestamp: number;
}

interface MorphoStyleChartProps {
  poolId: string;
  tokenPair: string;
  currentAPY: number;
  currentTVL: number;
}

export function MorphoStyleChart({ poolId, tokenPair, currentAPY, currentTVL }: MorphoStyleChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'apy' | 'tvl'>('apy');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Generate sample historical data based on current values
  const chartData = useMemo(() => {
    const now = new Date();
    const data: ChartDataPoint[] = [];
    
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 365
    };
    
    const days = periodDays[selectedPeriod];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Generate realistic fluctuations around current values
      const apyVariation = 1 + (Math.sin(i * 0.1) * 0.15 + Math.random() * 0.1 - 0.05);
      const tvlVariation = 1 + (Math.sin(i * 0.05) * 0.08 + Math.random() * 0.05 - 0.025);
      
      data.push({
        date: date.toISOString().split('T')[0],
        apy: Number((currentAPY * apyVariation).toFixed(2)),
        tvl: Number((currentTVL * tvlVariation).toFixed(0)),
        timestamp: date.getTime()
      });
    }
    
    return data;
  }, [currentAPY, currentTVL, selectedPeriod]);

  const currentValue = selectedMetric === 'apy' ? currentAPY : currentTVL;
  const average = useMemo(() => {
    const sum = chartData.reduce((acc, point) => acc + point[selectedMetric], 0);
    return Number((sum / chartData.length).toFixed(2));
  }, [chartData, selectedMetric]);

  const formatValue = (value: number) => {
    if (selectedMetric === 'apy') {
      return `${value.toFixed(2)}%`;
    } else {
      // Format TVL in millions/billions
      if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(1)}B`;
      } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(1)}M`;
      } else {
        return `$${(value / 1e3).toFixed(0)}K`;
      }
    }
  };

  const formatYAxisValue = (value: number) => {
    if (selectedMetric === 'apy') {
      return `${value.toFixed(1)}%`;
    } else {
      if (value >= 1e9) {
        return `$${(value / 1e9).toFixed(1)}B`;
      } else if (value >= 1e6) {
        return `$${(value / 1e6).toFixed(0)}M`;
      } else {
        return `$${(value / 1e3).toFixed(0)}K`;
      }
    }
  };

  const minValue = Math.min(...chartData.map(d => d[selectedMetric]));
  const maxValue = Math.max(...chartData.map(d => d[selectedMetric]));
  const padding = (maxValue - minValue) * 0.1;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {selectedMetric === 'apy' ? 'APY' : 'TVL'}
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                <div className="w-2 h-2 bg-blue-300 rounded-sm"></div>
              </div>
            </div>
          </div>
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-24 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">1 month</SelectItem>
              <SelectItem value="90d">3 months</SelectItem>
              <SelectItem value="all">1 year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatValue(currentValue)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-4 flex gap-2">
          <Badge 
            variant={selectedMetric === 'apy' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setSelectedMetric('apy')}
          >
            APY
          </Badge>
          <Badge 
            variant={selectedMetric === 'tvl' ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setSelectedMetric('tvl')}
          >
            TVL
          </Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (selectedPeriod === '7d') {
                    return date.getDate().toString();
                  } else {
                    return `${date.getDate()} ${date.toLocaleDateString('en', { month: 'short' })}`;
                  }
                }}
              />
              
              <YAxis 
                domain={[minValue - padding, maxValue + padding]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={formatYAxisValue}
                orientation="right"
              />
              
              <ReferenceLine 
                y={average} 
                stroke="#6B7280" 
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#areaGradient)"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: "#3B82F6",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-[1px] bg-gray-400 border-dashed border-t"></div>
            <span>Avg {formatValue(average)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}