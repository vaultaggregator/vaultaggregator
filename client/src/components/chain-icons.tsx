// Blockchain Network Icons Component
// SVG icons based on official sources from CryptoLogos.cc and official brand assets

export interface ChainIconProps {
  className?: string;
  size?: number;
}

export const EthereumIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 0L8.5 16.5L16 22L23.5 16.5L16 0Z"
      fill="#627EEA"
    />
    <path
      d="M16 32L8.5 18.5L16 24L23.5 18.5L16 32Z"
      fill="#627EEA"
      fillOpacity="0.6"
    />
  </svg>
);

export const ArbitrumIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#213147"/>
    <path
      d="M10.5 19.5L16 8L21.5 19.5H19L16 13L13 19.5H10.5Z"
      fill="#28A0F0"
    />
    <path
      d="M14.5 21.5H17.5L19 24H13L14.5 21.5Z"
      fill="#28A0F0"
    />
  </svg>
);

export const PolygonIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#8247E5"/>
    <path
      d="M22 11.5L19 9.5C18.5 9.2 17.5 9.2 17 9.5L12 12.5C11.5 12.8 11.5 13.2 12 13.5L15 15.5C15.5 15.8 16.5 15.8 17 15.5L22 12.5C22.5 12.2 22.5 11.8 22 11.5Z"
      fill="white"
    />
    <path
      d="M10 16.5L13 18.5C13.5 18.8 14.5 18.8 15 18.5L20 15.5C20.5 15.2 20.5 14.8 20 14.5L17 12.5C16.5 12.2 15.5 12.2 15 12.5L10 15.5C9.5 15.8 9.5 16.2 10 16.5Z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);

export const AvalancheIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#E84142"/>
    <path
      d="M16 8L22 20H10L16 8Z"
      fill="white"
    />
    <path
      d="M14 22H18C19 22 19.5 22.5 19 23.5C18.5 24.5 17.5 24 16 24C14.5 24 13.5 24.5 13 23.5C12.5 22.5 13 22 14 22Z"
      fill="white"
    />
  </svg>
);

export const BSCIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#F0B90B"/>
    <path
      d="M16 4L12 8L16 12L20 8L16 4Z"
      fill="#000"
    />
    <path
      d="M8 12L4 16L8 20L12 16L8 12Z"
      fill="#000"
    />
    <path
      d="M24 12L20 16L24 20L28 16L24 12Z"
      fill="#000"
    />
    <path
      d="M16 20L12 24L16 28L20 24L16 20Z"
      fill="#000"
    />
    <rect x="12" y="12" width="8" height="8" fill="#000"/>
  </svg>
);

export const OptimismIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#FF0420"/>
    <path
      d="M11 12C11 10.5 12.5 9 14 9C15.5 9 17 10.5 17 12V13C17 14.5 15.5 16 14 16C12.5 16 11 14.5 11 13V12Z"
      fill="white"
    />
    <path
      d="M18 12C18 10.5 19.5 9 21 9C22.5 9 24 10.5 24 12V13C24 14.5 22.5 16 21 16C19.5 16 18 14.5 18 13V12Z"
      fill="white"
    />
    <path
      d="M7 18C7 16.5 8.5 15 10 15H22C23.5 15 25 16.5 25 18V19C25 20.5 23.5 22 22 22H10C8.5 22 7 20.5 7 19V18Z"
      fill="white"
    />
  </svg>
);

export const BaseIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#0052FF"/>
    <circle cx="16" cy="16" r="12" fill="white"/>
    <circle cx="16" cy="16" r="8" fill="#0052FF"/>
    <circle cx="16" cy="13" r="3" fill="white"/>
  </svg>
);

export const FantomIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#13B5EC"/>
    <path
      d="M16 6L8 12V20L16 26L24 20V12L16 6Z"
      fill="white"
    />
    <path
      d="M16 10L12 13V19L16 22L20 19V13L16 10Z"
      fill="#13B5EC"
    />
  </svg>
);

export const SolanaIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="solanaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D18C"/>
        <stop offset="100%" stopColor="#9945FF"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="16" fill="url(#solanaGrad)"/>
    <path
      d="M7 12L12 7H25L20 12H7Z"
      fill="white"
    />
    <path
      d="M7 16L12 11H25L20 16H7Z"
      fill="white"
      fillOpacity="0.8"
    />
    <path
      d="M7 20L12 15H25L20 20H7Z"
      fill="white"
      fillOpacity="0.6"
    />
  </svg>
);

// Default fallback icon
export const DefaultChainIcon = ({ className = "", size = 24 }: ChainIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="16" fill="#6366F1"/>
    <path
      d="M16 8L8 16L16 24L24 16L16 8Z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);

// Chain icon selector function
export const getChainIcon = (chainName: string): React.FC<ChainIconProps> => {
  const name = chainName.toLowerCase();
  
  if (name.includes('ethereum') || name.includes('eth')) return EthereumIcon;
  if (name.includes('arbitrum')) return ArbitrumIcon;
  if (name.includes('polygon') || name.includes('matic')) return PolygonIcon;
  if (name.includes('avalanche') || name.includes('avax')) return AvalancheIcon;
  if (name.includes('bsc') || name.includes('binance')) return BSCIcon;
  if (name.includes('optimism')) return OptimismIcon;
  if (name.includes('base')) return BaseIcon;
  if (name.includes('fantom')) return FantomIcon;
  if (name.includes('solana')) return SolanaIcon;
  
  return DefaultChainIcon;
};