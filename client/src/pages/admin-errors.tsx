import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Bug, 
  Database, 
  Globe, 
  Shield, 
  Settings, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle,
  Zap,
  Filter,
  Search,
  TrendingUp,
  AlertOctagon
} from "lucide-react";
import AdminHeader from "@/components/admin-header";
import { formatTimeAgo } from "@/lib/utils";

interface ErrorLog {
  id: string;
  title: string;
  description: string;
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  stackTrace?: string;
  fixPrompt: string;
  metadata?: any;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  occurredAt: string;
  lastOccurredAt: string;
  count: number;
}

interface ErrorStats {
  total: number;
  unresolved: number;
  critical: number;
  high: number;
  byType: Record<string, number>;
}

export default function AdminErrors() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  // Fetch error logs
  const { data: errors = [], isLoading: errorsLoading } = useQuery<ErrorLog[]>({
    queryKey: ['/api/admin/errors', filterType, filterSeverity, showResolved],
    staleTime: 10000, // 10 seconds
  });

  // Fetch error statistics
  const { data: stats } = useQuery<ErrorStats>({
    queryKey: ['/api/admin/errors/stats'],
    staleTime: 30000, // 30 seconds
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      return apiRequest('POST', `/api/admin/errors/${errorId}/resolve`, { 
        resolvedBy: (user as any)?.username || 'admin' 
      });
    },
    onSuccess: () => {
      toast({
        title: "Error Resolved",
        description: "Error has been marked as resolved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/errors/stats'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve error.",
        variant: "destructive"
      });
    }
  });

  // Copy prompt to clipboard
  const copyPrompt = (prompt: string, title: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Prompt Copied! 📋",
      description: `Fix prompt for "${title}" copied to clipboard. Paste it in the chat to get help fixing this error.`,
      duration: 3000,
    });
  };

  // Get severity icon and color
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { 
          icon: AlertOctagon, 
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        };
      case 'high':
        return { 
          icon: AlertTriangle, 
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        };
      case 'medium':
        return { 
          icon: AlertCircle, 
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        };
      case 'low':
        return { 
          icon: Clock, 
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        };
      default:
        return { 
          icon: AlertCircle, 
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
        };
    }
  };

  // Get error type icon
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'api': return Globe;
      case 'database': return Database;
      case 'validation': return Shield;
      case 'service': return Settings;
      case 'external': return Zap;
      case 'authentication': return Shield;
      default: return Bug;
    }
  };

  // Filter errors
  const filteredErrors = errors.filter(error => {
    const matchesType = filterType === "all" || error.errorType.toLowerCase() === filterType.toLowerCase();
    const matchesSeverity = filterSeverity === "all" || error.severity === filterSeverity;
    const matchesSearch = !searchTerm || 
      error.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResolved = showResolved || !error.isResolved;
    
    return matchesType && matchesSeverity && matchesSearch && matchesResolved;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🚨 Error Management Center
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Creative error tracking with AI-powered fix prompts. Click the copy button to get instant help!
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Critical & High</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {stats.critical + stats.high}
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">Needs immediate attention</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Unresolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats.unresolved}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">Active issues</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.total}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">API Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.byType.API || 0}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">External services</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter Errors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search errors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showResolved ? "default" : "outline"}
                onClick={() => setShowResolved(!showResolved)}
                className="whitespace-nowrap"
              >
                {showResolved ? "Hide" : "Show"} Resolved
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error List */}
        <div className="space-y-4">
          {errorsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading errors...</p>
            </div>
          ) : filteredErrors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || filterType !== "all" || filterSeverity !== "all" 
                    ? "No matching errors found" 
                    : "No errors found!"
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterType !== "all" || filterSeverity !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Your application is running smoothly with no logged errors."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredErrors.map((error) => {
              const severityConfig = getSeverityConfig(error.severity);
              const TypeIcon = getTypeIcon(error.errorType);
              const SeverityIcon = severityConfig.icon;

              return (
                <Card key={error.id} className={`${severityConfig.bgColor} ${error.isResolved ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${severityConfig.color}`}>
                          <SeverityIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {error.title}
                            </h3>
                            <Badge variant={error.severity === 'critical' ? 'destructive' : error.severity === 'high' ? 'secondary' : 'outline'}>
                              {error.severity}
                            </Badge>
                            <Badge variant="outline">
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {error.errorType}
                            </Badge>
                            {error.count > 1 && (
                              <Badge variant="outline">
                                {error.count}x
                              </Badge>
                            )}
                            {error.isResolved && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {error.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Source: {error.source}</span>
                            <span>First: {formatTimeAgo(error.occurredAt)}</span>
                            <span>Last: {formatTimeAgo(error.lastOccurredAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPrompt(error.fixPrompt, error.title)}
                          className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Fix Prompt
                        </Button>
                        {!error.isResolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveErrorMutation.mutate(error.id)}
                            disabled={resolveErrorMutation.isPending}
                            className="bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Expandable details */}
                  <CardContent className="pt-0">
                    <Tabs defaultValue="prompt" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="prompt">Fix Prompt</TabsTrigger>
                        <TabsTrigger value="metadata">Details</TabsTrigger>
                        <TabsTrigger value="stack">Technical</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="prompt" className="mt-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {error.fixPrompt}
                          </p>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="metadata" className="mt-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                          {error.metadata ? (
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {JSON.stringify(error.metadata, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No additional details available</p>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="stack" className="mt-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                          {error.stackTrace ? (
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                              {error.stackTrace}
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No stack trace available</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}