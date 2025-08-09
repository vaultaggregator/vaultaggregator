import { IStorage } from "../storage";

export interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  urls: string[];
  lastUpdated: Date;
  isActive: boolean;
}

export interface UnknownQuery {
  id: string;
  question: string;
  timestamp: Date;
  userContext: any;
  frequency: number;
  isResolved: boolean;
  adminNotes?: string;
}

export class KnowledgeBase {
  private storage: IStorage;
  private knowledgeBase: KnowledgeItem[];
  private unknownQueries: Map<string, UnknownQuery>;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.knowledgeBase = [];
    this.unknownQueries = new Map();
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Comprehensive site knowledge based on actual features
    this.knowledgeBase = [
      {
        id: "site-url",
        category: "website",
        question: "what is my website url",
        answer: "Your website is running locally during development. When deployed, it will be available at a replit.app domain. You can deploy it using the Deploy button in Replit.",
        keywords: ["website", "url", "link", "domain", "site address"],
        urls: ["/"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "ai-tools",
        category: "features",
        question: "what ai tools are available",
        answer: "Your platform has 3 AI-powered tools: Portfolio Optimizer for smart asset allocation, Yield Predictor for ML-based trend forecasting, and Risk Analyzer for comprehensive security assessment. Access them through the 'AI Tools' dropdown in the header.",
        keywords: ["ai", "tools", "artificial intelligence", "portfolio", "predictor", "risk analyzer", "smart"],
        urls: ["/ai/portfolio-optimizer", "/ai/yield-predictor", "/ai/risk-analyzer"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "platform-overview",
        category: "general",
        question: "what does this platform do",
        answer: "Vault Aggregator is a DeFi yield aggregation platform that helps users discover, track, and compare yield farming opportunities across multiple blockchain networks. It provides real-time APY data, risk assessments, and AI-powered investment insights.",
        keywords: ["platform", "defi", "yield", "farming", "aggregator", "what is", "overview"],
        urls: ["/", "/dashboard"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "supported-networks",
        category: "networks",
        question: "what blockchain networks are supported",
        answer: "The platform supports multiple blockchain networks including Ethereum, Arbitrum, Polygon, Avalanche, BSC, Optimism, Base, Fantom, and Solana. You can filter opportunities by network in the dashboard.",
        keywords: ["networks", "blockchain", "chains", "ethereum", "arbitrum", "polygon", "avalanche", "bsc", "optimism", "base"],
        urls: ["/chains", "/dashboard"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "data-source",
        category: "data",
        question: "where does the data come from",
        answer: "All yield farming data comes from DeFi Llama's API, which provides real-time APY rates, TVL data, and pool information. The data is synchronized automatically every 10 minutes to ensure accuracy.",
        keywords: ["data", "source", "defi llama", "api", "real-time", "accurate"],
        urls: ["/api", "/documentation"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "admin-panel",
        category: "admin",
        question: "how to access admin panel",
        answer: "The admin panel can be accessed by clicking the 'Admin' button in the header. You'll need to log in with admin credentials to manage pools, categories, platforms, and view analytics.",
        keywords: ["admin", "panel", "login", "manage", "dashboard"],
        urls: ["/admin/login", "/admin"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "api-access",
        category: "api",
        question: "how to use the api",
        answer: "The platform offers a REST API for accessing yield data. You can generate API keys in the admin panel and use them to make authenticated requests. Full API documentation is available at /api.",
        keywords: ["api", "rest", "key", "authentication", "documentation"],
        urls: ["/api", "/documentation"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "risk-analysis",
        category: "features",
        question: "how does risk analysis work",
        answer: "The platform provides comprehensive risk analysis including smart contract audits, liquidity risks, and platform reputation scores. The AI Risk Analyzer offers detailed risk assessments with mitigation strategies.",
        keywords: ["risk", "analysis", "security", "audit", "safety"],
        urls: ["/ai/risk-analyzer", "/risk-dashboard"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "portfolio-optimization",
        category: "features", 
        question: "how to optimize my portfolio",
        answer: "Use the AI Portfolio Optimizer tool to get personalized asset allocation recommendations. Input your investment amount, risk tolerance, and preferences to receive AI-powered portfolio suggestions with expected returns and diversification scores.",
        keywords: ["portfolio", "optimization", "allocation", "diversification", "recommendation"],
        urls: ["/ai/portfolio-optimizer"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "yield-predictions",
        category: "features",
        question: "can you predict future yields",
        answer: "The AI Yield Predictor analyzes market trends, protocol fundamentals, and historical data to forecast APY trends over 7, 30, or 90-day periods. It provides confidence intervals and key factors affecting predictions.",
        keywords: ["yield", "prediction", "forecast", "future", "trends", "apy"],
        urls: ["/ai/yield-predictor"],
        lastUpdated: new Date(),
        isActive: true
      },
      {
        id: "smart-alerts",
        category: "features",
        question: "how do alerts work",
        answer: "Smart Alerts monitor yield opportunities and notify you when specific conditions are met, such as APY thresholds, risk changes, or new high-yield pools. Configure your alert preferences in the Smart Alerts section.",
        keywords: ["alerts", "notifications", "monitoring", "threshold", "smart"],
        urls: ["/smart-alerts"],
        lastUpdated: new Date(),
        isActive: true
      },

    ];
  }

  public findAnswer(query: string, context?: any): { answer: string; confidence: number; urls: string[] } | null {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);
    
    let bestMatch: KnowledgeItem | null = null;
    let bestScore = 0;

    for (const item of this.knowledgeBase) {
      if (!item.isActive) continue;

      let score = 0;
      
      // Direct question match (highest priority)
      if (lowerQuery.includes(item.question.toLowerCase())) {
        score += 100;
      }

      // Keyword matching
      for (const keyword of item.keywords) {
        if (lowerQuery.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Word overlap scoring
      const itemWords = [...item.keywords, ...item.question.toLowerCase().split(/\s+/)];
      for (const word of words) {
        if (word.length > 3 && itemWords.some(iw => iw.includes(word))) {
          score += 5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && bestScore >= 15) {
      return {
        answer: bestMatch.answer,
        confidence: Math.min(bestScore / 100, 1.0),
        urls: bestMatch.urls
      };
    }

    return null;
  }

  public recordUnknownQuery(query: string, context?: any): string {
    const queryKey = query.toLowerCase().trim();
    const existingQuery = this.unknownQueries.get(queryKey);

    if (existingQuery) {
      existingQuery.frequency += 1;
      existingQuery.timestamp = new Date();
      return existingQuery.id;
    }

    const unknownQuery: UnknownQuery = {
      id: `unknown_${Date.now()}`,
      question: query,
      timestamp: new Date(),
      userContext: context || {},
      frequency: 1,
      isResolved: false
    };

    this.unknownQueries.set(queryKey, unknownQuery);
    return unknownQuery.id;
  }

  public getUnknownQueries(): UnknownQuery[] {
    return Array.from(this.unknownQueries.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  public markQueryAsResolved(queryId: string, adminAnswer: string) {
    const query = Array.from(this.unknownQueries.values()).find(q => q.id === queryId);
    if (query) {
      query.isResolved = true;
      query.adminNotes = adminAnswer;
    }
  }

  public addKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): void {
    const knowledgeItem: KnowledgeItem = {
      ...item,
      id: `kb_${Date.now()}`,
      lastUpdated: new Date()
    };
    this.knowledgeBase.push(knowledgeItem);
  }

  public updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): boolean {
    const index = this.knowledgeBase.findIndex(item => item.id === id);
    if (index !== -1) {
      this.knowledgeBase[index] = { 
        ...this.knowledgeBase[index], 
        ...updates, 
        lastUpdated: new Date() 
      };
      return true;
    }
    return false;
  }

  public getStats() {
    return {
      totalKnowledgeItems: this.knowledgeBase.length,
      activeKnowledgeItems: this.knowledgeBase.filter(item => item.isActive).length,
      unknownQueries: this.unknownQueries.size,
      unresolvedQueries: Array.from(this.unknownQueries.values()).filter(q => !q.isResolved).length,
      frequentlyAskedUnknown: Array.from(this.unknownQueries.values())
        .filter(q => !q.isResolved)
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
    };
  }
}