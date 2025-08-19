import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Activity, 
  Database, 
  Globe, 
  Clock, 
  Cpu, 
  HardDrive,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cachePerformance: {
    hitRate: number;
    totalEntries: number;
    memoryUsage: number;
  };
  apiHealth: {
    etherscan: SystemCheck;
    defiLlama: SystemCheck;
    database: SystemCheck;
  };
  scheduledJobs: {
    defiLlamaSync: SystemCheck;
    holderDataSync: SystemCheck;
    aiOutlookGeneration: SystemCheck;
    cleanup: SystemCheck;
  };
  errorRates: {
    last1Hour: number;
    last24Hours: number;
    critical: number;
  };
}

interface SystemCheck {
  name: string;
  status: 'up' | 'down' | 'warning' | 'unknown';
  responseTime?: number;
  lastCheck: number;
  error?: string;
  details?: any;
}

export default function AdminSystem() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/admin/system/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: environment } = useQuery({
    queryKey: ["/api/admin/system/environment"],
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: memory } = useQuery({
    queryKey: ["/api/admin/system/memory"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: performance } = useQuery({
    queryKey: ["/api/admin/system/performance"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const runHealthCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/system/check", { method: "POST" });
      if (!response.ok) throw new Error("Failed to run health check");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Health Check Complete",
        description: "System health check completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run system health check",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
      case 'healthy':
        return 'default';
      case 'warning':
      case 'degraded':
        return 'secondary';
      case 'down':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                System Status
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor system health, performance, and operational status
              </p>
            </div>
            <div className="flex items-center gap-3">
              {health && (
                <Badge variant={getStatusColor(health.overall) as any} className="flex items-center gap-2">
                  {getStatusIcon(health.overall)}
                  System {health.overall}
                </Badge>
              )}
              <Button
                onClick={() => runHealthCheckMutation.mutate()}
                disabled={runHealthCheckMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Run Health Check
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apis">API Status</TabsTrigger>
            <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health ? formatUptime(health.uptime) : "Loading..."}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Since last restart
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health ? `${health.memoryUsage.percentage.toFixed(1)}%` : "0%"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {health ? formatBytes(health.memoryUsage.used) : "0 B"} used
                  </p>
                  {health && (
                    <Progress value={health.memoryUsage.percentage} className="mt-2" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health ? `${health.cachePerformance.hitRate.toFixed(1)}%` : "0%"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {health?.cachePerformance.totalEntries || 0} entries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health?.errorRates.last1Hour || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Errors in last hour
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Environment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {environment && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Node.js Version:</span>
                        <span className="font-medium">{environment.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Environment:</span>
                        <Badge variant="outline">{environment.environment}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                        <span className="font-medium">{environment.platform} ({environment.arch})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">CPU Cores:</span>
                        <span className="font-medium">{environment.cpuCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Memory:</span>
                        <span className="font-medium">{environment.totalMemoryFormatted}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Memory Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {memory && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Heap Used:</span>
                        <span className="font-medium">{memory.formatted.heapUsed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Heap Total:</span>
                        <span className="font-medium">{memory.formatted.heapTotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">External:</span>
                        <span className="font-medium">{memory.formatted.external}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">RSS:</span>
                        <span className="font-medium">{memory.formatted.rss}</span>
                      </div>
                      <div className="pt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Heap Usage</span>
                          <span>{memory.percentages.heapUsage}%</span>
                        </div>
                        <Progress value={memory.percentages.heapUsage} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {health && Object.entries(health.apiHealth).map(([name, check]) => (
                <Card key={name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{name}</CardTitle>
                      <Badge variant={getStatusColor(check.status) as any}>
                        {getStatusIcon(check.status)}
                        {check.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {check.responseTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                        <span className="font-medium">{check.responseTime.toFixed(0)}ms</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                      <span className="font-medium">
                        {check.lastCheck ? new Date(check.lastCheck).toLocaleTimeString() : "Never"}
                      </span>
                    </div>
                    {check.error && (
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {check.error}
                      </div>
                    )}
                    {check.details && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {health && Object.entries(health.scheduledJobs).map(([name, job]) => (
                <Card key={name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </CardTitle>
                      <Badge variant={getStatusColor(job.status) as any}>
                        {getStatusIcon(job.status)}
                        {job.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                      <span className="font-medium">
                        {job.lastCheck ? new Date(job.lastCheck).toLocaleTimeString() : "Never"}
                      </span>
                    </div>
                    {job.error && (
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {job.error}
                      </div>
                    )}
                    {job.details && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {Object.entries(job.details).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    CPU Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {performance && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Execution Time:</span>
                        <span className="font-medium">{performance.cpuMetrics.executionTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Load Average:</span>
                        <span className="font-medium text-xs">
                          {performance.cpuMetrics.loadAverage.map((avg: number) => avg.toFixed(2)).join(', ')}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Memory Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {performance && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Usage:</span>
                        <span className="font-medium">{performance.memoryMetrics.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Used:</span>
                        <span className="font-medium">{formatBytes(performance.memoryMetrics.used)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Cache Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {performance && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                        <span className="font-medium">{performance.cacheMetrics.hitRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Entries:</span>
                        <span className="font-medium">{performance.cacheMetrics.totalEntries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Size:</span>
                        <span className="font-medium">{formatBytes(performance.cacheMetrics.memoryUsage)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}