import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Database, 
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Zap,
  Server,
  Network
} from "lucide-react";
import AdminHeader from "@/components/admin-header";

interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    incoming: number;
    outgoing: number;
  };
  responseTime: number;
  activeConnections: number;
  errors: number;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  condition: 'above' | 'below';
  status: 'active' | 'triggered' | 'resolved';
  lastTriggered?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ServiceUptime {
  service: string;
  uptime: number;
  status: 'up' | 'down' | 'degraded';
  lastCheck: string;
  responseTime: number;
  incidents: number;
}

export default function AdminMonitoring() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("1h");
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeData, setRealTimeData] = useState<SystemMetrics[]>([]);

  // Fetch current system metrics
  const { data: currentMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ["/api/admin/monitoring/current"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch historical metrics
  const { data: historicalData, refetch: refetchHistorical } = useQuery({
    queryKey: ["/api/admin/monitoring/metrics", { range: timeRange }],
  });

  // Fetch alert rules
  const { data: alertRules } = useQuery({
    queryKey: ["/api/admin/monitoring/alerts"],
  });

  // Fetch service uptime
  const { data: uptimeData } = useQuery({
    queryKey: ["/api/admin/monitoring/uptime"],
  });

  const metrics = currentMetrics as SystemMetrics | undefined;
  const historical = (historicalData as any)?.metrics || [];
  const alerts = (alertRules as any)?.rules || [];
  const services = (uptimeData as any)?.services || [];

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (metrics) {
        setRealTimeData(prev => {
          const newData = [...prev, {
            ...metrics,
            timestamp: new Date().toISOString()
          }];
          // Keep only last 60 data points for real-time chart
          return newData.slice(-60);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [metrics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMetrics(), refetchHistorical()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatUptime = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  const formatDuration = (ms: number) => {
    return `${ms}ms`;
  };

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                System Monitoring
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time system metrics, performance monitoring, and alerts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Current System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Cpu className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">
                      {metrics?.cpu?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">CPU Usage</p>
                  </div>
                </div>
                {(metrics?.cpu || 0) > 80 ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Progress value={metrics?.cpu || 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <HardDrive className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">
                      {metrics?.memory?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Memory</p>
                  </div>
                </div>
                {(metrics?.memory || 0) > 85 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Progress value={metrics?.memory || 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">
                      {metrics?.disk?.toFixed(1) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Disk Usage</p>
                  </div>
                </div>
                {(metrics?.disk || 0) > 90 ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Progress value={metrics?.disk || 0} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-foreground">
                      {metrics?.responseTime || 0}ms
                    </p>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                  </div>
                </div>
                {(metrics?.responseTime || 0) > 1000 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitoring Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="uptime">Uptime</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time System Load */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Real-time System Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={realTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tick={false} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                          formatter={(value: any) => [`${value.toFixed(1)}%`, '']}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="cpu" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="CPU"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="memory" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Memory"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Network Traffic */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-green-600" />
                    Network Traffic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tick={false} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                          formatter={(value: any, name: string) => [formatBytes(value), name === 'network.incoming' ? 'Incoming' : 'Outgoing']}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="network.incoming" 
                          stackId="1"
                          stroke="#3b82f6" 
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          name="Incoming"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="network.outgoing" 
                          stackId="1"
                          stroke="#10b981" 
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Outgoing"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Server className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {metrics?.activeConnections || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {alerts.filter((alert: AlertRule) => alert.status === 'triggered').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {formatDuration(metrics?.responseTime || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historical Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historical}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke="#3b82f6" 
                        name="CPU Usage (%)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memory" 
                        stroke="#10b981" 
                        name="Memory Usage (%)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="#f59e0b" 
                        name="Response Time (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Network Throughput</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historical.slice(-24)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => formatBytes(value)}
                        />
                        <Legend />
                        <Bar dataKey="network.incoming" fill="#3b82f6" name="Incoming" />
                        <Bar dataKey="network.outgoing" fill="#10b981" name="Outgoing" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connection Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{metrics?.activeConnections || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Connections</div>
                    </div>
                    <Wifi className="h-8 w-8 text-blue-600" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peak Connections:</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Connection Errors:</span>
                      <span className="font-medium">{metrics?.errors || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bandwidth Usage:</span>
                      <span className="font-medium">
                        {formatBytes((metrics?.network?.incoming || 0) + (metrics?.network?.outgoing || 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Rules & Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert: AlertRule) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`}
                        />
                        <div>
                          <div className="font-medium">{alert.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.metric} {alert.condition} {alert.threshold}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={alert.status === 'triggered' ? 'destructive' : 'outline'}>
                          {alert.status}
                        </Badge>
                        {alert.lastTriggered && (
                          <div className="text-sm text-muted-foreground">
                            Last: {new Date(alert.lastTriggered).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Uptime Tab */}
          <TabsContent value="uptime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Uptime Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service: ServiceUptime) => (
                    <div key={service.service} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === 'up' ? 'bg-green-600' : 
                          service.status === 'degraded' ? 'bg-yellow-600' : 'bg-red-600'
                        }`} />
                        <div>
                          <div className="font-medium capitalize">{service.service}</div>
                          <div className="text-sm text-muted-foreground">
                            Last check: {new Date(service.lastCheck).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatUptime(service.uptime)}</div>
                          <div className="text-xs text-muted-foreground">Uptime</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatDuration(service.responseTime)}</div>
                          <div className="text-xs text-muted-foreground">Response</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{service.incidents}</div>
                          <div className="text-xs text-muted-foreground">Incidents</div>
                        </div>
                        <Badge 
                          variant={service.status === 'up' ? 'default' : 
                                  service.status === 'degraded' ? 'secondary' : 'destructive'}
                          className={getStatusColor(service.status)}
                        >
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}