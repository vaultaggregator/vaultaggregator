import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, DollarSign, Users, Search, Filter, ExternalLink, Heart } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { useState } from "react";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  const jobListings = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$120k - $180k",
      experience: "5+ years",
      description: "Lead our frontend development efforts, building beautiful and performant React applications for our DeFi platform.",
      requirements: ["React/TypeScript", "DeFi Experience", "UI/UX Design"],
      posted: "2 days ago"
    },
    {
      id: "2",
      title: "Smart Contract Developer",
      department: "Engineering", 
      location: "San Francisco, CA",
      type: "Full-time",
      salary: "$150k - $220k",
      experience: "3+ years",
      description: "Design and develop secure smart contracts for our yield aggregation protocols across multiple blockchains.",
      requirements: ["Solidity", "Web3.js/Ethers.js", "Security Auditing"],
      posted: "5 days ago"
    },
    {
      id: "3",
      title: "DeFi Research Analyst",
      department: "Research",
      location: "Remote",
      type: "Full-time", 
      salary: "$80k - $120k",
      experience: "2+ years",
      description: "Analyze DeFi protocols, yield opportunities, and market trends to provide insights for our platform and users.",
      requirements: ["DeFi Knowledge", "Data Analysis", "Financial Modeling"],
      posted: "1 week ago"
    },
    {
      id: "4",
      title: "DevOps Engineer",
      department: "Engineering",
      location: "New York, NY",
      type: "Full-time",
      salary: "$110k - $160k", 
      experience: "4+ years",
      description: "Build and maintain our cloud infrastructure, monitoring systems, and deployment pipelines.",
      requirements: ["AWS/GCP", "Kubernetes", "CI/CD"],
      posted: "3 days ago"
    },
    {
      id: "5",
      title: "Product Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      salary: "$90k - $140k",
      experience: "3+ years", 
      description: "Drive product marketing strategy, go-to-market campaigns, and user acquisition for our DeFi platform.",
      requirements: ["Product Marketing", "Crypto/DeFi", "Growth Marketing"],
      posted: "1 week ago"
    },
    {
      id: "6",
      title: "Community Manager",
      department: "Marketing",
      location: "Remote",
      type: "Part-time",
      salary: "$50k - $70k",
      experience: "2+ years",
      description: "Build and engage our community across social media platforms, Discord, and Telegram.",
      requirements: ["Community Building", "Social Media", "DeFi Knowledge"],
      posted: "4 days ago"
    }
  ];

  const benefits = [
    "Competitive salary + equity",
    "Remote-first culture",
    "Health, dental & vision insurance", 
    "Unlimited PTO",
    "Annual learning budget",
    "Top-tier equipment",
    "Crypto/DeFi education stipend",
    "Team retreats & conferences"
  ];

  const getDepartmentColor = (dept: string) => {
    const colors = {
      "Engineering": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Research": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
      "Marketing": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "Design": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
    };
    return colors[dept as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const filteredJobs = jobListings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || job.department === filterDepartment;
    const matchesLocation = filterLocation === "all" || job.location === filterLocation;
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            Join Our Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-page-description">
            Help us build the future of DeFi. We're looking for passionate individuals 
            to join our mission of democratizing access to yield opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Why Work With Us?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {benefits.slice(0, 4).map((benefit, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-4" data-testid="button-view-benefits">
                  View All Benefits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Engineering</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Marketing</span>
                    <Badge variant="secondary">2</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Research</span>
                    <Badge variant="secondary">1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search jobs..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-job-search"
                  />
                </div>
              </div>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-department">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-location">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                  <SelectItem value="New York, NY">New York, NY</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job Listings */}
            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={getDepartmentColor(job.department)}>
                            {job.department}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {job.type}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salary}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">{job.posted}</Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {job.experience}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base mb-4">
                      {job.description}
                    </CardDescription>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-sm">Key Requirements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button data-testid={`button-apply-${job.id}`}>
                        Apply Now
                      </Button>
                      <Button variant="outline" data-testid={`button-learn-more-${job.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or check back later for new opportunities.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterDepartment("all");
                      setFilterLocation("all");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Company Culture Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Our Culture</CardTitle>
            <CardDescription>
              What it's like to work at Vault Aggregator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Collaborative</h3>
                <p className="text-sm text-muted-foreground">
                  We work together across teams to solve complex problems and build amazing products.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Passionate</h3>
                <p className="text-sm text-muted-foreground">
                  We're passionate about DeFi and believe in its potential to transform finance.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ExternalLink className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  Open communication and transparency are core to how we operate and make decisions.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Filter className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Quality-focused</h3>
                <p className="text-sm text-muted-foreground">
                  We take pride in building high-quality, secure, and reliable products.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}