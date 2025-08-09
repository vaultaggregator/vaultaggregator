import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, TrendingUp, TrendingDown, Search, Filter, Plus, Trash2, AlertCircle } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Watchlist() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChain, setFilterChain] = useState("all");
  
  const watchlistPools = [
    {
      id: "1",
      name: "USDC-ETH LP",
      protocol: "Uniswap V3",
      chain: "Ethereum",
      apy: 12.5,
      tvl: "2.3M",
      risk: "Low",
      change24h: 2.1,
      alerts: true
    },
    {
      id: "2", 
      name: "MATIC Staking",
      protocol: "Lido",
      chain: "Polygon",
      apy: 8.7,
      tvl: "45.2M",
      risk: "Low",
      change24h: -0.8,
      alerts: false
    },
    {
      id: "3",
      name: "BTC-WBTC Farm",
      protocol: "Curve",
      chain: "Ethereum", 
      apy: 15.3,
      tvl: "12.8M",
      risk: "Medium",
      change24h: 5.2,
      alerts: true
    }
  ];

  const priceAlerts = [
    {
      id: "1",
      type: "APY Above",
      condition: "15%",
      pool: "USDC-ETH LP",
      status: "active"
    },
    {
      id: "2",
      type: "TVL Below", 
      condition: "$1M",
      pool: "BTC-WBTC Farm",
      status: "triggered"
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "High": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onAdminClick={() => {}} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            Your DeFi Watchlist
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-page-description">
            Track your favorite yield opportunities, set up alerts, and never miss 
            the best DeFi farming opportunities.
          </p>
        </div>

        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="watchlist">My Watchlist</TabsTrigger>
            <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist" className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search pools..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={filterChain} onValueChange={setFilterChain}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-chain-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                </SelectContent>
              </Select>
              <Button data-testid="button-add-pool">
                <Plus className="w-4 h-4 mr-2" />
                Add Pool
              </Button>
            </div>

            {/* Watchlist Table */}
            <div className="space-y-4">
              {watchlistPools.map((pool) => (
                <Card key={pool.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" data-testid={`button-favorite-${pool.id}`}>
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        </Button>
                        <div>
                          <h3 className="font-semibold text-foreground">{pool.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-muted-foreground">{pool.protocol}</span>
                            <Badge variant="outline" className="text-xs">{pool.chain}</Badge>
                            <Badge className={`text-xs ${getRiskColor(pool.risk)}`}>{pool.risk}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">APY</p>
                          <p className="font-semibold text-lg text-green-600">{pool.apy}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">TVL</p>
                          <p className="font-semibold">${pool.tvl}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">24h Change</p>
                          <p className={`font-semibold flex items-center ${
                            pool.change24h > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {pool.change24h > 0 ? (
                              <TrendingUp className="w-4 h-4 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1" />
                            )}
                            {Math.abs(pool.change24h)}%
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {pool.alerts && (
                            <Badge variant="secondary" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Alert
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" data-testid={`button-remove-${pool.id}`}>
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {watchlistPools.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Your watchlist is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Start adding yield opportunities to track their performance and set up alerts.
                  </p>
                  <Button data-testid="button-browse-pools">
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Pools
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Price Alerts</h2>
                <p className="text-muted-foreground">Get notified when your conditions are met</p>
              </div>
              <Button data-testid="button-create-alert">
                <Plus className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
            </div>

            <div className="space-y-4">
              {priceAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <AlertCircle className={`w-5 h-5 ${
                          alert.status === 'active' ? 'text-blue-500' : 'text-red-500'
                        }`} />
                        <div>
                          <h3 className="font-semibold text-foreground">{alert.pool}</h3>
                          <p className="text-sm text-muted-foreground">
                            {alert.type} {alert.condition}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={alert.status === 'active' ? 'default' : 'destructive'}>
                          {alert.status}
                        </Badge>
                        <Button variant="ghost" size="sm" data-testid={`button-delete-alert-${alert.id}`}>
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {priceAlerts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No alerts set up</h3>
                  <p className="text-muted-foreground mb-4">
                    Create alerts to get notified when APY, TVL, or other metrics hit your target levels.
                  </p>
                  <Button data-testid="button-create-first-alert">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Alert
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}