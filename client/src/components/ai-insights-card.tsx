import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, TrendingDown, Minus, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsights {
  id: string;
  poolId: string;
  outlook: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  marketFactors: string[];
  generatedAt: string;
  expiresAt: string;
}

interface AIInsightsCardProps {
  poolId: string;
}

export function AIInsightsCard({ poolId }: AIInsightsCardProps) {
  const queryClient = useQueryClient();
  
  const { data: insights, isLoading: loading, error } = useQuery<AIInsights>({
    queryKey: [`/api/pools/${poolId}/ai-prediction`],
    enabled: !!poolId,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refetch every 10 minutes
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-600 dark:text-green-400';
      case 'bearish':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center">
            <Brain className="w-4 h-4 mr-1.5 text-purple-600" />
            <span>AI Market Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !insights) {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center">
            <Brain className="w-4 h-4 mr-1.5 text-purple-600" />
            <span>AI Market Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="flex items-center text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>{error ? (error instanceof Error ? error.message : String(error)) : 'Insights unavailable'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center">
          <Brain className="w-4 h-4 mr-1.5 text-purple-600" />
          <span>AI Market Insights</span>
          <Sparkles className="w-3 h-3 ml-1 text-purple-500 animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4 space-y-3">
        {/* Sentiment and Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={cn('flex items-center text-xs font-semibold capitalize', getSentimentColor(insights.sentiment))}>
              {getSentimentIcon(insights.sentiment)}
              <span className="ml-1">{insights.sentiment}</span>
            </span>
          </div>
          {insights.confidence > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground">Confidence:</span>
              <div className="flex items-center">
                <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full transition-all duration-500', getConfidenceColor(insights.confidence))}
                    style={{ width: `${insights.confidence}%` }}
                  />
                </div>
                <span className="ml-1 text-xs font-medium">{insights.confidence}%</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Outlook */}
        <div className="space-y-1">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {insights.outlook}
          </p>
        </div>

        {/* Market Factors */}
        {insights.marketFactors && insights.marketFactors.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Key Factors:</p>
            <div className="flex flex-wrap gap-1">
              {insights.marketFactors.slice(0, 3).map((factor, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs py-0 px-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Update timestamp */}
        <div className="text-xs text-muted-foreground pt-1 border-t border-purple-200/50 dark:border-purple-700/50">
          Updated {new Date(insights.generatedAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}