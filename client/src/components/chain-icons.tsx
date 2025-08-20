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
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path
      d="M16.498 4v8.87L23.995 16L16.498 4z"
      fill="white"
      fillOpacity="0.602"
    />
    <path
      d="M16.498 4L9 16l7.498-3.13V4z"
      fill="white"
    />
    <path
      d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z"
      fill="white"
      fillOpacity="0.602"
    />
    <path
      d="M16.498 27.995v-6.028L9 17.616l7.498 10.38z"
      fill="white"
    />
    <path
      d="M16.498 20.573l7.497-4.573-7.497-3.047v7.62z"
      fill="white"
      fillOpacity="0.2"
    />
    <path
      d="M9 16l7.498 4.573v-7.62L9 16z"
      fill="white"
      fillOpacity="0.602"
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
    <circle cx="16" cy="16" r="16" fill="#28A0F0"/>
    <path
      d="M14.126 21.081l-.859-2.179h-.538l-.859 2.179h-.967L12.766 17h1.038l1.863 4.081h-.967zm-.084-2.726h-.684l-.312-.792-.312.792zm4.763 2.871c-1.112 0-1.996-.861-1.996-2.118 0-1.257.884-2.108 1.996-2.108.587 0 1.122.245 1.459.679l-.636.636c-.224-.294-.546-.462-.823-.462-.672 0-1.148.518-1.148 1.255s.476 1.265 1.148 1.265c.277 0 .599-.168.823-.462l.636.636c-.337.434-.872.679-1.459.679z"
      fill="white"
    />
    <path
      d="M16.498 8.5L9.876 11.958v6.584L16.498 23l6.622-4.458v-6.584L16.498 8.5z"
      fill="white"
      fillOpacity="0.8"
    />
    <path
      d="M19.294 14.368L16.498 12.5l-2.796 1.868 2.796 1.867 2.796-1.867z"
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
    <circle cx="16" cy="16" r="16" fill="#8247E5"/>
    <path
      d="M21.092 12.693c-.369-.215-.907-.215-1.276 0L17.202 14.36c-.369.215-.369.562 0 .777l2.614 1.667c.369.215.907.215 1.276 0l2.614-1.667c.369-.215.369-.562 0-.777l-2.614-1.667z"
      fill="white"
    />
    <path
      d="M21.092 19.307c-.369-.215-.907-.215-1.276 0L17.202 21.36c-.369.215-.369.562 0 .777l2.614 1.667c.369.215.907.215 1.276 0l2.614-1.667c.369-.215.369-.562 0-.777l-2.614-1.667z"
      fill="white"
    />
    <path
      d="M12.908 16c-.369-.215-.907-.215-1.276 0L8.018 17.667c-.369.215-.369.562 0 .777l2.614 1.667c.369.215.907.215 1.276 0l2.614-1.667c.369-.215.369-.562 0-.777L12.908 16z"
      fill="white"
    />
    <path
      d="M12.908 9.693c-.369-.215-.907-.215-1.276 0L8.018 11.36c-.369.215-.369.562 0 .777l2.614 1.667c.369.215.907.215 1.276 0l2.614-1.667c.369-.215.369-.562 0-.777l-2.614-1.667z"
      fill="white"
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
    <circle cx="16" cy="16" r="16" fill="#E84142"/>
    <path
      d="M13.33 21.165h5.34c.448 0 .672-.56.336-.84L16.168 17.5c-.224-.186-.56-.186-.784 0l-2.838 2.825c-.336.28-.112.84.336.84h.448zm6.72-8.33h-3.36L14.83 9.17c-.224-.373-.784-.373-1.008 0l-1.862 3.665h-3.36c-.448 0-.672.56-.336.84l5.376 5.325c.224.186.56.186.784 0l5.376-5.325c.336-.28.112-.84-.336-.84z"
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
    <circle cx="16" cy="16" r="16" fill="#F0B90B"/>
    <path
      d="M10.427 11.896l1.469-1.469 4.104 4.103 4.104-4.103 1.469 1.469-4.104 4.104 4.104 4.104-1.469 1.469L16 17.469l-4.104 4.104-1.469-1.469 4.104-4.104-4.104-4.104z"
      fill="white"
    />
    <circle cx="8" cy="16" r="2.5" fill="white"/>
    <circle cx="24" cy="16" r="2.5" fill="white"/>
    <circle cx="16" cy="8" r="2.5" fill="white"/>
    <circle cx="16" cy="24" r="2.5" fill="white"/>
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
    <circle cx="16" cy="16" r="16" fill="#FF0420"/>
    <path
      d="M9.8665 18.6c0-2.24 1.568-3.6 3.9335-3.6 2.3655 0 3.9335 1.36 3.9335 3.6s-1.568 3.6-3.9335 3.6c-2.3655 0-3.9335-1.36-3.9335-3.6zm11.2 0c0-2.24 1.568-3.6 3.9335-3.6 2.3655 0 3.9335 1.36 3.9335 3.6s-1.568 3.6-3.9335 3.6c-2.3655 0-3.9335-1.36-3.9335-3.6z"
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
    <circle cx="16" cy="16" r="16" fill="#0052FF"/>
    <path
      d="M16 27C21.5228 27 26 22.0751 26 16C26 9.92487 21.5228 5 16 5C10.4772 5 6 9.92487 6 16H13.5C14.3284 16 15 16.6716 15 17.5C15 18.3284 14.3284 19 13.5 19H6C6 22.0751 10.4772 27 16 27Z"
      fill="white"
    />
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
    <circle cx="16" cy="16" r="16" fill="#13B5EC"/>
    <path
      d="M15.5 7l.866.5L22 11.366v9.268L16.366 25l-.866.5-.866-.5L9 20.634v-9.268L14.634 7.5L15.5 7z"
      fill="white"
    />
    <path
      d="M15.5 9.5v4.366l3.75 2.166v2.968L15.5 21.166v1.299l4.5-2.6v-8.03L15.5 9.5zm.866-2L20 9.5v8.03l-3.634 2.105V18.5l2.5-1.445v-2.11L15.5 12.781V9.5l.866-2z"
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
      <linearGradient id={`solanaGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00D18C"/>
        <stop offset="100%" stopColor="#9945FF"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill={`url(#solanaGrad-${size})`}/>
    <path
      d="M6.63 20.495c.12-.12.282-.187.452-.187h17.671c.414 0 .621.5.328.793l-2.745 2.745c-.12.12-.282.187-.452.187H4.213c-.414 0-.621-.5-.328-.793l2.745-2.745zm2.745-12.49c.12-.12.282-.187.452-.187h17.671c.414 0 .621.5.328.793L24.145 11.356c-.12.12-.282.187-.452.187H6.022c-.414 0-.621-.5-.328-.793L8.439 8.005zm15.981 6.133c.414 0 .621.5.328.793l-2.745 2.745c-.12.12-.282.187-.452.187H4.213c-.414 0-.621-.5-.328-.793l2.745-2.745c.12-.12.282-.187.452-.187h17.671z"
      fill="white"
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