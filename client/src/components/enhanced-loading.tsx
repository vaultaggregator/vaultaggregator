import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, Activity, Zap, Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1000, prefix = "", suffix = "", className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

interface PoolScannerProps {
  isActive: boolean;
  poolsFound: number;
  totalScanned: number;
  currentProtocol?: string;
  className?: string;
}

export function PoolScanner({ isActive, poolsFound, totalScanned, currentProtocol, className }: PoolScannerProps) {
  if (!isActive) return null;

  return (
    <div className={cn("bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Database className="h-6 w-6 text-blue-600 animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <Database className="h-6 w-6 text-blue-400 opacity-30" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Scanning DeFi Protocols</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">Discovering new yield opportunities...</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                <AnimatedCounter value={poolsFound} />
              </div>
              <div className="text-xs text-gray-500">Found</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-blue-600">
                <AnimatedCounter value={totalScanned} />
              </div>
              <div className="text-xs text-gray-500">Scanned</div>
            </div>
          </div>
        </div>
      </div>
      
      {currentProtocol && (
        <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-md px-3 py-2">
          <Activity className="h-4 w-4 animate-bounce" />
          <span>Currently scanning: <strong>{currentProtocol}</strong></span>
        </div>
      )}
      
      <div className="mt-4 flex items-center space-x-2">
        <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
        <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        <span className="text-xs text-blue-600 dark:text-blue-400">In Progress</span>
      </div>
    </div>
  );
}

interface OperationStatusProps {
  operation: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
  progress?: number;
  className?: string;
}

export function OperationStatus({ operation, status, message, progress, className }: OperationStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'processing':
        return <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'processing':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    }
  };

  return (
    <div className={cn("flex items-center space-x-3 p-4 border rounded-lg", getStatusColor(), className)}>
      {getStatusIcon()}
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">{operation}</div>
        {message && (
          <div className="text-sm text-gray-600 dark:text-gray-400">{message}</div>
        )}
        {progress !== undefined && (
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DataSyncDashboardProps {
  operations: Array<{
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    progress?: number;
    message?: string;
  }>;
  className?: string;
}

export function DataSyncDashboard({ operations, className }: DataSyncDashboardProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700", className)}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Data Synchronization</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time yield data updates</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {operations.map((operation) => (
          <OperationStatus
            key={operation.id}
            operation={operation.name}
            status={operation.status}
            progress={operation.progress}
            message={operation.message}
          />
        ))}
      </div>
    </div>
  );
}

interface GlowingButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
  disabled?: boolean;
}

export function GlowingButton({ children, isActive = false, onClick, variant = 'primary', className, disabled }: GlowingButtonProps) {
  const getVariantClasses = () => {
    const base = "relative overflow-hidden transition-all duration-300 transform";
    
    switch (variant) {
      case 'primary':
        return `${base} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white`;
      case 'secondary':
        return `${base} bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white`;
      case 'success':
        return `${base} bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white`;
      case 'warning':
        return `${base} bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white`;
      case 'danger':
        return `${base} bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white`;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        getVariantClasses(),
        "px-6 py-3 rounded-lg font-medium shadow-lg",
        isActive && "animate-pulse shadow-2xl scale-105",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-white opacity-20 animate-ping rounded-lg"></div>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}