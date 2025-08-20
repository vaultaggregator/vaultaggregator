/**
 * Enhanced Yield Opportunity Card
 * Improved version with portfolio integration and better visuals
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Users, 
  DollarSign,
  Plus,
  Minus,
  Check,
  ExternalLink,
  Star,
  StarOff,
  Info,
  Clock
} from "lucide-react";
import { Link } from "wouter";
import type { YieldOpportunity } from "@/types";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

interface EnhancedYieldCardProps {
  pool: YieldOpportunity;
  className?: string;
}

export function EnhancedYieldCard({ pool, className }: EnhancedYieldCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("1000");
  const [notes, setNotes] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  
  const isTracked = false; // Simplified for now
  const portfolioItem = null; // Simplified for now
  
  // Parse APY values
  const currentApy = parseFloat(pool.apy) || 0;
  const apy30d = pool.rawData?.apyMean30d || currentApy;
  const apyChange = currentApy - apy30d;
  const apyTrend = apyChange > 0.5 ? 'up' : apyChange < -0.5 ? 'down' : 'stable';
  
  // Parse TVL
  const tvl = parseFloat(pool.tvl) || 0;
  const tvlFormatted = formatNumber(tvl, { currency: '$', maxDecimals: 2 });
    
  // Risk colors
  const riskColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };
  
  // Handle add to portfolio - simplified
  const handleAddToPortfolio = () => {
    // Portfolio functionality simplified for now
    setShowAddDialog(false);
    setInvestmentAmount("1000");
    setNotes("");
  };
  
  // Calculate daily yield
  const calculateDailyYield = (amount: number) => {
    return (amount * currentApy / 100 / 365).toFixed(2);
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        isHovered && "shadow-xl transform -translate-y-1",
        isTracked && "ring-2 ring-blue-500/20",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
        apyTrend === 'up' && "from-green-500/5 to-transparent group-hover:opacity-100",
        apyTrend === 'down' && "from-red-500/5 to-transparent group-hover:opacity-100",
        apyTrend === 'stable' && "from-blue-500/5 to-transparent group-hover:opacity-100"
      )} />
      
      <CardContent className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Platform Logo */}
            {pool.platform.logoUrl && (
              <img 
                src={pool.platform.logoUrl} 
                alt={pool.platform.displayName}
                className="w-10 h-10 rounded-full"
              />
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{pool.tokenPair}</h3>
                {isTracked && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{pool.platform.displayName}</span>
                <span>•</span>
                <span>{pool.chain.displayName}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant={isTracked ? "outline" : "default"}
                  className="h-8"
                >
                  {isTracked ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Track
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isTracked ? 'Update Position' : 'Add to Portfolio'}
                  </DialogTitle>
                  <DialogDescription>
                    Track your investment in {pool.tokenPair} on {pool.platform.displayName}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="amount">Investment Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                    {parseFloat(investmentAmount) > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Daily yield: ${calculateDailyYield(parseFloat(investmentAmount))}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddToPortfolio}>
                      {isTracked ? 'Update' : 'Add to Portfolio'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            

          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* APY */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>APY</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {currentApy.toFixed(2)}%
              </span>
              {apyTrend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              {apyTrend === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          
          {/* TVL */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <DollarSign className="h-3 w-3" />
              <span>TVL</span>
            </div>
            <div className="text-xl font-bold">{tvlFormatted}</div>
          </div>
          
          {/* Holders */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Users className="h-3 w-3" />
              <span>Holders</span>
            </div>
            <div className="text-xl font-bold">
              {pool.holdersCount ? formatNumber(pool.holdersCount, { maxDecimals: 0 }) : 'N/A'}
            </div>
          </div>
          
          {/* Risk */}
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Shield className="h-3 w-3" />
              <span>Risk</span>
            </div>
            <Badge className={cn("capitalize", riskColors[pool.riskLevel])}>
              {pool.riskLevel}
            </Badge>
          </div>
        </div>
        
        {/* Portfolio Info */}
        {isTracked && portfolioItem && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Your Position:</span>
              <span className="font-medium">{formatNumber(portfolioItem.amount, { currency: '$', maxDecimals: 0 })}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Daily Yield:</span>
              <span className="font-medium text-green-600">
                +${calculateDailyYield(portfolioItem.amount)}
              </span>
            </div>
          </div>
        )}
        
        {/* Historical APY */}
        {pool.rawData?.apyMean30d && (
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>30d: {pool.rawData.apyMean30d.toFixed(2)}%</span>
            </div>
            {pool.operatingDays && (
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Operating {pool.operatingDays} days</span>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href={`/yield/${pool.chain.name}/${pool.platform.slug}/${pool.id}`}>
            <Button variant="outline" className="flex-1">
              View Details
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
          {pool.platform.website && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(pool.platform.website, '_blank')}
              title="Visit Platform"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}