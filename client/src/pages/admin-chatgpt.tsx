import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, Bot, User, Trash2, Copy, Download, BarChart3, Settings, 
  Brain, Code, Shield, TrendingUp, Zap, MessageSquare, Play, 
  Pause, RotateCcw, FileText, Database, Sparkles
} from "lucide-react";
import AdminHeader from "@/components/admin-header";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface OpenAIResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  systemPrompt?: string;
  temperature?: number;
}

interface ConnectionTestResponse {
  connected: boolean;
  model?: string;
  message?: string;
  error?: string;
}

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
}

interface SystemPromptInfo {
  id: string;
  name: string;
  description: string;
}

interface ModelsResponse {
  models: ModelInfo[];
  systemPrompts: SystemPromptInfo[];
}

interface AnalysisResponse {
  analysis: string;
  analysisType: string;
  timestamp: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  dataAnalyzed: any;
}

export default function AdminChatGPT() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState("default");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2000]);
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [currentTab, setCurrentTab] = useState("chat");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<EventSource | null>(null);

  // Test OpenAI connection on load
  const { data: connectionTest } = useQuery<ConnectionTestResponse>({
    queryKey: ['/api/openai/test'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get available models and system prompts
  const { data: modelsData } = useQuery<ModelsResponse>({
    queryKey: ['/api/openai/models'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Send message mutation (non-streaming)
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          model: selectedModel,
          systemPrompt: selectedSystemPrompt,
          temperature: temperature[0],
          maxTokens: maxTokens[0],
          stream: false,
          includeContext
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to send message');
      }

      return await response.json() as OpenAIResponse;
    },
    onSuccess: (data, message) => {
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      setInputMessage("");
      
      // Update token usage
      if (data.usage?.total_tokens) {
        setTotalTokensUsed(prev => prev + data.usage!.total_tokens);
      }
      
      toast({
        title: "Message sent",
        description: `Model: ${data.model} | Tokens: ${data.usage?.total_tokens || 'N/A'} | Temperature: ${data.temperature || 'N/A'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Analysis mutation
  const analyzeDataMutation = useMutation({
    mutationFn: async (analysisType: string) => {
      const response = await fetch('/api/openai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisType }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to analyze data');
      }

      return await response.json() as AnalysisResponse;
    },
    onSuccess: (data) => {
      const analysisMessage: ChatMessage = {
        role: 'assistant',
        content: `**${data.analysisType.toUpperCase()} ANALYSIS**\n\n${data.analysis}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, analysisMessage]);
      
      if (data.usage?.total_tokens) {
        setTotalTokensUsed(prev => prev + data.usage!.total_tokens);
      }

      toast({
        title: "Analysis completed",
        description: `${data.analysisType} analysis generated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to generate analysis",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (streamingEnabled) {
      await handleStreamingMessage();
    } else {
      sendMessageMutation.mutate(inputMessage.trim());
    }
  };

  const handleStreamingMessage = async () => {
    const message = inputMessage.trim();
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsStreaming(true);
    setStreamingMessage("");

    try {
      // Use fetch for streaming since EventSource doesn't support POST
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          model: selectedModel,
          systemPrompt: selectedSystemPrompt,
          temperature: temperature[0],
          maxTokens: maxTokens[0],
          stream: true,
          includeContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = "";

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.done) {
                    setIsStreaming(false);
                    // Add final assistant message
                    const assistantMessage: ChatMessage = {
                      role: 'assistant',
                      content: data.fullResponse || streamingMessage,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    setStreamingMessage("");
                    return;
                  } else if (data.content) {
                    setStreamingMessage(prev => prev + data.content);
                  }
                } catch (error) {
                  console.warn('Failed to parse streaming data:', error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          setIsStreaming(false);
          setStreamingMessage("");
          toast({
            title: "Streaming error",
            description: "Failed to stream response",
            variant: "destructive",
          });
        }
      };

      processStream();



    } catch (error) {
      setIsStreaming(false);
      setStreamingMessage("");
      toast({
        title: "Error",
        description: "Failed to start streaming",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setTotalTokensUsed(0);
    setStreamingMessage("");
    setIsStreaming(false);
    toast({
      title: "Conversation cleared",
      description: "Chat history has been reset",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const exportConversation = async (format: 'json' | 'csv' = 'json') => {
    try {
      const response = await fetch(`/api/openai/export?format=${format}`);
      const data = format === 'json' ? await response.json() : await response.text();
      
      const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatgpt-conversation.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Conversation exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export conversation",
        variant: "destructive",
      });
    }
  };

  const getSystemPromptIcon = (promptId: string) => {
    switch (promptId) {
      case 'defi_expert': return <TrendingUp className="w-4 h-4" />;
      case 'data_analyst': return <BarChart3 className="w-4 h-4" />;
      case 'developer': return <Code className="w-4 h-4" />;
      case 'security_auditor': return <Shield className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getModelBadgeColor = (modelId: string) => {
    if (modelId.includes('4o')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (modelId.includes('4')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            Advanced ChatGPT Integration
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Most powerful AI assistant with streaming, model selection, custom prompts, and DeFi platform integration
          </p>
        </div>

        {/* Connection Status & Token Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-green-600" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectionTest ? (
                <div className="flex items-center gap-3">
                  <Badge variant={connectionTest.connected ? "default" : "destructive"} className="text-sm">
                    {connectionTest.connected ? "🟢 Connected" : "🔴 Disconnected"}
                  </Badge>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {connectionTest.message || (connectionTest.connected ? "OpenAI API is ready" : "API connection failed")}
                  </span>
                </div>
              ) : (
                <Badge variant="outline">⏳ Testing connection...</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Token Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {totalTokensUsed.toLocaleString()}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Total tokens used this session</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Settings Panel */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Quick Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">AI Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsData?.models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${getModelBadgeColor(model.id)}`}>
                                {model.name}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">System Prompt</Label>
                    <Select value={selectedSystemPrompt} onValueChange={setSelectedSystemPrompt}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelsData?.systemPrompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            <div className="flex items-center gap-2">
                              {getSystemPromptIcon(prompt.id)}
                              <span>{prompt.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Temperature: {temperature[0]}
                    </Label>
                    <Slider
                      value={temperature}
                      onValueChange={setTemperature}
                      max={2}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Max Tokens: {maxTokens[0]}
                    </Label>
                    <Slider
                      value={maxTokens}
                      onValueChange={setMaxTokens}
                      max={4000}
                      min={100}
                      step={100}
                      className="w-full"
                    />
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Streaming</Label>
                      <Switch checked={streamingEnabled} onCheckedChange={setStreamingEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-300">Platform Context</Label>
                      <Switch checked={includeContext} onCheckedChange={setIncludeContext} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Interface */}
              <Card className="lg:col-span-3 h-[700px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      AI Assistant Chat
                      {isStreaming && (
                        <Badge variant="outline" className="ml-2 animate-pulse">
                          <Play className="w-3 h-3 mr-1" />
                          Streaming...
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportConversation('json')}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearConversation}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                          <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-semibold mb-2">Ready for Advanced AI Interaction</h3>
                          <p className="mb-4">Ask questions about DeFi protocols, yield strategies, or platform management</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            <Badge variant="outline">Multiple AI Models</Badge>
                            <Badge variant="outline">Real-time Streaming</Badge>
                            <Badge variant="outline">Custom System Prompts</Badge>
                            <Badge variant="outline">Platform Context</Badge>
                          </div>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === 'user' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-purple-600 text-white'
                              }`}>
                                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                              </div>
                              <div className={`rounded-lg p-4 ${
                                message.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                              }`}>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {message.content}
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-opacity-20">
                                  <span className="text-xs opacity-70">
                                    {message.timestamp.toLocaleTimeString()}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(message.content)}
                                    className="h-6 px-2 text-xs opacity-70 hover:opacity-100"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* Streaming Message */}
                      {isStreaming && streamingMessage && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-600 text-white">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div className="rounded-lg p-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {streamingMessage}
                                <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse"></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex gap-3">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask anything about DeFi, yield farming, smart contracts, or platform management..."
                        className="min-h-[80px] resize-none"
                        disabled={sendMessageMutation.isPending || isStreaming}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || sendMessageMutation.isPending || isStreaming}
                          className="px-6 flex-1"
                        >
                          {sendMessageMutation.isPending || isStreaming ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                        {isStreaming && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsStreaming(false);
                              setStreamingMessage("");
                            }}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Model Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modelsData?.models.map((model) => (
                    <div 
                      key={model.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedModel === model.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getModelBadgeColor(model.id)}>
                          {model.name}
                        </Badge>
                        <span className="text-xs text-slate-500">Max: {model.maxTokens}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{model.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    System Prompts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {modelsData?.systemPrompts.map((prompt) => (
                    <div 
                      key={prompt.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSystemPrompt === prompt.id 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      onClick={() => setSelectedSystemPrompt(prompt.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getSystemPromptIcon(prompt.id)}
                        <span className="font-medium">{prompt.name}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{prompt.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Platform Data Analysis
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  Generate comprehensive AI-powered analysis of your DeFi platform data
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => analyzeDataMutation.mutate('performance')}
                    disabled={analyzeDataMutation.isPending}
                    className="h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>Performance Analysis</span>
                  </Button>
                  <Button
                    onClick={() => analyzeDataMutation.mutate('risk')}
                    disabled={analyzeDataMutation.isPending}
                    className="h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <Shield className="w-6 h-6" />
                    <span>Risk Analysis</span>
                  </Button>
                  <Button
                    onClick={() => analyzeDataMutation.mutate('market')}
                    disabled={analyzeDataMutation.isPending}
                    className="h-20 flex-col gap-2"
                    variant="outline"
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span>Market Analysis</span>
                  </Button>
                </div>
                {analyzeDataMutation.isPending && (
                  <div className="text-center mt-4">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Generating AI analysis...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export & Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => exportConversation('json')}
                    className="h-16 flex-col gap-2"
                    variant="outline"
                  >
                    <FileText className="w-6 h-6" />
                    <span>Export as JSON</span>
                  </Button>
                  <Button
                    onClick={() => exportConversation('csv')}
                    className="h-16 flex-col gap-2"
                    variant="outline"
                  >
                    <Database className="w-6 h-6" />
                    <span>Export as CSV</span>
                  </Button>
                </div>
                
                <Separator />
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Session Statistics
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{messages.length}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">Messages</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{totalTokensUsed.toLocaleString()}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">Tokens Used</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{selectedModel.toUpperCase()}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">Current Model</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}