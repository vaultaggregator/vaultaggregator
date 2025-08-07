import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, HelpCircle, MessageCircle, FileText, Users, Clock, CheckCircle } from "lucide-react";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");

  const popularArticles = [
    {
      title: "How to connect your wallet",
      category: "Getting Started",
      views: 1250,
      helpful: 95,
      timeToRead: "3 min"
    },
    {
      title: "Understanding APY calculations",
      category: "Yield Farming",
      views: 980,
      helpful: 88,
      timeToRead: "5 min"
    },
    {
      title: "Risk assessment methodology",
      category: "Safety",
      views: 756,
      helpful: 92,
      timeToRead: "7 min"
    },
    {
      title: "Troubleshooting transaction failures",
      category: "Technical",
      views: 645,
      helpful: 87,
      timeToRead: "4 min"
    },
    {
      title: "Multi-chain farming strategies",
      category: "Advanced",
      views: 534,
      helpful: 91,
      timeToRead: "12 min"
    },
    {
      title: "Gas fee optimization tips",
      category: "Cost Saving",
      views: 423,
      helpful: 89,
      timeToRead: "6 min"
    }
  ];

  const supportChannels = [
    {
      name: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7",
      responseTime: "< 2 minutes",
      status: "online",
      icon: <MessageCircle className="w-6 h-6" />
    },
    {
      name: "Email Support",
      description: "Send us detailed questions via email",
      availability: "Business hours",
      responseTime: "< 4 hours",
      status: "active",
      icon: <FileText className="w-6 h-6" />
    },
    {
      name: "Community Forum",
      description: "Connect with other users and experts",
      availability: "24/7",
      responseTime: "Community driven",
      status: "active",
      icon: <Users className="w-6 h-6" />
    },
    {
      name: "Video Call",
      description: "Schedule a one-on-one session",
      availability: "By appointment",
      responseTime: "Same day",
      status: "premium",
      icon: <Clock className="w-6 h-6" />
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-help-title">
            Help Center
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-help-subtitle">
            Get the support you need to make the most of Vault Aggregator
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg"
                data-testid="input-search-help"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {["Getting Started", "Wallet Setup", "Yield Farming", "Troubleshooting", "API"].map((tag) => (
                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gray-100">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="articles" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-help">
            <TabsTrigger value="articles">Help Articles</TabsTrigger>
            <TabsTrigger value="support">Support Channels</TabsTrigger>
            <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Popular Help Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularArticles.map((article, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-article-${index}`}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant="outline">{article.category}</Badge>
                          <span className="text-xs text-gray-500">{article.timeToRead}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{article.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{article.views} views</span>
                          <div className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                            <span>{article.helpful}% helpful</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Getting Started Guide</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    New to DeFi? Start here with our comprehensive beginner's guide.
                  </p>
                  <Button variant="outline" className="w-full">
                    Start Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Video Tutorials</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Watch step-by-step video guides for visual learners.
                  </p>
                  <Button variant="outline" className="w-full">
                    Watch Videos
                  </Button>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Community Forum</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect with other users and share experiences.
                  </p>
                  <Button variant="outline" className="w-full">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportChannels.map((channel, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`card-support-${index}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          {channel.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <p className="text-sm text-gray-600">{channel.description}</p>
                        </div>
                      </div>
                      {getStatusBadge(channel.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Availability:</span>
                      <span className="font-medium">{channel.availability}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Response Time:</span>
                      <span className="font-medium">{channel.responseTime}</span>
                    </div>
                    <Button 
                      className="w-full" 
                      variant={channel.status === 'premium' ? 'default' : 'outline'}
                      disabled={channel.status === 'premium'}
                    >
                      {channel.status === 'premium' ? 'Premium Feature' : 'Contact Now'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ticket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <p className="text-gray-600">
                  Can't find the answer you're looking for? Submit a detailed support ticket and our team will get back to you.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Input
                    placeholder="Brief description of your issue..."
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    data-testid="input-ticket-subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md" data-testid="select-ticket-category">
                    <option>Technical Issue</option>
                    <option>Account Problem</option>
                    <option>Feature Request</option>
                    <option>General Question</option>
                    <option>Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md" data-testid="select-ticket-priority">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                    rows={6}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    data-testid="textarea-ticket-message"
                  />
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1" data-testid="button-submit-ticket">
                    Submit Ticket
                  </Button>
                  <Button variant="outline" data-testid="button-clear-ticket">
                    Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  System Status - All Systems Operational
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "API Services", status: "operational", uptime: "99.9%" },
                  { name: "Data Sync", status: "operational", uptime: "99.8%" },
                  { name: "Web Application", status: "operational", uptime: "100%" },
                  { name: "Database", status: "operational", uptime: "99.9%" },
                  { name: "External Integrations", status: "operational", uptime: "98.5%" }
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-100 text-green-800">Operational</Badge>
                      <span className="text-sm text-gray-600">{service.uptime} uptime</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
      <Footer />
    </div>
  );
}