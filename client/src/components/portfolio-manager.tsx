/**
 * Portfolio Manager Component
 * Allows users to manage their yield farming portfolio
 */

import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { 
  Download, 
  Upload, 
  Trash2, 
  TrendingUp, 
  Shield, 
  DollarSign,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface PortfolioManagerProps {
  className?: string;
}

export function PortfolioManager({ className }: PortfolioManagerProps) {
  const {
    portfolio,
    metrics,
    isLoadingPools,
    exportPortfolio,
    importPortfolio,
    clearPortfolio,
    removeFromPortfolio
  } = usePortfolio();
  
  const [showImport, setShowImport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Prepare chart data
  const riskData = Object.entries(metrics.riskDistribution)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'low' ? '#10b981' : name === 'medium' ? '#f59e0b' : '#ef4444'
    }));

  const chainData = Object.entries(metrics.chainDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const platformData = Object.entries(metrics.platformDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importPortfolio(file);
      setShowImport(false);
    }
  };

  if (portfolio.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Portfolio Yet</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Start building your portfolio by adding yield farming pools
          </p>
          {showImport ? (
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="max-w-xs"
              />
              <Button variant="outline" onClick={() => setShowImport(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowImport(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Portfolio
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>
              Track and manage your yield farming investments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPortfolio}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            {showClearConfirm ? (
              <>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    clearPortfolio();
                    setShowClearConfirm(false);
                  }}
                >
                  Confirm Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowClearConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-blue-500" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Value</p>
                  <p className="text-xl font-bold">
                    ${metrics.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">Daily Yield</p>
                  <p className="text-xl font-bold text-green-600">
                    +${metrics.totalYield.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">Avg APY</p>
                  <p className="text-xl font-bold">
                    {metrics.avgApy.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Shield className="h-8 w-8 text-orange-500" />
                <div className="text-right">
                  <p className="text-xs text-gray-500">Positions</p>
                  <p className="text-xl font-bold">{portfolio.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="risk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
            <TabsTrigger value="chain">Chain Distribution</TabsTrigger>
            <TabsTrigger value="platform">Platform Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="risk" className="mt-4">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No risk data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="chain" className="mt-4">
            {chainData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No chain data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="platform" className="mt-4">
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No platform data available
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Portfolio Items */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Positions</h3>
          <div className="space-y-2">
            {portfolio.map((item) => (
              <div 
                key={item.poolId} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.poolId}</p>
                  <p className="text-xs text-gray-500">
                    Amount: ${item.amount.toLocaleString()}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromPortfolio(item.poolId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}