import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Clock, Settings, RefreshCw, Activity, Database, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ServiceStatus {
  id: string;
  name: string;
  type: 'scraper' | 'sync' | 'metrics' | 'healing';
  status: 'active' | 'error' | 'disabled' | 'unknown';
  lastRun: string | null;
  nextRun: string | null;
  interval: number; // minutes
  successRate: number;
  totalRuns: number;
  errorCount: number;
  lastError: string | null;
  description: string;
  poolsAffected?: number;
}

interface ServiceError {
  id: string;
  serviceId: string;
  timestamp: string;
  errorType: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

interface ServiceConfig {
  serviceId: string;
  interval: number;
  enabled: boolean;
}

export default function ServiceMonitor() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch service statuses
  const { data: services, isLoading: servicesLoading } = useQuery<ServiceStatus[]>({
    queryKey: ['/api/admin/services/status'],
    refetchInterval: 120000, // Refresh every 2 minutes (reduced from 30s for cost optimization)
  });

  // Fetch service errors
  const { data: errors } = useQuery<ServiceError[]>({
    queryKey: ['/api/admin/services/errors'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Update service configuration
  const updateConfigMutation = useMutation({
    mutationFn: async (config: ServiceConfig) => {
      const response = await fetch(`/api/admin/services/${config.serviceId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: config.interval, enabled: config.enabled }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service configuration');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Service configuration updated successfully",
        description: `Service will run every ${data.config.interval} minutes`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services/status'] });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update service configuration", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Trigger manual service run
  const triggerServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await fetch(`/api/admin/services/${serviceId}/trigger`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to trigger service');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service triggered successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services/status'] });
    },
    onError: () => {
      toast({ title: "Failed to trigger service", variant: "destructive" });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'disabled':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      error: "destructive",
      disabled: "secondary",
      unknown: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'scraper':
        return <Database className="w-4 h-4" />;
      case 'sync':
        return <RefreshCw className="w-4 h-4" />;
      case 'metrics':
        return <Activity className="w-4 h-4" />;
      case 'healing':
        return <Zap className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  const ServiceConfigDialog = ({ service }: { service: ServiceStatus }) => {
    const [interval, setInterval] = useState(service.interval);
    const [enabled, setEnabled] = useState(service.status !== 'disabled');

    const handleSave = () => {
      updateConfigMutation.mutate({
        serviceId: service.id,
        interval,
        enabled
      });
    };

    const formatInterval = (minutes: number) => {
      if (minutes >= 1440) {
        const days = Math.round(minutes / 1440);
        return `${days} day${days !== 1 ? 's' : ''}`;
      } else if (minutes >= 60) {
        const hours = Math.round(minutes / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" data-testid={`button-config-${service.id}`}>
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {service.displayName || service.name}</DialogTitle>
            <DialogDescription>
              Adjust the collection interval and enable/disable this service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="interval">Collection Interval (minutes)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="86400"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value))}
                data-testid="input-interval"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Current: Every {formatInterval(service.interval)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Common intervals: 5 min (real-time), 30 min (regular), 60 min (hourly), 1440 min (daily)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                data-testid="checkbox-enabled"
              />
              <Label htmlFor="enabled">Enable service</Label>
            </div>
            <div className="text-sm text-gray-600">
              <strong>Service:</strong> {service.description}
            </div>
            <Button 
              onClick={handleSave} 
              className="w-full" 
              data-testid="button-save-config"
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (servicesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading service status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Monitor</h1>
          <p className="text-muted-foreground">Monitor and configure data collection services</p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/services/status'] })}
          variant="outline"
          data-testid="button-refresh"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Log</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Service Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services?.map((service) => (
              <Card key={service.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getServiceTypeIcon(service.type)}
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    {getStatusIcon(service.status)}
                  </div>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(service.status)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interval</span>
                    <span className="text-sm font-medium">
                      {service.interval >= 1440 ? `${Math.round(service.interval / 1440)}d` : 
                       service.interval >= 60 ? `${Math.round(service.interval / 60)}h` : 
                       `${service.interval}m`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="text-sm font-medium">{service.successRate.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last Run</span>
                    <span className="text-sm">{formatTime(service.lastRun)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Next Run</span>
                    <span className="text-sm">{formatTime(service.nextRun)}</span>
                  </div>

                  {service.poolsAffected && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pools Affected</span>
                      <span className="text-sm font-medium">{service.poolsAffected}</span>
                    </div>
                  )}

                  {service.lastError && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Last Error: {service.lastError}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <ServiceConfigDialog service={service} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerServiceMutation.mutate(service.id)}
                      disabled={triggerServiceMutation.isPending}
                      data-testid={`button-trigger-${service.id}`}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Run Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Service errors from the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Error Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors?.slice(0, 20).map((error) => (
                    <TableRow key={error.id}>
                      <TableCell className="font-medium">
                        {services?.find(s => s.id === error.serviceId)?.name || error.serviceId}
                      </TableCell>
                      <TableCell>{formatTime(error.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant={error.severity === 'critical' ? 'destructive' : 'outline'}>
                          {error.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>{error.errorType}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {error.errorMessage}
                      </TableCell>
                      <TableCell>
                        <Badge variant={error.resolved ? 'default' : 'destructive'}>
                          {error.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services?.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{service.name} Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Runs</span>
                    <span className="font-medium">{service.totalRuns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Error Count</span>
                    <span className="font-medium text-red-600">{service.errorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-medium text-green-600">{service.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${service.successRate}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}