import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Calendar, Users } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function PressMedia() {
  const pressReleases = [
    {
      date: "2025-01-15",
      title: "Vault Aggregator Reaches $500M in Tracked TVL",
      excerpt: "Platform now tracks over 1,000 yield opportunities across 15 blockchains",
      category: "Milestone"
    },
    {
      date: "2025-01-10", 
      title: "New Partnership with Leading DeFi Protocols",
      excerpt: "Integration with 20+ new protocols expands yield farming options for users",
      category: "Partnership"
    },
    {
      date: "2024-12-20",
      title: "Vault Aggregator Launches Advanced Analytics Dashboard",
      excerpt: "Real-time risk assessment and historical performance tracking now available",
      category: "Product Update"
    }
  ];

  const mediaKit = [
    { name: "Company Logos (PNG)", size: "2.3 MB", type: "logos" },
    { name: "Product Screenshots", size: "5.1 MB", type: "screenshots" },
    { name: "Brand Guidelines", size: "1.8 MB", type: "guidelines" },
    { name: "Executive Photos", size: "3.2 MB", type: "photos" }
  ];

  const stats = [
    { label: "Total Value Tracked", value: "$500M+" },
    { label: "Active Users", value: "50K+" },
    { label: "Supported Protocols", value: "200+" },
    { label: "Blockchain Networks", value: "15+" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            Press & Media Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-page-description">
            Latest news, press releases, and media resources for journalists, 
            content creators, and media professionals.
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary mb-2">{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Press Releases */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">Latest Press Releases</h2>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">{release.category}</Badge>
                          <span className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {release.date}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{release.title}</CardTitle>
                        <CardDescription className="mt-2">{release.excerpt}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-read-more-${index}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Read More
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Media Resources */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Media Kit</h2>
            <Card>
              <CardHeader>
                <CardTitle>Download Resources</CardTitle>
                <CardDescription>
                  High-resolution logos, screenshots, and brand assets for media use.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mediaKit.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.size}</p>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-download-${index}`}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" data-testid="button-download-all">
                  <Download className="w-4 h-4 mr-2" />
                  Download Complete Kit
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Media Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Head of Communications</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>📧 press@vaultaggregator.com</p>
                    <p>📞 +1 (555) 123-4567</p>
                    <p>🐦 @VaultAggregator</p>
                  </div>
                  <Button variant="outline" className="w-full" data-testid="button-contact-media">
                    <Users className="w-4 h-4 mr-2" />
                    Contact Media Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Company Information */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>About Vault Aggregator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-muted-foreground">
              <p className="mb-4">
                Vault Aggregator is the leading DeFi yield aggregation platform, providing users with 
                comprehensive insights into yield farming opportunities across multiple blockchain networks. 
                Founded in 2024, our mission is to democratize access to DeFi yields while maintaining 
                the highest standards of security and transparency.
              </p>
              <p className="mb-4">
                The platform integrates with over 200 DeFi protocols across 15 blockchain networks, 
                tracking more than $500 million in total value locked. Our advanced analytics and 
                risk assessment tools help both novice and experienced DeFi users make informed 
                investment decisions.
              </p>
              <p>
                Vault Aggregator is backed by leading venture capital firms and has been featured 
                in major cryptocurrency and financial publications worldwide.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Coverage */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Media Coverage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { outlet: "CoinDesk", title: "DeFi Aggregators Gain Traction", date: "Jan 12, 2025" },
              { outlet: "The Block", title: "Yield Farming Renaissance", date: "Jan 8, 2025" },
              { outlet: "Decrypt", title: "Best DeFi Tools of 2025", date: "Jan 5, 2025" }
            ].map((article, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Badge variant="outline" className="mb-2">{article.outlet}</Badge>
                  <h3 className="font-semibold mb-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{article.date}</p>
                  <Button variant="outline" size="sm" data-testid={`button-article-${index}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Read Article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}