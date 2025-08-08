import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, Activity, Loader2, Zap, Database, Globe, RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );
}

interface PoolDataLoadingProps {
  message?: string;
  className?: string;
}

export function PoolDataLoading({ message = "Loading pool data...", className }: PoolDataLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 animate-spin">
          <div className="h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
        </div>
        
        {/* Inner pulsing circle */}
        <div className="flex items-center justify-center h-16 w-16">
          <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{message}</p>
        <div className="flex items-center justify-center mt-2 space-x-1">
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}

interface SyncAnimationProps {
  isActive: boolean;
  message?: string;
  className?: string;
}

export function SyncAnimation({ isActive, message = "Synchronizing data...", className }: SyncAnimationProps) {
  if (!isActive) return null;

  return (
    <div className={cn("flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", className)}>
      <div className="relative">
        <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
        <div className="absolute inset-0 animate-ping">
          <RefreshCw className="h-5 w-5 text-blue-400 opacity-30" />
        </div>
      </div>
      <span className="text-blue-700 dark:text-blue-300 font-medium">{message}</span>
    </div>
  );
}

interface YieldCardSkeletonProps {
  count?: number;
  className?: string;
}

export function YieldCardSkeleton({ count = 3, className }: YieldCardSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>

          {/* APY skeleton */}
          <div className="mb-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>

          {/* TVL skeleton */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>

          {/* Button skeleton */}
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

interface MetricLoadingProps {
  icon: React.ReactNode;
  label: string;
  className?: string;
}

export function MetricLoading({ icon, label, className }: MetricLoadingProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700", className)}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
      </div>
    </div>
  );
}

interface DataSyncProgressProps {
  progress: number;
  total: number;
  currentItem?: string;
  className?: string;
}

export function DataSyncProgress({ progress, total, currentItem, className }: DataSyncProgressProps) {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700", className)}>
      <div className="flex items-center space-x-3 mb-4">
        <Database className="h-5 w-5 text-blue-600 animate-pulse" />
        <span className="font-medium text-gray-900 dark:text-gray-100">Synchronizing Pool Data</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {currentItem ? `Processing: ${currentItem}` : `${progress} of ${total} pools`}
          </span>
          <span className="font-medium text-blue-600">{percentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Globe className="h-3 w-3" />
          <span>Fetching from DeFi Llama API</span>
        </div>
      </div>
    </div>
  );
}

interface FloatingActionLoadingProps {
  message: string;
  className?: string;
}

export function FloatingActionLoading({ message, className }: FloatingActionLoadingProps) {
  return (
    <div className={cn("fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-sm", className)}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Zap className="h-5 w-5 text-yellow-500 animate-bounce" />
          <div className="absolute inset-0 animate-ping">
            <Zap className="h-5 w-5 text-yellow-400 opacity-50" />
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{message}</span>
      </div>
    </div>
  );
}

interface WaveLoadingProps {
  className?: string;
}

export function WaveLoading({ className }: WaveLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center space-x-1", className)}>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="w-2 h-8 bg-blue-600 rounded-full animate-pulse"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '1s',
          }}
        ></div>
      ))}
    </div>
  );
}