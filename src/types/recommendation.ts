// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  age?: number;
  gender?: string;
  location?: string;
  registrationDate?: string;
  lastLoginDate?: string;
  preferences?: string[];
  tags?: string[];
  purchaseHistory?: Array<any>;
  browsingHistory?: string[];
  segment?: string;
  avgOrderValue?: number;
}

export interface CustomerBehavior {
  customerId: string;
  sessionId: string;
  viewedProducts: ViewedProduct[];
  searches: Search[];
  cartItems: CartItem[];
  purchaseHistory: Purchase[];
  timestamp: string;
}

export interface ViewedProduct {
  productId: string;
  viewDuration: number;
  timestamp: string;
}

export interface Search {
  query: string;
  resultCount: number;
  timestamp: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
  removedAt?: string;
}

export interface Purchase {
  orderId: string;
  products: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  timestamp: string;
}

// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  inventory?: number;
  popularity?: number;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
  attributes?: Record<string, any>;
  tags?: string[];
  brand?: string;
  rating?: number;
  averageRating?: number;
  customerReviewSentiment?: number;
  holiday?: boolean;
  season?: string;
  geographicalLocation?: string;
  similarProducts?: string[];
  recommendationProbability?: number;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  accuracy: number;
  confidence: number;
  settings: Record<string, any>;
}

// AgentConfig interface for server components
export interface AgentConfig {
  id: string;
  name: string;
  type: 'customer' | 'product' | 'recommendation-engine';
  enabled: boolean;
  model: string;
  parameters: Record<string, any>;
}

// Customer analysis types
export interface CustomerProfile {
  id: string;
  name: string;
  preferences: string[];
  purchaseHistory: { productId: string; productName: string; date: string }[];
  segment: string;
  recommendations: string[];
}

// Product analysis types
export interface ProductAnalysis {
  id: string;
  name: string;
  category: string;
  popularity: number;
  associatedProducts: { id: string; name: string; strength: number }[];
  targetCustomers: string[];
}

// Recommendation types
export interface Recommendation {
  id: string;
  customerName: string;
  customerId?: string;
  recommendedProducts: {
    id: string;
    name: string;
  }[];
  agentType: string;
  timestamp: string;
  converted: boolean;
  reasoning?: string;
  confidence?: number;
  conversionTimestamp?: string;
}

export interface RecentRecommendation {
  id: string;
  customerName: string;
  recommendedProducts: Array<{
    id: string;
    name: string;
  }>;
  agentType: string;
  timestamp: string;
  converted: boolean;
}

// Dashboard metrics
export interface RecommendationMetrics {
  conversionRate: number;
  conversionRateChange: number;
  averageOrderValue: number;
  aovChange: number;
  recommendationClickRate: number;
  clickRateChange: number;
  totalRecommendations: number;
  todayRecommendations: number;
  agentPerformance: {
    customerAgent: {
      accuracy: number;
      recommendationCount: number;
    };
    productAgent: {
      accuracy: number;
      recommendationCount: number;
    };
    recommendationEngine: {
      accuracy: number;
      recommendationCount: number;
    };
  };
}

// Define types for agent performance metrics
export interface AgentPerformance {
  customer: { recommendationCount: number; accuracy: number };
  product: { recommendationCount: number; accuracy: number };
  recommendationengine: { recommendationCount: number; accuracy: number };
}

// Database status interface
export interface DatabaseStatus {
  initialized: boolean;
}

// MultiAgent system types
export interface CustomerInsights {
  customerId: string;
  interests: string[];
  purchasePatterns: {
    frequency: string;
    averageSpend: number;
    preferredCategories: string[];
  };
  predictions: {
    likelyToBuy: string[];
    priceRange: string;
    stylePreferences: string[];
  };
  confidence: number;
  reasoning: string;
}

export interface ProductInsights {
  productId: string;
  similarProducts: string[];
  complementaryProducts: string[];
  targetDemographic: string[];
  seasonality: string | null;
  priceCompetitiveness: string;
  confidence: number;
  reasoning: string;
}

export interface RecommendationInsights {
  recommendedProducts: Array<{
    id: string;
    name: string;
    reasoning: string;
    confidence: number;
  }>;
  overallConfidence: number;
  reasoning: string;
} 