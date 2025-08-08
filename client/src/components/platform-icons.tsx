// DeFi Platform Icons Component
// Professional SVG icons for various DeFi protocols and platforms

export interface PlatformIconProps {
  className?: string;
  size?: number;
}

// Uniswap - DEX protocol
export const UniswapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#FF007A"/>
    <path
      d="M8.5 20.5c2-4 6-4 8 0s6 4 8 0M12 12c1-2 3-2 4 0s3 2 4 0"
      stroke="white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="10" cy="18" r="2" fill="white"/>
    <circle cx="22" cy="18" r="2" fill="white"/>
  </svg>
);

// SushiSwap - DEX protocol
export const SushiSwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#0E4F64"/>
    <path
      d="M8 16c0-4 4-8 8-8s8 4 8 8c0 2-1 4-3 5l-5-1-5 1c-2-1-3-3-3-5z"
      fill="#FA52A0"
    />
    <path
      d="M12 14c1-1 2-1 3 0s2 1 3 0"
      stroke="white"
      strokeWidth="1"
      fill="none"
    />
    <circle cx="13" cy="18" r="1" fill="white"/>
    <circle cx="19" cy="18" r="1" fill="white"/>
  </svg>
);

// Aave - Lending protocol
export const AaveIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#B6509E"/>
    <path
      d="M16 6L10 26h4l1-4h6l1 4h4L16 6z"
      fill="white"
    />
    <path
      d="M14 18l2-6 2 6h-4z"
      fill="#B6509E"
    />
  </svg>
);

// Compound - Lending protocol
export const CompoundIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#00D395"/>
    <path
      d="M12 10v12l8-6-8-6z"
      fill="white"
    />
    <path
      d="M20 10v12l-8-6 8-6z"
      fill="white"
      fillOpacity="0.6"
    />
  </svg>
);

// Curve Finance - DEX for stablecoins
export const CurveIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#40E0D0"/>
    <path
      d="M6 16c4-8 12-8 16 0s-4 12-8 12-8-4-8-12z"
      fill="none"
      stroke="white"
      strokeWidth="2"
    />
    <path
      d="M10 16c2-4 6-4 8 0s2 6 0 6-6-2-8-6z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);

// Balancer - DEX and liquidity pools
export const BalancerIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#1E1E1E"/>
    <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.8"/>
    <circle cx="20" cy="12" r="3" fill="white" fillOpacity="0.6"/>
    <circle cx="16" cy="22" r="3" fill="white" fillOpacity="0.4"/>
  </svg>
);

// 1inch - DEX aggregator
export const OneInchIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#1B69EC"/>
    <path
      d="M8 20l4-8 4 4 4-4 4 8-4-4-4 4-4-4-4 4z"
      fill="white"
    />
  </svg>
);

// MakerDAO - CDP platform
export const MakerDAOIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#1AAB9B"/>
    <path
      d="M8 22V10l8 8 8-8v12l-8-6-8 6z"
      fill="white"
    />
  </svg>
);

// Yearn Finance - Yield farming
export const YearnIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#0074D9"/>
    <path
      d="M8 12h16v8L16 26 8 20V12z"
      fill="white"
    />
    <path
      d="M12 16h8v4l-4 2-4-2v-4z"
      fill="#0074D9"
    />
  </svg>
);

// PancakeSwap - BSC DEX
export const PancakeSwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#D1884F"/>
    <path
      d="M16 6c-6 0-10 4-10 10s4 10 10 10 10-4 10-10S22 6 16 6z"
      fill="#1FC7D4"
    />
    <circle cx="13" cy="14" r="2" fill="white"/>
    <circle cx="19" cy="14" r="2" fill="white"/>
    <path
      d="M12 20c2 2 6 2 8 0"
      stroke="white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// QuickSwap - Polygon DEX
export const QuickSwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#448AFF"/>
    <path
      d="M8 16l8-8v6h8v4h-8v6l-8-8z"
      fill="white"
    />
  </svg>
);

// TraderJoe - Avalanche DEX
export const TraderJoeIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#E84142"/>
    <path
      d="M12 10h8v4h-8v8h-4v-8c0-2 2-4 4-4z"
      fill="white"
    />
    <path
      d="M20 14h4v8c0 2-2 4-4 4h-8v-4h8v-8z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);

// SpookySwap - Fantom DEX
export const SpookySwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#1969FF"/>
    <path
      d="M16 6c-4 0-6 2-6 6v4c0 4 2 6 6 6s6-2 6-6v-4c0-4-2-6-6-6z"
      fill="white"
    />
    <circle cx="13" cy="14" r="1" fill="#1969FF"/>
    <circle cx="19" cy="14" r="1" fill="#1969FF"/>
    <path
      d="M13 18c1 1 3 1 4 0"
      stroke="#1969FF"
      strokeWidth="1"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Convex Finance - Curve rewards
export const ConvexIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#FF6B6B"/>
    <path
      d="M8 12l8-4 8 4v8l-8 4-8-4v-8z"
      fill="none"
      stroke="white"
      strokeWidth="2"
    />
    <path
      d="M16 12v8M12 14l8 4M12 18l8-4"
      stroke="white"
      strokeWidth="1"
    />
  </svg>
);

// Default platform icon
export const DefaultPlatformIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#6B7280"/>
    <path
      d="M12 12h8v8h-8v-8z"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 8v4M16 20v4M8 16h4M20 16h4"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Platform icon selector function
export const getPlatformIcon = (platformName: string): React.FC<PlatformIconProps> => {
  const name = platformName.toLowerCase();
  
  if (name.includes('uniswap')) return UniswapIcon;
  if (name.includes('sushi')) return SushiSwapIcon;
  if (name.includes('aave')) return AaveIcon;
  if (name.includes('compound')) return CompoundIcon;
  if (name.includes('curve')) return CurveIcon;
  if (name.includes('balancer')) return BalancerIcon;
  if (name.includes('1inch') || name.includes('oneinch')) return OneInchIcon;
  if (name.includes('maker') || name.includes('mkr')) return MakerDAOIcon;
  if (name.includes('yearn') || name.includes('yfi')) return YearnIcon;
  if (name.includes('pancake')) return PancakeSwapIcon;
  if (name.includes('quick')) return QuickSwapIcon;
  if (name.includes('trader') || name.includes('joe')) return TraderJoeIcon;
  if (name.includes('spooky')) return SpookySwapIcon;
  if (name.includes('convex')) return ConvexIcon;
  
  return DefaultPlatformIcon;
};