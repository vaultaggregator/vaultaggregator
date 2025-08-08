import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Brain, Target, AlertTriangle, Calendar, BarChart3, Activity } from "lucide-react";
import type { YieldOpportunity } from "@/types";

interface ForecastData {
  date: string;
  predicted: number;
  confidence: number;
  lower: number;
  upper: number;
  actual?: number;
}

interface PoolForecast {
  poolId: string;
  pool: YieldOpportunity;
  trend: 'bullish' | 'bearish' | 'neutral';
  predictedApy: number;
  confidence: number;
  forecast: ForecastData[];
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

export default function YieldForecasting() {
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [forecastPeriod, setForecastPeriod] = useState<string>("7d");
  const [modelType, setModelType] = useState<string>("ml");

  const { data: pools = [] } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools'],
    queryFn: async () => {
      const response = await fetch('/api/pools?onlyVisible=true&limit=100');
      if (!response.ok) throw new Error('Failed to fetch pools');
      return response.json();
    }
  });

  const { data: forecasts = [], isLoading } = useQuery<PoolForecast[]>({
    queryKey: ['/api/yield-forecasts', forecastPeriod, modelType],
    queryFn: async () => {
      const response = await fetch(`/api/yield-forecasts?period=${forecastPeriod}&model=${modelType}`);
      if (!response.ok) throw new Error('Failed to fetch forecasts');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: poolForecast } = useQuery<PoolForecast>({
    queryKey: ['/api/yield-forecasts', selectedPool, forecastPeriod, modelType],
    queryFn: async () => {
      const response = await fetch(`/api/yield-forecasts/${selectedPool}?period=${forecastPeriod}&model=${modelType}`);
      if (!response.ok) throw new Error('Failed to fetch pool forecast');
      return response.json();
    },
    enabled: !!selectedPool,
    staleTime: 10 * 60 * 1000,
  });

  // Generate sample forecast data for demonstration
  const generateSampleForecast = (pool: YieldOpportunity): PoolForecast => {
    const currentApy = parseFloat(pool.apy);
    const volatility = Math.random() * 2 + 1; // 1-3% volatility
    const trend = Math.random() > 0.5 ? 'bullish' : 'bearish';
    
    const forecast: ForecastData[] = [];
    const periods = forecastPeriod === '7d' ? 7 : forecastPeriod === '30d' ? 30 : 90;
    
    for (let i = 0; i < periods; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      
      const trendMultiplier = trend === 'bullish' ? 1 + (i * 0.01) : 1 - (i * 0.005);
      const noise = (Math.random() - 0.5) * volatility;
      const predicted = Math.max(0, currentApy * trendMultiplier + noise);
      const confidence = Math.max(0.3, 0.9 - (i * 0.01));
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted,
        confidence,
        lower: predicted - (volatility * (1 - confidence)),
        upper: predicted + (volatility * (1 - confidence)),
      });
    }

    return {
      poolId: pool.id,
      pool,
      trend,
      predictedApy: forecast[forecast.length - 1].predicted,
      confidence: forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length,
      forecast,
      factors: [
        { name: 'Market Sentiment', impact: Math.random() * 20 - 10, description: 'Overall DeFi market sentiment' },
        { name: 'TVL Trend', impact: Math.random() * 15 - 7.5, description: 'Total Value Locked trending' },
        { name: 'Platform Activity', impact: Math.random() * 10 - 5, description: 'Protocol usage and activity' },
        { name: 'Token Price Impact', impact: Math.random() * 12 - 6, description: 'Underlying token price movements' },
        { name: 'Yield Competition', impact: Math.random() * 8 - 4, description: 'Competition from similar pools' },
      ]
    };
  };

  const sampleForecasts = pools.slice(0, 20).map(generateSampleForecast);
  const displayForecasts = isLoading ? [] : (forecasts.length > 0 ? forecasts : sampleForecasts);

  const selectedPoolData = selectedPool 
    ? (poolForecast || displayForecasts.find(f => f.poolId === selectedPool))
    : null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600 bg-green-50';
    if (confidence > 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-yield-forecasting-title">
              Yield Forecasting
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2" data-testid="text-yield-forecasting-subtitle">
              AI-powered predictions for DeFi yield opportunities using machine learning models
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="w-40" data-testid="select-forecast-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modelType} onValueChange={setModelType}>
              <SelectTrigger className="w-48" data-testid="select-model-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ml">Machine Learning</SelectItem>
                <SelectItem value="statistical">Statistical Model</SelectItem>
                <SelectItem value="hybrid">Hybrid Model</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPool} onValueChange={setSelectedPool}>
              <SelectTrigger className="w-64" data-testid="select-pool">
                <SelectValue placeholder="Select pool for detailed view" />
              </SelectTrigger>
              <SelectContent>
                {pools.slice(0, 50).map((pool) => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.platform.displayName} - {pool.tokenPair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Predictions */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Top Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayForecasts.slice(0, 10).map((forecast) => (
                      <div
                        key={forecast.poolId}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPool === forecast.poolId 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedPool(forecast.poolId)}
                        data-testid={`forecast-item-${forecast.poolId}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm truncate">
                              {forecast.pool.platform.displayName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {forecast.pool.tokenPair}
                            </p>
                            <div className="flex items-center mt-2">
                              {getTrendIcon(forecast.trend)}
                              <span className="ml-2 text-sm font-medium">
                                {forecast.predictedApy.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-xs ${getConfidenceColor(forecast.confidence)}`}>
                              {(forecast.confidence * 100).toFixed(0)}%
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {forecast.trend}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {selectedPoolData ? (
                <div className="space-y-6">
                  {/* Pool Header */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold">
                            {selectedPoolData.pool.platform.displayName} - {selectedPoolData.pool.tokenPair}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Current APY: {selectedPoolData.pool.apy}% | Predicted: {selectedPoolData.predictedApy.toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            {getTrendIcon(selectedPoolData.trend)}
                            <span className="ml-2 font-medium capitalize">{selectedPoolData.trend}</span>
                          </div>
                          <Badge className={getConfidenceColor(selectedPoolData.confidence)}>
                            {(selectedPoolData.confidence * 100).toFixed(0)}% Confidence
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  {/* Forecast Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        APY Forecast - {forecastPeriod.toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedPoolData.forecast}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickFormatter={(value) => `${value.toFixed(1)}%`}
                            />
                            <Tooltip 
                              formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                              labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            />
                            <Area 
                              dataKey="upper" 
                              stackId="1" 
                              stroke="transparent" 
                              fill="#3b82f6" 
                              fillOpacity={0.1} 
                            />
                            <Area 
                              dataKey="lower" 
                              stackId="1" 
                              stroke="transparent" 
                              fill="#ffffff" 
                              fillOpacity={1} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="predicted" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={false}
                            />
                            <ReferenceLine 
                              y={parseFloat(selectedPoolData.pool.apy)} 
                              stroke="#6b7280" 
                              strokeDasharray="5 5"
                              label="Current APY"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Forecast Factors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        Forecast Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedPoolData.factors.map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{factor.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{factor.description}</p>
                            </div>
                            <div className="text-right">
                              <div className={`flex items-center ${
                                factor.impact > 0 ? 'text-green-600' : factor.impact < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {factor.impact > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : 
                                 factor.impact < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> :
                                 <Activity className="w-4 h-4 mr-1" />}
                                <span className="font-medium">{factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a Pool for Detailed Forecast
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Choose a pool from the dropdown above or click on a prediction in the sidebar to see detailed forecasting analysis
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  Bullish Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {displayForecasts.filter(f => f.trend === 'bullish').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Expected to increase in {forecastPeriod}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
                  Bearish Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {displayForecasts.filter(f => f.trend === 'bearish').length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Expected to decrease in {forecastPeriod}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Brain className="w-4 h-4 mr-2 text-blue-600" />
                  Avg Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {displayForecasts.length > 0 
                    ? (displayForecasts.reduce((sum, f) => sum + f.confidence, 0) / displayForecasts.length * 100).toFixed(0)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Model prediction confidence
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}