import { useState } from "react";
import { Link } from "wouter";
import { Brain, Target, BarChart3, Shield, Zap, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const aiTools = [
  {
    name: "Portfolio Optimizer",
    description: "AI-powered portfolio allocation recommendations",
    href: "/ai/portfolio-optimizer",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    isNew: true,
  },
  {
    name: "Yield Predictor",
    description: "ML predictions for future yield trends",
    href: "/ai/yield-predictor",
    icon: BarChart3,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    isNew: true,
  },
  {
    name: "Risk Analyzer",
    description: "Comprehensive AI risk assessment",
    href: "/ai/risk-analyzer",
    icon: Shield,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    isNew: true,
  },
  {
    name: "Smart Alerts",
    description: "Intelligent yield opportunity notifications",
    href: "/smart-alerts",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
  },
];

interface AINavigationMenuProps {
  className?: string;
}

export function AINavigationMenu({ className = "" }: AINavigationMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center space-x-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${className}`}
          data-testid="button-ai-menu"
        >
          <Brain className="w-5 h-5 text-purple-600" />
          <span>AI Tools</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <DropdownMenuLabel className="flex items-center">
          <Brain className="w-4 h-4 mr-2 text-purple-600" />
          AI-Powered Tools
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="space-y-1">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <DropdownMenuItem key={tool.href} asChild className="p-0">
                <Link href={tool.href} className="block">
                  <div className="flex items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${tool.bgColor} mr-3`}>
                      <Icon className={`w-4 h-4 ${tool.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm text-foreground">
                          {tool.name}
                        </h3>
                        {tool.isNew && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        
        <div className="p-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mt-2">
          <div className="flex items-center mb-2">
            <Zap className="w-4 h-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium">Powered by GPT-4o</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Advanced AI models analyze market data, risk factors, and yield patterns to provide personalized investment insights.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile/smaller spaces
export function AINavigationCompact({ className = "" }: AINavigationMenuProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {aiTools.slice(0, 4).map((tool) => {
        const Icon = tool.icon;
        return (
          <Link key={tool.href} href={tool.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 text-center">
                <div className={`inline-flex p-2 rounded-lg ${tool.bgColor} mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1">
                  {tool.name}
                </h3>
                {tool.isNew && (
                  <Badge variant="secondary" className="text-xs">
                    New
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}