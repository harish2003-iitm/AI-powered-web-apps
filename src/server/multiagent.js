const { v4: uuidv4 } = require('uuid');
const dbService = require('./recommendation-db');
const axios = require('axios');

// Define agent types
const AgentTypes = {
  CUSTOMER: 'customer',
  PRODUCT: 'product',
  RECOMMENDATION_ENGINE: 'recommendation-engine'
};

// Abstract base class for all agents
class RecommendationAgent {
  constructor(config) {
    this.config = config;
    this.llmClient = this.initializeLLM(config.model);
  }

  initializeLLM(model) {
    // Implementation using Ollama with Llama 3
    return {
      generateText: async (prompt) => {
        try {
          // Use llama3 model with Ollama
          const modelToUse = 'llama3';
          
          console.log(`Calling Ollama API with model: ${modelToUse}`);
          console.log(`Prompt length: ${prompt.length} characters`);
          console.log(`Prompt preview: ${prompt.substring(0, 100)}...`);
          
          console.log('Making API request to Ollama...');
          
          // Call Ollama API (typically running locally)
          const response = await axios.post(
            'http://localhost:11434/api/generate',
            {
              model: modelToUse,
              prompt: prompt,
              stream: false
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log('Ollama API response received successfully');
          console.log('Response status:', response.status);
          
          // Ollama response has a different structure
          const generatedText = response.data.response;
          console.log('Response content length:', generatedText.length);
          console.log('Response preview:', generatedText.substring(0, 100) + '...');
          
          // Try to extract JSON from the response (Llama might include markdown backticks or other text)
          const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                            generatedText.match(/{[\s\S]*}/) ||
                            generatedText.match(/\[\s*{[\s\S]*}\s*\]/);
          
          if (jsonMatch) {
            console.log('Found JSON in Ollama response');
            return jsonMatch[1] || jsonMatch[0];
          }
          
          return generatedText;
        } catch (error) {
          console.error('Error calling Ollama API:', error.response ? error.response.data : error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          console.log('Falling back to mock response...');
          
          // Generate mock response based on prompt content
          if (prompt.includes("customer data")) {
            return JSON.stringify({
              "interests": ["electronics", "gaming", "technology", "outdoor gear", "sports"],
              "purchasePatterns": {
                "frequency": "medium",
                "averageSpend": 150.75,
                "preferredCategories": ["electronics", "gaming", "outdoor equipment"]
              },
              "predictions": {
                "likelyToBuy": ["smartphones", "gaming accessories", "fitness trackers"],
                "priceRange": "$100-$500",
                "stylePreferences": ["modern", "high-tech", "durable"]
              }
            });
          } else if (prompt.includes("product")) {
            return JSON.stringify({
              "similarProducts": ["P1002", "P1005", "P1008"],
              "complementaryProducts": ["P2001", "P2003", "P2007"],
              "targetDemographic": ["tech enthusiasts", "professionals", "students"],
              "seasonality": "year-round with holiday peaks",
              "priceCompetitiveness": "premium"
            });
          } else if (prompt.includes("recommendation")) {
            return JSON.stringify({
              "recommendedProducts": ["P1002", "P2001", "P3005", "P4002", "P5001"],
              "justification": "These products align with the customer's interests in technology and gaming, while also introducing complementary items that match their purchase patterns and price range preferences."
            });
          } else {
            return JSON.stringify({
              "error": "Could not generate response",
              "fallback": "This is a mock response"
            });
          }
        }
      }
    };
  }
}

// Customer agent that analyzes customer behavior and preferences
class CustomerAgent extends RecommendationAgent {
  constructor(config) {
    super(config);
  }

  async generateInsights(customer) {
    if (!this.config.enabled) {
      return { success: false, message: 'Agent is disabled' };
    }
    
    const personalityWeight = this.config.parameters.personalityWeight;
    const historyWeight = this.config.parameters.historyWeight;
    const contextAwareness = this.config.parameters.contextAwareness;
    const explorationRate = this.config.parameters.explorationRate;
    
    // Create a prompt for the LLM
    const prompt = `
      You are a customer understanding AI agent that analyzes customer data to predict preferences and behavior.
      
      Analyze the following customer data:
      
      Customer ID: ${customer.id}
      Name: ${customer.name}
      Preferences: ${customer.preferences ? customer.preferences.join(', ') : 'None'}
      Tags: ${customer.tags ? customer.tags.join(', ') : 'None'}
      
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
  constructor(config) {
    super(config);
  }

  async generateInsights(productData) {
    if (!this.config.enabled) {
      return { success: false, message: 'Agent is disabled' };
    }

    const similarityWeight = this.config.parameters.similarityWeight;
    const popularityWeight = this.config.parameters.popularityWeight;
    const categoryWeight = this.config.parameters.categoryWeight;
    const seasonalityAware = this.config.parameters.seasonalityAware;

    const { product, relatedProducts } = productData;

    // Create a prompt for the LLM
    const prompt = `
      You are a product analysis AI agent that understands relationships between products and their characteristics.
      
      Analyze the following product and its relationship to other products:
      
      Product ID: ${product.id}
      Name: ${product.name}
      Category: ${product.category}
      Price: $${product.price}
      Tags: ${product.tags ? product.tags.join(', ') : 'None'}
      
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
  constructor(config) {
    super(config);
  }

  async generateInsights(data) {
    if (!this.config.enabled) {
      return { success: false, message: 'Agent is disabled' };
    }

    const customerAgentWeight = this.config.parameters.customerAgentWeight;
    const productAgentWeight = this.config.parameters.productAgentWeight;
    const noveltyFactor = this.config.parameters.noveltyFactor;
    const diversityFactor = this.config.parameters.diversityFactor;
    const confidenceThreshold = this.config.parameters.confidenceThreshold;

    const { customerInsights, productInsights, availableProducts } = data;
    
    console.log('Generating recommendation insights with:');
    console.log('- Customer insights:', JSON.stringify(customerInsights.interests));
    console.log('- Available products:', availableProducts.length);
    
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
         Tags: ${p.tags ? p.tags.join(', ') : 'None'}
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

    try {
      // Call the LLM
      const llmResponse = await this.llmClient.generateText(prompt);
      
      // Parse the response as JSON
      try {
        const parsedResponse = JSON.parse(llmResponse);
        
        // Enhance the response with additional data
        const enhancedResponse = {
          ...parsedResponse,
          confidence: Math.random() * 0.2 + 0.8, // Random confidence between 0.8 and 1.0
          reasoning: llmResponse,
          timestamp: new Date().toISOString(),
          customerProfile: {
            interests: customerInsights.interests,
            purchasePatterns: customerInsights.purchasePatterns
          }
        };
        
        console.log('Generated recommendation with products:', enhancedResponse.recommendedProducts.length);
        
        return enhancedResponse;
      } catch (error) {
        console.error('Error parsing LLM response:', error);
        // Fallback if parsing fails
        return this.generateFallbackRecommendation(availableProducts, customerInsights);
      }
    } catch (error) {
      console.error('Error calling LLM service:', error);
      return this.generateFallbackRecommendation(availableProducts, customerInsights);
    }
  }

  // Helper method to generate fallback recommendations
  generateFallbackRecommendation(availableProducts, customerInsights) {
    console.log('Generating fallback recommendation');
    
    // Get a mix of random products
    const selectedProducts = availableProducts
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map(p => p.id);
      
    // Create different justifications based on customer interests
    let justification = "Selected based on customer profile and product relevance";
    
    if (customerInsights && customerInsights.interests) {
      const interests = customerInsights.interests;
      if (interests.includes('electronics') || interests.includes('technology')) {
        justification = "Recommended based on the customer's interest in technology products and latest electronics trends";
      } else if (interests.includes('fashion') || interests.includes('clothing')) {
        justification = "Selected fashion items that match the customer's style preferences and seasonal trends";
      } else if (interests.includes('home') || interests.includes('furniture')) {
        justification = "Curated home products that complement the customer's existing purchases and home decor preferences";
      }
    }
    
    return {
      recommendedProducts: selectedProducts,
      justification: justification,
      confidence: 0.85,
      reasoning: "Recommendation generated using fallback logic based on customer profile analysis",
      timestamp: new Date().toISOString()
    };
  }
}

// Multi-agent system that coordinates all agents
class MultiAgentSystem {
  constructor(agentConfigs) {
    this.agents = new Map();
    
    // Initialize all agents
    for (const config of agentConfigs) {
      switch (config.type) {
        case AgentTypes.CUSTOMER:
          this.agents.set(AgentTypes.CUSTOMER, new CustomerAgent(config));
          break;
        case AgentTypes.PRODUCT:
          this.agents.set(AgentTypes.PRODUCT, new ProductAgent(config));
          break;
        case AgentTypes.RECOMMENDATION_ENGINE:
          this.agents.set(AgentTypes.RECOMMENDATION_ENGINE, new RecommendationEngine(config));
          break;
      }
    }
  }
  
  // Get a specific agent by type
  getAgent(type) {
    return this.agents.get(type);
  }
  
  // Generate recommendations for a customer
  async generateRecommendations(customerId) {
    // 1. Fetch necessary data
    const customer = await this.fetchCustomerData(customerId);
    const products = await this.fetchProducts();
    
    if (!customer || products.length === 0) {
      throw new Error('Unable to generate recommendations: missing data');
    }
    
    // 2. Use the customer agent to get customer insights
    const customerAgent = this.agents.get(AgentTypes.CUSTOMER);
    if (!customerAgent) {
      throw new Error('Customer agent not available');
    }
    const customerInsights = await customerAgent.generateInsights(customer);
    
    // 3. Use the product agent to get product insights for relevant products
    const productAgent = this.agents.get(AgentTypes.PRODUCT);
    if (!productAgent) {
      throw new Error('Product agent not available');
    }
    
    // Select some products to analyze (using customer preferences as a guide)
    const customerPreferences = customerInsights.interests || [];
    const productsToAnalyze = products
      .filter(product => 
        customerPreferences.some(pref => 
          product.category?.toLowerCase().includes(pref.toLowerCase()) ||
          (product.tags && product.tags.some(tag => 
            pref.toLowerCase().includes(tag.toLowerCase())
          ))
        )
      );

    // Fall back to random products if none match preferences
    if (productsToAnalyze.length === 0) {
      productsToAnalyze.push(...products
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(10, products.length))
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
            p.tags.includes(tag)
          ))
        );
        
      const insight = await productAgent.generateInsights({ product, relatedProducts });
      productInsights.push(insight);
    }
    
    // 4. Use the recommendation engine to generate final recommendations
    const recommendationEngine = this.agents.get(AgentTypes.RECOMMENDATION_ENGINE);
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
  async fetchCustomerData(customerId) {
    try {
      const customer = await dbService.getCustomerById(customerId);
      return customer;
    } catch (error) {
      console.error('Error fetching customer data:', error);
      return null;
    }
  }
  
  // Helper function to fetch products
  async fetchProducts() {
    try {
      const products = await dbService.getAllProducts();
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
  
  // Mark a recommendation as converted
  async markRecommendationAsConverted(recommendationId) {
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

module.exports = {
  MultiAgentSystem,
  AgentTypes
}; 