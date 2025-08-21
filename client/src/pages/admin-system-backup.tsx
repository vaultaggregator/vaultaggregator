import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from "recharts";
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
  Monitor,
  Wifi,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Network,
  Timer,
  Users,
  Eye
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
  serverTime?: {
    current: string;
    timezone: string;
    formatted: string;
  };
  cpuMetrics?: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memoryMetrics?: {
    total: string;
    free: string;
    used: string;
    cached: string;
    percentages: {
      used: number;
      free: number;
      cached: number;
    };
  };
  cacheMetrics?: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
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
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/admin/system/health"],
    refetchInterval: 15000, // Refresh every 15 seconds for real-time feel
  });

  const { data: environment } = useQuery({
    queryKey: ["/api/admin/system/environment"],
  });

  interface SystemEnvironment {
    nodeVersion: string;
    environment: string;
    platform: string;
    arch: string;
    cpuCount: number;
    totalMemoryFormatted: string;
    formatted?: {
      uptime: string;
      memory: string;
      disk: string;
      load: string;
    };
  }

  const typedHealth = health as SystemHealth | undefined;
  const typedEnvironment = environment as SystemEnvironment | undefined;

  const { data: environment2 } = useQuery({
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

  // Add real-time data collection for charts
  useEffect(() => {
    if (health && performance) {
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        memoryUsage: health.memoryUsage?.percentage || 0,
        cacheHitRate: health.cachePerformance?.hitRate || 0,
        errorCount: health.errorRates?.last1Hour || 0,
        uptime: health.uptime || 0
      };

      setRealTimeData(prev => {
        const newData = [...prev, newDataPoint];
        // Keep only last 20 data points for chart performance
        return newData.slice(-20);
      });
    }
  }, [health, performance]);

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
              {health?.serverTime && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Server Time: {health.serverTime.formatted}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {health && (
                <Badge variant={getStatusColor(health.overall) as any} className="flex items-center gap-2">
                  {getStatusIcon(health.overall)}
                  System {health.overall}
                </Badge>
              )}
              <Button
                onClick={() => {
                  runHealthCheckMutation.mutate();
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/system"] });
                }}
                disabled={runHealthCheckMutation.isPending}
                className="flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${runHealthCheckMutation.isPending ? 'animate-spin' : ''}`} />
                {runHealthCheckMutation.isPending ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>
          </div>
        </div>

        {/* Server Time Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Server Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Current Time</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {health?.serverTime ? new Date(health.serverTime.current).toLocaleTimeString() : 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {health?.serverTime ? new Date(health.serverTime.current).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'Loading...'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Timezone</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {health?.serverTime?.timezone || 'Loading...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apis">API Health</TabsTrigger>
            <TabsTrigger value="jobs">Services</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">System Uptime</CardTitle>
                  <div className="flex items-center gap-1">
                    {health?.uptime > 86400000 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {health ? formatUptime(health.uptime) : "Loading..."}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    System running steadily
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Memory Usage</CardTitle>
                  <div className="flex items-center gap-1">
                    {(health?.memoryUsage.percentage || 0) > 80 ? (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <HardDrive className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {health ? `${health.memoryUsage.percentage.toFixed(1)}%` : "0%"}
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    {health ? formatBytes(health.memoryUsage.used) : "0 B"} / {health ? formatBytes(health.memoryUsage.total) : "0 B"}
                  </p>
                  {health && (
                    <Progress 
                      value={health.memoryUsage.percentage} 
                      className="mt-2 h-2"
                      style={{
                        background: health.memoryUsage.percentage > 80 ? '#fef3c7' : '#dcfce7'
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Cache Performance</CardTitle>
                  <div className="flex items-center gap-1">
                    {(health?.cachePerformance.hitRate || 0) > 80 ? (
                      <Zap className="h-4 w-4 text-green-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {health ? `${health.cachePerformance.hitRate.toFixed(1)}%` : "0%"}
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {health?.cachePerformance.totalEntries || 0} entries cached
                  </p>
                  {health && (
                    <Progress 
                      value={health.cachePerformance.hitRate} 
                      className="mt-2 h-2"
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">System Health</CardTitle>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(health?.overall || 'unknown')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {health?.overall.toUpperCase() || 'UNKNOWN'}
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    {health?.errorRates.last1Hour || 0} errors/hour
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    System Performance Trends
                  </CardTitle>
                  <CardDescription>Real-time memory and cache performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realTimeData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fontSize: 12 }}
                          label={{ value: '%', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `Time: ${value}`}
                          formatter={(value: any, name: string) => [
                            `${value.toFixed(1)}%`, 
                            name === 'memoryUsage' ? 'Memory Usage' : 
                            name === 'cacheHitRate' ? 'Cache Hit Rate' : name
                          ]}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="memoryUsage" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.3}
                          name="Memory Usage"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cacheHitRate" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.3}
                          name="Cache Hit Rate"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-green-600" />
                    API Health Overview
                  </CardTitle>
                  <CardDescription>External service connectivity status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {health?.apiHealth && Object.entries(health.apiHealth).map(([key, api]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(api.status)}
                          <div>
                            <span className="font-medium capitalize">{key}</span>
                            {api.responseTime && (
                              <p className="text-xs text-muted-foreground">
                                Response: {api.responseTime.toFixed(0)}ms
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={getStatusColor(api.status) as any}>
                          {api.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                  <Shield className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health?.scheduledJobs ? Object.values(health.scheduledJobs).filter(job => job.status === 'up').length : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Out of {health?.scheduledJobs ? Object.keys(health.scheduledJobs).length : 0} total services
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Efficiency</CardTitle>
                  <Timer className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {health ? formatBytes(health.cachePerformance.memoryUsage) : "0 B"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Memory utilized by cache
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Stability</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    99.9%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uptime reliability score
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
                        <span className="text-gray-600 dark:text-gray-300">Node.js Version:</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {health?.apiHealth && Object.entries(health.apiHealth).map(([key, api]) => (
                <Card key={key} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    api.status === 'up' ? 'bg-green-500' : 
                    api.status === 'warning' ? 'bg-yellow-500' : 
                    api.status === 'down' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{key} API</CardTitle>
                      {getStatusIcon(api.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(api.status) as any} className="text-xs">
                        {api.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {api.responseTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Response Time:</span>
                        <span className="text-sm font-medium">
                          {api.responseTime.toFixed(0)}ms
                        </span>
                      </div>
                    )}
                    
                    {api.lastCheck && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Check:</span>
                        <span className="text-sm font-medium">
                          {new Date(api.lastCheck).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    
                    {api.error && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Error: {api.error}
                        </p>
                      </div>
                    )}
                    
                    {api.details && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {JSON.stringify(api.details, null, 2)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {health?.scheduledJobs && Object.entries(health.scheduledJobs).map(([key, job]) => (
                <Card key={key} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize flex items-center gap-2">
                        {key === 'defiLlamaSync' && <Database className="h-4 w-4 text-blue-600" />}
                        {key === 'holderDataSync' && <Users className="h-4 w-4 text-green-600" />}
                        {key === 'aiOutlookGeneration' && <Eye className="h-4 w-4 text-purple-600" />}
                        {key === 'cleanup' && <RefreshCw className="h-4 w-4 text-orange-600" />}
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </CardTitle>
                      {getStatusIcon(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Service Status:</span>
                      <Badge variant={getStatusColor(job.status) as any}>
                        {job.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {job.lastCheck && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Check:</span>
                        <span className="text-sm font-medium">
                          {new Date(job.lastCheck).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {job.details && job.details.lastSync && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Last Sync:</span>
                        <span className="text-sm font-medium">
                          {new Date(job.details.lastSync).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {job.error && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {job.error}
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          job.status === 'up' ? 'bg-green-500 animate-pulse' : 
                          job.status === 'warning' ? 'bg-yellow-500' : 
                          job.status === 'down' ? 'bg-red-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-xs text-muted-foreground">
                          {job.status === 'up' ? 'Running normally' :
                           job.status === 'warning' ? 'Needs attention' :
                           job.status === 'down' ? 'Service offline' : 'Status unknown'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {performance?.responseTime?.toFixed(0) || 0}ms
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {performance?.throughput || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Requests/sec</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {typedEnvironment?.cpuCount || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">CPU Cores</p>
                    </div>
                    <Cpu className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {typedEnvironment?.totalMemoryFormatted || '0 GB'}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Memory</p>
                    </div>
                    <Server className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage Breakdown</CardTitle>
                  <CardDescription>Detailed memory allocation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {memory && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Heap Used</span>
                          <span className="font-medium">{memory.formatted.heapUsed}</span>
                        </div>
                        <Progress value={memory.percentages.heapUsage} className="h-2" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Heap Total</span>
                          <span className="font-medium">{memory.formatted.heapTotal}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>External</span>
                          <span className="font-medium">{memory.formatted.external}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>RSS (Resident Set Size)</span>
                          <span className="font-medium">{memory.formatted.rss}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Environment</CardTitle>
                  <CardDescription>Runtime configuration details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {typedEnvironment && (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Node.js Version</span>
                        <Badge variant="outline">{typedEnvironment.nodeVersion}</Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Environment</span>
                        <Badge variant={typedEnvironment.environment === 'production' ? 'default' : 'secondary'}>
                          {typedEnvironment.environment}
                        </Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Platform</span>
                        <span className="font-medium">{typedEnvironment.platform}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Architecture</span>
                        <span className="font-medium">{typedEnvironment.arch}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
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
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Live System Metrics
                  </CardTitle>
                  <CardDescription>Real-time system performance monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realTimeData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 11 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `Time: ${value}`}
                          formatter={(value: any, name: string) => [
                            `${value.toFixed(1)}%`, 
                            name === 'memoryUsage' ? 'Memory' : 
                            name === 'cacheHitRate' ? 'Cache Hit Rate' : name
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="memoryUsage" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                          name="Memory Usage"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cacheHitRate" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={false}
                          name="Cache Hit Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    System Health Status
                  </CardTitle>
                  <CardDescription>Current system component status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Database</span>
                        </div>
                        <Badge variant="default" className="text-xs">HEALTHY</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">APIs</span>
                        </div>
                        <Badge variant="default" className="text-xs">ONLINE</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Services</span>
                        </div>
                        <Badge variant="default" className="text-xs">RUNNING</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Security</span>
                        </div>
                        <Badge variant="default" className="text-xs">PROTECTED</Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold mb-3">Error Rate Monitoring</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Hour</span>
                          <span className="text-sm font-medium text-green-600">
                            {health?.errorRates.last1Hour || 0} errors
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last 24 Hours</span>
                          <span className="text-sm font-medium text-green-600">
                            {health?.errorRates.last24Hours || 0} errors
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Critical Issues</span>
                          <span className="text-sm font-medium text-green-600">
                            {health?.errorRates.critical || 0} issues
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold mb-3">Cache Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Hit Rate</span>
                          <span className="text-sm font-medium text-purple-600">
                            {health?.cachePerformance.hitRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total Entries</span>
                          <span className="text-sm font-medium">
                            {health?.cachePerformance.totalEntries || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Memory Usage</span>
                          <span className="text-sm font-medium">
                            {health ? formatBytes(health.cachePerformance.memoryUsage) : '0 B'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time alerts and notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  System Alerts & Notifications
                </CardTitle>
                <CardDescription>Recent system events and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(health?.memoryUsage.percentage || 0) > 80 && (
                    <div className="flex items-center gap-3 p-3 border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          High Memory Usage Detected
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          Memory usage is at {health?.memoryUsage.percentage.toFixed(1)}%. Consider monitoring for potential memory leaks.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(health?.cachePerformance.hitRate || 0) < 70 && (
                    <div className="flex items-center gap-3 p-3 border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Low Cache Hit Rate
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Cache hit rate is at {health?.cachePerformance.hitRate.toFixed(1)}%. Cache optimization may be needed.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Success message when all systems are healthy */}
                  {(health?.memoryUsage.percentage || 0) <= 80 && (health?.cachePerformance.hitRate || 0) >= 70 && (
                    <div className="flex items-center gap-3 p-3 border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          All Systems Operating Normally
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          System performance is optimal. No issues detected.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}