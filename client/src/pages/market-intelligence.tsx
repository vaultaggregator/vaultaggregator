import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Target, 
  AlertTriangle, 
  Brain,
  BarChart3,
  Eye,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MarketIntelligence {
  sentiment: {
    overallMarketSentiment: number;
    protocols: Array<{
      name: string;
      sentimentScore: number;
      sentiment: string;
      keyFactors: string[];
      riskLevel: string;
      confidence: number;
    }>;
    marketTrends: string[];
  };
  whaleActivity: {
    whaleActivity: Array<{
      poolId: string;
      activity: string;
      amount: string;
      impact: string;
      trend: string;
      confidence: number;
      timestamp: string;
    }>;
    insights: string[];
    riskAlerts: string[];
  };
  protocolHealth: {
    protocols: Array<{
      name: string;
      healthScore: number;
      grade: string;
      factors: {
        tvlStability: number;
        apySustainability: number;
        maturity: number;
        security: number;
        liquidity: number;
        governance: number;
      };
      strengths: string[];
      risks: string[];
      recommendation: string;
    }>;
    marketOverview: {
      healthyProtocols: number;
      riskProtocols: number;
      averageScore: number;
    };
  };
  yieldForecasts: {
    forecasts: Array<{
      poolId: string;
      platform: string;
      currentApy: number;
      predictions: {
        "7d": { predicted: number; range: { low: number; high: number }; confidence: number; trend: string };
        "30d": { predicted: number; range: { low: number; high: number }; confidence: number; trend: string };
        "90d": { predicted: number; range: { low: number; high: number }; confidence: number; trend: string };
      };
      factors: string[];
      riskLevel: string;
    }>;
    modelMetadata: {
      accuracy: number;
      lastTrained: string;
      dataPoints: number;
      modelVersion: string;
    };
  };
  summary: {
    totalProtocolsAnalyzed: number;
    averageHealthScore: number;
    marketSentiment: number;
    highRiskAlerts: number;
  };
}

export default function MarketIntelligencePage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: intelligence, isLoading, error } = useQuery<MarketIntelligence>({
    queryKey: ["/api/market-intelligence"],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced DeFi market analysis and predictions
          </p>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !intelligence) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Analysis Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to generate market intelligence at this time.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry Analysis
          </Button>
        </div>
      </div>
    );
  }

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (score >= 50) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  const getHealthGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (grade.startsWith('B')) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
    if (grade.startsWith('C')) return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "Rising") return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "Declining") return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered market analysis, whale tracking, and yield predictions
          </p>
        </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{intelligence.summary.marketSentiment}/100</div>
            <Progress value={intelligence.summary.marketSentiment} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Health</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{intelligence.summary.averageHealthScore}/100</div>
            <Progress value={intelligence.summary.averageHealthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocols Analyzed</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{intelligence.summary.totalProtocolsAnalyzed}</div>
            <p className="text-xs text-muted-foreground">Active protocols</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {intelligence.summary.highRiskAlerts}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="whales" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Whale Activity
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Forecasts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protocol Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Protocol Health Scores
                </CardTitle>
                <CardDescription>
                  Comprehensive risk assessment of major protocols
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {intelligence.protocolHealth.protocols.slice(0, 5).map((protocol, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{protocol.name}</span>
                        <Badge className={getHealthGradeColor(protocol.grade)}>
                          {protocol.grade}
                        </Badge>
                      </div>
                      <Progress value={protocol.healthScore} className="h-2" />
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold">{protocol.healthScore}/100</div>
                      <div className="text-xs text-muted-foreground">
                        {protocol.recommendation}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Market Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Market Trends
                </CardTitle>
                <CardDescription>
                  Key trends shaping the DeFi landscape
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intelligence.sentiment.marketTrends?.map((trend, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{trend}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Alerts */}
          {intelligence.whaleActivity.riskAlerts?.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Alerts
                </CardTitle>
                <CardDescription>
                  Critical risks detected by our monitoring systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intelligence.whaleActivity.riskAlerts.map((alert, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200">{alert}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Protocol Sentiment Analysis
              </CardTitle>
              <CardDescription>
                AI-powered sentiment analysis from news and social media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {intelligence.sentiment.protocols?.map((protocol, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{protocol.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getSentimentColor(protocol.sentimentScore)}>
                            {protocol.sentiment}
                          </Badge>
                          <span className="text-sm font-mono">
                            {protocol.sentimentScore}/100
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Factors:</h4>
                          <div className="flex flex-wrap gap-1">
                            {protocol.keyFactors?.map((factor, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm px-2 py-1 rounded ${
                            protocol.riskLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            protocol.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {protocol.riskLevel} Risk
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {protocol.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Whale Movement Tracking
              </CardTitle>
              <CardDescription>
                Large wallet activities affecting pool dynamics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {intelligence.whaleActivity.whaleActivity?.map((activity, index) => (
                  <Card key={index} className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(activity.trend)}
                          <span className="font-medium capitalize">
                            {activity.activity}
                          </span>
                          <Badge variant="outline">{activity.amount}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            activity.impact === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            activity.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          }>
                            {activity.impact} Impact
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Trend: {activity.trend}</span>
                        <span>{activity.confidence}% confidence</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {intelligence.whaleActivity.insights?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Market Insights</h3>
                  <div className="space-y-2">
                    {intelligence.whaleActivity.insights.map((insight, index) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                ML-Powered Yield Forecasts
              </CardTitle>
              <CardDescription>
                Advanced predictions for APY trends across timeframes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {intelligence.yieldForecasts.forecasts?.slice(0, 10).map((forecast, index) => (
                  <Card key={index} className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{forecast.platform}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Current:</span>
                          <Badge variant="outline">{forecast.currentApy.toFixed(2)}%</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">7 Days</div>
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(forecast.predictions["7d"].trend)}
                            <span className="font-semibold">
                              {forecast.predictions["7d"].predicted.toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {forecast.predictions["7d"].confidence}% confidence
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">30 Days</div>
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(forecast.predictions["30d"].trend)}
                            <span className="font-semibold">
                              {forecast.predictions["30d"].predicted.toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {forecast.predictions["30d"].confidence}% confidence
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground mb-1">90 Days</div>
                          <div className="flex items-center justify-center gap-1">
                            {getTrendIcon(forecast.predictions["90d"].trend)}
                            <span className="font-semibold">
                              {forecast.predictions["90d"].predicted.toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {forecast.predictions["90d"].confidence}% confidence
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Key Factors:</h4>
                        <div className="flex flex-wrap gap-1">
                          {forecast.factors?.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <span className={`text-sm px-2 py-1 rounded ${
                          forecast.riskLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          forecast.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {forecast.riskLevel} Risk
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {intelligence.yieldForecasts.modelMetadata && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Model Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                        <div className="font-semibold">
                          {intelligence.yieldForecasts.modelMetadata.accuracy}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Data Points</div>
                        <div className="font-semibold">
                          {intelligence.yieldForecasts.modelMetadata.dataPoints?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Version</div>
                        <div className="font-semibold">
                          {intelligence.yieldForecasts.modelMetadata.modelVersion}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Last Updated</div>
                        <div className="font-semibold text-xs">
                          {formatDistanceToNow(new Date(intelligence.yieldForecasts.modelMetadata.lastTrained || new Date()), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      <Footer />
    </div>
  );
}