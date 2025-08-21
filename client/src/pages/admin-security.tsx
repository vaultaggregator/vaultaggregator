import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  Ban, 
  Key,
  Activity,
  Globe,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";
import { apiRequest } from "@/lib/queryClient";

interface SecuritySettings {
  twoFactorRequired: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireEmailVerification: boolean;
  allowedIpRanges: string[];
  blockedIpRanges: string[];
}

interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failed' | 'password_changed' | 'account_locked' | 'suspicious_activity';
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

interface ActiveSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  createdAt: string;
  lastActivity: string;
  isCurrentSession: boolean;
}

interface SecurityStats {
  totalSessions: number;
  activeSessions: number;
  failedLoginsToday: number;
  lockedAccounts: number;
  criticalAlerts: number;
  suspiciousActivity: number;
}

export default function AdminSecurity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Fetch security settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/security/settings"],
  });

  // Fetch security events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/admin/security/events", { 
      search: searchTerm || undefined,
      type: eventTypeFilter !== "all" ? eventTypeFilter : undefined,
      severity: severityFilter !== "all" ? severityFilter : undefined
    }],
  });

  // Fetch active sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/admin/security/sessions"],
  });

  // Fetch security statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/security/stats"],
  });

  const securitySettings = settings as SecuritySettings | undefined;
  const securityEvents = (eventsData as any)?.events || [];
  const activeSessions = (sessionsData as any)?.sessions || [];
  const securityStats = stats as SecurityStats | undefined;

  // Update security settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SecuritySettings>) => {
      return await apiRequest("/api/admin/security/settings", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/settings"] });
      toast({
        title: "Settings Updated",
        description: "Security settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update security settings.",
        variant: "destructive",
      });
    },
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest(`/api/admin/security/sessions/${sessionId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/security/sessions"] });
      toast({
        title: "Session Terminated",
        description: "User session has been terminated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to terminate session.",
        variant: "destructive",
      });
    },
  });

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'login_failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'password_changed': return <Key className="h-4 w-4 text-blue-600" />;
      case 'account_locked': return <Ban className="h-4 w-4 text-orange-600" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const updateSetting = (key: keyof SecuritySettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Security Center
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor security events, manage sessions, and configure security policies
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Logs
              </Button>
              <Button className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Scan
              </Button>
            </div>
          </div>
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {securityStats?.activeSessions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {securityStats?.failedLoginsToday || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed Logins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {securityStats?.lockedAccounts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Locked Accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {securityStats?.suspiciousActivity || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Suspicious</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {securityStats?.criticalAlerts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {securityStats?.totalSessions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Critical Security Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {securityEvents
                    .filter((event: SecurityEvent) => event.severity === 'critical')
                    .slice(0, 5)
                    .map((event: SecurityEvent) => (
                      <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getEventIcon(event.type)}
                        <div className="flex-1">
                          <div className="font-medium">{event.details}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.username} • {formatDate(event.timestamp)}
                          </div>
                        </div>
                        <Badge variant={getSeverityBadgeVariant(event.severity) as any}>
                          {event.severity}
                        </Badge>
                      </div>
                    ))}
                  {securityEvents.filter((event: SecurityEvent) => event.severity === 'critical').length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No critical alerts
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Security Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {securityEvents.slice(0, 5).map((event: SecurityEvent) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getEventIcon(event.type)}
                      <div className="flex-1">
                        <div className="font-medium">{event.details}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.username} • {formatDate(event.timestamp)}
                        </div>
                      </div>
                      <Badge variant={getSeverityBadgeVariant(event.severity) as any}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Event Log</CardTitle>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <select 
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">All Events</option>
                      <option value="login_success">Login Success</option>
                      <option value="login_failed">Login Failed</option>
                      <option value="password_changed">Password Changed</option>
                      <option value="account_locked">Account Locked</option>
                      <option value="suspicious_activity">Suspicious Activity</option>
                    </select>
                    <select 
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {securityEvents.map((event: SecurityEvent) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEventIcon(event.type)}
                              <div>
                                <div className="font-medium">{event.details}</div>
                                <div className="text-sm text-muted-foreground">{event.type}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{event.username}</TableCell>
                          <TableCell>{event.ipAddress}</TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>
                            <Badge variant={getSeverityBadgeVariant(event.severity) as any}>
                              {event.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(event.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active User Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeSessions.map((session: ActiveSession) => (
                        <TableRow key={session.id} className={session.isCurrentSession ? "bg-blue-50 dark:bg-blue-950" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {session.username}
                              {session.isCurrentSession && (
                                <Badge variant="outline" className="text-xs">Current</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{session.ipAddress}</TableCell>
                          <TableCell>{session.location}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {session.userAgent.split(' ')[0]}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(session.createdAt)}</TableCell>
                          <TableCell>{formatDate(session.lastActivity)}</TableCell>
                          <TableCell>
                            {!session.isCurrentSession && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => terminateSessionMutation.mutate(session.id)}
                                disabled={terminateSessionMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Require Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
                    </div>
                    <Switch
                      checked={securitySettings?.twoFactorRequired || false}
                      onCheckedChange={(checked) => updateSetting('twoFactorRequired', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Email Verification Required</Label>
                      <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                    </div>
                    <Switch
                      checked={securitySettings?.requireEmailVerification || false}
                      onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Password Length</Label>
                    <Input
                      type="number"
                      value={securitySettings?.passwordMinLength || 8}
                      onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                      min="6"
                      max="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings?.sessionTimeout || 30}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="1440"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={securitySettings?.maxLoginAttempts || 5}
                      onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                      min="3"
                      max="20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Lockout Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={securitySettings?.lockoutDuration || 15}
                      onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                      min="1"
                      max="1440"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Allowed IP Ranges</Label>
                    <Input
                      placeholder="192.168.1.0/24, 10.0.0.0/8"
                      value={securitySettings?.allowedIpRanges?.join(', ') || ''}
                      onChange={(e) => updateSetting('allowedIpRanges', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to allow all IPs. Use CIDR notation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Blocked IP Ranges</Label>
                    <Input
                      placeholder="192.168.100.0/24, 172.16.0.0/12"
                      value={securitySettings?.blockedIpRanges?.join(', ') || ''}
                      onChange={(e) => updateSetting('blockedIpRanges', e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Block specific IP ranges. Use CIDR notation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}