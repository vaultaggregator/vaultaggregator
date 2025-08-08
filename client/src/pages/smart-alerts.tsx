import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Bell, Plus, Settings, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserAlert {
  id: string;
  userId: string;
  poolId: string;
  alertType: string;
  condition: string;
  targetValue: string;
  currentValue: string;
  message: string;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
}

interface AlertNotification {
  id: string;
  alertId: string;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

export default function SmartAlerts() {
  const [userId] = useState('demo-user-123'); // In real app, get from auth context
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState({
    poolId: '',
    alertType: 'apy_change',
    condition: 'above',
    targetValue: '',
    message: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/users', userId, 'alerts'],
    queryFn: () => apiRequest(`/api/users/${userId}/alerts`)
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/users', userId, 'notifications'],
    queryFn: () => apiRequest(`/api/users/${userId}/notifications`)
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData: any) => apiRequest(`/api/users/${userId}/alerts`, {
      method: 'POST',
      body: JSON.stringify(alertData),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'alerts'] });
      setIsCreating(false);
      setNewAlert({
        poolId: '',
        alertType: 'apy_change',
        condition: 'above',
        targetValue: '',
        message: ''
      });
      toast({
        title: "Alert Created",
        description: "Your smart alert has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create alert. Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ alertId, isActive }: { alertId: string; isActive: boolean }) =>
      apiRequest(`/api/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'alerts'] });
      toast({
        title: "Alert Updated",
        description: "Alert status has been updated."
      });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'notifications'] });
    }
  });

  const handleCreateAlert = () => {
    if (!newAlert.poolId || !newAlert.targetValue) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    createAlertMutation.mutate({
      ...newAlert,
      userId,
      currentValue: "0" // Will be updated by the system
    });
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'apy_change':
        return <TrendingUp className="h-4 w-4" />;
      case 'tvl_change':
        return <TrendingDown className="h-4 w-4" />;
      case 'risk_level':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Smart Alerts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up intelligent alerts for yield pool changes
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          data-testid="button-create-alert"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Set up conditions for when you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="poolId">Pool ID</Label>
                <Input
                  id="poolId"
                  data-testid="input-alert-pool-id"
                  value={newAlert.poolId}
                  onChange={(e) => setNewAlert({ ...newAlert, poolId: e.target.value })}
                  placeholder="Enter pool ID to monitor"
                />
              </div>
              <div>
                <Label htmlFor="alertType">Alert Type</Label>
                <Select
                  value={newAlert.alertType}
                  onValueChange={(value) => setNewAlert({ ...newAlert, alertType: value })}
                >
                  <SelectTrigger data-testid="select-alert-type">
                    <SelectValue placeholder="Select alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apy_change">APY Change</SelectItem>
                    <SelectItem value="tvl_change">TVL Change</SelectItem>
                    <SelectItem value="risk_level">Risk Level Change</SelectItem>
                    <SelectItem value="price_change">Price Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={newAlert.condition}
                  onValueChange={(value) => setNewAlert({ ...newAlert, condition: value })}
                >
                  <SelectTrigger data-testid="select-alert-condition">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                    <SelectItem value="increases_by">Increases by</SelectItem>
                    <SelectItem value="decreases_by">Decreases by</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  data-testid="input-alert-target-value"
                  value={newAlert.targetValue}
                  onChange={(e) => setNewAlert({ ...newAlert, targetValue: e.target.value })}
                  placeholder="Enter target value (e.g., 10 for 10%)"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Input
                id="message"
                data-testid="input-alert-message"
                value={newAlert.message}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                placeholder="Custom alert message"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateAlert}
                data-testid="button-save-alert"
                disabled={createAlertMutation.isPending}
              >
                {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                data-testid="button-cancel-alert"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Your Alerts
            </CardTitle>
            <CardDescription>
              Manage your active smart alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="text-center py-4">Loading alerts...</div>
            ) : alerts?.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert: UserAlert) => (
                  <div
                    key={alert.id}
                    className="border rounded-lg p-4 space-y-3"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getAlertTypeIcon(alert.alertType)}
                        <span className="font-medium capitalize">
                          {alert.alertType.replace('_', ' ')}
                        </span>
                      </div>
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={(checked) =>
                          toggleAlertMutation.mutate({
                            alertId: alert.id,
                            isActive: checked
                          })
                        }
                        data-testid={`switch-alert-${alert.id}`}
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pool: {alert.poolId}
                    </div>
                    <div className="text-sm">
                      Trigger when {alert.condition} {alert.targetValue}
                      {alert.alertType.includes('change') ? '%' : ''}
                    </div>
                    {alert.lastTriggered && (
                      <div className="text-xs text-gray-500">
                        Last triggered: {new Date(alert.lastTriggered).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No alerts configured yet. Create your first alert to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
            <CardDescription>
              Latest alert notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="text-center py-4">Loading notifications...</div>
            ) : notifications?.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 10).map((notification: AlertNotification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-3 space-y-2 cursor-pointer transition-colors ${
                      notification.isRead 
                        ? 'bg-gray-50 dark:bg-gray-900' 
                        : 'bg-white dark:bg-gray-800 border-blue-200'
                    }`}
                    onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={getSeverityColor(notification.severity)}
                      >
                        {notification.severity}
                      </Badge>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <div className="text-sm">{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No notifications yet. Alerts will appear here when triggered.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {alerts?.filter((a: UserAlert) => a.isActive).length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {alerts?.filter((a: UserAlert) => a.lastTriggered).length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Triggered Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {notifications?.filter((n: AlertNotification) => !n.isRead).length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unread Notifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {notifications?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Notifications</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}