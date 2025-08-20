import { useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Calculator, TrendingUp, Users, Clock, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

export default function RiskCalculation() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-risk-calculation-title">
              How Risk is Calculated
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Understanding our comprehensive risk assessment methodology for DeFi yield opportunities
            </p>
          </div>

          {/* Risk Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                Risk Assessment Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our risk assessment system evaluates DeFi protocols using a multi-factor approach that considers 
                operational history, financial metrics, user adoption, and protocol maturity. Each pool receives 
                a risk score from 1-10, which is then categorized into Low, Medium, or High risk levels.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <Badge className="bg-green-600 text-white mb-2">1-3 Low</Badge>
                  <p className="text-sm text-green-700 dark:text-green-300">Established protocols with proven track records</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <Badge className="bg-yellow-600 text-white mb-2">4-6 Medium</Badge>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Moderately tested protocols with some risk factors</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                  <Badge className="bg-red-600 text-white mb-2">7-10 High</Badge>
                  <p className="text-sm text-red-700 dark:text-red-300">Newer or experimental protocols requiring caution</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Operating History (40% weight)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Less than 30 days</span>
                    <Badge variant="destructive">High Risk (+3)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">30-180 days</span>
                    <Badge className="bg-yellow-600">Medium Risk (+2)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">180-365 days</span>
                    <Badge className="bg-yellow-600">Medium Risk (+1)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">1-2 years</span>
                    <Badge className="bg-green-600">Low Risk (+0.5)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Over 2 years</span>
                    <Badge className="bg-green-600">Low Risk (+0)</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Longer operating history indicates protocol stability and reduces smart contract risk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Total Value Locked (25% weight)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Under $1M</span>
                    <Badge variant="destructive">High Risk (+2)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">$1M - $10M</span>
                    <Badge className="bg-yellow-600">Medium Risk (+1.5)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">$10M - $100M</span>
                    <Badge className="bg-yellow-600">Medium Risk (+1)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">$100M - $1B</span>
                    <Badge className="bg-green-600">Low Risk (+0.5)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Over $1B</span>
                    <Badge className="bg-green-600">Low Risk (+0)</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Higher TVL indicates greater market confidence and protocol adoption.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  APY Analysis (20% weight)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Over 50% APY</span>
                    <Badge variant="destructive">High Risk (+2)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">20-50% APY</span>
                    <Badge className="bg-yellow-600">Medium Risk (+1)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">10-20% APY</span>
                    <Badge className="bg-yellow-600">Medium Risk (+0.5)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">5-10% APY</span>
                    <Badge className="bg-green-600">Low Risk (+0)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Under 5% APY</span>
                    <Badge className="bg-green-600">Low Risk (+0)</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Unusually high yields often indicate higher risk or unsustainable tokenomics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-orange-600" />
                  User Adoption (15% weight)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Under 100 users</span>
                    <Badge variant="destructive">High Risk (+1.5)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">100-500 users</span>
                    <Badge className="bg-yellow-600">Medium Risk (+1)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">500-2,000 users</span>
                    <Badge className="bg-yellow-600">Medium Risk (+0.5)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">2,000-10,000 users</span>
                    <Badge className="bg-green-600">Low Risk (+0.25)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Over 10,000 users</span>
                    <Badge className="bg-green-600">Low Risk (+0)</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Higher user adoption indicates greater community trust and protocol validation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Formula */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-6 w-6 mr-2 text-indigo-600" />
                Risk Score Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm">
                <div className="text-center font-bold mb-4">Risk Score Formula</div>
                <div className="space-y-2">
                  <div>Risk Score = (Days Factor × 0.40) + (TVL Factor × 0.25) + (APY Factor × 0.20) + (Users Factor × 0.15)</div>
                  <div className="text-xs text-muted-foreground mt-4">
                    Final score is rounded to the nearest 0.5 and capped between 1.0 and 10.0
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2.5</div>
                  <div className="text-sm text-muted-foreground">Example: Lido stETH</div>
                  <div className="text-xs text-green-600">Low Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">4.5</div>
                  <div className="text-sm text-muted-foreground">Example: Morpho USDC</div>
                  <div className="text-xs text-yellow-600">Medium Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">7.5</div>
                  <div className="text-sm text-muted-foreground">Example: New Protocol</div>
                  <div className="text-xs text-red-600">High Risk</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-6 w-6 mr-2 text-yellow-600" />
                Important Considerations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Real-time Updates</div>
                    <div className="text-sm text-muted-foreground">Risk scores are recalculated every 10 minutes using live blockchain data</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Authentic Data Only</div>
                    <div className="text-sm text-muted-foreground">All metrics are sourced directly from official APIs and blockchain data</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Not Financial Advice</div>
                    <div className="text-sm text-muted-foreground">Risk scores are informational tools only. Always conduct your own research before investing</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Additional Risks</div>
                    <div className="text-sm text-muted-foreground">Smart contract bugs, regulatory changes, and market volatility are not captured in these scores</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}