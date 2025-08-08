import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { TrendingUp, DollarSign, Clock, Target, Shield, Zap, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface InvestmentRequest {
  amount: number;
  duration: number;
  expectedReturn: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  strategy: string;
}

interface RecommendedPool {
  id: string;
  tokenPair: string;
  apy: string;
  tvl: string;
  platform: { displayName: string };
  chain: { displayName: string };
  riskLevel: string;
  allocation: number;
  reason: string;
  projectedReturn: number;
}

interface InvestmentResponse {
  summary: string;
  totalProjectedReturn: number;
  riskAssessment: string;
  recommendations: RecommendedPool[];
  timeline: {
    timeframe: string;
    expectedValue: number;
    description: string;
  }[];
  warnings: string[];
  confidence: number;
}

export default function InvestmentAdvisor() {
  const [formData, setFormData] = useState<InvestmentRequest>({
    amount: 10000,
    duration: 12,
    expectedReturn: 8,
    riskTolerance: "moderate",
    strategy: ""
  });

  const [result, setResult] = useState<InvestmentResponse | null>(null);

  // Get available pools for AI analysis
  const { data: pools } = useQuery({
    queryKey: ["/api/pools"],
    select: (data: any[]) => data.filter(pool => pool.visible !== false)
  });

  const investmentMutation = useMutation({
    mutationFn: async (request: InvestmentRequest) => {
      const response = await fetch("/api/investment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error("Failed to analyze investment");
      return await response.json();
    },
    onSuccess: (data: InvestmentResponse) => {
      setResult(data);
    }
  });

  const handleSubmit = () => {
    if (!formData.amount || !formData.strategy.trim()) return;
    investmentMutation.mutate(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'extreme': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStrategyColor = (tolerance: string) => {
    switch (tolerance) {
      case 'conservative': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'moderate': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      case 'aggressive': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI Investment Advisor
          </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get personalized DeFi investment strategies powered by advanced AI analysis
        </p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Investment Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Investment Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investment Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Enter amount in USD"
                className="text-lg"
                data-testid="input-investment-amount"
              />
              <p className="text-sm text-gray-500">{formatCurrency(formData.amount)}</p>
            </div>

            {/* Investment Duration */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Investment Duration: {formData.duration} months
              </Label>
              <Slider
                value={[formData.duration]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value[0] }))}
                max={36}
                min={1}
                step={1}
                className="w-full"
                data-testid="slider-duration"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 month</span>
                <span>3 years</span>
              </div>
            </div>

            {/* Expected Return */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Expected Annual Return: {formData.expectedReturn}%
              </Label>
              <Slider
                value={[formData.expectedReturn]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, expectedReturn: value[0] }))}
                max={50}
                min={1}
                step={1}
                className="w-full"
                data-testid="slider-expected-return"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1% (Conservative)</span>
                <span>50% (High Risk)</span>
              </div>
            </div>

            {/* Risk Tolerance */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Tolerance
              </Label>
              <Select
                value={formData.riskTolerance}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, riskTolerance: value }))}
              >
                <SelectTrigger data-testid="select-risk-tolerance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      Conservative - Minimize losses
                    </div>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Moderate - Balanced approach
                    </div>
                  </SelectItem>
                  <SelectItem value="aggressive">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-red-600" />
                      Aggressive - Maximize returns
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Investment Strategy */}
            <div className="space-y-2">
              <Label htmlFor="strategy">Investment Strategy & Goals</Label>
              <Textarea
                id="strategy"
                value={formData.strategy}
                onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
                placeholder="Describe your investment goals, preferences, and any specific requirements..."
                className="min-h-[100px]"
                data-testid="textarea-strategy"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={investmentMutation.isPending || !formData.amount || !formData.strategy.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
              data-testid="button-analyze-investment"
            >
              {investmentMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing Investment Strategy...
                </div>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate AI Investment Strategy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Investment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Investment Strategy Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {result.summary}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Projected Return</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(result.totalProjectedReturn)}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Confidence Level</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {result.confidence}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Badge className={getStrategyColor(formData.riskTolerance)}>
                        {formData.riskTolerance.charAt(0).toUpperCase() + formData.riskTolerance.slice(1)} Strategy
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Pools */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Pool Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.recommendations.map((pool, index) => (
                      <div key={pool.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {pool.tokenPair}
                              </h3>
                              <Badge className={getRiskColor(pool.riskLevel)}>
                                {pool.riskLevel} risk
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {pool.platform.displayName} • {pool.chain.displayName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{pool.apy}% APY</p>
                            <p className="text-sm text-gray-500">TVL: {pool.tvl}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Allocation</span>
                            <span className="text-sm font-bold">{pool.allocation}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${pool.allocation}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                            <span>Investment: {formatCurrency((formData.amount * pool.allocation) / 100)}</span>
                            <span>Projected: {formatCurrency(pool.projectedReturn)}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{pool.reason}</p>
                        
                        <Link href={`/pool/${pool.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            View Pool Details
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Investment Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.timeline.map((phase, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {phase.timeframe}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {phase.description}
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              Expected: {formatCurrency(phase.expectedValue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings & Risk Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {result.riskAssessment}
                      </p>
                      
                      {result.warnings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-yellow-700 dark:text-yellow-400">
                            Important Considerations:
                          </h4>
                          <ul className="space-y-1">
                            {result.warnings.map((warning, index) => (
                              <li key={index} className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="h-64 flex items-center justify-center">
              <CardContent className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Fill out the investment parameters to get your personalized AI strategy
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}