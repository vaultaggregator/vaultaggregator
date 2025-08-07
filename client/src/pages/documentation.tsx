import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Lightbulb, Shield, TrendingUp, AlertCircle, ExternalLink, FileText, Video, MessageSquare } from "lucide-react";

export default function Documentation() {
  const quickStartSteps = [
    {
      title: "Explore Available Pools",
      description: "Browse through our curated list of DeFi yield opportunities across multiple chains.",
      icon: <TrendingUp className="w-5 h-5" />,
      action: "View Pools"
    },
    {
      title: "Analyze Risk & Returns",
      description: "Compare APY rates, TVL amounts, and risk assessments to make informed decisions.",
      icon: <Shield className="w-5 h-5" />,
      action: "Learn Risk Assessment"
    },
    {
      title: "Connect Your Wallet",
      description: "Link your Web3 wallet to interact with protocols directly from our platform.",
      icon: <ExternalLink className="w-5 h-5" />,
      action: "Integration Guide"
    },
    {
      title: "Start Yield Farming",
      description: "Follow our step-by-step guides to begin earning yield on your crypto assets.",
      icon: <Lightbulb className="w-5 h-5" />,
      action: "Get Started"
    }
  ];

  const guides = [
    {
      category: "Beginner",
      title: "What is Yield Farming?",
      description: "Learn the basics of DeFi yield farming and how to get started safely.",
      readTime: "5 min",
      difficulty: "Beginner",
      icon: <FileText className="w-5 h-5" />
    },
    {
      category: "Beginner",
      title: "Understanding APY vs APR",
      description: "Learn the difference between APY and APR and how they affect your returns.",
      readTime: "3 min", 
      difficulty: "Beginner",
      icon: <FileText className="w-5 h-5" />
    },
    {
      category: "Intermediate",
      title: "Risk Assessment Guide",
      description: "How we evaluate and categorize risk levels for different protocols.",
      readTime: "8 min",
      difficulty: "Intermediate", 
      icon: <Shield className="w-5 h-5" />
    },
    {
      category: "Intermediate",
      title: "Impermanent Loss Explained",
      description: "Understanding impermanent loss in liquidity pools and how to minimize it.",
      readTime: "10 min",
      difficulty: "Intermediate",
      icon: <AlertCircle className="w-5 h-5" />
    },
    {
      category: "Advanced",
      title: "Multi-Chain Strategies",
      description: "Advanced techniques for yield farming across multiple blockchain networks.",
      readTime: "15 min",
      difficulty: "Advanced",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      category: "Advanced", 
      title: "Smart Contract Integration",
      description: "How to integrate Vault Aggregator data into your own DeFi applications.",
      readTime: "20 min",
      difficulty: "Advanced",
      icon: <ExternalLink className="w-5 h-5" />
    }
  ];

  const faqs = [
    {
      question: "How often is the pool data updated?",
      answer: "Pool data is updated every 10 minutes from DeFi Llama and other reliable sources. APY rates and TVL values are refreshed in real-time to ensure you have the most current information."
    },
    {
      question: "What does the risk level indicate?",
      answer: "Risk levels (Low, Medium, High) are determined by factors including smart contract audits, protocol maturity, TVL stability, and historical performance. Low risk indicates established protocols with multiple audits."
    },
    {
      question: "Can I invest directly through Vault Aggregator?",
      answer: "Vault Aggregator is an information platform that aggregates yield opportunities. To invest, you'll need to visit the actual protocol (like Uniswap, Aave, etc.) and interact with their smart contracts directly."
    },
    {
      question: "Which wallets are supported?",
      answer: "We support all major Web3 wallets including MetaMask, Coinbase Wallet, WalletConnect-compatible wallets, and hardware wallets like Ledger and Trezor."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, Vault Aggregator is available as a web application optimized for mobile browsers. Native mobile apps for iOS and Android are in development."
    },
    {
      question: "How do you make money?",
      answer: "Vault Aggregator is currently free to use. We may introduce premium features in the future, but basic pool discovery and comparison will always remain free."
    }
  ];

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return <Badge className="bg-green-100 text-green-800">Beginner</Badge>;
      case 'Intermediate':
        return <Badge className="bg-yellow-100 text-yellow-800">Intermediate</Badge>;
      case 'Advanced':
        return <Badge className="bg-red-100 text-red-800">Advanced</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-docs-title">
            Documentation
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-docs-subtitle">
            Everything you need to know about DeFi yield farming and using Vault Aggregator
          </p>
        </div>

        <Tabs defaultValue="quickstart" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-documentation">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Getting Started with Vault Aggregator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Welcome to Vault Aggregator! Follow these steps to start discovering and comparing DeFi yield opportunities.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickStartSteps.map((step, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500" data-testid={`card-step-${index}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            {step.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                            <Button variant="outline" size="sm">
                              {step.action}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Concepts */}
            <Card>
              <CardHeader>
                <CardTitle>Key Concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2">APY (Annual Percentage Yield)</h4>
                    <p className="text-sm text-gray-600">
                      The annualized rate of return including compound interest. Higher APY means better returns.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2">TVL (Total Value Locked)</h4>
                    <p className="text-sm text-gray-600">
                      The total amount of assets deposited in a pool. Higher TVL often indicates more stability.
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-orange-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Risk Assessment</h4>
                    <p className="text-sm text-gray-600">
                      Our evaluation of potential risks including smart contract, liquidity, and market risks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-guide-${index}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        {guide.icon}
                      </div>
                      <div className="flex flex-col items-end">
                        {getDifficultyBadge(guide.difficulty)}
                        <span className="text-xs text-gray-500 mt-1">{guide.readTime} read</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-3">{guide.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{guide.description}</p>
                    <Button variant="outline" className="w-full">
                      Read Guide
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0" data-testid={`faq-${index}`}>
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Still have questions?</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Can't find the answer you're looking for? Our support team is here to help.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Join Discord
                    </Button>
                    <Button variant="outline" size="sm">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="w-5 h-5 mr-2 text-red-600" />
                    Video Tutorials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Watch step-by-step video guides covering everything from basics to advanced strategies.
                  </p>
                  <Button variant="outline" className="w-full">
                    Browse Videos
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    DeFi Glossary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Comprehensive glossary of DeFi terms and concepts you'll encounter while yield farming.
                  </p>
                  <Button variant="outline" className="w-full">
                    View Glossary
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2 text-green-600" />
                    External Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Curated list of external resources, tools, and educational content from the DeFi community.
                  </p>
                  <Button variant="outline" className="w-full">
                    Explore Resources
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                    Community Forum
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Join discussions with other yield farmers, share strategies, and get community support.
                  </p>
                  <Button variant="outline" className="w-full">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-orange-600" />
                    Security Best Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Essential security practices for safely participating in DeFi protocols and yield farming.
                  </p>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" />
                    White Papers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Technical documentation and research papers from major DeFi protocols and platforms.
                  </p>
                  <Button variant="outline" className="w-full">
                    Download Papers
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}