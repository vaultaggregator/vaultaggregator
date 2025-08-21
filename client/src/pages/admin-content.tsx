import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  Image, 
  Video, 
  Link as LinkIcon, 
  Edit3, 
  Trash2,
  Plus,
  Upload,
  Eye,
  EyeOff,
  Calendar,
  Search,
  Filter,
  Globe,
  Smartphone,
  Desktop,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin-header";
import { apiRequest } from "@/lib/queryClient";

interface ContentItem {
  id: string;
  type: 'page' | 'post' | 'media' | 'announcement';
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
}

interface ContentStats {
  totalPages: number;
  totalPosts: number;
  totalMedia: number;
  publishedContent: number;
  draftContent: number;
  totalViews: number;
  popularContent: ContentItem[];
  recentActivity: Array<{
    id: string;
    action: string;
    content: string;
    author: string;
    timestamp: string;
  }>;
}

interface SeoSettings {
  defaultTitle: string;
  defaultDescription: string;
  keywords: string[];
  socialTitle: string;
  socialDescription: string;
  socialImage: string;
  analyticsId: string;
  robotsTxt: string;
  sitemap: boolean;
}

export default function AdminContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const [newContent, setNewContent] = useState({
    type: "page" as const,
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    status: "draft" as const,
    seoTitle: "",
    seoDescription: "",
    tags: [] as string[],
  });

  // Fetch content
  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ["/api/admin/content", { 
      search: searchTerm || undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined
    }],
  });

  // Fetch content statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/content/stats"],
  });

  // Fetch SEO settings
  const { data: seoSettings } = useQuery({
    queryKey: ["/api/admin/seo/settings"],
  });

  const contentItems = (contentData as any)?.content || [];
  const contentStats = stats as ContentStats | undefined;
  const seoConfig = seoSettings as SeoSettings | undefined;

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (data: typeof newContent) => {
      return await apiRequest("/api/admin/content", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/stats"] });
      setIsCreateDialogOpen(false);
      setNewContent({
        type: "page",
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        status: "draft",
        seoTitle: "",
        seoDescription: "",
        tags: [],
      });
      toast({
        title: "Content Created",
        description: "New content has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create content.",
        variant: "destructive",
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContentItem> }) => {
      return await apiRequest(`/api/admin/content/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      setIsEditDialogOpen(false);
      setSelectedContent(null);
      toast({
        title: "Content Updated",
        description: "Content has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update content.",
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/content/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      toast({
        title: "Content Deleted",
        description: "Content has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete content.",
        variant: "destructive",
      });
    },
  });

  // Update SEO settings mutation
  const updateSeoMutation = useMutation({
    mutationFn: async (data: Partial<SeoSettings>) => {
      return await apiRequest("/api/admin/seo/settings", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/settings"] });
      toast({
        title: "SEO Settings Updated",
        description: "SEO settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update SEO settings.",
        variant: "destructive",
      });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileText className="h-4 w-4" />;
      case 'post': return <FileText className="h-4 w-4" />;
      case 'media': return <Image className="h-4 w-4" />;
      case 'announcement': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
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
                Content Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Create, edit, and manage website content, pages, and SEO settings
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Content
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Content</DialogTitle>
                  <DialogDescription>
                    Add a new page, post, or announcement to your website.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Content Type</Label>
                      <select 
                        value={newContent.type}
                        onChange={(e) => setNewContent(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="page">Page</option>
                        <option value="post">Blog Post</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <select 
                        value={newContent.status}
                        onChange={(e) => setNewContent(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newContent.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setNewContent(prev => ({ 
                          ...prev, 
                          title,
                          slug: generateSlug(title)
                        }));
                      }}
                      placeholder="Enter content title"
                    />
                  </div>
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input
                      value={newContent.slug}
                      onChange={(e) => setNewContent(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                  <div>
                    <Label>Excerpt</Label>
                    <Textarea
                      value={newContent.excerpt}
                      onChange={(e) => setNewContent(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description or excerpt"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={newContent.content}
                      onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your content here..."
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>SEO Title</Label>
                      <Input
                        value={newContent.seoTitle}
                        onChange={(e) => setNewContent(prev => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder="SEO optimized title"
                      />
                    </div>
                    <div>
                      <Label>SEO Description</Label>
                      <Textarea
                        value={newContent.seoDescription}
                        onChange={(e) => setNewContent(prev => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder="Meta description for search engines"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createContentMutation.mutate(newContent)}
                    disabled={createContentMutation.isPending}
                  >
                    {createContentMutation.isPending ? "Creating..." : "Create Content"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {contentStats?.totalPages || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {contentStats?.publishedContent || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {contentStats?.totalViews ? (contentStats.totalViews > 1000 ? `${(contentStats.totalViews / 1000).toFixed(1)}K` : contentStats.totalViews) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Image className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-foreground">
                    {contentStats?.totalMedia || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Media Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="seo">SEO Settings</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(contentStats?.popularContent || []).slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(item.type)}
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.views} views • {formatDate(item.updatedAt)}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(item.status) as any}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(contentStats?.recentActivity || []).slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">{activity.content}</div>
                          <div className="text-xs text-muted-foreground">
                            {activity.author} • {formatDate(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">All Types</option>
                      <option value="page">Pages</option>
                      <option value="post">Posts</option>
                      <option value="announcement">Announcements</option>
                    </select>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Table */}
            <Card>
              <CardHeader>
                <CardTitle>Content Items ({contentItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : contentItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                    No content found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Content</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contentItems.map((item: ContentItem) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-muted-foreground">/{item.slug}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(item.type)}
                                <span className="capitalize">{item.type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(item.status) as any}>
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.author}</TableCell>
                            <TableCell>{item.views}</TableCell>
                            <TableCell>{formatDate(item.updatedAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedContent(item);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteContentMutation.mutate(item.id)}
                                  disabled={deleteContentMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings Tab */}
          <TabsContent value="seo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Default Site Title</Label>
                    <Input
                      value={seoConfig?.defaultTitle || ''}
                      onChange={(e) => updateSeoMutation.mutate({ defaultTitle: e.target.value })}
                      placeholder="Your Site Title"
                    />
                  </div>
                  <div>
                    <Label>Default Meta Description</Label>
                    <Textarea
                      value={seoConfig?.defaultDescription || ''}
                      onChange={(e) => updateSeoMutation.mutate({ defaultDescription: e.target.value })}
                      placeholder="Default meta description for your site"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Default Keywords</Label>
                    <Input
                      value={seoConfig?.keywords?.join(', ') || ''}
                      onChange={(e) => updateSeoMutation.mutate({ 
                        keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) 
                      })}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                  <div>
                    <Label>Google Analytics ID</Label>
                    <Input
                      value={seoConfig?.analyticsId || ''}
                      onChange={(e) => updateSeoMutation.mutate({ analyticsId: e.target.value })}
                      placeholder="GA4-XXXXXXXXX"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Social Media Title</Label>
                    <Input
                      value={seoConfig?.socialTitle || ''}
                      onChange={(e) => updateSeoMutation.mutate({ socialTitle: e.target.value })}
                      placeholder="Title for social media sharing"
                    />
                  </div>
                  <div>
                    <Label>Social Media Description</Label>
                    <Textarea
                      value={seoConfig?.socialDescription || ''}
                      onChange={(e) => updateSeoMutation.mutate({ socialDescription: e.target.value })}
                      placeholder="Description for social media sharing"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Social Media Image URL</Label>
                    <Input
                      value={seoConfig?.socialImage || ''}
                      onChange={(e) => updateSeoMutation.mutate({ socialImage: e.target.value })}
                      placeholder="https://example.com/social-image.jpg"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Generate XML Sitemap</Label>
                      <p className="text-sm text-muted-foreground">Automatically generate sitemap.xml</p>
                    </div>
                    <Switch
                      checked={seoConfig?.sitemap || false}
                      onCheckedChange={(checked) => updateSeoMutation.mutate({ sitemap: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Robots.txt Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Robots.txt Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Robots.txt Content</Label>
                  <Textarea
                    value={seoConfig?.robotsTxt || ''}
                    onChange={(e) => updateSeoMutation.mutate({ robotsTxt: e.target.value })}
                    placeholder="User-agent: *&#10;Disallow:"
                    rows={8}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Configure how search engine crawlers should index your site.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">85.2%</div>
                  <div className="text-sm text-muted-foreground">Desktop Traffic</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">14.8%</div>
                  <div className="text-sm text-muted-foreground">Mobile Traffic</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold">2.5min</div>
                  <div className="text-sm text-muted-foreground">Avg. Time on Page</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Top performing content by views and engagement
                  </div>
                  
                  {(contentStats?.popularContent || []).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.type} • Published {formatDate(item.publishedAt || item.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{item.views}</div>
                        <div className="text-sm text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}