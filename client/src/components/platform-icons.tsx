// DeFi Platform Icons Component
// Professional SVG icons for various DeFi protocols and platforms

export interface PlatformIconProps {
  className?: string;
  size?: number;
}

// Uniswap - Official logo based on Wikipedia SVG
export const UniswapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#FF007A"/>
    <path
      d="M64 20c-24.3 0-44 19.7-44 44 0 24.3 19.7 44 44 44 24.3 0 44-19.7 44-44 0-24.3-19.7-44-44-44zm0 4c22.1 0 40 17.9 40 40 0 22.1-17.9 40-40 40-22.1 0-40-17.9-40-40 0-22.1 17.9-40 40-40z"
      fill="white"
    />
    <path
      d="M51.5 48.2c-2.1 1.2-3.5 3.4-3.5 6 0 3.9 3.1 7 7 7 1.9 0 3.6-.8 4.9-2.1l8.1 4.7c-.6 1.5-.9 3.1-.9 4.8 0 7.2 5.8 13 13 13s13-5.8 13-13c0-7.2-5.8-13-13-13-2.8 0-5.4 1.1-7.3 2.9L64 54.8c1.3-1.3 2.1-3 2.1-4.9 0-3.9-3.1-7-7-7-1.9 0-3.6.8-4.9 2.1l-8.1-4.7c.6-1.5.9-3.1.9-4.8 0-7.2-5.8-13-13-13s-13 5.8-13 13c0 7.2 5.8 13 13 13 2.8 0 5.4-1.1 7.3-2.9l7.8 3.7z"
      fill="white"
    />
  </svg>
);

// SushiSwap - Based on official brand colors and design
export const SushiSwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#0E4F64"/>
    <path
      d="M32 64c0-17.7 14.3-32 32-32s32 14.3 32 32c0 8.8-3.6 16.8-9.4 22.6L64 108.8 41.4 86.6C35.6 80.8 32 72.8 32 64z"
      fill="#FA52A0"
    />
    <ellipse cx="52" cy="56" rx="4" ry="6" fill="white"/>
    <ellipse cx="76" cy="56" rx="4" ry="6" fill="white"/>
    <path
      d="M48 72c8 8 24 8 32 0"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M56 84c4 4 12 4 16 0"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Aave - Official Ghost logo based on brand guidelines
export const AaveIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#9896FF"/>
    <path
      d="M64 20c-7.5 0-14 2.5-19.5 6.7-5.5 4.2-9.5 10.3-9.5 17.3 0 12 8 22 19 25.5V92c0 3.3 2.7 6 6 6s6-2.7 6-6V69.5c11-3.5 19-13.5 19-25.5 0-7-4-13.1-9.5-17.3C78 22.5 71.5 20 64 20z"
      fill="white"
    />
    <ellipse cx="54" cy="44" rx="4" ry="6" fill="#9896FF"/>
    <ellipse cx="74" cy="44" rx="4" ry="6" fill="#9896FF"/>
    <path
      d="M52 56c4 6 12 6 16 0"
      stroke="#9896FF"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M58 88c2 4 6 4 8 0"
      stroke="#9896FF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Compound - Official brand design with chart concept
export const CompoundIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#00D395"/>
    <path
      d="M28 84L40 72L52 60L64 48L76 36L88 24L100 32"
      stroke="white"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="40" cy="72" r="6" fill="white"/>
    <circle cx="52" cy="60" r="6" fill="white"/>
    <circle cx="64" cy="48" r="6" fill="white"/>
    <circle cx="76" cy="36" r="6" fill="white"/>
    <circle cx="88" cy="24" r="6" fill="white"/>
  </svg>
);

// Curve Finance - Based on official CRV logo
export const CurveIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#40E0D0"/>
    <path
      d="M20 64c12-32 44-32 56 0s-12 44-28 44-28-12-28-44z"
      fill="none"
      stroke="white"
      strokeWidth="6"
    />
    <path
      d="M32 64c8-16 24-16 32 0s8 24 0 24-24-8-32-24z"
      fill="white"
      opacity="0.9"
    />
    <path
      d="M44 64c4-8 12-8 16 0s4 12 0 12-12-4-16-12z"
      fill="#40E0D0"
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

// PancakeSwap - Official bunny/rabbit design
export const PancakeSwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#D1884F"/>
    <ellipse cx="64" cy="72" rx="28" ry="32" fill="#1FC7D4"/>
    <ellipse cx="52" cy="40" rx="8" ry="16" fill="#1FC7D4"/>
    <ellipse cx="76" cy="40" rx="8" ry="16" fill="#1FC7D4"/>
    <circle cx="56" cy="60" r="4" fill="white"/>
    <circle cx="72" cy="60" r="4" fill="white"/>
    <ellipse cx="64" cy="72" rx="6" ry="4" fill="#D1884F"/>
    <path
      d="M54 80c4 4 12 4 16 0"
      stroke="white"
      strokeWidth="3"
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

// SpookySwap - Official ghost/BOO design
export const SpookySwapIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="64" cy="64" r="64" fill="#1969FF"/>
    <path
      d="M64 20c-16 0-24 8-24 24v32c0 16 8 24 24 24s24-8 24-24V44c0-16-8-24-24-24z"
      fill="white"
    />
    <path
      d="M40 100c8-8 8-8 16 0s8 8 16 0 8 8 16 0"
      fill="white"
    />
    <circle cx="52" cy="56" r="4" fill="#1969FF"/>
    <circle cx="76" cy="56" r="4" fill="#1969FF"/>
    <ellipse cx="64" cy="72" rx="8" ry="4" fill="#1969FF"/>
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

// Lido - Fallback icon (logos now served from database URLs)
export const LidoIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <div className={`w-${size} h-${size} ${className} rounded-full bg-orange-500 flex items-center justify-center`}>
    <span className="text-white font-bold text-sm">L</span>
  </div>
);

// Morpho - Fallback icon (logos now served from database URLs)
export const MorphoIcon = ({ className = "", size = 24 }: PlatformIconProps) => (
  <div className={`w-${size} h-${size} ${className} rounded-full bg-blue-600 flex items-center justify-center`}>
    <span className="text-white font-bold text-sm">M</span>
  </div>
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
  if (name.includes('lido')) return LidoIcon;
  if (name.includes('morpho')) return MorphoIcon;
  
  return DefaultPlatformIcon;
};