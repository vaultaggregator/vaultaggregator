import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Minus, Send, Bot } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pools?: Array<{
    id: string;
    tokenPair: string;
    apy: string;
    platform: { displayName: string };
    chain: { displayName: string };
    tvl?: string;
    riskLevel: string;
  }>;
}

interface FloatingChatProps {
  className?: string;
}

export default function FloatingChat({ className }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hey there! 👋 I'm your Crypto Companion. I can help you find the best yield opportunities, explain DeFi concepts, or share market insights. What would you like to know?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/companion/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response");
      }
      
      return await response.json();
    },
    onSuccess: (response: { message: string; pools?: any[] }) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.message,
          pools: response.pools || [],
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment!",
        },
      ]);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTvl = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return "N/A";
    
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-purple-600 hover:bg-purple-700"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card 
        className={`w-96 transition-all duration-200 shadow-xl border-purple-200 dark:border-purple-800 ${
          isMinimized ? "h-16" : "h-96"
        }`}
        data-testid="chat-widget"
      >
        <CardHeader className="p-4 bg-purple-50 dark:bg-purple-950 border-b border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Crypto Companion</CardTitle>
              <a 
                href="/companion" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 underline ml-2"
                data-testid="link-full-companion"
              >
                Open Full View
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900"
                data-testid="button-minimize-chat"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                      data-testid={`message-${message.role}-${index}`}
                    >
                      <p className="text-sm">{message.content}</p>
                      
                      {message.pools && message.pools.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.pools.map((pool) => (
                            <Link key={pool.id} href={`/pool/${pool.id}`}>
                              <div className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 transition-colors cursor-pointer">
                                <div className="flex justify-between items-start text-xs">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{pool.tokenPair}</p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                      {pool.platform.displayName} • {pool.chain.displayName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-green-600">{pool.apy}%</p>
                                    <p className="text-gray-500 dark:text-gray-400">APY</p>
                                  </div>
                                </div>
                                <div className="mt-1 flex justify-between text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    TVL: {pool.tvl ? formatTvl(pool.tvl) : 'N/A'}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Risk: {pool.riskLevel}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about yields, DeFi, or market insights..."
                  className="flex-1"
                  disabled={chatMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}