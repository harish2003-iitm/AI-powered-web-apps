// Mock database implementation for the recommendation system
// In a real implementation, this would connect to a database

// Mock data store
const mockDb = {
  customers: [],
  products: [],
  recommendations: [],
  agents: [
    {
      id: 'agent-customer',
      name: 'Customer Agent',
      type: 'customer',
      description: 'Analyzes customer behavior and preferences',
      parameters: {
        personalityWeight: 0.7,
        historyWeight: 0.8,
        contextAwareness: true,
        explorationRate: 0.2
      },
      model: 'gpt-4-turbo',
      enabled: true
    },
    {
      id: 'agent-product',
      name: 'Product Agent',
      type: 'product',
      description: 'Evaluates product relationships and characteristics',
      parameters: {
        similarityWeight: 0.8,
        popularityWeight: 0.6,
        categoryWeight: 0.7,
        seasonalityAware: true
      },
      model: 'gpt-4-turbo',
      enabled: true
    },
    {
      id: 'agent-recommendation',
      name: 'Recommendation Engine',
      type: 'recommendation-engine',
      description: 'Combines insights from other agents to generate recommendations',
      parameters: {
        customerAgentWeight: 0.7,
        productAgentWeight: 0.7,
        noveltyFactor: 0.3,
        diversityFactor: 0.4,
        confidenceThreshold: 0.6
      },
      model: 'gpt-4-turbo',
      enabled: true
    }
  ]
};

// Database operations
async function getCustomers() {
  console.log(`Getting all customers: ${mockDb.customers.length} found`);
  return mockDb.customers;
}

async function getCustomerById(customerId) {
  console.log(`Looking for customer with ID: ${customerId}`);
  console.log(`Available customers: ${mockDb.customers.map(c => c.id).join(', ')}`);
  
  const customer = mockDb.customers.find(c => c.id === customerId);
  
  if (customer) {
    console.log(`Found customer: ${customer.name}`);
  } else {
    console.log(`Customer not found with ID: ${customerId}`);
  }
  
  return customer;
}

async function addCustomers(customers) {
  mockDb.customers = [...mockDb.customers, ...customers];
  console.log(`Added ${customers.length} customers. Total: ${mockDb.customers.length}`);
  return customers.length;
}

async function getProducts() {
  console.log(`Getting all products: ${mockDb.products.length} found`);
  return mockDb.products;
}

async function getAllProducts() {
  console.log(`Getting all products: ${mockDb.products.length} found`);
  return mockDb.products;
}

async function addProducts(products) {
  mockDb.products = [...mockDb.products, ...products];
  return products.length;
}

async function getRecommendations() {
  return mockDb.recommendations;
}

async function addRecommendation(recommendation) {
  mockDb.recommendations.push(recommendation);
  return recommendation;
}

async function getAgents() {
  return mockDb.agents;
}

// Export database operations
module.exports = {
  getCustomers,
  getCustomerById,
  addCustomers,
  getProducts,
  getAllProducts,
  addProducts,
  getRecommendations,
  addRecommendation,
  getAgents,
  mockDb
}; 