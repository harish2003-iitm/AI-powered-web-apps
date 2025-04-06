import { AgentConfig, Customer, Product, Recommendation } from '../types/recommendation';
import { v4 as uuidv4 } from 'uuid';
import * as dbService from './recommendation-db';
import axios from 'axios';

// Define agent types
type AgentType = 'customer' | 'product' | 'recommendation-engine';

// Abstract base class for all agents
abstract class RecommendationAgent {
  protected config: AgentConfig;
  protected llmClient: any;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llmClient = this.initializeLLM(config.model);
  }

  protected initializeLLM(model: string): any {
    // Real implementation using OpenAI
    return {
      generateText: async (prompt: string): Promise<string> => {
        try {
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4-turbo',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 1000
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
              }
            }
          );
          return response.data.choices[0].message.content;
        } catch (error) {
          console.error('Error calling OpenAI API:', error);
          throw new Error('Failed to generate text with OpenAI');
        }
      }
    };
  }

  abstract generateInsights(data: any): Promise<any>;
}

// Customer agent that analyzes customer behavior and preferences
class CustomerAgent extends RecommendationAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async generateInsights(customer: Customer): Promise<any> {
    if (!this.config.enabled) {
      return { success: false, message: 'Agent is disabled' };
    }
    
    const personalityWeight = this.config.parameters.personalityWeight as number;
    const historyWeight = this.config.parameters.historyWeight as number;
    const contextAwareness = this.config.parameters.contextAwareness as boolean;
    const explorationRate = this.config.parameters.explorationRate as number;
    
    // Create a prompt for the LLM
    const prompt = `
      You are a customer understanding AI agent that analyzes customer data to predict preferences and behavior.
      
      Analyze the following customer data:
      
      Customer ID: ${customer.id}
      Name: ${customer.name}
      Preferences: ${customer.preferences?.join(', ') || 'None'}
      Tags: ${customer.tags?.join(', ') || 'None'}
      
      Consider the following weights:
      - Personality importance: ${personalityWeight}
      - Purchase history importance: ${historyWeight}
      - Exploration rate for new items: ${explorationRate}
      ${contextAwareness ? '- Consider contextual factors like time of day, season, etc.' : ''}
      
      Provide a detailed analysis of this customer's preferences and shopping patterns.
      
      Format your response as a JSON object with the following structure:
      {
        "interests": ["interest1", "interest2", ...],
        "purchasePatterns": {
          "frequency": "low|medium|high",
          "averageSpend": number,
          "preferredCategories": ["category1", "category2", ...]
        },
        "predictions": {
          "likelyToBuy": ["product1", "product2", ...],
          "priceRange": "string",
          "stylePreferences": ["style1", "style2", ...]
        }
      }
    `;

    // Call the LLM
    const llmResponse = await this.llmClient.generateText(prompt);
    
    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(llmResponse);
      return {
        customerId: customer.id,
        ...parsedResponse,
        confidence: 0.85,
        reasoning: llmResponse
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // Fallback if parsing fails
      return {
        customerId: customer.id,
        interests: customer.preferences || [],
        purchasePatterns: {
          frequency: 'medium',
          averageSpend: 120.5,
          preferredCategories: ['electronics', 'books'],
        },
        predictions: {
          likelyToBuy: ['smartphones', 'accessories'],
          priceRange: '100-500',
          stylePreferences: ['modern', 'minimalist'],
        },
        confidence: 0.7,
        reasoning: llmResponse,
      };
    }
  }
}

// Product agent that understands product relationships and characteristics
class ProductAgent extends RecommendationAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async generateInsights(productData: { product: Product, relatedProducts: Product[] }): Promise<any> {
    if (!this.config.enabled) {
      return { success: false, message: 'Agent is disabled' };
    }

    const similarityWeight = this.config.parameters.similarityWeight as number;
    const popularityWeight = this.config.parameters.popularityWeight as number;
    const categoryWeight = this.config.parameters.categoryWeight as number;
    const seasonalityAware = this.config.parameters.seasonalityAware as boolean;

    const { product, relatedProducts } = productData;

    // Create a prompt for the LLM
    const prompt = `
      You are a product analysis AI agent that understands relationships between products and their characteristics.
      
      Analyze the following product and its relationship to other products:
      
      Product ID: ${product.id}
      Name: ${product.name}
      Category: ${product.category}
      Price: $${product.price}
      Tags: ${product.tags?.join(', ') || 'None'}
      
      Related products:
      ${relatedProducts.map((p, i) => `
      ${i+1}. ${p.name} (${p.category}) - $${p.price}
      `).join('')}
      
      Consider the following weights:
      - Similarity to other products importance: ${similarityWeight}
      - Popularity importance: ${popularityWeight}
      - Category relationship importance: ${categoryWeight}
      ${seasonalityAware ? '- Consider seasonal trends' : ''}
      
      Provide insights about this product and how it relates to others.
      
      Format your response as a JSON object with the following structure:
      {
        "similarProducts": ["productId1", "productId2", ...],
        "complementaryProducts": ["productId1", "productId2", ...],
        "targetDemographic": ["demographic1", "demographic2", ...],
        "seasonality": "string or null",
        "priceCompetitiveness": "budget|competitive|premium"
      }
    `;

    // Call the LLM
    const llmResponse = await this.llmClient.generateText(prompt);
    
    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(llmResponse);
      return {
        productId: product.id,
        ...parsedResponse,
        confidence: 0.82,
        reasoning: llmResponse
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // Fallback if parsing fails
      return {
        productId: product.id,
        similarProducts: relatedProducts.slice(0, 3).map(p => p.id),
        complementaryProducts: relatedProducts.slice(3, 6).map(p => p.id),
        targetDemographic: ['tech enthusiasts', 'professionals'],
        seasonality: seasonalityAware ? 'high demand in Q4' : null,
        priceCompetitiveness: product.price > 100 ? 'premium' : 'competitive',
        confidence: 0.75,
        reasoning: llmResponse,
      };
    }
  }
}

// Recommendation engine that combines insights from other agents
class RecommendationEngine extends RecommendationAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async generateInsights(data: { customerInsights: any, productInsights: any[], availableProducts: Product[] }): Promise<any> {
    if (!this.config.enabled) {
      return { success: false, message: 'Agent is disabled' };
    }

    const customerAgentWeight = this.config.parameters.customerAgentWeight as number;
    const productAgentWeight = this.config.parameters.productAgentWeight as number;
    const noveltyFactor = this.config.parameters.noveltyFactor as number;
    const diversityFactor = this.config.parameters.diversityFactor as number;
    const confidenceThreshold = this.config.parameters.confidenceThreshold as number;

    const { customerInsights, productInsights, availableProducts } = data;
    
    // Create a prompt for the LLM
    const prompt = `
      You are a recommendation engine AI that generates personalized product recommendations by combining customer and product insights.
      
      Generate personalized product recommendations based on the following:
      
      Customer Insights:
      - Interests: ${customerInsights.interests.join(', ')}
      - Likely to buy: ${customerInsights.predictions.likelyToBuy.join(', ')}
      - Price range: ${customerInsights.predictions.priceRange}
      
      Product Insights:
      ${productInsights.map((insight, i) => `
      Product ${i+1}:
      - Product ID: ${insight.productId}
      - Similar products: ${insight.similarProducts.join(', ')}
      - Complementary products: ${insight.complementaryProducts.join(', ')}
      - Target demographic: ${insight.targetDemographic.join(', ')}
      `).join('\n')}
      
      Available Products:
      ${availableProducts.map((p, i) => `
      ${i+1}. Product ID: ${p.id}
         Name: ${p.name}
         Category: ${p.category}
         Price: $${p.price}
         Tags: ${p.tags?.join(', ') || 'None'}
      `).join('\n')}
      
      Consider the following factors:
      - Customer insights weight: ${customerAgentWeight}
      - Product insights weight: ${productAgentWeight}
      - Novelty importance: ${noveltyFactor}
      - Diversity importance: ${diversityFactor}
      - Minimum confidence threshold: ${confidenceThreshold}
      
      Recommend the top 5 products for this customer from the available products list.
      
      Format your response as a JSON object with the following structure:
      {
        "recommendedProducts": ["productId1", "productId2", ...],
        "justification": "string explaining why these products were recommended"
      }
    `;

    // Call the LLM
    const llmResponse = await this.llmClient.generateText(prompt);
    
    // Parse the response as JSON
    try {
      const parsedResponse = JSON.parse(llmResponse);
      return {
        ...parsedResponse,
        confidence: 0.9,
        reasoning: llmResponse
      };
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // Fallback if parsing fails
      const recommendedProducts = availableProducts
        .sort(() => 0.5 - Math.random())
        .slice(0, 5)
        .map(p => p.id);
        
      return {
        recommendedProducts,
        justification: "Selected based on customer profile and product relevance",
        confidence: 0.7,
        reasoning: llmResponse,
      };
    }
  }
}

// Multi-agent system that coordinates all agents
export class MultiAgentSystem {
  private agents: Map<AgentType, RecommendationAgent>;
  
  constructor(agentConfigs: AgentConfig[]) {
    this.agents = new Map();
    
    // Initialize all agents
    for (const config of agentConfigs) {
      switch (config.type) {
        case 'customer':
          this.agents.set('customer', new CustomerAgent(config));
          break;
        case 'product':
          this.agents.set('product', new ProductAgent(config));
          break;
        case 'recommendation-engine':
          this.agents.set('recommendation-engine', new RecommendationEngine(config));
          break;
      }
    }
  }
  
  // Get a specific agent by type
  getAgent(type: AgentType): RecommendationAgent | undefined {
    return this.agents.get(type);
  }
  
  // Generate recommendations for a customer
  async generateRecommendations(customerId: string): Promise<any> {
    // 1. Fetch necessary data
    const customer = await this.fetchCustomerData(customerId);
    const products = await this.fetchProducts();
    
    if (!customer || products.length === 0) {
      throw new Error('Unable to generate recommendations: missing data');
    }
    
    // 2. Use the customer agent to get customer insights
    const customerAgent = this.agents.get('customer');
    if (!customerAgent) {
      throw new Error('Customer agent not available');
    }
    const customerInsights = await customerAgent.generateInsights(customer);
    
    // 3. Use the product agent to get product insights for relevant products
    const productAgent = this.agents.get('product');
    if (!productAgent) {
      throw new Error('Product agent not available');
    }
    
    // Select some products to analyze (using customer preferences as a guide)
    const customerPreferences = customerInsights.interests || [];
    const productsToAnalyze = products
      .filter(product => 
        customerPreferences.some((pref: string) => 
          product.category?.toLowerCase().includes(pref.toLowerCase()) ||
          (product.tags && product.tags.some(tag => 
            pref.toLowerCase().includes(tag.toLowerCase())
          ))
        )
      )
      .slice(0, 3); // Limit to 3 products for API efficiency
    
    // Fall back to random products if none match preferences
    if (productsToAnalyze.length === 0) {
      productsToAnalyze.push(...products
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
      );
    }
    
    // Generate insights for each selected product
    const productInsights = [];
    for (const product of productsToAnalyze) {
      const relatedProducts = products
        .filter(p => p.id !== product.id)
        .filter(p => 
          p.category === product.category || 
          (p.tags && product.tags && p.tags.some(tag => 
            p.tags?.includes(tag)
          ))
        )
        .slice(0, 5);
        
      const insight = await productAgent.generateInsights({ product, relatedProducts });
      productInsights.push(insight);
    }
    
    // 4. Use the recommendation engine to generate final recommendations
    const recommendationEngine = this.agents.get('recommendation-engine');
    if (!recommendationEngine) {
      throw new Error('Recommendation engine not available');
    }
    
    const recommendationInsights = await recommendationEngine.generateInsights({
      customerInsights,
      productInsights,
      availableProducts: products
    });
    
    return recommendationInsights;
  }
  
  // Helper function to fetch customer data
  private async fetchCustomerData(customerId: string): Promise<Customer | null> {
    try {
      const customer = await dbService.getCustomerById(customerId);
      return customer;
    } catch (error) {
      console.error('Error fetching customer data:', error);
      return null;
    }
  }
  
  // Helper function to fetch products
  private async fetchProducts(): Promise<Product[]> {
    try {
      const products = await dbService.getAllProducts();
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
  
  // Mark a recommendation as converted
  async markRecommendationAsConverted(recommendationId: string): Promise<void> {
    try {
      // In a real implementation, this would update the recommendation in the database
      console.log(`Marking recommendation ${recommendationId} as converted`);
      // Update database if needed
      // await dbService.updateRecommendation(recommendationId, { converted: true });
    } catch (error) {
      console.error('Error marking recommendation as converted:', error);
      throw new Error('Failed to mark recommendation as converted');
    }
  }
}

// Factory function to create the multi-agent system
export async function createMultiAgentSystem(): Promise<MultiAgentSystem> {
  const agentConfigs = await dbService.getAgentConfigs();
  return new MultiAgentSystem(agentConfigs);
} 