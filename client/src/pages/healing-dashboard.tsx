/**
 * Self-Healing System Dashboard
 * Real-time monitoring of the application's self-healing capabilities
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Activity, CheckCircle, XCircle, Clock } from "lucide-react";

export default function HealingDashboard() {
  const { toast } = useToast();

  // Fetch healing statistics
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["/api/healing/stats"],
    refetchInterval: 5000 // Auto-refresh every 5 seconds
  });

  // Fetch healing history
  const { data: history } = useQuery({
    queryKey: ["/api/healing/history"],
    refetchInterval: 5000
  });

  // Trigger test healing
  const triggerTest = async (simulateError: boolean) => {
    try {
      const response = await fetch("/api/healing/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: "test", simulateError })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Completed",
          description: simulateError 
            ? "Self-healing test with simulated error completed" 
            : "Normal operation test completed",
          variant: "default"
        });
      } else {
        throw new Error(result.error);
      }
      
      // Refresh stats
      queryClient.invalidateQueries({ queryKey: ["/api/healing/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/healing/history"] });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      </div>
    );
  }

  const statsData = (stats as any)?.data || {
    totalAttempts: 0,
    successfulHeals: 0,
    failedHeals: 0,
    successRate: "N/A",
    byService: {},
    recentHistory: []
  };

  const historyData = (history as any)?.data || { recentHistory: [], totalAttempts: 0 };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Self-Healing System Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and test the application's automatic error recovery system
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Healing attempts made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Successful Heals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsData.successfulHeals}
            </div>
            <p className="text-xs text-muted-foreground">Errors recovered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Heals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsData.failedHeals}
            </div>
            <p className="text-xs text-muted-foreground">Unrecoverable errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.successRate}</div>
            <p className="text-xs text-muted-foreground">Recovery effectiveness</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
          <CardDescription>Healing attempts by service</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(statsData.byService).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(statsData.byService).map(([service, data]: [string, any]) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{service}</span>
                  </div>
                  <div className="flex gap-4">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {data.success} successful
                    </Badge>
                    <Badge variant="destructive">
                      {data.failed} failed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No healing attempts yet</p>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Self-Healing</CardTitle>
          <CardDescription>Trigger test scenarios to see self-healing in action</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => triggerTest(true)}
              variant="outline"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Test with Error
            </Button>
            <Button 
              onClick={() => triggerTest(false)}
              variant="outline"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Test Normal Operation
            </Button>
            <Button 
              onClick={() => refetch()}
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Healing History</CardTitle>
          <CardDescription>Last 10 healing attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {historyData.recentHistory.length > 0 ? (
            <div className="space-y-2">
              {historyData.recentHistory.map((entry: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {entry.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{entry.service}</div>
                      <div className="text-sm text-gray-500">{entry.error}</div>
                      {entry.strategy && (
                        <div className="text-xs text-blue-600 mt-1">
                          Strategy: {entry.strategy}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.attempts} attempt{entry.attempts !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No healing attempts recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}