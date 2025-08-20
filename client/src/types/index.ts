export interface YieldOpportunity {
  id: string;
  platform: {
    id: string;
    name: string;
    displayName: string;
    slug: string;
    logoUrl?: string;
    website?: string;
    visitUrlTemplate?: string;
    showUnderlyingTokens?: boolean;
  };
  chain: {
    id: string;
    name: string;
    displayName: string;
    color: string;
  };
  tokenPair: string;
  apy: string;
  tvl: string;
  riskLevel: 'low' | 'medium' | 'high';
  poolAddress?: string;
  notes: Array<{
    id: string;
    content: string;
    isPublic: boolean;
  }>;
  categories?: Category[];
  isVisible: boolean;
  lastUpdated: string;
  rawData?: {
    apyMean30d?: number;
    count?: number;
    [key: string]: any;
  };
  holdersCount?: number | null;
  operatingDays?: number | null;
}

export interface FilterOptions {
  chainId?: string;
  platformId?: string;
  categoryId?: string;
  search?: string;
  sortBy?: 'apy' | 'tvl' | 'platform';
}

export interface AppStats {
  totalPools: number;
  activePools: number;
  hiddenPools: number;
  avgApy: number;
  totalTvl: number;
}

export interface Chain {
  id: string;
  name: string;
  displayName: string;
  color: string;
  isActive: boolean;
}

export interface Platform {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  iconUrl?: string;
  description?: string;
  color: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  poolCount: number;
  subcategories?: Category[];
}

export type CategoryWithPoolCount = Category;
