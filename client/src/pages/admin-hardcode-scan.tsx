import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Search, 
  FileText, 
  Shield, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import AdminHeader from "@/components/admin-header";
import { useToast } from "@/hooks/use-toast";

interface HardcodeFinding {
  file: string;
  line: number;
  column: number;
  type: 'address' | 'url' | 'chainId' | 'timeConstant' | 'apiKey' | 'tokenSymbol';
  value: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

interface HardcodeReport {
  timestamp: string | null;
  totalFindings: number;
  severityCounts: Record<string, number>;
  findings: HardcodeFinding[];
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  message?: string;
}

export default function AdminHardcodeScan() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const { toast } = useToast();

  const { data: scanReport, isLoading, refetch } = useQuery<HardcodeReport>({
    queryKey: ["/api/admin/hardcode-scan"],
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const handleRunScan = async () => {
    try {
      toast({
        title: "Running Hardcode Scan",
        description: "This may take a few minutes...",
      });
      
      const response = await fetch("/api/admin/hardcode-scan/run", { method: "POST" });
      if (!response.ok) throw new Error("Failed to run scan");
      
      // Wait a moment then refresh the data
      setTimeout(() => {
        refetch();
        toast({
          title: "Scan Complete",
          description: "Hardcode scan finished successfully",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run hardcode scan",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'address': return '🏛️';
      case 'url': return '🌐';
      case 'chainId': return '⛓️';
      case 'timeConstant': return '⏱️';
      case 'apiKey': return '🔑';
      case 'tokenSymbol': return '💰';
      default: return '📄';
    }
  };

  const filteredFindings = scanReport?.findings?.filter(finding => 
    selectedSeverity === "all" || finding.severity === selectedSeverity
  ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <AdminHeader />
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading hardcode scan results...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="admin-hardcode-scan">
      <AdminHeader />
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="w-6 h-6" />
              Hardcode Scanner
            </h1>
            <p className="text-gray-600 mt-1">
              Scan codebase for hardcoded values and security issues
            </p>
          </div>
          <Button onClick={handleRunScan} data-testid="button-run-scan">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run New Scan
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-findings">
              {scanReport?.totalFindings || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-critical-count">
              {scanReport?.summary?.criticalCount || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-high-count">
              {scanReport?.summary?.highCount || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-medium-count">
              {scanReport?.summary?.mediumCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Scan Info */}
      {scanReport?.timestamp && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  Last scan: {new Date(scanReport.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Scanned {scanReport.totalFindings} items
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {scanReport?.message && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{scanReport.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hardcode Findings</CardTitle>
            <Tabs value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="high">High</TabsTrigger>
                <TabsTrigger value="medium">Medium</TabsTrigger>
                <TabsTrigger value="low">Low</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFindings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {scanReport?.totalFindings === 0 ? 
                "No hardcoded values found! 🎉" : 
                "No findings match the selected severity filter"
              }
            </div>
          ) : (
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Suggestion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFindings.map((finding, index) => (
                    <TableRow key={index} data-testid={`row-finding-${index}`}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {finding.file.replace('/home/runner/workspace/', '')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getTypeIcon(finding.type)}</span>
                          <span className="text-xs">{finding.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-48 truncate">
                        {finding.value}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(finding.severity)} data-testid={`badge-${finding.severity}`}>
                          {finding.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {finding.line}:{finding.column}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-64">
                        {finding.suggestion}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}