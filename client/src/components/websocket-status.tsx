import { Wifi, WifiOff, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRealtimeApy } from "@/hooks/useRealtimeApy";

interface WebSocketStatusProps {
  variant?: 'badge' | 'minimal' | 'compact';
  showTime?: boolean;
  className?: string;
}

export function WebSocketStatus({ variant = 'badge', showTime = false, className }: WebSocketStatusProps) {
  const { isConnected, lastUpdate } = useRealtimeApy();

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`} />
        <span className={`text-xs font-medium ${isConnected ? "text-green-600" : "text-orange-600"}`}>
          {isConnected ? "Live" : "..."}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-2 text-xs", className)}>
        <Activity size={10} className={isConnected ? "text-green-500 animate-pulse" : "text-orange-500"} />
        <span className={`font-medium ${isConnected ? "text-green-600" : "text-orange-600"}`}>
          {isConnected ? "Live Data" : "Connecting"}
        </span>
        {showTime && lastUpdate && (
          <span className="text-xs text-muted-foreground">
            {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge 
      variant={isConnected ? "default" : "destructive"}
      className={cn(
        "text-xs px-2 py-1 flex items-center space-x-1 transition-all duration-200",
        isConnected 
          ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800" 
          : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800",
        className
      )}
      data-testid="websocket-status-badge"
    >
      {isConnected ? (
        <>
          <Activity size={12} className="animate-pulse" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff size={12} />
          <span>Disconnected</span>
        </>
      )}
    </Badge>
  );
}