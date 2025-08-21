import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  trending?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
}

export function EnhancedStatsCard({
  title,
  value,
  change,
  changeType = 'percentage',
  icon: Icon,
  iconColor = 'text-blue-600',
  description,
  badge,
  trending,
  loading = false,
  onClick
}: EnhancedStatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const formatChange = () => {
    if (change === undefined) return '';
    const sign = change > 0 ? '+' : '';
    const suffix = changeType === 'percentage' ? '%' : '';
    return `${sign}${change.toFixed(1)}${suffix}`;
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className={`h-8 w-8 ${iconColor}`} />
            <div className="ml-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {badge && (
              <Badge variant={badge.variant || 'default'} className="text-xs">
                {badge.text}
              </Badge>
            )}
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={`text-xs font-medium ${getTrendColor()}`}>
                  {formatChange()}
                </span>
              </div>
            )}
          </div>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}