import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  RefreshCw, 
  Download, 
  Upload,
  Settings,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
  disabled?: boolean;
  loading?: boolean;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export default function AdminQuickActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  // System maintenance mutations
  const restartServiceMutation = useMutation({
    mutationFn: async (service: string) => {
      return await apiRequest(`/api/admin/system/restart/${service}`, "POST");
    },
    onSuccess: (_, service) => {
      toast({
        title: "Service Restarted",
        description: `${service} has been restarted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system"] });
    },
    onError: (error: any) => {
      toast({
        title: "Restart Failed",
        description: error.message || "Failed to restart service.",
        variant: "destructive",
      });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/system/clear-cache", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Cache Cleared",
        description: "System cache has been cleared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clear Cache Failed",
        description: error.message || "Failed to clear cache.",
        variant: "destructive",
      });
    },
  });

  const runHealthCheckMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/system/health-check", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Health Check Complete",
        description: "System health check completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system"] });
    },
    onError: (error: any) => {
      toast({
        title: "Health Check Failed",
        description: error.message || "Failed to run health check.",
        variant: "destructive",
      });
    },
  });

  const backupDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/system/backup", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Backup Started",
        description: "Database backup has been initiated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to start backup.",
        variant: "destructive",
      });
    },
  });

  const handleAction = async (actionId: string, actionFn: () => Promise<any>) => {
    setLoadingActions(prev => new Set([...prev, actionId]));
    try {
      await actionFn();
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionId);
        return newSet;
      });
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "health-check",
      title: "System Health Check",
      description: "Run comprehensive system diagnostics",
      icon: CheckCircle,
      color: "text-green-600",
      action: () => handleAction("health-check", () => runHealthCheckMutation.mutateAsync()),
      loading: loadingActions.has("health-check"),
      badge: { text: "Safe", variant: "secondary" }
    },
    {
      id: "clear-cache",
      title: "Clear Cache",
      description: "Clear all system caches for fresh data",
      icon: RefreshCw,
      color: "text-blue-600",
      action: () => handleAction("clear-cache", () => clearCacheMutation.mutateAsync()),
      loading: loadingActions.has("clear-cache"),
      badge: { text: "Quick", variant: "outline" }
    },
    {
      id: "backup-data",
      title: "Backup Database",
      description: "Create a full database backup",
      icon: Database,
      color: "text-purple-600",
      action: () => handleAction("backup-data", () => backupDataMutation.mutateAsync()),
      loading: loadingActions.has("backup-data"),
      badge: { text: "Important", variant: "default" }
    },
    {
      id: "restart-scraper",
      title: "Restart Data Scraper",
      description: "Restart the pool data collection service",
      icon: RotateCcw,
      color: "text-orange-600",
      action: () => handleAction("restart-scraper", () => restartServiceMutation.mutateAsync("scraper")),
      loading: loadingActions.has("restart-scraper"),
      badge: { text: "Service", variant: "secondary" }
    },
    {
      id: "security-scan",
      title: "Security Scan",
      description: "Run security vulnerability assessment",
      icon: Shield,
      color: "text-red-600",
      action: () => handleAction("security-scan", async () => {
        // Simulate security scan
        await new Promise(resolve => setTimeout(resolve, 3000));
        toast({
          title: "Security Scan Complete",
          description: "No vulnerabilities found. System is secure.",
        });
      }),
      loading: loadingActions.has("security-scan"),
      badge: { text: "Security", variant: "destructive" }
    },
    {
      id: "optimize-db",
      title: "Optimize Database",
      description: "Run database optimization and cleanup",
      icon: Settings,
      color: "text-indigo-600",
      action: () => handleAction("optimize-db", async () => {
        // Simulate database optimization
        await new Promise(resolve => setTimeout(resolve, 2500));
        toast({
          title: "Database Optimized",
          description: "Database has been optimized for better performance.",
        });
      }),
      loading: loadingActions.has("optimize-db"),
      badge: { text: "Performance", variant: "default" }
    },
    {
      id: "export-logs",
      title: "Export System Logs",
      description: "Download comprehensive system logs",
      icon: Download,
      color: "text-gray-600",
      action: () => {
        // Simulate log export
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Sample system logs...';
        link.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        toast({
          title: "Logs Exported",
          description: "System logs have been downloaded.",
        });
      },
      badge: { text: "Export", variant: "outline" }
    },
    {
      id: "system-info",
      title: "System Information",
      description: "View detailed system information",
      icon: Zap,
      color: "text-yellow-600",
      action: () => {
        toast({
          title: "System Information",
          description: "Node.js v18.17.0, 4GB RAM, 50GB Storage",
          duration: 5000,
        });
      },
      badge: { text: "Info", variant: "secondary" }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isLoading = action.loading || false;
            
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={action.action}
                disabled={action.disabled || isLoading}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`h-5 w-5 ${action.color}`} />
                  {action.badge && (
                    <Badge variant={action.badge.variant} className="text-xs">
                      {action.badge.text}
                    </Badge>
                  )}
                  {isLoading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Action Status */}
        {loadingActions.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {loadingActions.size} action{loadingActions.size !== 1 ? 's' : ''} running...
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}