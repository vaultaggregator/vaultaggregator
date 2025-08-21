import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Download,
  RefreshCw,
  Eye,
  Filter,
  TrendingUp,
  AlertCircle,
  Bug,
  Database,
  Wifi,
  Shield,
  Server,
  Zap,
  ExternalLink,
  Calendar,
  User
} from "lucide-react";
import AdminHeader from "@/components/admin-header";
import { queryClient } from "@/lib/queryClient";

interface ErrorLog {
  id: string;
  title: string;
  description: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  count: number;
  isResolved: boolean;
  createdAt: string;
  lastOccurredAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  stackTrace?: string;
  fixPrompt: string;
  metadata?: any;
}

interface ErrorStats {
  total: number;
  unresolved: number;
  critical: number;
  high: number;
  byType: Record<string, number>;
}

const severityColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white'
};

const errorTypeIcons = {
  API: Wifi,
  Database: Database,
  Validation: AlertCircle,
  Service: Server,
  External: ExternalLink,
  Authentication: Shield
};

export default function AdminErrorManagement() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    resolved: '',
    source: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0
  });
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  // Fetch error statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ErrorStats>({
    queryKey: ["/api/admin/errors/stats"],
    refetchInterval: 30000,
  });

  // Fetch errors with filters
  const { data: errorsData, isLoading: errorsLoading, refetch: refetchErrors } = useQuery({
    queryKey: ["/api/admin/errors", filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());
      
      const response = await fetch(`/api/admin/errors?${params}`, {
        credentials: 'include'
      });
      return response.json();
    }
  });

  // Fetch unresolved errors
  const { data: unresolvedErrors } = useQuery({
    queryKey: ["/api/admin/errors/unresolved"],
    refetchInterval: 15000,
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async ({ errorId, resolvedBy }: { errorId: string; resolvedBy: string }) => {
      const response = await fetch(`/api/admin/errors/${errorId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/errors/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/errors/unresolved"] });
    }
  });

  // Export errors function
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/errors/export/${format}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      severity: '',
      resolved: '',
      source: '',
      search: ''
    });
  };

  const errorsList = errorsData?.errors || [];
  const totalErrors = errorsData?.totalCount || 0;
  const unresolvedList = Array.isArray(unresolvedErrors) ? unresolvedErrors : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Error Management Center
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Comprehensive error tracking, monitoring, and resolution system
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Error Logs
            </TabsTrigger>
            <TabsTrigger value="unresolved" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Unresolved ({unresolvedList?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-slate-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Errors</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.total || 0}</p>
                      </div>
                      <Bug className="w-8 h-8 text-slate-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Unresolved</p>
                        <p className="text-2xl font-bold text-red-600">{stats?.unresolved || 0}</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-600">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Critical</p>
                        <p className="text-2xl font-bold text-red-700">{stats?.critical || 0}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">High Priority</p>
                        <p className="text-2xl font-bold text-orange-600">{stats?.high || 0}</p>
                      </div>
                      <Zap className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Error Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Error Types Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.byType ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(stats.byType).map(([type, count]) => {
                      const IconComponent = errorTypeIcons[type as keyof typeof errorTypeIcons] || Bug;
                      return (
                        <div key={type} className="text-center p-4 border rounded-lg">
                          <IconComponent className="w-6 h-6 mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{type}</p>
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No error data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Error Logs Tab */}
          <TabsContent value="errors" className="space-y-6">
            {/* Filters and Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters & Actions
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('csv')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('json')}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetchErrors()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search errors..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      data-testid="input-error-search"
                    />
                  </div>
                  
                  <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger data-testid="select-severity-filter">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger data-testid="select-type-filter">
                      <SelectValue placeholder="Error Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                      <SelectItem value="Validation">Validation</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="External">External</SelectItem>
                      <SelectItem value="Authentication">Authentication</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.resolved} onValueChange={(value) => setFilters(prev => ({ ...prev, resolved: value }))}>
                    <SelectTrigger data-testid="select-resolved-filter">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="false">Unresolved</SelectItem>
                      <SelectItem value="true">Resolved</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error List */}
            <Card>
              <CardHeader>
                <CardTitle>Error Logs ({totalErrors} total)</CardTitle>
              </CardHeader>
              <CardContent>
                {errorsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse border rounded-lg p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : errorsList.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No errors found matching your filters</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errorsList.map((error: ErrorLog) => {
                      const IconComponent = errorTypeIcons[error.errorType as keyof typeof errorTypeIcons] || Bug;
                      return (
                        <div 
                          key={error.id} 
                          className={`border rounded-lg p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            error.severity === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 
                            error.severity === 'high' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <IconComponent className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                <h3 className="font-medium text-slate-900 dark:text-slate-100">{error.title}</h3>
                                <Badge className={severityColors[error.severity]}>
                                  {error.severity.toUpperCase()}
                                </Badge>
                                {error.count > 1 && (
                                  <Badge variant="secondary">
                                    {error.count}x
                                  </Badge>
                                )}
                                {error.isResolved ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Resolved
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Unresolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{error.description}</p>
                              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Server className="w-3 h-3" />
                                  {error.source}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(error.lastOccurredAt).toLocaleString()}
                                </span>
                                {error.resolvedBy && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    Resolved by {error.resolvedBy}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedError(error)}
                                    data-testid={`button-view-error-${error.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <IconComponent className="w-5 h-5" />
                                      {error.title}
                                      <Badge className={severityColors[error.severity]}>
                                        {error.severity.toUpperCase()}
                                      </Badge>
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Description</h4>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">{error.description}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Fix Instructions</h4>
                                      <p className="text-sm text-slate-600 dark:text-slate-400">{error.fixPrompt}</p>
                                    </div>
                                    {error.stackTrace && (
                                      <div>
                                        <h4 className="font-medium mb-2">Stack Trace</h4>
                                        <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto">
                                          {error.stackTrace}
                                        </pre>
                                      </div>
                                    )}
                                    {error.metadata && (
                                      <div>
                                        <h4 className="font-medium mb-2">Metadata</h4>
                                        <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto">
                                          {JSON.stringify(error.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {!error.isResolved && (
                                <Button
                                  size="sm"
                                  onClick={() => resolveErrorMutation.mutate({ 
                                    errorId: error.id, 
                                    resolvedBy: 'Admin' 
                                  })}
                                  disabled={resolveErrorMutation.isPending}
                                  data-testid={`button-resolve-error-${error.id}`}
                                >
                                  {resolveErrorMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalErrors > pagination.limit && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, totalErrors)} of {totalErrors} errors
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.offset === 0}
                        onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.offset + pagination.limit >= totalErrors}
                        onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unresolved Errors Tab */}
          <TabsContent value="unresolved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Unresolved Errors ({unresolvedList?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unresolvedList?.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">All errors have been resolved!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unresolvedList?.slice(0, 20).map((error: ErrorLog) => (
                      <div key={error.id} className="border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <h3 className="font-medium text-slate-900 dark:text-slate-100">{error.title}</h3>
                              <Badge className={severityColors[error.severity]}>
                                {error.severity.toUpperCase()}
                              </Badge>
                              {error.count > 1 && <Badge variant="secondary">{error.count}x</Badge>}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{error.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Last occurred: {new Date(error.lastOccurredAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => resolveErrorMutation.mutate({ 
                              errorId: error.id, 
                              resolvedBy: 'Admin' 
                            })}
                            disabled={resolveErrorMutation.isPending}
                            data-testid={`button-resolve-unresolved-${error.id}`}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Logs Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 mb-4">
                    System logging integration is being prepared
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    This will include application logs, performance metrics, and system events
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}