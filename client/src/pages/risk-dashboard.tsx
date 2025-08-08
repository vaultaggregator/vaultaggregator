import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, TrendingUp, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface RiskScore {
  id: string;
  poolId: string;
  overallScore: number;
  smartContractRisk: number;
  liquidityRisk: number;
  platformRisk: number;
  marketRisk: number;
  auditStatus: string;
  tvlStability: string;
  apyVolatility: string;
  updatedAt: string;
}

export default function RiskDashboard() {
  const [poolId, setPoolId] = useState('');
  const [analyzedPoolId, setAnalyzedPoolId] = useState<string | null>(null);

  const { data: riskScore, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/pools', analyzedPoolId, 'risk-score'],
    enabled: !!analyzedPoolId,
    queryFn: () => apiRequest(`/api/pools/${analyzedPoolId}/risk-score`)
  });

  const handleAnalyze = () => {
    if (poolId.trim()) {
      setAnalyzedPoolId(poolId.trim());
    }
  };

  const getRiskLevel = (score: number) => {
    if (score <= 20) return { level: 'Very Low', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score <= 40) return { level: 'Low', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (score <= 60) return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (score <= 80) return { level: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { level: 'Very High', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getAuditStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Risk Analysis Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive risk assessment for DeFi yield pools
          </p>
        </div>
      </div>

      {/* Pool Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Pool Risk</CardTitle>
          <CardDescription>
            Enter a pool ID to get detailed risk analysis and scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="poolId">Pool ID</Label>
              <Input
                id="poolId"
                data-testid="input-pool-id"
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="Enter pool ID to analyze..."
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleAnalyze}
              data-testid="button-analyze-risk"
              disabled={!poolId.trim() || isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Risk'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Analysis Results */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load risk analysis. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {riskScore && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Risk Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Overall Risk Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{riskScore.overallScore}/100</div>
                <Badge 
                  variant="secondary" 
                  className={`${getRiskLevel(riskScore.overallScore).color} text-white`}
                  data-testid={`badge-risk-${getRiskLevel(riskScore.overallScore).level.toLowerCase().replace(' ', '-')}`}
                >
                  {getRiskLevel(riskScore.overallScore).level} Risk
                </Badge>
              </div>
              <Progress 
                value={riskScore.overallScore} 
                className="w-full h-3"
                data-testid="progress-overall-risk"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Last updated: {new Date(riskScore.updatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Audit Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Security Audit Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {getAuditStatusIcon(riskScore.auditStatus)}
                <span className="text-lg font-medium capitalize">
                  {riskScore.auditStatus} Audit
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>TVL Stability</Label>
                  <div className="font-medium" data-testid="text-tvl-stability">
                    {parseFloat(riskScore.tvlStability).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <Label>APY Volatility</Label>
                  <div className="font-medium" data-testid="text-apy-volatility">
                    {parseFloat(riskScore.apyVolatility).toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factor Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Risk Factor Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Smart Contract Risk</Label>
                    <span className="text-sm font-medium">{riskScore.smartContractRisk}/100</span>
                  </div>
                  <Progress value={riskScore.smartContractRisk} className="h-2" />
                  <Badge 
                    variant="outline" 
                    className={getRiskLevel(riskScore.smartContractRisk).textColor}
                  >
                    {getRiskLevel(riskScore.smartContractRisk).level}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Liquidity Risk</Label>
                    <span className="text-sm font-medium">{riskScore.liquidityRisk}/100</span>
                  </div>
                  <Progress value={riskScore.liquidityRisk} className="h-2" />
                  <Badge 
                    variant="outline" 
                    className={getRiskLevel(riskScore.liquidityRisk).textColor}
                  >
                    {getRiskLevel(riskScore.liquidityRisk).level}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Platform Risk</Label>
                    <span className="text-sm font-medium">{riskScore.platformRisk}/100</span>
                  </div>
                  <Progress value={riskScore.platformRisk} className="h-2" />
                  <Badge 
                    variant="outline" 
                    className={getRiskLevel(riskScore.platformRisk).textColor}
                  >
                    {getRiskLevel(riskScore.platformRisk).level}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Market Risk</Label>
                    <span className="text-sm font-medium">{riskScore.marketRisk}/100</span>
                  </div>
                  <Progress value={riskScore.marketRisk} className="h-2" />
                  <Badge 
                    variant="outline" 
                    className={getRiskLevel(riskScore.marketRisk).textColor}
                  >
                    {getRiskLevel(riskScore.marketRisk).level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Assessment Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-600 mb-2">Very Low Risk (0-20)</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Established protocols with strong security audits and high liquidity
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Low Risk (21-40)</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Well-known platforms with good track record and moderate liquidity
              </p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-600 mb-2">Medium Risk (41-60)</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Newer protocols or moderate liquidity with some uncertainty
              </p>
            </div>
            <div>
              <h4 className="font-medium text-red-600 mb-2">High Risk (61-100)</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Unaudited protocols, low liquidity, or experimental features
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}