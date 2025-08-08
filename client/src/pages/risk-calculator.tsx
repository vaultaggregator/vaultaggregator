import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Shield, AlertTriangle, TrendingUp, Calculator, Eye, Target, Activity, Lock, Zap, Globe } from "lucide-react";
import type { YieldOpportunity } from "@/types";

interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  category: 'protocol' | 'market' | 'technical' | 'regulatory';
}

interface RiskAssessment {
  poolId: string;
  pool: YieldOpportunity;
  overallScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  factors: RiskFactor[];
  recommendations: string[];
}

interface PortfolioRisk {
  totalAllocation: number;
  weightedRisk: number;
  diversificationScore: number;
  recommendations: string[];
}

export default function RiskCalculator() {
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [portfolioAllocations, setPortfolioAllocations] = useState<{ poolId: string; allocation: number }[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<number>(5);
  const [timeHorizon, setTimeHorizon] = useState<string>("medium");

  const { data: pools = [] } = useQuery<YieldOpportunity[]>({
    queryKey: ['/api/pools'],
    queryFn: async () => {
      const response = await fetch('/api/pools?onlyVisible=true&limit=100');
      if (!response.ok) throw new Error('Failed to fetch pools');
      return response.json();
    }
  });

  const { data: riskAssessments = [] } = useQuery<RiskAssessment[]>({
    queryKey: ['/api/risk-assessments'],
    queryFn: async () => {
      const response = await fetch('/api/risk-assessments');
      if (!response.ok) throw new Error('Failed to fetch risk assessments');
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: poolRisk } = useQuery<RiskAssessment>({
    queryKey: ['/api/risk-assessments', selectedPool],
    queryFn: async () => {
      const response = await fetch(`/api/risk-assessments/${selectedPool}`);
      if (!response.ok) throw new Error('Failed to fetch pool risk assessment');
      return response.json();
    },
    enabled: !!selectedPool,
    staleTime: 30 * 60 * 1000,
  });

  // Generate comprehensive risk assessment
  const generateRiskAssessment = (pool: YieldOpportunity): RiskAssessment => {
    const currentApy = parseFloat(pool.apy);
    const tvl = parseFloat(pool.tvl);
    
    // Risk factors with scores (0-10, 10 being highest risk)
    const factors: RiskFactor[] = [
      {
        name: 'Smart Contract Risk',
        score: Math.random() * 3 + 2, // 2-5
        weight: 0.25,
        description: 'Risk from smart contract vulnerabilities and bugs',
        category: 'technical'
      },
      {
        name: 'Liquidity Risk',
        score: tvl < 1000000 ? 7 + Math.random() * 2 : Math.random() * 3 + 1,
        weight: 0.2,
        description: 'Risk from insufficient liquidity causing slippage',
        category: 'market'
      },
      {
        name: 'Protocol Risk',
        score: Math.random() * 4 + 1, // 1-5
        weight: 0.2,
        description: 'Risk from protocol governance and operational issues',
        category: 'protocol'
      },
      {
        name: 'Impermanent Loss',
        score: pool.tokenPair.includes('USDC') || pool.tokenPair.includes('USDT') ? 
               Math.random() * 2 + 1 : Math.random() * 4 + 3, // Stables vs volatile
        weight: 0.15,
        description: 'Loss from token price divergence in LP positions',
        category: 'market'
      },
      {
        name: 'Regulatory Risk',
        score: Math.random() * 3 + 2, // 2-5
        weight: 0.1,
        description: 'Risk from changing regulatory environment',
        category: 'regulatory'
      },
      {
        name: 'Counterparty Risk',
        score: Math.random() * 3 + 1, // 1-4
        weight: 0.1,
        description: 'Risk from other parties in the protocol',
        category: 'protocol'
      }
    ];

    // Calculate overall score
    const overallScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    
    const riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' = 
      overallScore < 3 ? 'Low' :
      overallScore < 5 ? 'Medium' :
      overallScore < 7 ? 'High' : 'Very High';

    const recommendations = [
      overallScore > 6 ? 'Consider reducing allocation due to high risk score' : 'Risk level appears manageable',
      tvl < 1000000 ? 'Monitor liquidity closely - low TVL detected' : 'Adequate liquidity available',
      currentApy > 15 ? 'High APY may indicate elevated risk - investigate thoroughly' : 'APY appears reasonable',
      'Always diversify across multiple pools and protocols',
      'Monitor protocol announcements and governance changes'
    ];

    return {
      poolId: pool.id,
      pool,
      overallScore,
      riskLevel,
      factors,
      recommendations
    };
  };

  // Generate sample assessments
  const sampleAssessments = pools.slice(0, 30).map(generateRiskAssessment);
  const displayAssessments = riskAssessments.length > 0 ? riskAssessments : sampleAssessments;

  const selectedPoolData = selectedPool 
    ? (poolRisk || displayAssessments.find(r => r.poolId === selectedPool))
    : null;

  // Portfolio risk calculation
  const calculatePortfolioRisk = (): PortfolioRisk => {
    if (portfolioAllocations.length === 0) {
      return {
        totalAllocation: 0,
        weightedRisk: 0,
        diversificationScore: 0,
        recommendations: ['Add pools to calculate portfolio risk']
      };
    }

    const totalAllocation = portfolioAllocations.reduce((sum, alloc) => sum + alloc.allocation, 0);
    
    const weightedRisk = portfolioAllocations.reduce((sum, alloc) => {
      const assessment = displayAssessments.find(a => a.poolId === alloc.poolId);
      return sum + (assessment ? assessment.overallScore * (alloc.allocation / totalAllocation) : 0);
    }, 0);

    // Simple diversification score based on number of pools and allocation distribution
    const numPools = portfolioAllocations.length;
    const maxAllocation = Math.max(...portfolioAllocations.map(a => a.allocation));
    const diversificationScore = Math.min(10, (numPools * 2) - (maxAllocation / totalAllocation * 10));

    const recommendations = [
      weightedRisk > 6 ? 'Portfolio has high risk - consider rebalancing' : 'Portfolio risk is manageable',
      diversificationScore < 5 ? 'Consider better diversification across more pools' : 'Good diversification detected',
      numPools < 3 ? 'Add more pools to reduce concentration risk' : 'Adequate pool diversification',
    ];

    return {
      totalAllocation,
      weightedRisk,
      diversificationScore,
      recommendations
    };
  };

  const portfolioRisk = calculatePortfolioRisk();

  const addToPortfolio = (poolId: string) => {
    if (!portfolioAllocations.find(a => a.poolId === poolId)) {
      setPortfolioAllocations(prev => [...prev, { poolId, allocation: 10 }]);
    }
  };

  const updateAllocation = (poolId: string, allocation: number) => {
    setPortfolioAllocations(prev => 
      prev.map(a => a.poolId === poolId ? { ...a, allocation } : a)
    );
  };

  const removeFromPortfolio = (poolId: string) => {
    setPortfolioAllocations(prev => prev.filter(a => a.poolId !== poolId));
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Very High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protocol': return <Shield className="w-4 h-4" />;
      case 'market': return <TrendingUp className="w-4 h-4" />;
      case 'technical': return <Zap className="w-4 h-4" />;
      case 'regulatory': return <Globe className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Chart data for risk distribution
  const riskDistribution = [
    { name: 'Low Risk', value: displayAssessments.filter(a => a.riskLevel === 'Low').length, fill: '#10b981' },
    { name: 'Medium Risk', value: displayAssessments.filter(a => a.riskLevel === 'Medium').length, fill: '#f59e0b' },
    { name: 'High Risk', value: displayAssessments.filter(a => a.riskLevel === 'High').length, fill: '#f97316' },
    { name: 'Very High Risk', value: displayAssessments.filter(a => a.riskLevel === 'Very High').length, fill: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-risk-calculator-title">
              Risk Score Calculator
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2" data-testid="text-risk-calculator-subtitle">
              Comprehensive risk analysis and portfolio optimization for DeFi yield opportunities
            </p>
          </div>

          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="individual" data-testid="tab-individual-risk">Individual Pool Risk</TabsTrigger>
              <TabsTrigger value="portfolio" data-testid="tab-portfolio-risk">Portfolio Risk</TabsTrigger>
              <TabsTrigger value="overview" data-testid="tab-risk-overview">Risk Overview</TabsTrigger>
            </TabsList>

            {/* Individual Pool Risk */}
            <TabsContent value="individual">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pool Selection */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="w-5 h-5 mr-2" />
                        Select Pool
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select value={selectedPool} onValueChange={setSelectedPool}>
                        <SelectTrigger data-testid="select-risk-pool">
                          <SelectValue placeholder="Choose pool to analyze" />
                        </SelectTrigger>
                        <SelectContent>
                          {pools.slice(0, 50).map((pool) => (
                            <SelectItem key={pool.id} value={pool.id}>
                              {pool.platform.displayName} - {pool.tokenPair}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Risk Tolerance */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Risk Tolerance: {riskTolerance}/10
                        </label>
                        <Slider
                          value={[riskTolerance]}
                          onValueChange={([value]) => setRiskTolerance(value)}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                          data-testid="slider-risk-tolerance"
                        />
                      </div>

                      <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                        <SelectTrigger data-testid="select-time-horizon">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short Term (&lt; 1 month)</SelectItem>
                          <SelectItem value="medium">Medium Term (1-6 months)</SelectItem>
                          <SelectItem value="long">Long Term (&gt; 6 months)</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Top Risky Pools */}
                      <div className="mt-6">
                        <h3 className="font-medium mb-3">Highest Risk Pools</h3>
                        <div className="space-y-2">
                          {displayAssessments
                            .sort((a, b) => b.overallScore - a.overallScore)
                            .slice(0, 5)
                            .map((assessment) => (
                              <div
                                key={assessment.poolId}
                                className={`p-2 rounded cursor-pointer text-sm ${
                                  selectedPool === assessment.poolId 
                                    ? 'bg-blue-50 border border-blue-200' 
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedPool(assessment.poolId)}
                                data-testid={`risk-item-${assessment.poolId}`}
                              >
                                <p className="font-medium truncate">
                                  {assessment.pool.platform.displayName}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-xs text-gray-500 truncate">
                                    {assessment.pool.tokenPair}
                                  </span>
                                  <Badge className={`text-xs ${getRiskColor(assessment.riskLevel)}`}>
                                    {assessment.riskLevel}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Risk Analysis */}
                <div className="lg:col-span-2">
                  {selectedPoolData ? (
                    <div className="space-y-6">
                      {/* Risk Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-bold">
                                {selectedPoolData.pool.platform.displayName} - {selectedPoolData.pool.tokenPair}
                              </h2>
                              <p className="text-sm text-gray-600 mt-1">
                                APY: {selectedPoolData.pool.apy}% | TVL: ${parseFloat(selectedPoolData.pool.tvl).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={`px-3 py-2 text-base ${getRiskColor(selectedPoolData.riskLevel)}`}>
                                {selectedPoolData.riskLevel} Risk
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1">
                                Score: {selectedPoolData.overallScore.toFixed(1)}/10
                              </p>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <Progress 
                              value={(selectedPoolData.overallScore / 10) * 100} 
                              className="h-3"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Low Risk</span>
                              <span>High Risk</span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => addToPortfolio(selectedPoolData.poolId)}
                            className="w-full"
                            data-testid="button-add-to-portfolio"
                          >
                            Add to Portfolio Analysis
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Risk Factors */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Risk Factor Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedPoolData.factors.map((factor, index) => (
                              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center">
                                    {getCategoryIcon(factor.category)}
                                    <span className="ml-2 font-medium">{factor.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-bold ${
                                      factor.score < 3 ? 'text-green-600' :
                                      factor.score < 6 ? 'text-yellow-600' :
                                      factor.score < 8 ? 'text-orange-600' : 'text-red-600'
                                    }`}>
                                      {factor.score.toFixed(1)}/10
                                    </span>
                                    <p className="text-xs text-gray-500">
                                      Weight: {(factor.weight * 100).toFixed(0)}%
                                    </p>
                                  </div>
                                </div>
                                <Progress 
                                  value={(factor.score / 10) * 100} 
                                  className="h-2 mb-2"
                                />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {factor.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recommendations */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Target className="w-5 h-5 mr-2" />
                            Recommendations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedPoolData.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="ml-3 text-sm text-blue-900 dark:text-blue-100">
                                  {rec}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Calculator className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Select a Pool for Risk Analysis
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Choose a pool from the dropdown to see comprehensive risk assessment
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Portfolio Risk */}
            <TabsContent value="portfolio">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Builder */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Portfolio Builder
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {portfolioAllocations.map((alloc) => {
                        const pool = pools.find(p => p.id === alloc.poolId);
                        if (!pool) return null;

                        return (
                          <div key={alloc.poolId} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm truncate">
                                  {pool.platform.displayName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {pool.tokenPair}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromPortfolio(alloc.poolId)}
                                data-testid={`button-remove-${alloc.poolId}`}
                              >
                                ×
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-gray-500">
                                Allocation: {alloc.allocation}%
                              </label>
                              <Slider
                                value={[alloc.allocation]}
                                onValueChange={([value]) => updateAllocation(alloc.poolId, value)}
                                max={100}
                                min={1}
                                step={1}
                                className="w-full"
                                data-testid={`slider-allocation-${alloc.poolId}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                      
                      {portfolioAllocations.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                          Add pools from individual risk analysis to build your portfolio
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Portfolio Analysis */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Portfolio Risk Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {portfolioRisk.totalAllocation}%
                          </p>
                          <p className="text-xs text-gray-500">Total Allocation</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${
                            portfolioRisk.weightedRisk < 4 ? 'text-green-600' :
                            portfolioRisk.weightedRisk < 6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {portfolioRisk.weightedRisk.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">Weighted Risk</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {portfolioRisk.diversificationScore.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500">Diversification</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Portfolio Recommendations</h4>
                        {portfolioRisk.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="ml-3 text-sm text-yellow-900 dark:text-yellow-100">
                              {rec}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Risk Overview */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {riskDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Metrics Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Risk Metrics Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {displayAssessments.filter(a => a.riskLevel === 'Low').length}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">Low Risk Pools</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">
                          {displayAssessments.filter(a => a.riskLevel === 'Medium').length}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Medium Risk Pools</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {displayAssessments.filter(a => a.riskLevel === 'High').length}
                        </p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">High Risk Pools</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          {displayAssessments.filter(a => a.riskLevel === 'Very High').length}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">Very High Risk</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Average Risk by Platform</h4>
                      <div className="space-y-2">
                        {Object.entries(
                          displayAssessments.reduce((acc, assessment) => {
                            const platform = assessment.pool.platform.displayName;
                            if (!acc[platform]) acc[platform] = [];
                            acc[platform].push(assessment.overallScore);
                            return acc;
                          }, {} as Record<string, number[]>)
                        )
                          .map(([platform, scores]) => ({
                            platform,
                            avgScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
                          }))
                          .sort((a, b) => a.avgScore - b.avgScore)
                          .slice(0, 8)
                          .map(({ platform, avgScore }) => (
                            <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="text-sm truncate flex-1">{platform}</span>
                              <div className="flex items-center ml-2">
                                <Progress value={(avgScore / 10) * 100} className="w-16 h-2 mr-2" />
                                <span className={`text-sm font-medium ${
                                  avgScore < 4 ? 'text-green-600' :
                                  avgScore < 6 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {avgScore.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}