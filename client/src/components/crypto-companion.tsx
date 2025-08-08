import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  pools?: Array<{
    id: string;
    tokenPair: string;
    apy: string;
    tvl: string;
    platform: string;
  }>;
}

interface CompanionResponse {
  message: string;
  insights?: string[];
  recommendedPools?: Array<{
    id: string;
    tokenPair: string;
    apy: string;
    tvl: string;
    platform: string;
    reason: string;
  }>;
  marketTip?: string;
}

export function CryptoCompanion() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      content: "Hey there, crypto explorer! 👋 I'm your DeFi companion, here to help you navigate the yield farming universe. Ask me about pools, market trends, or get personalized advice based on your risk appetite!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: pools } = useQuery({
    queryKey: ["/api/pools"],
    select: (data: any[]) =>
      data.filter((pool) => pool.isVisible).slice(0, 20), // Get top visible pools
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/companion/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          context: {
            availablePools: pools?.length || 0,
            totalTvl: (stats as any)?.totalTvl || 0,
            activePools: (stats as any)?.activePools || 0,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data: CompanionResponse = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.message,
        timestamp: new Date(),
        pools: data.recommendedPools,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Oops! My neural networks are having a coffee break ☕ Try asking me something else!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "What are the best high-yield pools right now?",
    "Show me low-risk stablecoin yields",
    "What's happening in DeFi markets today?",
    "Compare Aave vs Morpho yields",
    "Find me pools with >10% APY",
  ];

  return (
    <Card className="h-[600px] flex flex-col" data-testid="crypto-companion">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Crypto Companion
          <Badge variant="secondary" className="ml-auto">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
                data-testid={`message-${message.type}-${message.id}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.type === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={`rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>

                    {message.pools && message.pools.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium opacity-75">
                          Recommended Pools:
                        </p>
                        {message.pools.map((pool) => (
                          <div
                            key={pool.id}
                            className="bg-background/20 rounded p-2 text-xs"
                            data-testid={`recommended-pool-${pool.id}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-medium">
                                {pool.tokenPair}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {pool.apy}% APY
                              </Badge>
                            </div>
                            <div className="text-xs opacity-75 mt-1">
                              {pool.platform} • TVL: {pool.tvl}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-xs opacity-50 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150" />
                    <span className="text-sm ml-2">Analyzing markets...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setInput(question)}
                  data-testid={`quick-question-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about yields, pools, or market insights..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-chat-message"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {(stats as any)?.activePools || 0} Active Pools
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Real-time Analysis
          </div>
        </div>
      </CardContent>
    </Card>
  );
}