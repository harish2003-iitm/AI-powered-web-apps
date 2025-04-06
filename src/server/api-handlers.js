const { MultiAgentSystem } = require('./multiagent');
const dbService = require('./recommendation-db');

// Global MultiAgentSystem instance
let multiAgentSystem = null;

// Initialize the MultiAgentSystem
function initializeMultiAgentSystem(agents) {
  if (multiAgentSystem) return multiAgentSystem;
  
  const agentConfigs = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    enabled: agent.enabled,
    model: agent.model,
    parameters: agent.parameters
  }));
  
  multiAgentSystem = new MultiAgentSystem(agentConfigs);
  return multiAgentSystem;
}

// Customer analysis handler
async function analyzeCustomers(req, res, mockDb) {
  const { agentId } = req.body;
  
  // Find the agent
  const agent = mockDb.agents.find(a => a.id === agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (!agent.enabled) {
    return res.status(400).json({ error: 'Agent is not active' });
  }
  
  // Check if we have both customers and products
  if (mockDb.customers.length === 0) {
    return res.status(400).json({ error: 'No customer data available for analysis' });
  }
  
  if (mockDb.products.length === 0) {
    return res.status(400).json({ error: 'No product data available for analysis' });
  }
  
  try {
    // Initialize the MultiAgentSystem if not already done
    const agentSystem = initializeMultiAgentSystem(mockDb.agents);
    
    // Sample a few customers for analysis (to avoid overloading the API)
    const customersToAnalyze = mockDb.customers.slice(0, 3);
    
    // Use the real customer agent to analyze customers
    const customerAgent = agentSystem.getAgent('customer');
    
    if (!customerAgent) {
      return res.status(500).json({ error: 'Customer agent not initialized properly' });
    }
    
    // Generate customer profiles using AI
    const customerProfiles = [];
    for (const customer of customersToAnalyze) {
      try {
        // Get real insights from the LLM
        const insights = await customerAgent.generateInsights(customer);
        
        // Transform LLM insights to the expected format for the UI
        const customerProfile = {
          id: customer.id,
          name: customer.name,
          segment: insights.purchasePatterns?.preferredCategories?.[0] || 'General',
          preferences: insights.interests || [],
          recommendations: insights.predictions?.likelyToBuy || []
        };
        
        customerProfiles.push(customerProfile);
      } catch (error) {
        console.error(`Error analyzing customer ${customer.id}:`, error);
      }
    }
    
    res.json(customerProfiles);
  } catch (error) {
    console.error('Error in customer analysis:', error);
    res.status(500).json({ error: 'Failed to analyze customers' });
  }
}

// Product analysis handler
async function analyzeProducts(req, res, mockDb) {
  const { agentId } = req.body;
  
  // Find the agent
  const agent = mockDb.agents.find(a => a.id === agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (!agent.enabled) {
    return res.status(400).json({ error: 'Agent is not active' });
  }
  
  // Check if we have products
  if (mockDb.products.length === 0) {
    return res.status(400).json({ error: 'No product data available for analysis' });
  }
  
  try {
    // Initialize the MultiAgentSystem if not already done
    const agentSystem = initializeMultiAgentSystem(mockDb.agents);
    
    // Sample a few products for analysis (to avoid overloading the API)
    const productsToAnalyze = mockDb.products.slice(0, 3);
    
    // Use the real product agent to analyze products
    const productAgent = agentSystem.getAgent('product');
    
    if (!productAgent) {
      return res.status(500).json({ error: 'Product agent not initialized properly' });
    }
    
    // Generate product analysis using AI
    const productAnalyses = [];
    for (const product of productsToAnalyze) {
      try {
        // Get related products for context
        const relatedProducts = mockDb.products
          .filter(p => p.id !== product.id)
          .filter(p => 
            p.category === product.category || 
            (p.tags && product.tags && p.tags.some(tag => p.tags.includes(tag)))
          )
          .slice(0, 5);
          
        // Get real insights from the LLM
        const insights = await productAgent.generateInsights({ product, relatedProducts });
        
        // Format the response for the UI
        const analysisResult = {
          id: product.id,
          name: product.name,
          category: product.category,
          popularity: product.popularity || 50,
          associatedProducts: [],
          targetCustomers: insights.targetDemographic || []
        };
        
        // Add associated products from the insights
        if (insights.similarProducts && Array.isArray(insights.similarProducts)) {
          for (const productId of insights.similarProducts) {
            const associatedProduct = mockDb.products.find(p => p.id === productId);
            if (associatedProduct) {
              analysisResult.associatedProducts.push({
                name: associatedProduct.name,
                strength: 0.8
              });
            }
          }
        }
        
        // If we don't have enough associated products, add some from related products
        if (analysisResult.associatedProducts.length < 3) {
          for (const relatedProduct of relatedProducts) {
            if (!analysisResult.associatedProducts.some(ap => ap.name === relatedProduct.name)) {
              analysisResult.associatedProducts.push({
                name: relatedProduct.name,
                strength: 0.6
              });
              
              if (analysisResult.associatedProducts.length >= 3) break;
            }
          }
        }
        
        productAnalyses.push(analysisResult);
      } catch (error) {
        console.error(`Error analyzing product ${product.id}:`, error);
      }
    }
    
    res.json(productAnalyses);
  } catch (error) {
    console.error('Error in product analysis:', error);
    res.status(500).json({ error: 'Failed to analyze products' });
  }
}

// Generate recommendations handler
async function generateRecommendations(req, res, mockDb) {
  const { agentId } = req.body;
  
  // Find the agent
  const agent = mockDb.agents.find(a => a.id === agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (!agent.enabled) {
    return res.status(400).json({ error: 'Agent is not active' });
  }
  
  // Check if we have both customers and products
  if (mockDb.customers.length === 0) {
    return res.status(400).json({ error: 'No customer data available for recommendations' });
  }
  
  if (mockDb.products.length === 0) {
    return res.status(400).json({ error: 'No product data available for recommendations' });
  }
  
  try {
    // Initialize the MultiAgentSystem if not already done
    const agentSystem = initializeMultiAgentSystem(mockDb.agents);
    
    // Use all customers for generating recommendations
    const customersForRecommendations = mockDb.customers;
    console.log(`Generating recommendations for all ${customersForRecommendations.length} customers`);
    
    // Use the full MultiAgentSystem to generate real recommendations
    let recommendationCount = 0;
    let generatedRecommendations = [];
    
    console.log('Generating Ollama powered recommendations with llama3 model...');
    
    for (const customer of customersForRecommendations) {
      try {
        console.log(`Generating recommendations for customer ${customer.id}: ${customer.name}`);
        
        // Generate recommendations for this customer through OpenAI
        const recommendation = await agentSystem.generateRecommendations(customer.id);
        
        console.log('Raw recommendation from OpenAI:', JSON.stringify(recommendation));
        
        // Store the recommendation
        if (recommendation) {
          const newRecommendation = {
            id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            customerName: customer.name,
            recommendedProducts: recommendation.recommendedProducts.map(productId => {
              const product = mockDb.products.find(p => p.id === productId);
              return {
                id: productId,
                name: product?.name || 'Unknown Product'
              };
            }),
            agentType: 'recommendation-engine',
            timestamp: new Date().toISOString(),
            converted: false,
            justification: recommendation.justification || '',
            confidence: recommendation.confidence || 0.8,
            reasoning: recommendation.reasoning || ''
          };
          
          mockDb.recommendations.push(newRecommendation);
          generatedRecommendations.push(newRecommendation);
          recommendationCount++;
          
          console.log('Added new recommendation:', newRecommendation.id);
        }
      } catch (error) {
        console.error(`Error generating recommendations for customer ${customer.id}:`, error);
      }
    }
    
    res.json({ 
      success: true, 
      count: recommendationCount,
      recommendations: generatedRecommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations', details: error.message });
  }
}

module.exports = {
  analyzeCustomers,
  analyzeProducts,
  generateRecommendations
}; 