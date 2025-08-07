import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, ExternalLink, Calendar, TrendingUp, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { YieldOpportunity } from "@/types";

export default function PoolDetail() {
  const { poolId } = useParams<{ poolId: string }>();
  
  const { data: pool, isLoading, error } = useQuery<YieldOpportunity>({
    queryKey: ['/api/pools', poolId],
    enabled: !!poolId,
  });

  const formatTvl = (tvl: string): string => {
    const num = parseFloat(tvl);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatApy = (apy: string): string => {
    const num = parseFloat(apy);
    return `${num.toFixed(2)}%`;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPlatformInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="bg-white rounded-xl p-8">
              <div className="h-12 bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pool Not Found</h2>
              <p className="text-gray-600">The requested pool could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back-to-pools">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pools
            </Button>
          </Link>
        </div>

        {/* Pool Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {/* Platform Logo */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden shadow-lg"
                  data-testid={`logo-${pool.platform.name}`}
                >
                  {pool.platform.logoUrl ? (
                    <img 
                      src={pool.platform.logoUrl} 
                      alt={pool.platform.displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{
                        background: `linear-gradient(135deg, ${pool.chain.color}80, ${pool.chain.color})`
                      }}
                    >
                      {getPlatformInitials(pool.platform.displayName)}
                    </div>
                  )}
                </div>

                {/* Pool Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-pool-title">
                    {pool.tokenPair}
                  </h1>
                  <p className="text-xl text-gray-600 mb-3" data-testid="text-platform-name">
                    {pool.platform.displayName}
                  </p>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant="outline"
                      className="text-sm px-3 py-1"
                      style={{ 
                        backgroundColor: `${pool.chain.color}20`, 
                        color: pool.chain.color,
                        borderColor: `${pool.chain.color}40`
                      }}
                      data-testid="badge-network"
                    >
                      {pool.chain.displayName}
                    </Badge>
                    <Badge 
                      className={`text-sm px-3 py-1 ${getRiskColor(pool.riskLevel)}`}
                      data-testid="badge-risk"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)} Risk
                    </Badge>
                  </div>
                </div>
              </div>

              {/* External Link Button */}
              <Button 
                variant="outline" 
                size="lg" 
                className="hover:bg-blue-50"
                data-testid="button-external-link"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Visit Platform
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                Current APY (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600" data-testid="text-apy-current">
                {formatApy(pool.apy)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                30-Day Average APY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500" data-testid="text-apy-30d">
                {pool.rawData?.apyMean30d ? formatApy(pool.rawData.apyMean30d.toString()) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                Total Value Locked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600" data-testid="text-tvl">
                {formatTvl(pool.tvl)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                Operating Since
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-700" data-testid="text-operating-days">
                {pool.rawData?.count ? `${pool.rawData.count}` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">days</p>
            </CardContent>
          </Card>
        </div>

        {/* Pool Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pool Information */}
          <Card>
            <CardHeader>
              <CardTitle>Pool Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Token Pair</h4>
                <p className="text-gray-700" data-testid="text-token-pair">{pool.tokenPair}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Platform</h4>
                <p className="text-gray-700" data-testid="text-platform">{pool.platform.displayName}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Blockchain Network</h4>
                <p className="text-gray-700" data-testid="text-network">{pool.chain.displayName}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
                <Badge className={`${getRiskColor(pool.riskLevel)}`}>
                  {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)} Risk
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              {pool.notes && pool.notes.length > 0 ? (
                <div className="space-y-4">
                  {pool.notes.map((note, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-gray-700" data-testid={`text-note-${index}`}>
                        💡 {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No additional notes available for this pool.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}