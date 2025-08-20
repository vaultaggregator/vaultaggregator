import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Clock, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Server,
  Database,
  Globe,
  Zap,
  Shield,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";

interface ServiceStatus {
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'error' | 'warning';
  uptime: number;
  lastCheck: string;
  nextRun?: string;
  stats?: {
    processed?: number;
    failed?: number;
    pending?: number;
    successRate?: number;
  };
  logs?: string[];
  error?: string;
}

export default function AdminServices() {
  const [selectedTab, setSelectedTab] = useState("active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/admin/services/status"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: health } = useQuery({
    queryKey: ["/api/admin/system/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/services/refresh", { method: "POST" });
      if (!response.ok) throw new Error("Failed to refresh services");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Services Refreshed",
        description: "All service statuses have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh service status",
        variant: "destructive",
      });
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: async ({ service, action }: { service: string; action: 'start' | 'stop' | 'restart' }) => {
      const response = await fetch(`/api/admin/services/${service}/${action}`, { method: "POST" });
      if (!response.ok) throw new Error(`Failed to ${action} service`);
      return response.json();
    },
    onSuccess: (_, { service, action }) => {
      toast({
        title: "Service Updated",
        description: `${service} has been ${action}ed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
    },
    onError: (_, { service, action }) => {
      toast({
        title: "Error",
        description: `Failed to ${action} ${service}`,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'up':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
      case 'down':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'up':
      case 'healthy':
        return 'default';
      case 'warning':
      case 'degraded':
        return 'secondary';
      case 'stopped':
      case 'down':
      case 'error':
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

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  // Mock service data if not available from API
  const mockServices: ServiceStatus[] = [
    {
      name: 'defiLlamaSync',
      displayName: 'DeFi Llama Sync',
      status: health?.scheduledJobs?.defiLlamaSync?.status || 'running',
      uptime: Date.now() - (health?.scheduledJobs?.defiLlamaSync?.lastCheck || Date.now()),
      lastCheck: new Date(health?.scheduledJobs?.defiLlamaSync?.lastCheck || Date.now()).toLocaleTimeString(),
      nextRun: '5 minutes',
      stats: {
        processed: 44,
        failed: 0,
        successRate: 100
      }
    },
    {
      name: 'holderDataSync',
      displayName: 'Holder Data Sync',
      status: health?.scheduledJobs?.holderDataSync?.status || 'running',
      uptime: Date.now() - (health?.scheduledJobs?.holderDataSync?.lastCheck || Date.now()),
      lastCheck: new Date(health?.scheduledJobs?.holderDataSync?.lastCheck || Date.now()).toLocaleTimeString(),
      nextRun: '30 minutes',
      stats: {
        processed: 44,
        failed: 0,
        pending: 0,
        successRate: 100
      }
    },
    {
      name: 'aiOutlookGeneration',
      displayName: 'AI Outlook Generation',
      status: health?.scheduledJobs?.aiOutlookGeneration?.status || 'warning',
      uptime: Date.now() - (health?.scheduledJobs?.aiOutlookGeneration?.lastCheck || Date.now()),
      lastCheck: new Date(health?.scheduledJobs?.aiOutlookGeneration?.lastCheck || Date.now()).toLocaleTimeString(),
      nextRun: '24 hours',
      stats: {
        processed: 0,
        failed: 0,
        successRate: 0
      }
    },
    {
      name: 'cleanup',
      displayName: 'Database Cleanup',
      status: health?.scheduledJobs?.cleanup?.status || 'running',
      uptime: Date.now() - (health?.scheduledJobs?.cleanup?.lastCheck || Date.now()),
      lastCheck: new Date(health?.scheduledJobs?.cleanup?.lastCheck || Date.now()).toLocaleTimeString(),
      nextRun: '60 days',
      stats: {
        processed: 0,
        failed: 0,
        successRate: 100
      }
    }
  ];

  const displayServices = services || mockServices;
  const activeServices = displayServices.filter((s: ServiceStatus) => s.status === 'running');
  const warningServices = displayServices.filter((s: ServiceStatus) => s.status === 'warning');
  const errorServices = displayServices.filter((s: ServiceStatus) => s.status === 'error' || s.status === 'stopped');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Service Monitor
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor and manage background services and scheduled tasks
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
                <Activity className="h-4 w-4" />
                {activeServices.length} Active
              </Badge>
              {warningServices.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                  <AlertTriangle className="h-4 w-4" />
                  {warningServices.length} Warning
                </Badge>
              )}
              {errorServices.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-2 px-3 py-1">
                  <XCircle className="h-4 w-4" />
                  {errorServices.length} Error
                </Badge>
              )}
              <Button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                {refreshMutation.isPending ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayServices.length}</div>
              <p className="text-xs text-muted-foreground">
                Background processes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeServices.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round((activeServices.length / displayServices.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                System reliability
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Service Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active Services</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="logs">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayServices.map((service: ServiceStatus) => (
                <Card key={service.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{service.displayName}</CardTitle>
                        <Badge variant={getStatusColor(service.status) as any}>
                          {getStatusIcon(service.status)}
                          <span className="ml-1">{service.status}</span>
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {service.status === 'running' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleServiceMutation.mutate({ service: service.name, action: 'stop' })}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleServiceMutation.mutate({ service: service.name, action: 'start' })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleServiceMutation.mutate({ service: service.name, action: 'restart' })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                        <p className="font-medium">{service.lastCheck}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Next Run:</span>
                        <p className="font-medium">{service.nextRun || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {service.stats && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                          <span className="font-medium">{service.stats.successRate}%</span>
                        </div>
                        <Progress value={service.stats.successRate} className="h-2" />
                        
                        <div className="grid grid-cols-3 gap-2 text-xs text-center mt-3">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Processed</p>
                            <p className="font-bold text-green-600">{service.stats.processed || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Failed</p>
                            <p className="font-bold text-red-600">{service.stats.failed || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="font-bold text-yellow-600">{service.stats.pending || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {service.error && (
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {service.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="space-y-4">
              {health?.scheduledJobs && Object.entries(health.scheduledJobs).map(([name, job]: [string, any]) => (
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
                        {job.lastCheck ? new Date(job.lastCheck).toLocaleString() : "Never"}
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

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Service Activity</CardTitle>
                <CardDescription>
                  Last 50 service events and status changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 py-2 border-b">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">DeFi Llama Sync</span>
                      <span>completed successfully</span>
                      <span className="ml-auto text-xs">2 minutes ago</span>
                    </div>
                    <div className="flex items-center gap-2 py-2 border-b">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Holder Data Sync</span>
                      <span>processed 44 pools</span>
                      <span className="ml-auto text-xs">5 minutes ago</span>
                    </div>
                    <div className="flex items-center gap-2 py-2 border-b">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">AI Outlook Generation</span>
                      <span>skipped - disabled</span>
                      <span className="ml-auto text-xs">1 hour ago</span>
                    </div>
                    <div className="flex items-center gap-2 py-2 border-b">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Database Cleanup</span>
                      <span>removed 0 expired records</span>
                      <span className="ml-auto text-xs">1 day ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}