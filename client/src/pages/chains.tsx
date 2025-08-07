import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, TrendingUp, DollarSign, Activity, ExternalLink, Shield } from "lucide-react";

export default function Chains() {
  const [search, setSearch] = useState("");

  const { data: chains, isLoading } = useQuery({
    queryKey: ['/api/chains'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extended chain data with additional metrics
  const enhancedChains = [
    {
      id: "ethereum",
      name: "Ethereum",
      displayName: "Ethereum",
      color: "#627EEA",
      poolCount: 127,
      totalTvl: "$1.2B",
      avgApy: "8.4%",
      status: "active",
      gasPrice: "25 gwei",
      blockTime: "12s",
      security: "High",
      ecosystem: "Mature",
      description: "The most established DeFi ecosystem with the highest TVL and widest protocol support."
    },
    {
      id: "polygon",
      name: "Polygon",
      displayName: "Polygon",
      color: "#8247E5",
      poolCount: 89,
      totalTvl: "$520M",
      avgApy: "12.1%",
      status: "active",
      gasPrice: "0.001 MATIC",
      blockTime: "2s",
      security: "Medium",
      ecosystem: "Growing",
      description: "Layer 2 scaling solution for Ethereum with low fees and fast transactions."
    },
    {
      id: "arbitrum",
      name: "Arbitrum",
      displayName: "Arbitrum",
      color: "#28A0F0",
      poolCount: 64,
      totalTvl: "$380M",
      avgApy: "9.7%",
      status: "active",
      gasPrice: "0.1 gwei",
      blockTime: "1s",
      security: "High",
      ecosystem: "Emerging",
      description: "Optimistic rollup providing fast and cheap transactions while maintaining Ethereum security."
    },
    {
      id: "optimism",
      name: "Optimism",
      displayName: "Optimism",
      color: "#FF0420",
      poolCount: 45,
      totalTvl: "$290M",
      avgApy: "10.3%",
      status: "active",
      gasPrice: "0.001 gwei",
      blockTime: "2s",
      security: "High",
      ecosystem: "Emerging",
      description: "Another optimistic rollup focusing on simplicity and Ethereum compatibility."
    },
    {
      id: "avalanche",
      name: "Avalanche",
      displayName: "Avalanche",
      color: "#E84142",
      poolCount: 38,
      totalTvl: "$180M",
      avgApy: "11.8%",
      status: "active",
      gasPrice: "25 nAVAX",
      blockTime: "1s",
      security: "High",
      ecosystem: "Growing",
      description: "High-performance blockchain with subnet architecture and fast finality."
    },
    {
      id: "fantom",
      name: "Fantom",
      displayName: "Fantom",
      color: "#1969FF",
      poolCount: 29,
      totalTvl: "$95M",
      avgApy: "15.2%",
      status: "active",
      gasPrice: "20 gwei",
      blockTime: "1s",
      security: "Medium",
      ecosystem: "Stable",
      description: "DAG-based smart contract platform with instant transactions."
    }
  ];

  const filteredChains = enhancedChains.filter(chain =>
    chain.name.toLowerCase().includes(search.toLowerCase()) ||
    chain.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const getSecurityBadge = (security: string) => {
    switch (security) {
      case 'High': return <Badge className="bg-green-100 text-green-800">High Security</Badge>;
      case 'Medium': return <Badge variant="secondary">Medium Security</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getEcosystemBadge = (ecosystem: string) => {
    switch (ecosystem) {
      case 'Mature': return <Badge className="bg-blue-100 text-blue-800">Mature</Badge>;
      case 'Growing': return <Badge className="bg-purple-100 text-purple-800">Growing</Badge>;
      case 'Emerging': return <Badge className="bg-yellow-100 text-yellow-800">Emerging</Badge>;
      default: return <Badge variant="outline">Stable</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-chains-title">
            Blockchain Networks
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-chains-subtitle">
            Explore yield opportunities across different blockchain networks
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-chains"
            />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-chains">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Chains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{enhancedChains.length}</p>
              <p className="text-sm text-green-600 mt-1">All active</p>
            </CardContent>
          </Card>

          <Card data-testid="card-combined-tvl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Combined TVL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">$2.6B</p>
              <p className="text-sm text-green-600 mt-1">+7.2% this month</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-pools">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Total Pools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">392</p>
              <p className="text-sm text-blue-600 mt-1">Across all chains</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-apy-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Avg APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">11.2%</p>
              <p className="text-sm text-gray-600 mt-1">Weighted average</p>
            </CardContent>
          </Card>
        </div>

        {/* Chains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChains.map((chain) => (
            <Card key={chain.id} className="hover:shadow-lg transition-shadow" data-testid={`card-chain-${chain.id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: chain.color }}
                    >
                      {chain.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{chain.displayName}</CardTitle>
                      <p className="text-sm text-gray-500">{chain.poolCount} pools</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" data-testid={`button-view-${chain.id}`}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {chain.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total TVL</p>
                    <p className="text-lg font-bold text-green-600">{chain.totalTvl}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg APY</p>
                    <p className="text-lg font-bold text-blue-600">{chain.avgApy}</p>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Gas Price</p>
                    <p className="font-medium">{chain.gasPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Block Time</p>
                    <p className="font-medium">{chain.blockTime}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {getSecurityBadge(chain.security)}
                  {getEcosystemBadge(chain.ecosystem)}
                </div>

                {/* Action Button */}
                <Button className="w-full" variant="outline" data-testid={`button-explore-${chain.id}`}>
                  Explore Pools
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredChains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500" data-testid="text-no-chains">
              No chains found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}