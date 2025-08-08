import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, TrendingUp, MessageSquare, ThumbsUp, Eye, User } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Strategy {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  riskLevel: string;
  expectedReturn: string;
  timeHorizon: string;
  isPublic: boolean;
  upvotes: number;
  views: number;
  user: {
    id: string;
    username: string;
  };
  strategyPools: Array<{
    id: string;
    poolId: string;
    allocation: string;
    pool: {
      id: string;
      tokenPair: string;
      apy: string;
      platform: { name: string };
      chain: { name: string };
    };
  }>;
}

interface Discussion {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  replyCount: number;
  lastReplyAt: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      username: string;
    };
  }>;
}

export default function CommunityInsights() {
  const [userId] = useState('demo-user-123');
  const [activeTab, setActiveTab] = useState('strategies');
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);
  
  const [newStrategy, setNewStrategy] = useState({
    title: '',
    description: '',
    category: 'yield-farming',
    riskLevel: 'medium',
    expectedReturn: '',
    timeHorizon: '',
    isPublic: true
  });

  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: strategies, isLoading: strategiesLoading } = useQuery({
    queryKey: ['/api/strategies'],
    queryFn: () => apiRequest('/api/strategies?isPublic=true')
  });

  const { data: discussions, isLoading: discussionsLoading } = useQuery({
    queryKey: ['/api/discussions'],
    queryFn: () => apiRequest('/api/discussions')
  });

  const createStrategyMutation = useMutation({
    mutationFn: (strategyData: any) => apiRequest('/api/strategies', {
      method: 'POST',
      body: JSON.stringify({ ...strategyData, userId }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      setIsCreatingStrategy(false);
      setNewStrategy({
        title: '',
        description: '',
        category: 'yield-farming',
        riskLevel: 'medium',
        expectedReturn: '',
        timeHorizon: '',
        isPublic: true
      });
      toast({
        title: "Strategy Created",
        description: "Your investment strategy has been shared with the community."
      });
    }
  });

  const createDiscussionMutation = useMutation({
    mutationFn: (discussionData: any) => apiRequest('/api/discussions', {
      method: 'POST',
      body: JSON.stringify({ ...discussionData, userId }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discussions'] });
      setIsCreatingDiscussion(false);
      setNewDiscussion({
        title: '',
        content: '',
        category: 'general'
      });
      toast({
        title: "Discussion Started",
        description: "Your discussion has been posted successfully."
      });
    }
  });

  const upvoteStrategyMutation = useMutation({
    mutationFn: (strategyId: string) => apiRequest(`/api/strategies/${strategyId}/upvote`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      toast({
        title: "Vote Recorded",
        description: "Thanks for supporting this strategy!"
      });
    }
  });

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'yield-farming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'liquidity-mining':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'staking':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Community Insights</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share strategies, discuss trends, and learn from the community
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="strategies" data-testid="tab-strategies">Investment Strategies</TabsTrigger>
          <TabsTrigger value="discussions" data-testid="tab-discussions">Community Discussions</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Community Strategies</h2>
            <Button
              onClick={() => setIsCreatingStrategy(true)}
              data-testid="button-create-strategy"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Share Strategy
            </Button>
          </div>

          {/* Create Strategy Form */}
          {isCreatingStrategy && (
            <Card>
              <CardHeader>
                <CardTitle>Share Your Investment Strategy</CardTitle>
                <CardDescription>
                  Help the community by sharing your successful DeFi investment approach
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="strategyTitle">Strategy Title *</Label>
                  <Input
                    id="strategyTitle"
                    data-testid="input-strategy-title"
                    value={newStrategy.title}
                    onChange={(e) => setNewStrategy({ ...newStrategy, title: e.target.value })}
                    placeholder="Give your strategy a catchy title"
                  />
                </div>

                <div>
                  <Label htmlFor="strategyDescription">Description *</Label>
                  <Textarea
                    id="strategyDescription"
                    data-testid="textarea-strategy-description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                    placeholder="Explain your strategy, methodology, and key insights"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={newStrategy.category}
                      onValueChange={(value) => setNewStrategy({ ...newStrategy, category: value })}
                    >
                      <SelectTrigger data-testid="select-strategy-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yield-farming">Yield Farming</SelectItem>
                        <SelectItem value="liquidity-mining">Liquidity Mining</SelectItem>
                        <SelectItem value="staking">Staking</SelectItem>
                        <SelectItem value="arbitrage">Arbitrage</SelectItem>
                        <SelectItem value="diversified">Diversified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Risk Level</Label>
                    <Select
                      value={newStrategy.riskLevel}
                      onValueChange={(value) => setNewStrategy({ ...newStrategy, riskLevel: value })}
                    >
                      <SelectTrigger data-testid="select-strategy-risk">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expectedReturn">Expected Return (%)</Label>
                    <Input
                      id="expectedReturn"
                      data-testid="input-expected-return"
                      value={newStrategy.expectedReturn}
                      onChange={(e) => setNewStrategy({ ...newStrategy, expectedReturn: e.target.value })}
                      placeholder="e.g., 15-25"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timeHorizon">Time Horizon</Label>
                  <Input
                    id="timeHorizon"
                    data-testid="input-time-horizon"
                    value={newStrategy.timeHorizon}
                    onChange={(e) => setNewStrategy({ ...newStrategy, timeHorizon: e.target.value })}
                    placeholder="e.g., 3-6 months, Long-term"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => createStrategyMutation.mutate(newStrategy)}
                    data-testid="button-submit-strategy"
                    disabled={createStrategyMutation.isPending}
                  >
                    {createStrategyMutation.isPending ? 'Publishing...' : 'Share Strategy'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingStrategy(false)}
                    data-testid="button-cancel-strategy"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strategies List */}
          {strategiesLoading ? (
            <div className="text-center py-8">Loading strategies...</div>
          ) : strategies?.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {strategies.map((strategy: Strategy) => (
                <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{strategy.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">{strategy.user.username}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className={getCategoryColor(strategy.category)}>
                          {strategy.category.replace('-', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getRiskLevelColor(strategy.riskLevel)}>
                          {strategy.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {strategy.description}
                    </p>

                    {strategy.expectedReturn && (
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Expected Return:</span>
                          <span className="font-medium ml-1">{strategy.expectedReturn}%</span>
                        </div>
                        {strategy.timeHorizon && (
                          <div>
                            <span className="text-gray-600">Timeline:</span>
                            <span className="font-medium ml-1">{strategy.timeHorizon}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {strategy.views || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {strategy.upvotes}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => upvoteStrategyMutation.mutate(strategy.id)}
                        data-testid={`button-upvote-strategy-${strategy.id}`}
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Helpful
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No strategies shared yet. Be the first to share your investment approach!
            </div>
          )}
        </TabsContent>

        <TabsContent value="discussions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Community Discussions</h2>
            <Button
              onClick={() => setIsCreatingDiscussion(true)}
              data-testid="button-create-discussion"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Start Discussion
            </Button>
          </div>

          {/* Create Discussion Form */}
          {isCreatingDiscussion && (
            <Card>
              <CardHeader>
                <CardTitle>Start a Discussion</CardTitle>
                <CardDescription>
                  Ask questions, share insights, or discuss DeFi trends with the community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="discussionTitle">Title *</Label>
                  <Input
                    id="discussionTitle"
                    data-testid="input-discussion-title"
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                    placeholder="What would you like to discuss?"
                  />
                </div>

                <div>
                  <Label htmlFor="discussionContent">Content *</Label>
                  <Textarea
                    id="discussionContent"
                    data-testid="textarea-discussion-content"
                    value={newDiscussion.content}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                    placeholder="Share your thoughts, ask questions, or provide insights..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={newDiscussion.category}
                    onValueChange={(value) => setNewDiscussion({ ...newDiscussion, category: value })}
                  >
                    <SelectTrigger data-testid="select-discussion-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Discussion</SelectItem>
                      <SelectItem value="strategies">Strategy Discussion</SelectItem>
                      <SelectItem value="market-analysis">Market Analysis</SelectItem>
                      <SelectItem value="platform-review">Platform Review</SelectItem>
                      <SelectItem value="risk-management">Risk Management</SelectItem>
                      <SelectItem value="news">News & Updates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => createDiscussionMutation.mutate(newDiscussion)}
                    data-testid="button-submit-discussion"
                    disabled={createDiscussionMutation.isPending}
                  >
                    {createDiscussionMutation.isPending ? 'Posting...' : 'Start Discussion'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingDiscussion(false)}
                    data-testid="button-cancel-discussion"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Discussions List */}
          {discussionsLoading ? (
            <div className="text-center py-8">Loading discussions...</div>
          ) : discussions?.length > 0 ? (
            <div className="space-y-4">
              {discussions.map((discussion: Discussion) => (
                <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-2">{discussion.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            {discussion.user.username}
                          </div>
                          <span>•</span>
                          <span>{new Date(discussion.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={getCategoryColor(discussion.category)}>
                        {discussion.category.replace('-', ' ')}
                      </Badge>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {discussion.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {discussion.replyCount} replies
                      </div>
                      {discussion.lastReplyAt && (
                        <span>
                          Last reply: {new Date(discussion.lastReplyAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No discussions yet. Start the conversation by creating the first discussion!
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
      <Footer />
    </div>
  );
}