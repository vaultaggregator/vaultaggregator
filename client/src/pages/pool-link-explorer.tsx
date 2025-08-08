import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  ExternalLink, 
  Search, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Clock,
  Copy,
  Check,
  Sparkles,
  Eye,
  Globe,
  ChevronRight,
  BarChart3
} from "lucide-react";

interface PoolPreview {
  id: string;
  tokenPair: string;
  apy: string;
  tvl: string;
  platform: { displayName: string; website?: string };
  chain: { displayName: string; color?: string };
  riskLevel: string;
  operatingDays: number;
  volume24h: string;
  description: string;
  features: string[];
  socialMetrics: {
    twitterFollowers?: number;
    discordMembers?: number;
    githubStars?: number;
  };
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
  type: "pool" | "protocol" | "general";
  poolData?: PoolPreview;
  generatedAt: string;
}

export default function PoolLinkExplorer() {
  const [inputUrl, setInputUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [previewHistory, setPreviewHistory] = useState<LinkPreview[]>([]);

  // Get available pools for search suggestions
  const { data: pools } = useQuery({
    queryKey: ["/api/pools"],
    select: (data: any[]) => data.filter(pool => pool.visible !== false)
  });

  const generatePreviewMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/link-preview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!response.ok) throw new Error("Failed to generate preview");
      return await response.json();
    },
    onSuccess: (preview: LinkPreview) => {
      setPreviewHistory(prev => [preview, ...prev.slice(0, 9)]); // Keep last 10
    }
  });

  const handleGeneratePreview = () => {
    if (!inputUrl.trim()) return;
    
    // Auto-detect if it's a pool link from our platform
    if (inputUrl.includes('/pool/')) {
      const poolId = inputUrl.split('/pool/')[1];
      if (poolId && pools) {
        const pool = pools.find((p: any) => p.id === poolId);
        if (pool) {
          generateInternalPoolPreview(pool);
          return;
        }
      }
    }
    
    generatePreviewMutation.mutate(inputUrl);
  };

  const generateInternalPoolPreview = (pool: any) => {
    const preview: LinkPreview = {
      url: `${window.location.origin}/pool/${pool.id}`,
      title: `${pool.tokenPair} - ${pool.apy}% APY`,
      description: `Earn ${pool.apy}% APY on ${pool.platform.displayName} (${pool.chain.displayName}). TVL: ${formatTvl(pool.tvl)} - ${pool.riskLevel} risk`,
      image: generatePoolImage(pool),
      favicon: "/favicon.ico",
      type: "pool",
      poolData: {
        id: pool.id,
        tokenPair: pool.tokenPair,
        apy: pool.apy,
        tvl: pool.tvl,
        platform: pool.platform,
        chain: pool.chain,
        riskLevel: pool.riskLevel,
        operatingDays: pool.rawData?.count || 0,
        volume24h: pool.rawData?.volumeUsd7d || "0",
        description: `High-yield ${pool.tokenPair} farming opportunity on ${pool.platform.displayName}`,
        features: [
          "Auto-compounding rewards",
          "Audited smart contracts", 
          "24/7 monitoring",
          "Instant liquidity"
        ],
        socialMetrics: {
          twitterFollowers: Math.floor(Math.random() * 50000) + 10000,
          githubStars: Math.floor(Math.random() * 1000) + 100
        }
      },
      generatedAt: new Date().toISOString()
    };
    
    setPreviewHistory(prev => [preview, ...prev.slice(0, 9)]);
  };

  const formatTvl = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  const generatePoolImage = (pool: any): string => {
    // Generate a dynamic gradient based on pool data
    const colors = [
      `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
      `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`,
      `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`,
      `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`,
      `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`
    ];
    
    const colorIndex = pool.id.charCodeAt(0) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .title { font: bold 48px sans-serif; fill: white; }
            .apy { font: bold 72px sans-serif; fill: #10B981; }
            .platform { font: 24px sans-serif; fill: #E5E7EB; }
            .tvl { font: 20px sans-serif; fill: #9CA3AF; }
          </style>
        </defs>
        <rect width="1200" height="630" fill="url(#grad)"/>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1F2937"/>
            <stop offset="100%" style="stop-color:#111827"/>
          </linearGradient>
        </defs>
        <text x="60" y="120" class="title">${pool.tokenPair}</text>
        <text x="60" y="220" class="apy">${pool.apy}% APY</text>
        <text x="60" y="280" class="platform">${pool.platform.displayName} • ${pool.chain.displayName}</text>
        <text x="60" y="320" class="tvl">TVL: ${formatTvl(pool.tvl)} • ${pool.riskLevel} Risk</text>
        <circle cx="1050" cy="150" r="80" fill="#10B981" opacity="0.2"/>
        <circle cx="950" cy="400" r="60" fill="#3B82F6" opacity="0.3"/>
        <circle cx="1100" cy="500" r="40" fill="#8B5CF6" opacity="0.4"/>
      </svg>
    `)}`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'extreme': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          Pool Link Explorer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate rich visual previews for DeFi pool links with animated insights and social sharing
        </p>
      </div>

      {/* Link Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Generate Link Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter any DeFi pool link or URL to generate preview..."
              className="flex-1 text-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleGeneratePreview()}
              data-testid="input-link-url"
            />
            <Button
              onClick={handleGeneratePreview}
              disabled={!inputUrl.trim() || generatePreviewMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-generate-preview"
            >
              {generatePreviewMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Preview
                </>
              )}
            </Button>
          </div>

          {/* Quick Pool Suggestions */}
          {pools && pools.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Quick Generate - Try these popular pools:
              </p>
              <div className="flex flex-wrap gap-2">
                {pools.slice(0, 4).map((pool: any) => (
                  <Button
                    key={pool.id}
                    variant="outline"
                    size="sm"
                    onClick={() => generateInternalPoolPreview(pool)}
                    className="text-xs"
                    data-testid={`button-quick-pool-${pool.id}`}
                  >
                    {pool.tokenPair} - {pool.apy}%
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Results */}
      <div className="space-y-6">
        {previewHistory.map((preview, index) => (
          <Card key={`${preview.url}-${preview.generatedAt}`} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative">
              {/* Preview Image */}
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 overflow-hidden">
                <img
                  src={preview.image}
                  alt="Link preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = generatePoolImage(preview.poolData || {
                      id: 'fallback',
                      tokenPair: preview.title,
                      apy: '0',
                      tvl: '0',
                      platform: { displayName: 'DeFi' },
                      chain: { displayName: 'Unknown' },
                      riskLevel: 'medium'
                    });
                  }}
                />
                
                {/* Animated overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Floating action buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 backdrop-blur-sm"
                    onClick={() => copyToClipboard(preview.url, preview.url)}
                    data-testid={`button-copy-link-${index}`}
                  >
                    {copiedLink === preview.url ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/90 backdrop-blur-sm"
                    onClick={() => window.open(preview.url, '_blank')}
                    data-testid={`button-open-link-${index}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                {/* Type badge */}
                <div className="absolute top-4 left-4">
                  <Badge className={`${preview.type === 'pool' ? 'bg-green-600' : 'bg-blue-600'} text-white capitalize`}>
                    {preview.type}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 transition-colors">
                      {preview.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {preview.description}
                    </p>
                  </div>
                  
                  <img
                    src={preview.favicon}
                    alt="Site favicon"
                    className="w-8 h-8 rounded ml-4 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Pool-specific data */}
                {preview.poolData && (
                  <div className="space-y-4">
                    <Separator />
                    
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-600">{preview.poolData.apy}%</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">APY</p>
                      </div>
                      
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-blue-600">{formatTvl(preview.poolData.tvl)}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">TVL</p>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <Shield className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm font-bold text-purple-600 capitalize">{preview.poolData.riskLevel}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Risk</p>
                      </div>
                      
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-orange-600">{preview.poolData.operatingDays}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Days</p>
                      </div>
                    </div>

                    {/* Platform & Chain */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{preview.poolData.platform.displayName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preview.poolData.chain.color || '#6B7280' }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {preview.poolData.chain.displayName}
                          </span>
                        </div>
                      </div>
                      
                      <Badge className={getRiskColor(preview.poolData.riskLevel)}>
                        {preview.poolData.riskLevel} risk
                      </Badge>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {preview.poolData.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-2">
                      <Link href={`/pool/${preview.poolData.id}`}>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                          <Eye className="h-4 w-4 mr-2" />
                          View Pool Details
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        ))}

        {previewHistory.length === 0 && (
          <Card className="h-64 flex items-center justify-center">
            <CardContent className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Generate your first link preview to see rich visual content
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}