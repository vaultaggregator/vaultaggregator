import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, TrendingUp, TrendingDown, Minus, Clock, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfidenceGauge } from "./confidence-gauge";

interface AIOutlook {
  id: string;
  poolId: string;
  outlook: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  marketFactors: string[];
  generatedAt: string;
  expiresAt: string;
}

interface AIOutlookProps {
  poolId: string;
}

export function AIOutlook({ poolId }: AIOutlookProps) {
  const { data: outlook, isLoading, error } = useQuery<AIOutlook>({
    queryKey: ["/api/pools", poolId, "outlook"],
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchInterval: 2 * 60 * 60 * 1000, // Auto-refresh every 2 hours
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-900";
      case "bearish":
        return "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-900";
      default:
        return "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-900";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <Card data-testid="ai-outlook-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI Market Outlook
          </CardTitle>
          <CardDescription>
            Generating AI-powered market analysis...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !outlook) {
    return (
      <Card data-testid="ai-outlook-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI Market Outlook
          </CardTitle>
          <CardDescription>
            Unable to generate AI outlook at the moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Our AI analysis is temporarily unavailable. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ai-outlook-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <CardTitle>AI Market Outlook</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={getSentimentColor(outlook.sentiment)}
              data-testid={`badge-sentiment-${outlook.sentiment}`}
            >
              {getSentimentIcon(outlook.sentiment)}
              <span className="ml-1 capitalize">{outlook.sentiment}</span>
            </Badge>
            <span 
              className={cn("text-sm font-medium", getConfidenceColor(outlook.confidence))}
              data-testid="text-confidence"
            >
              {outlook.confidence}% confidence
            </span>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Generated {formatTimeAgo(outlook.generatedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Outlook Text */}
          <div className="lg:col-span-2 space-y-4">
            <div data-testid="text-outlook">
              <p className="text-sm leading-relaxed">{outlook.outlook}</p>
            </div>
            
            {outlook.marketFactors && outlook.marketFactors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Key Factors Considered</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outlook.marketFactors.map((factor, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs"
                      data-testid={`factor-${index}`}
                    >
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Confidence Gauge */}
          <div className="lg:col-span-1 flex justify-center">
            <ConfidenceGauge 
              confidence={outlook.confidence} 
              sentiment={outlook.sentiment}
              size={180}
            />
          </div>
        </div>



        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Analysis auto-refreshes every 2 hours
          </div>
          <div className="text-xs text-muted-foreground">
            {outlook && new Date(outlook.generatedAt).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}