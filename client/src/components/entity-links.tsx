import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useContext, createContext } from "react";

// Context to track if we're inside a clickable container
const ClickableContainerContext = createContext(false);

// Provider component for clickable containers
export function ClickableContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ClickableContainerContext.Provider value={true}>
      <div className={className}>
        {children}
      </div>
    </ClickableContainerContext.Provider>
  );
}

// Hook to check if we're inside a clickable container
function useInClickableContainer() {
  return useContext(ClickableContainerContext);
}

// Protocol Link Component
interface ProtocolLinkProps {
  protocol: {
    id: string;
    name: string;
    slug?: string;
    displayName?: string;
  };
  chain?: {
    id: string;
    name: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function ProtocolLink({ protocol, chain, className, children }: ProtocolLinkProps) {
  const displayText = children || protocol.displayName || protocol.name;
  // Use slug if available, otherwise use name
  const protocolSlug = protocol.slug || protocol.name.toLowerCase().replace(/\s+/g, '-');
  const href = `/protocol/${protocolSlug}`;
  const inClickableContainer = useInClickableContainer();
  
  if (inClickableContainer) {
    return (
      <span className={cn("text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    );
  }
  
  return (
    <Link href={href}>
      <span className={cn("hover:text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    </Link>
  );
}

// Network Link Component  
interface NetworkLinkProps {
  network: {
    id: string;
    name: string;
    displayName?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function NetworkLink({ network, className, children }: NetworkLinkProps) {
  const displayText = children || network.displayName || network.name;
  // Use network name in URL (lowercase)
  const networkName = network.name.toLowerCase();
  const href = `/network/${networkName}`;
  const inClickableContainer = useInClickableContainer();
  
  if (inClickableContainer) {
    return (
      <span className={cn("text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    );
  }
  
  return (
    <Link href={href}>
      <span className={cn("hover:text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    </Link>
  );
}

// Token Link Component
interface TokenLinkProps {
  token: {
    address: string;
    symbol?: string;
    name?: string;
  };
  chain: {
    id: string;
    name: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function TokenLink({ token, chain, className, children }: TokenLinkProps) {
  const displayText = children || token.symbol || token.name || "Token";
  // Use chain name in URL (lowercase)
  const chainName = chain.name.toLowerCase();
  const href = `/token/${chainName}/${token.address.toLowerCase()}`;
  const inClickableContainer = useInClickableContainer();
  
  if (inClickableContainer) {
    return (
      <span className={cn("text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    );
  }
  
  return (
    <Link href={href}>
      <span className={cn("hover:text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    </Link>
  );
}

// Pool Link Component
interface PoolLinkProps {
  pool: {
    id: string;
    tokenPair: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export function PoolLink({ pool, className, children }: PoolLinkProps) {
  const displayText = children || pool.tokenPair;
  const href = `/pool/${pool.id}`;
  const inClickableContainer = useInClickableContainer();
  
  if (inClickableContainer) {
    return (
      <span className={cn("text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    );
  }
  
  return (
    <Link href={href}>
      <span className={cn("hover:text-blue-400 cursor-pointer transition-colors underline decoration-dotted", className)}>
        {displayText}
      </span>
    </Link>
  );
}

// Address Link Component (for wallet addresses)
interface AddressLinkProps {
  address: string;
  className?: string;
  children?: React.ReactNode;
  showShortened?: boolean;
}

export function AddressLink({ address, className, children, showShortened = true }: AddressLinkProps) {
  const displayText = children || (showShortened ? `${address.slice(0, 6)}...${address.slice(-4)}` : address);
  const href = `/profile/${address}`;
  const inClickableContainer = useInClickableContainer();
  
  if (inClickableContainer) {
    return (
      <span className={cn("text-blue-400 cursor-pointer transition-colors underline decoration-dotted font-mono", className)}>
        {displayText}
      </span>
    );
  }
  
  return (
    <Link href={href}>
      <span className={cn("hover:text-blue-400 cursor-pointer transition-colors underline decoration-dotted font-mono", className)}>
        {displayText}
      </span>
    </Link>
  );
}