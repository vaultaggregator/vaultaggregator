import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, Shield, DollarSign, Target, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import { CryptoLoader } from "@/components/crypto-loader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PortfolioInput {
  totalAmount: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: 'short' | 'medium' | 'long'; // 3m, 6m-2y, 2y+
  preferredNetworks: string[];
  avoidHighRisk: boolean;
  minimumAPY: number;
  maxPositions: number;
}

interface OptimizedAllocation {
  poolId: string;
  tokenPair: string;
  platform: string;
  network: string;
  allocation: number; // percentage
  amount: number; // dollar amount
  apy: number;
  riskLevel: string;
  reasoning: string;
}

interface PortfolioRecommendation {
  allocations: OptimizedAllocation[];
  expectedAPY: number;
  totalRisk: string;
  diversificationScore: number;
  confidence: number;
  aiInsights: string;
  rebalanceFrequency: string;
  warnings: string[];
}

export default function AIPortfolioOptimizer() {
  const { toast } = useToast();
  const [portfolioInput, setPortfolioInput] = useState<PortfolioInput>({
    totalAmount: 10000,
    riskTolerance: 'moderate',
    timeHorizon: 'medium',
    preferredNetworks: ['ethereum'],
    avoidHighRisk: true,
    minimumAPY: 5.0,
    maxPositions: 5
  });

  const { data: networks = [] } = useQuery({
    queryKey: ['/api/chains'],
  });

  const optimizePortfolio = useMutation({
    mutationFn: async (input: PortfolioInput) => {
      return await apiRequest('/api/ai/optimize-portfolio', 'POST', input);
    },
    onSuccess: () => {
      toast({
        title: "Portfolio Optimized",
        description: "AI has generated your personalized portfolio recommendations.",
      });
    },
    onError: () => {
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize portfolio. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOptimize = () => {
    optimizePortfolio.mutate(portfolioInput);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const recommendation = optimizePortfolio.data as PortfolioRecommendation | undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Brain className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Portfolio Optimizer</h1>
              <p className="text-muted-foreground">
                Get personalized DeFi portfolio recommendations powered by advanced AI analysis
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Portfolio Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={portfolioInput.totalAmount}
                  onChange={(e) => setPortfolioInput(prev => ({
                    ...prev,
                    totalAmount: parseFloat(e.target.value) || 0
                  }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Risk Tolerance</Label>
                <div className="flex space-x-2 mt-2">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((risk) => (
                    <Button
                      key={risk}
                      variant={portfolioInput.riskTolerance === risk ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPortfolioInput(prev => ({ ...prev, riskTolerance: risk }))}
                      className="capitalize"
                    >
                      {risk}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Time Horizon</Label>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant={portfolioInput.timeHorizon === 'short' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPortfolioInput(prev => ({ ...prev, timeHorizon: 'short' }))}
                  >
                    Short (3m)
                  </Button>
                  <Button
                    variant={portfolioInput.timeHorizon === 'medium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPortfolioInput(prev => ({ ...prev, timeHorizon: 'medium' }))}
                  >
                    Medium (6m-2y)
                  </Button>
                  <Button
                    variant={portfolioInput.timeHorizon === 'long' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPortfolioInput(prev => ({ ...prev, timeHorizon: 'long' }))}
                  >
                    Long (2y+)
                  </Button>
                </div>
              </div>

              <div>
                <Label>Minimum APY (%)</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={[portfolioInput.minimumAPY]}
                    onValueChange={(value) => setPortfolioInput(prev => ({
                      ...prev,
                      minimumAPY: value[0]
                    }))}
                    min={0}
                    max={50}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    {portfolioInput.minimumAPY}% minimum APY
                  </p>
                </div>
              </div>

              <div>
                <Label>Maximum Positions</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={[portfolioInput.maxPositions]}
                    onValueChange={(value) => setPortfolioInput(prev => ({
                      ...prev,
                      maxPositions: value[0]
                    }))}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    {portfolioInput.maxPositions} positions maximum
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleOptimize}
                disabled={optimizePortfolio.isPending}
                className="w-full"
                size="lg"
              >
                {optimizePortfolio.isPending ? (
                  <>
                    <CryptoLoader className="w-4 h-4 mr-2" />
                    Optimizing Portfolio...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize Portfolio
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimizePortfolio.isPending && (
                <div className="flex flex-col items-center justify-center py-12">
                  <CryptoLoader className="w-12 h-12 mb-4" />
                  <p className="text-muted-foreground">Analyzing thousands of yield opportunities...</p>
                </div>
              )}

              {recommendation && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {recommendation.expectedAPY.toFixed(2)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Expected APY</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round(recommendation.confidence)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Confidence</p>
                    </div>
                  </div>

                  {/* Portfolio Allocations */}
                  <div>
                    <h3 className="font-semibold mb-3">Recommended Allocations</h3>
                    <div className="space-y-3">
                      {recommendation.allocations.map((allocation, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{allocation.tokenPair}</h4>
                              <p className="text-sm text-muted-foreground">
                                {allocation.platform} on {allocation.network}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{allocation.allocation}%</p>
                              <p className="text-sm text-muted-foreground">
                                ${allocation.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <Badge className={getRiskColor(allocation.riskLevel)}>
                              {allocation.riskLevel} risk
                            </Badge>
                            <span className="text-sm font-medium">{allocation.apy.toFixed(2)}% APY</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {allocation.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-purple-600" />
                      AI Insights
                    </h3>
                    <p className="text-sm">{recommendation.aiInsights}</p>
                  </div>

                  {/* Warnings */}
                  {recommendation.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                        Important Considerations
                      </h3>
                      <ul className="space-y-1">
                        {recommendation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {!recommendation && !optimizePortfolio.isPending && (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your parameters and click "Optimize Portfolio" to get AI recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}