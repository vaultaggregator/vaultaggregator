import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { type ApiSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

function getHealthStatusIcon(status: string) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'unhealthy':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'down':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getHealthStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'unhealthy':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'down':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'blockchain':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'data':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'ai':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export default function AdminApiSettings() {
  const [toggleReasonMap, setToggleReasonMap] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiSettings, isLoading, error } = useQuery<ApiSettings[]>({
    queryKey: ['/api/api-settings'],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ serviceName, isEnabled, disabledReason }: { 
      serviceName: string; 
      isEnabled: boolean; 
      disabledReason?: string;
    }) => {
      return apiRequest(`/api/api-settings/${serviceName}/toggle`, 'PATCH', {
        isEnabled, 
        disabledReason 
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-settings'] });
      toast({
        title: "API Setting Updated",
        description: `${variables.serviceName} has been ${variables.isEnabled ? 'enabled' : 'disabled'}`,
      });
      setToggleReasonMap(prev => {
        const { [variables.serviceName]: _, ...rest } = prev;
        return rest;
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API setting",
        variant: "destructive",
      });
    },
  });

  const handleToggleApi = (serviceName: string, currentEnabled: boolean) => {
    if (currentEnabled) {
      // Disabling - ask for reason
      const reason = toggleReasonMap[serviceName] || '';
      if (!reason.trim()) {
        toast({
          title: "Reason Required",
          description: "Please provide a reason for disabling this API",
          variant: "destructive",
        });
        return;
      }
      toggleMutation.mutate({
        serviceName,
        isEnabled: false,
        disabledReason: reason,
      });
    } else {
      // Enabling - no reason needed
      toggleMutation.mutate({
        serviceName,
        isEnabled: true,
      });
    }
  };

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return 'Never';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleString();
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Error Loading API Settings</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="admin-api-settings-page">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">API Settings Management</h1>
      </div>
      
      <p className="text-muted-foreground mb-8">
        Manage external API connections and monitor their health status. Toggle services on/off and track their performance metrics.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading API settings...</span>
        </div>
      )}

      {!isLoading && apiSettings && (
        <div className="grid gap-6">
          {apiSettings.map((api) => (
            <Card key={api.serviceName} className="relative" data-testid={`api-card-${api.serviceName}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{api.displayName}</CardTitle>
                    <Badge variant="secondary" className={getCategoryColor(api.category || 'unknown')}>
                      {(api.category || 'Unknown').toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {getHealthStatusIcon(api.healthStatus || 'unknown')}
                      <Badge className={getHealthStatusColor(api.healthStatus || 'unknown')}>
                        {(api.healthStatus || 'Unknown').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={api.isEnabled}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => handleToggleApi(api.serviceName, api.isEnabled)}
                      data-testid={`api-toggle-${api.serviceName}`}
                    />
                    {toggleMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
                <CardDescription>{api.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Base URL</Label>
                    <p className="font-mono text-xs bg-muted p-2 rounded">
                      {api.baseUrl || 'Not configured'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Rate Limit</Label>
                    <p>{api.rateLimitRpm || 'N/A'} requests/min</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority</Label>
                    <p>Level {api.priority || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Last Health Check</Label>
                    <p>{formatDate(api.lastHealthCheck)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Error Count</Label>
                    <p>{api.errorCount || 0} errors</p>
                  </div>
                </div>

                {!api.isEnabled && api.disabledReason && (
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <Label className="text-red-700 dark:text-red-300 font-semibold">Disabled Reason:</Label>
                    <p className="text-red-600 dark:text-red-400 mt-1">{api.disabledReason}</p>
                    {api.disabledBy && api.disabledAt && (
                      <p className="text-red-500 dark:text-red-500 text-xs mt-2">
                        Disabled by {api.disabledBy} on {formatDate(api.disabledAt)}
                      </p>
                    )}
                  </div>
                )}

                {!api.isEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor={`reason-${api.serviceName}`}>Reason for disabling (required):</Label>
                    <Textarea
                      id={`reason-${api.serviceName}`}
                      placeholder="Enter reason for disabling this API..."
                      value={toggleReasonMap[api.serviceName] || ''}
                      onChange={(e) => setToggleReasonMap(prev => ({
                        ...prev,
                        [api.serviceName]: e.target.value
                      }))}
                      className="resize-none"
                      rows={2}
                      data-testid={`reason-input-${api.serviceName}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && apiSettings && apiSettings.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No API Settings Found</h3>
          <p className="text-muted-foreground">
            No API settings have been configured yet.
          </p>
        </div>
      )}
    </div>
  );
}