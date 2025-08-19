import { Wifi, WifiOff, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WebSocketStatusProps {
  isConnected: boolean;
  className?: string;
}

export function WebSocketStatus({ isConnected, className }: WebSocketStatusProps) {

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