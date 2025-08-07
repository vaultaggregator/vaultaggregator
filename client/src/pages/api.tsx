import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Key, BookOpen, Zap, Shield, Globe } from "lucide-react";

export default function API() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("pools");

  const endpoints = [
    {
      id: "pools",
      method: "GET",
      path: "/api/pools",
      description: "Retrieve all yield pools with filtering options",
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
      path: "/api/pools/{id}",
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
        "rawData": { "additional": "protocol-specific data" }
      }
    },
    {
      id: "chains",
      method: "GET", 
      path: "/api/chains",
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
      path: "/api/platforms", 
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
      path: "/api/stats",
      description: "Get platform-wide statistics",
      parameters: [],
      response: {
        "totalPools": 392,
        "activePools": 387,
        "totalTvl": "2400000000",
        "averageApy": "8.7"
      }
    }
  ];

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-api-title">
            API Documentation
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-api-subtitle">
            Integrate Vault Aggregator data into your applications
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-api-version">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Code2 className="w-4 h-4 mr-2 text-blue-600" />
                API Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">v1.0</p>
              <Badge className="mt-2 bg-green-100 text-green-800">Stable</Badge>
            </CardContent>
          </Card>

          <Card data-testid="card-rate-limit">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-orange-600" />
                Rate Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">1000/hr</p>
              <p className="text-sm text-gray-600 mt-1">Per API key</p>
            </CardContent>
          </Card>

          <Card data-testid="card-uptime">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">99.9%</p>
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
                  {endpoints.map((endpoint) => (
                    <button
                      key={endpoint.id}
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedEndpoint === endpoint.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      data-testid={`button-endpoint-${endpoint.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge 
                            className={`text-xs ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {endpoint.method}
                          </Badge>
                          <p className="font-mono text-sm mt-1">{endpoint.path}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Endpoint Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Badge className="mr-3 bg-green-100 text-green-800">
                        {currentEndpoint?.method}
                      </Badge>
                      <code className="text-lg">{currentEndpoint?.path}</code>
                    </CardTitle>
                    <Button variant="outline" size="sm" data-testid="button-try-endpoint">
                      Try it out
                    </Button>
                  </div>
                  <p className="text-gray-600 mt-2">{currentEndpoint?.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Parameters */}
                  {currentEndpoint?.parameters && currentEndpoint.parameters.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Parameters</h4>
                      <div className="space-y-3">
                        {currentEndpoint.parameters.map((param, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {param.name}
                              </code>
                              <Badge variant={param.required ? "default" : "secondary"}>
                                {param.required ? "Required" : "Optional"}
                              </Badge>
                              <Badge variant="outline">{param.type}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{param.description}</p>
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
                <p className="text-gray-600">
                  Vault Aggregator API uses API keys for authentication. Include your API key in the request headers.
                </p>
                
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                  <pre><code>{`curl -X GET "https://api.vault-aggregator.com/api/pools" \\
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
                      <Button variant="outline" className="mt-3 w-full">Get Free Key</Button>
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
                      <Button className="mt-3 w-full">Upgrade to Pro</Button>
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
const response = await fetch('https://api.vault-aggregator.com/api/pools?limit=10', {
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

response = requests.get('https://api.vault-aggregator.com/api/stats', headers=headers)
stats = response.json()

print(f"Total TVL: ${stats['totalTvl']}")
print(f"Average APY: {stats['averageApy']}%")`}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">cURL</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`# Get Ethereum pools only
curl -X GET "https://api.vault-aggregator.com/api/pools?chainId=ethereum" \\
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
                <p className="text-gray-600">
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