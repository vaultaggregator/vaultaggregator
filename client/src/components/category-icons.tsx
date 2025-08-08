// DeFi Category Icons Component
// Professional SVG icons for different DeFi categories and yield farming types

export interface CategoryIconProps {
  className?: string;
  size?: number;
}

// Stables - Fiat money representation icon
export const StablesIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#22C55E"/>
    <rect x="8" y="11" width="16" height="10" rx="1" fill="white"/>
    <path
      d="M10 13h12M10 15h12M10 17h12M10 19h8"
      stroke="#22C55E"
      strokeWidth="0.5"
    />
    <circle cx="12" cy="16" r="1.5" fill="#22C55E"/>
    <path
      d="M11 16h2M12 15v2"
      stroke="white"
      strokeWidth="0.5"
    />
    <path
      d="M23 14l2-2 2 2M23 18l2 2 2-2"
      stroke="white"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M7 14l-2-2-2 2M7 18l-2 2-2-2"
      stroke="white"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

// ETH - Ethereum specific icon
export const ETHIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
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

// Lending - Handshake/loan icon
export const LendingIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#8B5CF6"/>
    <path
      d="M8 16c0-1.5 1-3 3-3s3 1.5 3 3v1c0 1.5-1 3-3 3s-3-1.5-3-3v-1z"
      fill="white"
    />
    <path
      d="M18 16c0-1.5 1-3 3-3s3 1.5 3 3v1c0 1.5-1 3-3 3s-3-1.5-3-3v-1z"
      fill="white"
    />
    <path
      d="M14 18h4v2c0 1-1 2-2 2s-2-1-2-2v-2z"
      fill="white"
    />
    <path
      d="M12 14l2-2 2 2 2-2 2 2"
      stroke="white"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

// Farming - Growth/plant icon
export const FarmingIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#10B981"/>
    <path
      d="M16 26v-8"
      stroke="white"
      strokeWidth="2"
    />
    <path
      d="M16 18c-2-2-4-4-4-6s2-4 4-4 4 2 4 4-2 4-4 6z"
      fill="white"
    />
    <path
      d="M12 20c-1-1-2-2-2-3s1-2 2-2 2 1 2 2-1 2-2 3z"
      fill="white"
      fillOpacity="0.8"
    />
    <path
      d="M20 20c1-1 2-2 2-3s-1-2-2-2-2 1-2 2 1 2 2 3z"
      fill="white"
      fillOpacity="0.8"
    />
    <rect x="14" y="24" width="4" height="4" fill="white" rx="1"/>
  </svg>
);

// DEX - Exchange arrows icon
export const DEXIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#F59E0B"/>
    <path
      d="M6 12l4-4 4 4M10 8v12"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M26 20l-4 4-4-4M22 24V12"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="10" cy="20" r="2" fill="white"/>
    <circle cx="22" cy="12" r="2" fill="white"/>
  </svg>
);

// Liquidity - Pool/waves icon  
export const LiquidityIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#06B6D4"/>
    <path
      d="M6 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
      stroke="white"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M6 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
      stroke="white"
      strokeWidth="2"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M6 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
      stroke="white"
      strokeWidth="2"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

// Governance - Voting/checkmark icon
export const GovernanceIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="16" fill="#6366F1"/>
    <path
      d="M8 16l6 6 10-10"
      stroke="white"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Default category icon
export const DefaultCategoryIcon = ({ className = "", size = 24 }: CategoryIconProps) => (
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
      d="M16 8L8 16L16 24L24 16L16 8Z"
      fill="white"
      fillOpacity="0.8"
    />
  </svg>
);

// Category icon selector function
export const getCategoryIcon = (categoryName: string): React.FC<CategoryIconProps> => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('stables') || name.includes('stable') || name.includes('usd') || name.includes('fiat')) return StablesIcon;
  if (name.includes('eth') || name.includes('ethereum')) return ETHIcon;
  if (name.includes('lend') || name.includes('borrow') || name.includes('loan')) return LendingIcon;
  if (name.includes('farm') || name.includes('yield') || name.includes('stake')) return FarmingIcon;
  if (name.includes('dex') || name.includes('swap') || name.includes('exchange')) return DEXIcon;
  if (name.includes('liquidity') || name.includes('pool') || name.includes('lp')) return LiquidityIcon;
  if (name.includes('governance') || name.includes('vote') || name.includes('dao')) return GovernanceIcon;
  
  return DefaultCategoryIcon;
};