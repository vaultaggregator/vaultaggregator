import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Network,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  Clock,
  DollarSign,
  Activity,
  Target,
  GitBranch,
  Flame,
  Brain,
  Eye,
  Sparkles,
  Wind,
  CircuitBoard
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie
} from "recharts";

interface CrossPoolAnalyticsProps {
  poolId: string;
}

export function CrossPoolAnalytics({ poolId }: CrossPoolAnalyticsProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: [`/api/pools/${poolId}/cross-analysis`],
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Analyzing cross-pool patterns...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Advanced Risk Score Card with Visualization */}
      {analytics.riskScore && (
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Comprehensive Risk Analysis
              </div>
              <Badge variant={
                analytics.riskScore.riskLevel === 'high' ? 'destructive' :
                analytics.riskScore.riskLevel === 'medium' ? 'default' :
                'secondary'
              } className="text-lg px-3 py-1">
                {analytics.riskScore.riskLevel.toUpperCase()} RISK
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Risk Score</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {(typeof analytics.riskScore.totalRisk === 'number' ? analytics.riskScore.totalRisk : Number(analytics.riskScore.totalRisk) || 0).toFixed(0)}/100
                    </span>
                  </div>
                  <Progress value={typeof analytics.riskScore.totalRisk === 'number' ? analytics.riskScore.totalRisk : Number(analytics.riskScore.totalRisk) || 0} className="h-3" />
                </div>
                
                <div className="mt-4 space-y-2">
                  {Object.entries(analytics.riskScore.factors).map(([key, value]: [string, any]) => {
                    const numValue = typeof value === 'number' ? value : Number(value) || 0;
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Progress value={numValue} className="w-20 h-2" />
                          <span className="font-medium w-12 text-right">{numValue.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Risk Recommendations</h4>
                <div className="space-y-2">
                  {analytics.riskScore.recommendations.map((rec: string, idx: number) => (
                    <Alert key={idx} className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MEV Activity & Gas Optimization Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MEV Activity Card */}
        {analytics.mevActivity && (
          <Card className="border-2 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flame className="w-5 h-5 mr-2 text-red-600" />
                MEV Activity Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">MEV Risk Level</span>
                  <Badge variant={
                    analytics.mevActivity.mevRisk === 'high' ? 'destructive' :
                    analytics.mevActivity.mevRisk === 'medium' ? 'default' :
                    'secondary'
                  }>
                    {analytics.mevActivity.mevRisk.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-red-600 dark:text-red-400">Sandwich Attacks</span>
                      <Target className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                      {analytics.mevActivity.sandwichAttacks}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-orange-600 dark:text-orange-400">Victim Txns</span>
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                      {analytics.mevActivity.victimTransactions}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Arbitrage Volume</span>
                  <p className="text-lg font-bold mt-1">
                    ${((typeof analytics.mevActivity.arbitrageVolume === 'number' ? analytics.mevActivity.arbitrageVolume : Number(analytics.mevActivity.arbitrageVolume) || 0) / 1000000).toFixed(2)}M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gas Optimization Card */}
        {analytics.gasOptimization && (
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-green-600" />
                Gas Optimization Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Optimal Interaction Time</span>
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {analytics.gasOptimization.bestHour}:00 UTC
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    on {analytics.gasOptimization.bestDay}s
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Avg Gas Price</span>
                    <p className="text-lg font-bold mt-1">
                      {(typeof analytics.gasOptimization.avgGasPrice === 'number' ? analytics.gasOptimization.avgGasPrice : Number(analytics.gasOptimization.avgGasPrice) || 0).toFixed(0)} Gwei
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <span className="text-xs text-blue-600 dark:text-blue-400">Savings Potential</span>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {(typeof analytics.gasOptimization.savingsPotential === 'number' ? analytics.gasOptimization.savingsPotential : Number(analytics.gasOptimization.savingsPotential) || 0).toFixed(0)}%
                    </p>
                  </div>
                </div>
                
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Save up to ${((typeof analytics.gasOptimization.savingsPotential === 'number' ? analytics.gasOptimization.savingsPotential : Number(analytics.gasOptimization.savingsPotential) || 0) * 50).toFixed(0)} per transaction by timing your interactions
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Network Effects & Behavioral Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CircuitBoard className="w-5 h-5 mr-2 text-indigo-600" />
            Advanced Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="network" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="network">Network Effects</TabsTrigger>
              <TabsTrigger value="behavioral">Behavioral Patterns</TabsTrigger>
              <TabsTrigger value="correlations">Pool Correlations</TabsTrigger>
            </TabsList>
            
            {/* Network Effects Tab */}
            <TabsContent value="network" className="space-y-4">
              {analytics.networkEffect && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Influence Score</span>
                        <Network className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                        {(typeof analytics.networkEffect.influenceScore === 'number' ? analytics.networkEffect.influenceScore : Number(analytics.networkEffect.influenceScore) || 0).toFixed(0)}/100
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Systemic Risk</span>
                        <Shield className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {(typeof analytics.networkEffect.systemicRisk === 'number' ? analytics.networkEffect.systemicRisk : Number(analytics.networkEffect.systemicRisk) || 0).toFixed(1)}/10
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Connected Pools</span>
                        <GitBranch className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {analytics.networkEffect.correlatedPools.length}
                      </p>
                    </div>
                  </div>
                  
                  {analytics.networkEffect.dependentPools.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Dependent Pools</h4>
                      <div className="flex flex-wrap gap-2">
                        {analytics.networkEffect.dependentPools.map((pool: string) => (
                          <Badge key={pool} variant="outline">
                            {pool.slice(0, 8)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            {/* Behavioral Patterns Tab */}
            <TabsContent value="behavioral" className="space-y-4">
              {analytics.behavioralInsights && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patterns Detection */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Detected Patterns</h4>
                      
                      {analytics.behavioralInsights.patterns.accumulation.detected && (
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <strong>Accumulation Phase</strong>
                            <br />
                            Confidence: {((typeof analytics.behavioralInsights.patterns.accumulation.confidence === 'number' ? analytics.behavioralInsights.patterns.accumulation.confidence : Number(analytics.behavioralInsights.patterns.accumulation.confidence) || 0) * 100).toFixed(0)}%
                            <br />
                            Timeframe: {analytics.behavioralInsights.patterns.accumulation.timeframe}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {analytics.behavioralInsights.patterns.distribution.detected && (
                        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                          <Activity className="h-4 w-4 text-red-600" />
                          <AlertDescription>
                            <strong>Distribution Phase</strong>
                            <br />
                            Confidence: {((typeof analytics.behavioralInsights.patterns.distribution.confidence === 'number' ? analytics.behavioralInsights.patterns.distribution.confidence : Number(analytics.behavioralInsights.patterns.distribution.confidence) || 0) * 100).toFixed(0)}%
                            <br />
                            Timeframe: {analytics.behavioralInsights.patterns.distribution.timeframe}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    {/* Predictions */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">AI Predictions</h4>
                      
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Next Inflow Peak</span>
                          <Brain className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="text-sm font-bold">
                          {new Date(analytics.behavioralInsights.predictions.nextInflowPeak).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Expected Volatility</span>
                          <Wind className="w-4 h-4 text-yellow-600" />
                        </div>
                        <p className="text-sm font-bold">
                          {(typeof analytics.behavioralInsights.predictions.expectedVolatility === 'number' ? analytics.behavioralInsights.predictions.expectedVolatility : Number(analytics.behavioralInsights.predictions.expectedVolatility) || 0).toFixed(0)}%
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Liquidity Trend</span>
                          <Activity className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-sm font-bold capitalize">
                          {analytics.behavioralInsights.predictions.liquidityTrend}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pool Rotation Analysis */}
                  {analytics.behavioralInsights.patterns.rotation && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <strong>Liquidity Rotation Detected</strong>
                        <br />
                        Volume: ${((typeof analytics.behavioralInsights.patterns.rotation.volume === 'number' ? analytics.behavioralInsights.patterns.rotation.volume : Number(analytics.behavioralInsights.patterns.rotation.volume) || 0) / 1000000).toFixed(2)}M
                        <br />
                        From: {analytics.behavioralInsights.patterns.rotation.fromPools.join(', ')}
                        <br />
                        To: {analytics.behavioralInsights.patterns.rotation.toPools.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </TabsContent>
            
            {/* Pool Correlations Tab */}
            <TabsContent value="correlations" className="space-y-4">
              {analytics.correlations && analytics.correlations.length > 0 && (
                <>
                  <div className="space-y-3">
                    {analytics.correlations.map((corr: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            corr.correlation > 0.7 ? 'bg-green-500' :
                            corr.correlation > 0.4 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm font-mono">
                            {corr.pool2.slice(0, 8)}...
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {((typeof corr.correlation === 'number' ? corr.correlation : Number(corr.correlation) || 0) * 100).toFixed(0)}% correlation
                            </p>
                            <p className="text-xs text-gray-500">
                              {corr.sharedWallets} shared wallets
                            </p>
                          </div>
                          
                          {corr.migrationFlow !== 'none' && (
                            <Badge variant="outline" className="text-xs">
                              {corr.migrationFlow.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Alert>
                    <Network className="h-4 w-4" />
                    <AlertDescription>
                      Pools with high correlation tend to experience similar flow patterns. Consider diversifying across uncorrelated pools.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}