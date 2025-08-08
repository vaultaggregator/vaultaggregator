import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, MessageSquare, Brain, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/header";

interface UnknownQuery {
  id: string;
  question: string;
  timestamp: string;
  userContext: any;
  frequency: number;
  isResolved: boolean;
  adminNotes?: string;
}

interface KnowledgeStats {
  totalKnowledgeItems: number;
  activeKnowledgeItems: number;
  unknownQueries: number;
  unresolvedQueries: number;
  frequentlyAskedUnknown: UnknownQuery[];
}

export function KnowledgeCenterPage() {
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<KnowledgeStats>({
    queryKey: ["/api/admin/knowledge-stats"],
  });

  const { data: unknownQueries, isLoading: queriesLoading } = useQuery<UnknownQuery[]>({
    queryKey: ["/api/admin/unknown-queries"],
  });

  const resolveQueryMutation = useMutation({
    mutationFn: async ({ queryId, adminAnswer }: { queryId: string; adminAnswer: string }) => {
      await apiRequest(`/api/admin/resolve-query/${queryId}`, "POST", { adminAnswer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unknown-queries"] });
      setSelectedQuery(null);
      setAdminResponse("");
    },
  });

  const handleResolveQuery = (queryId: string) => {
    if (adminResponse.trim()) {
      resolveQueryMutation.mutate({ queryId, adminAnswer: adminResponse });
    }
  };

  if (statsLoading || queriesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const unresolvedQueries = unknownQueries?.filter(q => !q.isResolved) || [];
  const resolvedQueries = unknownQueries?.filter(q => q.isResolved) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Knowledge Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage companion intelligence and review user queries
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Items</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalKnowledgeItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeKnowledgeItems || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unknown Queries</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unknownQueries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total recorded queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unresolvedQueries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.frequentlyAskedUnknown?.[0]?.frequency || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Most frequent query
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="unresolved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unresolved" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Unresolved ({unresolvedQueries.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Resolved ({resolvedQueries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unresolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                Queries Needing Attention
              </CardTitle>
              <CardDescription>
                These user questions couldn't be answered by the companion. Review and provide responses to improve the knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {unresolvedQueries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>All queries resolved! Great job maintaining the knowledge base.</p>
                </div>
              ) : (
                unresolvedQueries
                  .sort((a, b) => b.frequency - a.frequency)
                  .map((query) => (
                    <Card key={query.id} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                              "{query.question}"
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDistanceToNow(new Date(query.timestamp), { addSuffix: true })}
                              </span>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Asked {query.frequency} time{query.frequency !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {selectedQuery === query.id ? (
                        <CardContent className="pt-0">
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                            <h4 className="font-medium mb-2">User Context:</h4>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                              {JSON.stringify(query.userContext, null, 2)}
                            </pre>
                          </div>
                          
                          <div className="space-y-3">
                            <label className="block text-sm font-medium">
                              Admin Response:
                            </label>
                            <Textarea
                              placeholder="Provide a helpful response that will improve the knowledge base..."
                              value={adminResponse}
                              onChange={(e) => setAdminResponse(e.target.value)}
                              className="min-h-[100px]"
                              data-testid={`textarea-response-${query.id}`}
                            />
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleResolveQuery(query.id)}
                                disabled={!adminResponse.trim() || resolveQueryMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`button-resolve-${query.id}`}
                              >
                                {resolveQueryMutation.isPending ? "Resolving..." : "Resolve Query"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedQuery(null);
                                  setAdminResponse("");
                                }}
                                data-testid={`button-cancel-${query.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      ) : (
                        <CardContent className="pt-0">
                          <Button 
                            onClick={() => setSelectedQuery(query.id)}
                            variant="outline"
                            className="w-full"
                            data-testid={`button-respond-${query.id}`}
                          >
                            Respond to Query
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Resolved Queries
              </CardTitle>
              <CardDescription>
                Previously unknown queries that have been addressed and resolved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resolvedQueries.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                  <p>No resolved queries yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resolvedQueries.map((query) => (
                    <Card key={query.id} className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                              "{query.question}"
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <span>
                                Asked {query.frequency} time{query.frequency !== 1 ? 's' : ''}
                              </span>
                              <span>
                                Resolved {formatDistanceToNow(new Date(query.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            {query.adminNotes && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  <strong>Admin Response:</strong> {query.adminNotes}
                                </p>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Resolved
                          </Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}