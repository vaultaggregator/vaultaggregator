import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Zap, Shield, ExternalLink, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  category: string;
  accessLevel: string;
  pricing: string;
  rateLimit: string;
  documentation: string;
  isActive: boolean;
  createdAt: string;
}

interface DeveloperApplication {
  id: string;
  companyName: string;
  contactEmail: string;
  projectDescription: string;
  intendedUse: string;
  expectedVolume: string;
  status: string;
  submittedAt: string;
  approvedAt?: string;
}

export default function ApiMarketplace() {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  
  const [application, setApplication] = useState({
    companyName: '',
    contactEmail: '',
    projectDescription: '',
    intendedUse: '',
    expectedVolume: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: endpoints, isLoading: endpointsLoading } = useQuery({
    queryKey: ['/api/marketplace/endpoints', selectedCategory, selectedAccessLevel],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedAccessLevel) params.append('accessLevel', selectedAccessLevel);
      return apiRequest(`/api/marketplace/endpoints${params.toString() ? `?${params.toString()}` : ''}`);
    }
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/marketplace/applications'],
    queryFn: () => apiRequest('/api/marketplace/applications')
  });

  const submitApplicationMutation = useMutation({
    mutationFn: (applicationData: any) => apiRequest('/api/marketplace/apply', {
      method: 'POST',
      body: JSON.stringify(applicationData),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/applications'] });
      setIsApplying(false);
      setApplication({
        companyName: '',
        contactEmail: '',
        projectDescription: '',
        intendedUse: '',
        expectedVolume: ''
      });
      toast({
        title: "Application Submitted",
        description: "Your API access application has been submitted for review."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getAccessLevelColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'premium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pools':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'analytics':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'alerts':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'portfolio':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PUT':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Code className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">API Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access powerful APIs for yield data, analytics, and portfolio management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="endpoints" data-testid="tab-endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="apply" data-testid="tab-apply">Developer Access</TabsTrigger>
          <TabsTrigger value="applications" data-testid="tab-applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Browse API Endpoints</CardTitle>
              <CardDescription>
                Discover APIs for yield data, risk analysis, and portfolio management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="pools">Pool Data</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="alerts">Smart Alerts</SelectItem>
                      <SelectItem value="portfolio">Portfolio Management</SelectItem>
                      <SelectItem value="risk">Risk Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Access Level</Label>
                  <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                    <SelectTrigger data-testid="select-access-filter">
                      <SelectValue placeholder="All access levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Access Levels</SelectItem>
                      <SelectItem value="public">Public (Free)</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints Grid */}
          {endpointsLoading ? (
            <div className="text-center py-8">Loading API endpoints...</div>
          ) : endpoints?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {endpoints.map((endpoint: ApiEndpoint) => (
                <Card key={endpoint.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {endpoint.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={getCategoryColor(endpoint.category)}>
                          {endpoint.category}
                        </Badge>
                        <Badge variant="outline" className={getAccessLevelColor(endpoint.accessLevel)}>
                          {endpoint.accessLevel}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                          {endpoint.method.toUpperCase()}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.endpoint}</code>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-600">Pricing</Label>
                        <div className="font-medium">{endpoint.pricing}</div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Rate Limit</Label>
                        <div className="font-medium">{endpoint.rateLimit}</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                      {endpoint.documentation && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-docs-${endpoint.id}`}
                        >
                          <a href={endpoint.documentation} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Documentation
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No API endpoints found matching your criteria.
            </div>
          )}
        </TabsContent>

        <TabsContent value="apply" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply for Developer Access</CardTitle>
              <CardDescription>
                Get access to premium APIs for building advanced DeFi applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isApplying ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <h3 className="font-medium">Secure APIs</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enterprise-grade security and reliability
                      </p>
                    </div>
                    <div className="text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-medium">High Performance</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Low latency and high throughput APIs
                      </p>
                    </div>
                    <div className="text-center">
                      <Code className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h3 className="font-medium">Developer Tools</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SDKs, documentation, and support
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-4">API Access Tiers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-green-600">Public (Free)</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Basic endpoints with rate limiting
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 space-y-1">
                          <li>• 1,000 requests/day</li>
                          <li>• Pool data access</li>
                          <li>• Basic analytics</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-blue-600">Premium</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Enhanced features and higher limits
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 space-y-1">
                          <li>• 50,000 requests/day</li>
                          <li>• Real-time alerts</li>
                          <li>• Advanced analytics</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-purple-600">Enterprise</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Custom solutions and dedicated support
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 space-y-1">
                          <li>• Unlimited requests</li>
                          <li>• Custom endpoints</li>
                          <li>• 24/7 support</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsApplying(true)}
                    data-testid="button-start-application"
                    className="w-full"
                  >
                    Apply for Developer Access
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company/Project Name *</Label>
                    <Input
                      id="companyName"
                      data-testid="input-company-name"
                      value={application.companyName}
                      onChange={(e) => setApplication({ ...application, companyName: e.target.value })}
                      placeholder="Your company or project name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      data-testid="input-contact-email"
                      value={application.contactEmail}
                      onChange={(e) => setApplication({ ...application, contactEmail: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="projectDescription">Project Description *</Label>
                    <Textarea
                      id="projectDescription"
                      data-testid="textarea-project-description"
                      value={application.projectDescription}
                      onChange={(e) => setApplication({ ...application, projectDescription: e.target.value })}
                      placeholder="Describe your project and how you plan to use our APIs"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="intendedUse">Intended Use Case *</Label>
                    <Textarea
                      id="intendedUse"
                      data-testid="textarea-intended-use"
                      value={application.intendedUse}
                      onChange={(e) => setApplication({ ...application, intendedUse: e.target.value })}
                      placeholder="Specific APIs and features you need"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedVolume">Expected API Volume</Label>
                    <Input
                      id="expectedVolume"
                      data-testid="input-expected-volume"
                      value={application.expectedVolume}
                      onChange={(e) => setApplication({ ...application, expectedVolume: e.target.value })}
                      placeholder="e.g., 10,000 requests/day"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitApplicationMutation.mutate(application)}
                      data-testid="button-submit-application"
                      disabled={submitApplicationMutation.isPending || !application.companyName || !application.contactEmail || !application.projectDescription}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submitApplicationMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsApplying(false)}
                      data-testid="button-cancel-application"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>
                Track your developer access applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="text-center py-8">Loading applications...</div>
              ) : applications?.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app: DeveloperApplication) => (
                    <div
                      key={app.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`application-${app.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{app.companyName}</h3>
                          <p className="text-sm text-gray-600">{app.contactEmail}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(app.status)}
                          <Badge
                            variant="outline"
                            className={
                              app.status === 'approved'
                                ? 'border-green-200 text-green-800'
                                : app.status === 'rejected'
                                ? 'border-red-200 text-red-800'
                                : 'border-yellow-200 text-yellow-800'
                            }
                          >
                            {app.status}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-1">Project Description</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {app.projectDescription}
                        </p>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                        {app.approvedAt && (
                          <span> • Approved: {new Date(app.approvedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No applications submitted yet. Apply for developer access to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}