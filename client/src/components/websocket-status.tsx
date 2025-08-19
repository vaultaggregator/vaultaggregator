import { Wifi, WifiOff, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WebSocketStatusProps {
  isConnected: boolean;
  lastUpdate: number | null;
  className?: string;
}

export function WebSocketStatus({ isConnected, lastUpdate, className }: WebSocketStatusProps) {
  const getLastUpdateText = () => {
    if (!lastUpdate) return "Never";
    const now = Date.now();
    const diffMs = now - lastUpdate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return "1h+ ago";
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={cn(
          "text-xs px-2 py-1 flex items-center space-x-1 transition-all duration-200",
          isConnected 
            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800" 
            : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800"
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
            <span>Offline</span>
          </>
        )}
      </Badge>
      
      {lastUpdate && (
        <span className="text-xs text-muted-foreground hidden sm:inline" data-testid="websocket-last-update">
          Updated {getLastUpdateText()}
        </span>
      )}
    </div>
  );
}