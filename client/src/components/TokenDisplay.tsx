import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Sparkles, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  normalizeTokenAddress, 
  normalizeTokenAddresses, 
  isKnownToken,
  getTokenSymbol,
  truncateAddress 
} from '@/utils/tokenNormalization';

interface TokenDisplayProps {
  addresses: string | string[];
  maxDisplay?: number;
  showNormalizeButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function TokenDisplay({ 
  addresses, 
  maxDisplay = 3, 
  showNormalizeButton = true,
  size = 'sm',
  variant = 'outline',
  className = ''
}: TokenDisplayProps) {
  const [normalized, setNormalized] = useState(false);
  const { toast } = useToast();
  
  const addressArray = Array.isArray(addresses) ? addresses : [addresses];
  
  if (!addressArray || addressArray.length === 0) {
    return <span className="text-gray-500 dark:text-gray-400 text-sm">No tokens</span>;
  }
  
  const hasUnknownTokens = addressArray.some(addr => !isKnownToken(addr));
  const canNormalize = hasUnknownTokens && !normalized;
  
  const displayTokens = normalized 
    ? normalizeTokenAddresses(addressArray, { preferSymbol: true, maxDisplay })
    : addressArray.map(addr => {
        const symbol = getTokenSymbol(addr);
        return symbol || truncateAddress(addr);
      });
  
  const handleNormalize = () => {
    setNormalized(true);
    toast({
      title: "Tokens Normalized",
      description: "Token addresses have been converted to readable symbols",
    });
  };
  
  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Token address copied to clipboard",
    });
  };
  
  const handleViewOnEtherscan = (address: string) => {
    window.open(`https://etherscan.io/token/${address}`, '_blank');
  };
  
  const extraCount = addressArray.length - maxDisplay;
  const visibleTokens = displayTokens.slice(0, maxDisplay);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-wrap gap-1">
        {visibleTokens.map((token, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={variant} 
                  className={`
                    cursor-pointer transition-colors hover:bg-gray-200 dark:hover:bg-gray-600
                    ${size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1'}
                    ${isKnownToken(addressArray[index]) ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                  `}
                  onClick={() => handleCopyAddress(addressArray[index])}
                >
                  {token}
                  {isKnownToken(addressArray[index]) && (
                    <Sparkles className="ml-1 w-3 h-3 text-green-600 dark:text-green-400" />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <div className="font-medium">
                    {getTokenSymbol(addressArray[index]) || 'Unknown Token'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {addressArray[index]}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(addressArray[index]);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOnEtherscan(addressArray[index]);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {extraCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{extraCount} more
          </Badge>
        )}
      </div>
      
      {canNormalize && showNormalizeButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNormalize}
                className="h-6 w-6 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Normalize token addresses to readable symbols</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Simple token badge component for minimal display
export function TokenBadge({ 
  address, 
  onClick,
  className = '',
  variant = 'outline' 
}: { 
  address: string; 
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
}) {
  const symbol = getTokenSymbol(address);
  const isKnown = isKnownToken(address);
  
  return (
    <Badge 
      variant={variant}
      className={`
        ${isKnown ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
        ${onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {symbol || truncateAddress(address)}
      {isKnown && <Sparkles className="ml-1 w-3 h-3 text-green-600 dark:text-green-400" />}
    </Badge>
  );
}