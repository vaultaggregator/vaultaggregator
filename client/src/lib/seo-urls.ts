// SEO-friendly URL generation utilities
import type { YieldOpportunity } from "@/types";

// Create URL-safe slug from text
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')    // Remove leading/trailing hyphens
    .replace(/-+/g, '-');       // Replace multiple hyphens with single
}

// Generate SEO-friendly URL for yield opportunity
export function generateYieldUrl(opportunity: YieldOpportunity): string {
  const network = createSlug(opportunity.chain.name);
  const protocol = createSlug(opportunity.platform.name);
  const tokenPair = createSlug(opportunity.tokenPair);
  const apy = opportunity.rawData?.apyBase 
    ? Math.round(parseFloat(opportunity.rawData.apyBase.toString())) 
    : 'unknown';
  
  // Create descriptive slug: token-pair-apy-yield
  const slug = `${tokenPair}-${apy}apy-yield`;
  
  return `/yield/${network}/${protocol}/${opportunity.id}/${slug}`;
}

// Generate fallback legacy URL
export function generateLegacyUrl(poolId: string): string {
  return `/pool/${poolId}`;
}

// Parse SEO URL parameters
export function parseYieldUrl(params: {
  network?: string;
  protocol?: string;
  poolId?: string;
  slug?: string;
}) {
  return {
    network: params.network?.replace(/-/g, ' ') || '',
    protocol: params.protocol?.replace(/-/g, ' ') || '',
    poolId: params.poolId || '',
    slug: params.slug || ''
  };
}

// Generate page title for SEO
export function generatePageTitle(opportunity: YieldOpportunity): string {
  const apy = opportunity.rawData?.apyBase 
    ? `${Math.round(parseFloat(opportunity.rawData.apyBase.toString()))}%` 
    : '';
  
  return `${opportunity.tokenPair} ${apy} APY - ${opportunity.platform.displayName} on ${opportunity.chain.displayName} | Vault Aggregator`;
}

// Generate meta description for SEO
export function generateMetaDescription(opportunity: YieldOpportunity): string {
  const apy = opportunity.rawData?.apyBase 
    ? `${parseFloat(opportunity.rawData.apyBase.toString()).toFixed(2)}%` 
    : 'competitive';
  
  const tvl = opportunity.rawData?.tvlUsd 
    ? formatTvlForSeo(opportunity.rawData.tvlUsd.toString())
    : '';
  
  const tvlText = tvl ? ` with ${tvl} TVL` : '';
  
  return `Earn ${apy} APY on ${opportunity.tokenPair} through ${opportunity.platform.displayName} on ${opportunity.chain.displayName}${tvlText}. Compare DeFi yield farming opportunities and maximize your crypto returns.`;
}

// Format TVL for SEO descriptions
function formatTvlForSeo(tvl: string): string {
  const num = parseFloat(tvl);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(0)}`;
}

// Generate canonical URL
export function generateCanonicalUrl(opportunity: YieldOpportunity, baseUrl: string = ''): string {
  return `${baseUrl}${generateYieldUrl(opportunity)}`;
}

// Generate breadcrumb data
export function generateBreadcrumbs(opportunity: YieldOpportunity) {
  return [
    { name: 'Home', url: '/' },
    { name: 'Yield Opportunities', url: '/' },
    { name: opportunity.chain.displayName, url: `/?network=${opportunity.chain.id}` },
    { name: opportunity.platform.displayName, url: `/?protocol=${opportunity.platform.id}` },
    { name: opportunity.tokenPair, url: generateYieldUrl(opportunity) }
  ];
}