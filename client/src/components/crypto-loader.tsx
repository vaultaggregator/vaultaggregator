import { cn } from "@/lib/utils";
import { Bitcoin, DollarSign, TrendingUp, Activity, Zap } from "lucide-react";

interface CryptoLoaderProps {
  message?: string;
  className?: string;
}

export function CryptoLoader({ message = "Loading crypto data...", className }: CryptoLoaderProps) {
  const cryptoIcons = [Bitcoin, DollarSign, TrendingUp, Activity, Zap];

  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      {/* Floating crypto symbols */}
      <div className="relative w-32 h-32 mb-6">
        {cryptoIcons.map((Icon, index) => {
          const angle = (360 / cryptoIcons.length) * index;
          const radius = 40;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={index}
              className="absolute animate-bounce"
              style={{
                left: `50%`,
                top: `50%`,
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                animationDelay: `${index * 0.2}s`,
                animationDuration: '2s'
              }}
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          );
        })}
        
        {/* Central pulsing circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full animate-pulse shadow-xl flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
      
      {/* Loading message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{message}</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}

interface YieldSyncLoaderProps {
  poolsProcessed: number;
  totalPools: number;
  currentPool?: string;
  className?: string;
}

export function YieldSyncLoader({ poolsProcessed, totalPools, currentPool, className }: YieldSyncLoaderProps) {
  const percentage = totalPools > 0 ? Math.round((poolsProcessed / totalPools) * 100) : 0;

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-spin flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="absolute inset-0 w-10 h-10 border-2 border-green-300 rounded-full animate-ping"></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Syncing Yield Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fetching latest APY rates...</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{percentage}%</div>
          <div className="text-sm text-gray-500">{poolsProcessed}/{totalPools}</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
        <div 
          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {/* Current pool */}
      {currentPool && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Activity className="h-4 w-4 animate-pulse" />
          <span>Processing: {currentPool}</span>
        </div>
      )}
    </div>
  );
}

interface PulsingLoadCardProps {
  title: string;
  icon: React.ReactNode;
  className?: string;
}

export function PulsingLoadCard({ title, icon, className }: PulsingLoadCardProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse", className)}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg">
          {icon}
        </div>
        <span className="font-medium text-gray-600 dark:text-gray-400">{title}</span>
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded animate-pulse"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-2/3 animate-pulse"></div>
      </div>
    </div>
  );
}