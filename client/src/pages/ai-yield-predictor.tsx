import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Brain, TrendingUp, Calendar, BarChart3, Activity, Zap, Target } from "lucide-react";
import { CryptoLoader } from "@/components/crypto-loader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { YieldOpportunity } from "@/types";

interface PredictionData {
  date: string;
  predicted_apy: number;
  confidence_upper: number;
  confidence_lower: number;
  market_events: string[];
}

interface YieldPrediction {
  poolId: string;
  currentAPY: number;
  predictions: PredictionData[];
  summary: {
    trend: 'bullish' | 'bearish' | 'stable';
    confidence: number;
    keyFactors: string[];
    expectedChange: number; // percentage change over prediction period
  };
  aiAnalysis: string;
  riskFactors: string[];
  recommendations: string[];
}

export default function AIYieldPredictor() {
  const { toast } = useToast();
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [predictionPeriod, setPredictionPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: pools = [], isLoading: poolsLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools?limit=50'],
  });

  const predictYields = useMutation({
    mutationFn: async (params: { poolId: string; period: string }) => {
      return await apiRequest('/api/ai/predict-yields', 'POST', params);
    },
    onSuccess: () => {
      toast({
        title: "Prediction Complete",
        description: "AI yield prediction has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Prediction Failed",
        description: "Unable to generate yield prediction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePredict = () => {
    if (!selectedPool) {
      toast({
        title: "No Pool Selected",
        description: "Please select a yield pool first.",
        variant: "destructive",
      });
      return;
    }
    predictYields.mutate({ poolId: selectedPool, period: predictionPeriod });
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'bearish': return 'text-red-600 bg-red-50';
      case 'stable': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return '7 Days';
      case '30d': return '30 Days';
      case '90d': return '90 Days';
      default: return period;
    }
  };

  const prediction = predictYields.data as YieldPrediction | undefined;
  const selectedPoolData = pools.find(p => p.id === selectedPool);

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Brain className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Yield Predictor</h1>
              <p className="text-muted-foreground">
                Advanced machine learning predictions for DeFi yield trends and opportunities
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Prediction Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Pool</label>
                {poolsLoading ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                ) : (
                  <select
                    value={selectedPool}
                    onChange={(e) => setSelectedPool(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md bg-background"
                  >
                    <option value="">Choose a yield pool...</option>
                    {pools.map((pool) => (
                      <option key={pool.id} value={pool.id}>
                        {pool.tokenPair} - {pool.platform.displayName} ({pool.apy}%)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Prediction Period</label>
                <div className="space-y-2">
                  {(['7d', '30d', '90d'] as const).map((period) => (
                    <Button
                      key={period}
                      variant={predictionPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPredictionPeriod(period)}
                      className="w-full"
                    >
                      {getPeriodLabel(period)}
                    </Button>
                  ))}
                </div>
              </div>

              {selectedPoolData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedPoolData.tokenPair}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Platform:</span> {selectedPoolData.platform.displayName}</p>
                    <p><span className="text-muted-foreground">Network:</span> {selectedPoolData.chain.displayName}</p>
                    <p><span className="text-muted-foreground">Current APY:</span> <span className="font-medium text-green-600">{selectedPoolData.apy}%</span></p>
                    <p><span className="text-muted-foreground">TVL:</span> {selectedPoolData.tvl || 'N/A'}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handlePredict}
                disabled={predictYields.isPending || !selectedPool}
                className="w-full"
                size="lg"
              >
                {predictYields.isPending ? (
                  <>
                    <CryptoLoader className="w-4 h-4 mr-2" />
                    Generating Prediction...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Predict Yields
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {predictYields.isPending && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CryptoLoader className="w-12 h-12 mb-4" />
                  <p className="text-muted-foreground">Analyzing market trends and generating predictions...</p>
                </CardContent>
              </Card>
            )}

            {prediction && (
              <>
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-green-600" />
                      Prediction Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {prediction.currentAPY.toFixed(2)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Current APY</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {prediction.summary.expectedChange > 0 ? '+' : ''}{prediction.summary.expectedChange.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Expected Change</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round(prediction.summary.confidence)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center mb-4">
                      <Badge className={`${getTrendColor(prediction.summary.trend)} text-sm px-3 py-1`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {prediction.summary.trend.toUpperCase()} Trend
                      </Badge>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-blue-600" />
                        AI Analysis
                      </h3>
                      <p className="text-sm">{prediction.aiAnalysis}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Prediction Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                      Yield Prediction Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={prediction.predictions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${Number(value).toFixed(2)}%`,
                              name === 'predicted_apy' ? 'Predicted APY' : 
                              name === 'confidence_upper' ? 'Upper Bound' : 'Lower Bound'
                            ]}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="confidence_upper" 
                            stackId="1"
                            stroke="transparent" 
                            fill="#3B82F6" 
                            fillOpacity={0.2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="confidence_lower" 
                            stackId="1"
                            stroke="transparent" 
                            fill="#ffffff" 
                            fillOpacity={1}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="predicted_apy" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            dot={{ r: 4 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Factors & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {prediction.summary.keyFactors.map((factor, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="text-blue-600 mr-2">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <span className="text-green-600 mr-2">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!prediction && !predictYields.isPending && (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a pool and click "Predict Yields" to see AI-powered forecasts</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}