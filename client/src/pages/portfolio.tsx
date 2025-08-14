/**
 * Portfolio Page
 * Main portfolio management interface
 */

import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PortfolioManager } from "@/components/portfolio-manager";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Activity,
  Plus,
  Calculator,
  Target,
  Info
} from "lucide-react";

export default function Portfolio() {
  const { portfolio, metrics, isLoadingPools } = usePortfolio();
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState("10000");
  
  // Calculate projected returns
  const calculateProjectedReturns = (amount: number, apy: number, days: number) => {
    const dailyRate = apy / 100 / 365;
    return amount * dailyRate * days;
  };
  
  const projectedDaily = metrics.avgApy > 0 
    ? calculateProjectedReturns(parseFloat(calculatorAmount) || 0, metrics.avgApy, 1)
    : 0;
    
  const projectedMonthly = metrics.avgApy > 0 
    ? calculateProjectedReturns(parseFloat(calculatorAmount) || 0, metrics.avgApy, 30)
    : 0;
    
  const projectedYearly = metrics.avgApy > 0 
    ? calculateProjectedReturns(parseFloat(calculatorAmount) || 0, metrics.avgApy, 365)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Portfolio Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track, analyze, and optimize your DeFi yield farming portfolio
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Portfolio Value</p>
                  <p className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Daily Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    +${metrics.totalYield.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Average APY</p>
                  <p className="text-2xl font-bold">{metrics.avgApy.toFixed(2)}%</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Positions</p>
                  <p className="text-2xl font-bold">{portfolio.length}</p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portfolio Manager - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PortfolioManager />
          </div>
          
          {/* Side Panel */}
          <div className="space-y-6">
            {/* Yield Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Yield Calculator
                </CardTitle>
                <CardDescription>
                  Calculate potential returns based on your portfolio APY
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="calculator-amount">Investment Amount ($)</Label>
                    <Input
                      id="calculator-amount"
                      type="number"
                      value={calculatorAmount}
                      onChange={(e) => setCalculatorAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  
                  {metrics.avgApy > 0 ? (
                    <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm">
                        <span className="text-gray-500">At {metrics.avgApy.toFixed(2)}% APY:</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Daily:</span>
                        <span className="font-medium text-green-600">
                          +${projectedDaily.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Monthly:</span>
                        <span className="font-medium text-green-600">
                          +${projectedMonthly.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Yearly:</span>
                        <span className="font-medium text-green-600">
                          +${projectedYearly.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Add pools to your portfolio to see projected returns
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Portfolio Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Portfolio Goals
                </CardTitle>
                <CardDescription>
                  Set and track your investment targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Monthly Yield Target</span>
                      <Badge variant="secondary">$5,000</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((metrics.totalYield * 30 / 5000) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${(metrics.totalYield * 30).toFixed(2)} / $5,000
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Portfolio Value Goal</span>
                      <Badge variant="secondary">$100,000</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min((metrics.totalValue / 100000) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${metrics.totalValue.toLocaleString()} / $100,000
                    </p>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Goal
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
                <CardDescription>
                  Portfolio risk distribution analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.riskDistribution).map(([level, amount]) => {
                    const percentage = metrics.totalValue > 0 
                      ? (amount / metrics.totalValue) * 100 
                      : 0;
                    const color = level === 'low' ? 'green' : level === 'medium' ? 'yellow' : 'red';
                    
                    return (
                      <div key={level}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm capitalize">{level} Risk</span>
                          <span className="text-sm font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all bg-${color}-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {metrics.riskDistribution.low > metrics.totalValue * 0.5
                        ? "Your portfolio is well-balanced with low risk exposure."
                        : metrics.riskDistribution.high > metrics.totalValue * 0.3
                        ? "Consider reducing high-risk positions for better stability."
                        : "Your portfolio has a moderate risk profile."}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}