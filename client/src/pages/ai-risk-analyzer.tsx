import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, TrendingDown, Brain, Target, Zap, CheckCircle, XCircle } from "lucide-react";
import { CryptoLoader } from "@/components/crypto-loader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { YieldOpportunity } from "@/types";

interface RiskFactor {
  category: string;
  score: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string[];
}

interface RiskAnalysis {
  poolId: string;
  overallRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  riskFactors: RiskFactor[];
  historicalVolatility: {
    apy: number;
    tvl: number;
    trend: string;
  };
  protocolRisks: {
    smartContractRisk: number;
    liquidityRisk: number;
    counterpartyRisk: number;
    regulatoryRisk: number;
  };
  aiInsights: string;
  recommendations: string[];
  riskMitigationStrategies: string[];
  worstCaseScenario: {
    description: string;
    probability: number;
    potentialLoss: number;
  };
}

export default function AIRiskAnalyzer() {
  const { toast } = useToast();
  const [selectedPool, setSelectedPool] = useState<string>('');

  const { data: pools = [], isLoading: poolsLoading } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools?limit=50'],
  });

  const analyzeRisk = useMutation({
    mutationFn: async (poolId: string) => {
      return await apiRequest('/api/ai/analyze-risk', 'POST', { poolId });
    },
    onSuccess: () => {
      toast({
        title: "Risk Analysis Complete",
        description: "Comprehensive risk assessment has been generated.",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Unable to complete risk analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!selectedPool) {
      toast({
        title: "No Pool Selected",
        description: "Please select a yield pool first.",
        variant: "destructive",
      });
      return;
    }
    analyzeRisk.mutate(selectedPool);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very-high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const analysis = analyzeRisk.data as RiskAnalysis | undefined;
  const selectedPoolData = pools.find(p => p.id === selectedPool);

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Risk Analyzer</h1>
              <p className="text-muted-foreground">
                Advanced AI-powered risk assessment for DeFi yield opportunities
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
                Risk Analysis Controls
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

              {selectedPoolData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedPoolData.tokenPair}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Platform:</span> {selectedPoolData.platform.displayName}</p>
                    <p><span className="text-muted-foreground">Network:</span> {selectedPoolData.chain.displayName}</p>
                    <p><span className="text-muted-foreground">APY:</span> <span className="font-medium text-green-600">{selectedPoolData.apy}%</span></p>
                    <p><span className="text-muted-foreground">Risk:</span> 
                      <Badge className={`ml-2 ${getRiskColor(selectedPoolData.riskLevel)}`}>
                        {selectedPoolData.riskLevel}
                      </Badge>
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAnalyze}
                disabled={analyzeRisk.isPending || !selectedPool}
                className="w-full"
                size="lg"
              >
                {analyzeRisk.isPending ? (
                  <>
                    <CryptoLoader className="w-4 h-4 mr-2" />
                    Analyzing Risks...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analyze Risks
                  </>
                )}
              </Button>

              {/* Risk Legend */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-semibold mb-3 text-sm">Risk Levels</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                    <span>Low (0-25)</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                    <span>Medium (26-50)</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                    <span>High (51-75)</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                    <span>Very High (76-100)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {analyzeRisk.isPending && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CryptoLoader className="w-12 h-12 mb-4" />
                  <p className="text-muted-foreground">Analyzing smart contracts, liquidity, and market risks...</p>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <>
                {/* Risk Score Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-red-600" />
                      Overall Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className={`text-4xl font-bold mb-2 ${getRiskScoreColor(analysis.overallRiskScore)}`}>
                          {Math.round(analysis.overallRiskScore)}
                        </div>
                        <p className="text-muted-foreground">Risk Score</p>
                        <Badge className={`mt-2 ${getRiskColor(analysis.riskLevel)}`}>
                          {analysis.riskLevel.toUpperCase().replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Smart Contract</span>
                            <span className="text-sm font-medium">{analysis.protocolRisks.smartContractRisk}%</span>
                          </div>
                          <Progress value={analysis.protocolRisks.smartContractRisk} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Liquidity</span>
                            <span className="text-sm font-medium">{analysis.protocolRisks.liquidityRisk}%</span>
                          </div>
                          <Progress value={analysis.protocolRisks.liquidityRisk} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Counterparty</span>
                            <span className="text-sm font-medium">{analysis.protocolRisks.counterpartyRisk}%</span>
                          </div>
                          <Progress value={analysis.protocolRisks.counterpartyRisk} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Regulatory</span>
                            <span className="text-sm font-medium">{analysis.protocolRisks.regulatoryRisk}%</span>
                          </div>
                          <Progress value={analysis.protocolRisks.regulatoryRisk} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-red-600" />
                        AI Risk Insights
                      </h3>
                      <p className="text-sm">{analysis.aiInsights}</p>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="factors" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="factors">Risk Factors</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
                    <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                  </TabsList>

                  <TabsContent value="factors" className="space-y-4">
                    {analysis.riskFactors.map((factor, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              {getImpactIcon(factor.impact)}
                              <h3 className="font-semibold ml-2">{factor.category}</h3>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-medium ${getRiskScoreColor(factor.score)}`}>
                                {factor.score}/100
                              </span>
                            </div>
                          </div>
                          <Progress value={factor.score} className="mb-3" />
                          <p className="text-sm text-muted-foreground mb-3">{factor.description}</p>
                          <div>
                            <p className="text-sm font-medium mb-1">Mitigation Strategies:</p>
                            <ul className="text-sm space-y-1">
                              {factor.mitigation.map((strategy, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-green-600 mr-2">•</span>
                                  {strategy}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">AI Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="mitigation" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Risk Mitigation Strategies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.riskMitigationStrategies.map((strategy, index) => (
                            <li key={index} className="flex items-start">
                              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="scenarios" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                          Worst Case Scenario
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">
                              {Math.round(analysis.worstCaseScenario.probability)}%
                            </p>
                            <p className="text-sm text-muted-foreground">Probability</p>
                          </div>
                          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">
                              -{analysis.worstCaseScenario.potentialLoss}%
                            </p>
                            <p className="text-sm text-muted-foreground">Potential Loss</p>
                          </div>
                        </div>
                        <p className="text-sm">{analysis.worstCaseScenario.description}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {!analysis && !analyzeRisk.isPending && (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a pool and click "Analyze Risks" to see comprehensive risk assessment</p>
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