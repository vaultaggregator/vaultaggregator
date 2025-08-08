import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Info } from "lucide-react";

interface MetricTooltipProps {
  metric: string;
  children: React.ReactNode;
  variant?: "icon" | "underline";
  side?: "top" | "bottom" | "left" | "right";
}

interface MetricExplanation {
  title: string;
  description: string;
  example?: string;
  levels?: Record<string, string>;
}

const METRIC_EXPLANATIONS: Record<string, MetricExplanation> = {
  "apy": {
    title: "Annual Percentage Yield (APY)",
    description: "The yearly return you can expect on your investment, including compound interest. This shows how much your money would grow if you held it for a full year.",
    example: "A 10% APY means $1,000 becomes $1,100 after one year."
  },
  "24h-apy": {
    title: "24-Hour APY",
    description: "The current yield rate based on the last 24 hours of performance. This can fluctuate daily based on market conditions and protocol activity.",
    example: "Higher activity often means higher yields, but also more volatility."
  },
  "30d-apy": {
    title: "30-Day Average APY",
    description: "The average yield over the past 30 days, providing a more stable view of the pool's performance over time.",
    example: "This smooths out daily fluctuations to show longer-term trends."
  },
  "tvl": {
    title: "Total Value Locked (TVL)",
    description: "The total dollar value of all assets currently deposited in this pool. Higher TVL often indicates more trust and stability.",
    example: "$10M TVL means there's $10 million worth of assets in the pool."
  },
  "risk-level": {
    title: "Risk Level",
    description: "An assessment of potential risks including smart contract risk, impermanent loss, and protocol stability. Higher yields often come with higher risks.",
    levels: {
      "low": "Established protocols with strong track records",
      "medium": "Some risk factors but generally reliable",
      "high": "Higher potential returns but increased risk of loss"
    }
  },
  "operating-days": {
    title: "Operating Since",
    description: "How long this pool has been active. Longer operating periods can indicate greater stability and proven track record.",
    example: "365 days means the pool has been running for about one year."
  },
  "impermanent-loss": {
    title: "Impermanent Loss",
    description: "A temporary loss in dollar value compared to holding assets separately. This occurs when token prices change relative to each other in liquidity pools.",
    example: "If you provide ETH/USDC and ETH price doubles, you'll have less ETH than if you just held ETH."
  },
  "liquidity-pool": {
    title: "Liquidity Pool",
    description: "A collection of funds locked in a smart contract that provides liquidity for decentralized trading. Users earn fees from trades.",
    example: "You deposit tokens, traders use your liquidity, you earn a share of trading fees."
  },
  "yield-farming": {
    title: "Yield Farming",
    description: "The practice of lending or staking cryptocurrency to earn rewards. You provide liquidity and receive tokens or fees in return.",
    example: "Like earning interest at a bank, but with cryptocurrency and often higher rates."
  },
  "smart-contract": {
    title: "Smart Contract Risk",
    description: "The risk that the automated code governing the pool has bugs or vulnerabilities that could lead to loss of funds.",
    example: "Code is audited, but there's always some risk with complex financial contracts."
  },
  "defi": {
    title: "Decentralized Finance (DeFi)",
    description: "Financial services built on blockchain technology that operate without traditional intermediaries like banks.",
    example: "Lending, borrowing, and trading directly between users using smart contracts."
  },
  "protocol": {
    title: "Protocol",
    description: "The underlying platform or application that hosts the yield opportunity, like Uniswap, Aave, or Compound.",
    example: "Each protocol has its own rules, fees, and risk profile."
  }
};

export function MetricTooltip({ 
  metric, 
  children, 
  variant = "icon", 
  side = "top" 
}: MetricTooltipProps) {
  const explanation = METRIC_EXPLANATIONS[metric];
  
  if (!explanation) {
    return <>{children}</>;
  }

  const TooltipIcon = variant === "icon" ? HelpCircle : Info;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {variant === "icon" ? (
            <div className="inline-flex items-center gap-1 cursor-help">
              {children}
              <TooltipIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          ) : (
            <span className="border-b border-dotted border-muted-foreground cursor-help hover:border-foreground transition-colors">
              {children}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          className="max-w-xs p-4 text-sm"
          data-testid={`tooltip-${metric}`}
        >
          <div className="space-y-2">
            <div className="font-semibold text-foreground">
              {explanation.title}
            </div>
            <div className="text-muted-foreground leading-relaxed">
              {explanation.description}
            </div>
            {explanation.example && (
              <div className="text-xs text-muted-foreground italic pt-1 border-t border-border">
                💡 {explanation.example}
              </div>
            )}
            {explanation.levels && (
              <div className="space-y-1 pt-1 border-t border-border">
                {Object.entries(explanation.levels).map(([level, desc]) => (
                  <div key={level} className="text-xs">
                    <span className="font-medium capitalize">{level}:</span>{" "}
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience component for common DeFi terms
export function DeFiTooltip({ 
  term, 
  children, 
  variant = "underline" 
}: { 
  term: string; 
  children: React.ReactNode; 
  variant?: "icon" | "underline" 
}) {
  return (
    <MetricTooltip metric={term} variant={variant}>
      {children}
    </MetricTooltip>
  );
}