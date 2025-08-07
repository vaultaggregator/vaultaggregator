import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Key, BookOpen, Zap, Shield, Globe } from "lucide-react";

export default function API() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("public-stats");

  // Public API endpoints (no authentication required)
  const publicEndpoints = [
    {
      id: "public-stats",
      method: "GET",
      path: "/api/public/stats",
      description: "Get platform-wide statistics including total pools, average APY, and TVL",
      parameters: [],
      response: {
        "totalPools": 3,
        "activePools": 3,
        "avgApy": 6.21,
        "totalTvl": "34,031,083,802",
        "lastUpdated": "2025-08-07T16:20:17.243Z"
      }
    },
    {
      id: "public-chains",
      method: "GET",
      path: "/api/public/chains",
      description: "List all supported blockchain networks",
      parameters: [],
      response: {
        "chains": [
          {
            "id": "23532a30-59bb-4822-a2c9-03e58d34c3ce",
            "name": "ethereum",
            "displayName": "Ethereum",
            "color": "#627EEA",
            "isActive": true
          },
          {
            "id": "b0b0e11c-a0d0-4b52-99f4-b8f6b0c730dc",
            "name": "arbitrum",
            "displayName": "Arbitrum",
            "color": "#96BEDC",
            "isActive": true
          }
        ]
      }
    },
    {
      id: "public-platforms",
      method: "GET",
      path: "/api/public/platforms",
      description: "List all supported DeFi protocols and platforms",
      parameters: [],
      response: {
        "platforms": [
          {
            "id": "platform-123",
            "name": "morpho-blue",
            "displayName": "Morpho Blue",
            "website": "https://morpho.org",
            "isActive": true
          }
        ]
      }
    },
    {
      id: "public-top-pools",
      method: "GET",
      path: "/api/public/top-pools",
      description: "Get top performing yield pools (limited to 50 pools maximum)",
      parameters: [
        { name: "limit", type: "number", required: false, description: "Number of pools to return (default: 10, max: 50)" }
      ],
      response: {
        "pools": [
          {
            "id": "12409481-f9e9-4dba-b0f8-c8b7c95deb62",
            "tokenPair": "USDC",
            "apy": "10.3247",
            "tvl": "9556322.00",
            "riskLevel": "low",
            "platform": {
              "name": "morpho-blue",
              "displayName": "morpho-blue"
            },
            "chain": {
              "name": "ethereum",
              "displayName": "Ethereum",
              "color": "#627EEA"
            },
            "lastUpdated": "2025-08-07T12:55:29.513Z"
          }
        ],
        "count": 2,
        "maxLimit": 50
      }
    }
  ];

  // Authenticated API endpoints (require API key)
  const authenticatedEndpoints = [
    {
      id: "pools",
      method: "GET",
      path: "/api/v1/pools",
      description: "Retrieve all yield pools with advanced filtering and search options",
      parameters: [
        { name: "chainId", type: "string", required: false, description: "Filter by blockchain network" },
        { name: "platformId", type: "string", required: false, description: "Filter by protocol platform" },
        { name: "search", type: "string", required: false, description: "Search pools by token pair" },
        { name: "limit", type: "number", required: false, description: "Number of results (default: 50)" },
        { name: "offset", type: "number", required: false, description: "Pagination offset (default: 0)" }
      ],
      response: {
        "pools": [
          {
            "id": "pool-123",
            "tokenPair": "USDC/ETH",
            "apy": "12.45",
            "tvl": "1500000.00",
            "riskLevel": "medium",
            "platform": { "name": "uniswap-v3", "displayName": "Uniswap V3" },
            "chain": { "name": "ethereum", "displayName": "Ethereum" }
          }
        ]
      }
    },
    {
      id: "pool-detail",
      method: "GET",
      path: "/api/v1/pools/{id}",
      description: "Get detailed information about a specific pool",
      parameters: [
        { name: "id", type: "string", required: true, description: "Unique pool identifier" }
      ],
      response: {
        "id": "pool-123",
        "tokenPair": "USDC/ETH",
        "apy": "12.45",
        "tvl": "1500000.00",
        "riskLevel": "medium",
        "poolAddress": "0x...",
        "platform": { "name": "uniswap-v3", "displayName": "Uniswap V3" },
        "chain": { "name": "ethereum", "displayName": "Ethereum" }
      }
    },
    {
      id: "chains",
      method: "GET", 
      path: "/api/v1/chains",
      description: "List all supported blockchain networks",
      parameters: [],
      response: {
        "chains": [
          {
            "id": "ethereum",
            "name": "ethereum",
            "displayName": "Ethereum",
            "color": "#627EEA",
            "isActive": true
          }
        ]
      }
    },
    {
      id: "platforms",
      method: "GET",
      path: "/api/v1/platforms", 
      description: "List all supported DeFi protocols",
      parameters: [],
      response: {
        "platforms": [
          {
            "id": "uniswap-v3",
            "name": "uniswap-v3",
            "displayName": "Uniswap V3",
            "website": "https://uniswap.org",
            "isActive": true
          }
        ]
      }
    },
    {
      id: "stats",
      method: "GET",
      path: "/api/v1/stats",
      description: "Get platform-wide statistics",
      parameters: [],
      response: {
        "totalPools": 392,
        "activePools": 387,
        "hiddenPools": 22,
        "avgApy": 8.7,
        "totalTvl": "2,400,000,000"
      }
    }
  ];

  const allEndpoints = [...publicEndpoints, ...authenticatedEndpoints];
  const currentEndpoint = allEndpoints.find(e => e.id === selectedEndpoint);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-api-title">
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-api-subtitle">
            Integrate Vault Aggregator data into your applications
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-api-public">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Public API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{publicEndpoints.length}</p>
              <p className="text-sm text-muted-foreground">No authentication required</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-api-authenticated">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Key className="w-4 h-4 mr-2" />
                Authenticated API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{authenticatedEndpoints.length}</p>
              <p className="text-sm text-muted-foreground">Requires API key</p>
            </CardContent>
          </Card>
          
          <Card data-testid="card-api-version">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Code2 className="w-4 h-4 mr-2 text-blue-600" />
                API Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">v1.0</p>
              <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Stable</Badge>
            </CardContent>
          </Card>

          <Card data-testid="card-rate-limit">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Zap className="w-4 h-4 mr-2 text-orange-600" />
                Rate Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">1000/hr</p>
              <p className="text-sm text-muted-foreground mt-1">Per API key</p>
            </CardContent>
          </Card>

          <Card data-testid="card-uptime">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">99.9%</p>
              <p className="text-sm text-green-600 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="endpoints" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-api">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Endpoint List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Tabs defaultValue="public" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="public">Public API</TabsTrigger>
                      <TabsTrigger value="authenticated">Authenticated API</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="public" className="space-y-2">
                      {publicEndpoints.map((endpoint) => (
                        <button
                          key={endpoint.id}
                          onClick={() => setSelectedEndpoint(endpoint.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedEndpoint === endpoint.id
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                              : 'hover:bg-muted border-border'
                          }`}
                          data-testid={`button-endpoint-${endpoint.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                  {endpoint.method}
                                </Badge>
                                <Globe className="w-3 h-3 text-green-600" />
                              </div>
                              <p className="font-mono text-sm">{endpoint.path}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </TabsContent>

                    <TabsContent value="authenticated" className="space-y-2">
                      {authenticatedEndpoints.map((endpoint) => (
                        <button
                          key={endpoint.id}
                          onClick={() => setSelectedEndpoint(endpoint.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedEndpoint === endpoint.id
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                              : 'hover:bg-muted border-border'
                          }`}
                          data-testid={`button-endpoint-${endpoint.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                  {endpoint.method}
                                </Badge>
                                <Key className="w-3 h-3 text-blue-600" />
                              </div>
                              <p className="font-mono text-sm">{endpoint.path}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Endpoint Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Badge className="mr-3 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {currentEndpoint?.method}
                      </Badge>
                      <code className="text-lg text-foreground">{currentEndpoint?.path}</code>
                    </CardTitle>
                    <Button variant="outline" size="sm" data-testid="button-try-endpoint">
                      Try it out
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-2">{currentEndpoint?.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Parameters */}
                  {currentEndpoint?.parameters && currentEndpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Parameters</h4>
                      <div className="space-y-3">
                        {currentEndpoint.parameters.map((param, index) => (
                          <div key={index} className="border border-border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                {param.name}
                              </code>
                              <Badge variant={param.required ? "default" : "secondary"}>
                                {param.required ? "Required" : "Optional"}
                              </Badge>
                              <Badge variant="outline">{param.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Example */}
                  <div>
                    <h4 className="font-semibold mb-3">Response Example</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{JSON.stringify(currentEndpoint?.response, null, 2)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  API Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Vault Aggregator API uses API keys for authentication. Include your API key in the request headers.
                </p>
                
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                  <pre><code>{`curl -X GET "${window.location.origin}/api/v1/pools" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code></pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-orange-800 mb-2">Free Tier</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• 1,000 requests/hour</li>
                        <li>• Basic pool data</li>
                        <li>• Community support</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        className="mt-3 w-full"
                        onClick={() => window.open('/admin/login', '_blank')}
                        data-testid="button-get-free-key"
                      >
                        Get Free Key
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Pro Tier</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 10,000 requests/hour</li>
                        <li>• Historical data access</li>
                        <li>• Priority support</li>
                        <li>• Webhook notifications</li>
                      </ul>
                      <Button 
                        className="mt-3 w-full"
                        onClick={() => window.open('/admin/login', '_blank')}
                        data-testid="button-upgrade-to-pro"
                      >
                        Upgrade to Pro
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">JavaScript / Node.js</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`// Fetch all pools with high APY
const response = await fetch('${window.location.origin}/api/v1/pools?limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
const highYieldPools = data.pools.filter(pool => parseFloat(pool.apy) > 10);
console.log('High yield pools:', highYieldPools);`}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Python</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`import requests

# Get pool statistics
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('${window.location.origin}/api/v1/stats', headers=headers)
stats = response.json()

print(f"Total TVL: {stats['totalTvl']}")
print(f"Average APY: {stats['avgApy']}%")`}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">cURL</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`# Get Ethereum pools only
curl -X GET "${window.location.origin}/api/v1/pools?chainId=ethereum" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Webhook Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Get real-time notifications when pool data changes or new opportunities become available.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Available Events</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <Badge variant="outline" className="mr-2">pool.created</Badge>
                        New pool detected
                      </li>
                      <li className="flex items-center">
                        <Badge variant="outline" className="mr-2">pool.apy_changed</Badge>
                        APY threshold reached
                      </li>
                      <li className="flex items-center">
                        <Badge variant="outline" className="mr-2">pool.tvl_changed</Badge>
                        TVL significant change
                      </li>
                      <li className="flex items-center">
                        <Badge variant="outline" className="mr-2">pool.risk_updated</Badge>
                        Risk level modified
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Webhook Payload Example</h4>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      <code>{`{
  "event": "pool.apy_changed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "poolId": "pool-123",
    "tokenPair": "USDC/ETH",
    "oldApy": "8.5",
    "newApy": "12.4",
    "threshold": "10.0"
  }
}`}</code>
                    </pre>
                  </div>
                </div>

                <Button className="w-full md:w-auto">Configure Webhooks</Button>
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