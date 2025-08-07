import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Users, TrendingUp } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ListYourProject() {
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    category: "",
    chain: "",
    website: "",
    telegram: "",
    twitter: "",
    discord: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Project submission:", formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            List Your DeFi Project
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-page-description">
            Get your protocol featured on Vault Aggregator and reach thousands of DeFi investors 
            looking for the best yield opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Benefits */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Reach More Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect with thousands of DeFi users actively searching for yield opportunities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle>Increase TVL</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Attract more liquidity providers to your protocol with better visibility.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-primary" />
                <CardTitle>Real-time Data</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatic integration with DeFi Llama for up-to-date APY and TVL information.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submission Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Submit Your Project</CardTitle>
            <CardDescription>
              Fill out the form below and we'll review your project for inclusion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    placeholder="Enter your project name"
                    required
                    data-testid="input-project-name"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website *</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://yourproject.com"
                    required
                    data-testid="input-website"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your project and what makes it unique"
                  className="min-h-[100px]"
                  required
                  data-testid="textarea-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lending">Lending</SelectItem>
                      <SelectItem value="dex">DEX</SelectItem>
                      <SelectItem value="yield-farming">Yield Farming</SelectItem>
                      <SelectItem value="staking">Staking</SelectItem>
                      <SelectItem value="derivatives">Derivatives</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chain">Blockchain</Label>
                  <Select onValueChange={(value) => setFormData({...formData, chain: value})}>
                    <SelectTrigger data-testid="select-chain">
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="avalanche">Avalanche</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                    placeholder="@yourproject"
                    data-testid="input-twitter"
                  />
                </div>
                <div>
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    value={formData.telegram}
                    onChange={(e) => setFormData({...formData, telegram: e.target.value})}
                    placeholder="t.me/yourproject"
                    data-testid="input-telegram"
                  />
                </div>
                <div>
                  <Label htmlFor="discord">Discord</Label>
                  <Input
                    id="discord"
                    value={formData.discord}
                    onChange={(e) => setFormData({...formData, discord: e.target.value})}
                    placeholder="discord.gg/yourproject"
                    data-testid="input-discord"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" data-testid="button-submit">
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How long does the review process take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Most projects are reviewed within 48-72 hours. We'll contact you via email with updates.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What are the requirements for listing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your project should have a working product, audited smart contracts (preferred), 
                  and be integrated with DeFi Llama for automatic data updates.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a cost to list my project?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Basic listings are free. We offer premium features for projects looking for additional exposure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}