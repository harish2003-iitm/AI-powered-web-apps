const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
// Load environment variables from .env file
require('dotenv').config();

// Import MultiAgentSystem
const { MultiAgentSystem } = require('./server/multiagent');

// Import API handlers for LLM-powered endpoints
const { 
  analyzeCustomers,
  analyzeProducts, 
  generateRecommendations
} = require('./server/api-handlers');

const app = express();
const PORT = process.env.API_PORT || 8001;
const isProduction = process.env.NODE_ENV === 'production';

// Log configuration
console.log('Server configuration:');
console.log(`- Port: ${PORT}`);
console.log(`- Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log('- Using local Ollama with llama3 model');

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files from the React build directory
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../build')));
} else {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Add better error handling for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON format' });
  }
  next();
});

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware to handle various URL patterns and normalize them
app.use((req, res, next) => {
  // Handle direct API endpoints without any prefix (like /customers, /products, etc.)
  if (/^\/(customers|products|agents|metrics|recent|status|initialize)/.test(req.path)) {
    console.log(`[URL Rewrite] ${req.method} ${req.path} -> /api/recommendation${req.path}`);
    req.url = `/api/recommendation${req.path}`;
    return app._router.handle(req, res);
  }
  
  // Handle /recommendation/xyz URLs and rewrite to /api/recommendation/xyz
  if (req.path.startsWith('/recommendation/')) {
    console.log(`[URL Rewrite] ${req.method} ${req.path} -> /api${req.path}`);
    req.url = `/api${req.path}`;
    return app._router.handle(req, res);
  }
  
  next();
});

// Mock database data
const mockDb = {
  initialized: false,
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
      model: 'llama3-8b',
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
      model: 'llama3-8b',
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
      model: 'llama3-70b',
      enabled: true
    }
  ]
};

// Mock metrics data
const mockMetrics = {
  conversionRate: 28.5,
  conversionRateChange: 2.5,
  averageOrderValue: 120.75,
  aovChange: 3.8,
  recommendationClickRate: 32.4,
  clickRateChange: 1.2,
  totalRecommendations: 1250,
  todayRecommendations: 78,
  agentPerformance: {
    customerAgent: {
      accuracy: 85.2,
      recommendationCount: 450
    },
    productAgent: {
      accuracy: 78.1,
      recommendationCount: 380
    },
    recommendationEngine: {
      accuracy: 92.5,
      recommendationCount: 420
    }
  }
};

// Sample products data
const sampleProducts = [
  {
    id: 'prod-001',
    name: 'Premium Bluetooth Headphones',
    description: 'Noise-cancelling headphones with premium sound quality',
    price: 129.99,
    category: 'Electronics',
    subcategory: 'Audio',
    imageUrl: 'https://via.placeholder.com/300',
    attributes: {
      color: 'Black',
      wireless: true,
      batteryLife: '30 hours',
      noiseCancelling: true
    },
    tags: ['wireless', 'premium', 'audio', 'noise-cancelling'],
    popularity: 92,
    stock: 45,
    createdAt: '2023-01-15T14:22:10Z',
    updatedAt: '2023-04-20T09:15:33Z'
  },
  {
    id: 'prod-002',
    name: 'Ergonomic Office Chair',
    description: 'Adjustable office chair with lumbar support and breathable mesh',
    price: 229.99,
    category: 'Furniture',
    subcategory: 'Office',
    imageUrl: 'https://via.placeholder.com/300',
    attributes: {
      color: 'Gray',
      material: 'Mesh',
      adjustableHeight: true,
      reclinable: true
    },
    tags: ['office', 'ergonomic', 'chair', 'comfortable'],
    popularity: 87,
    stock: 28,
    createdAt: '2023-02-10T11:30:05Z',
    updatedAt: '2023-05-02T16:45:27Z'
  },
  {
    id: 'prod-003',
    name: 'Smart Fitness Watch',
    description: 'Track your workouts, heart rate, and sleep patterns',
    price: 159.99,
    category: 'Electronics',
    subcategory: 'Wearables',
    imageUrl: 'https://via.placeholder.com/300',
    attributes: {
      color: 'Black/Silver',
      waterproof: true,
      batteryLife: '7 days',
      heartRateMonitor: true
    },
    tags: ['fitness', 'smart watch', 'health', 'wearable'],
    popularity: 94,
    stock: 62,
    createdAt: '2023-01-22T08:12:45Z',
    updatedAt: '2023-04-15T13:20:18Z'
  }
];

// Sample metrics data for the dashboard
const sampleMetrics = {
  totalRecommendations: 1254,
  conversionRate: 0.24,
  averageOrderValue: 87.42,
  clickThroughRate: 0.34,
  topAgentPerformance: 31.5,
  revenueFromRecommendations: 23456.78,
  customerSatisfactionScore: 8.7,
  previousPeriodConversionRate: 0.22,
  previousPeriodAverageOrderValue: 82.15,
  previousPeriodClickThroughRate: 0.31,
  timePeriod: "Last 30 days"
};

// Sample recent recommendations
const sampleRecentRecommendations = [
  {
    id: "rec-001",
    customerId: "cust-001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    date: "2023-05-20T14:22:10Z",
    products: [
      {
        id: "prod-001",
        name: "Premium Headphones",
        price: 129.99,
        imageUrl: "https://source.unsplash.com/random/100x100/?headphones"
      },
      {
        id: "prod-002",
        name: "Wireless Mouse",
        price: 45.99,
        imageUrl: "https://source.unsplash.com/random/100x100/?mouse"
      }
    ],
    status: "converted",
    agentId: "agent-a",
    agentName: "Agent A"
  },
  {
    id: "rec-002",
    customerId: "cust-002",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    date: "2023-05-18T09:15:45Z",
    products: [
      {
        id: "prod-003",
        name: "Running Shoes",
        price: 89.95,
        imageUrl: "https://source.unsplash.com/random/100x100/?shoes"
      }
    ],
    status: "pending",
    agentId: "agent-b",
    agentName: "Agent B"
  },
  {
    id: "rec-003",
    customerId: "cust-003",
    customerName: "Mike Johnson",
    customerEmail: "mike@example.com",
    date: "2023-05-17T16:50:30Z",
    products: [
      {
        id: "prod-004",
        name: "Smart Watch",
        price: 199.99,
        imageUrl: "https://source.unsplash.com/random/100x100/?smartwatch"
      },
      {
        id: "prod-005",
        name: "Fitness Tracker",
        price: 79.99,
        imageUrl: "https://source.unsplash.com/random/100x100/?fitnesstracker"
      }
    ],
    status: "rejected",
    agentId: "agent-c",
    agentName: "Agent C"
  }
];

// Sample customer profiles for analysis
const sampleCustomerProfiles = [
  {
    id: "cust-001",
    name: "John Doe",
    preferences: ["Electronics", "Gaming", "Outdoor"],
    purchaseHistory: [
      { productId: "prod-001", productName: "Premium Headphones", date: "2023-05-10T10:30:00Z" },
      { productId: "prod-004", productName: "Smart Watch", date: "2023-04-22T14:15:30Z" },
      { productId: "prod-007", productName: "Bluetooth Speaker", date: "2023-03-15T09:45:00Z" }
    ],
    segment: "Tech Enthusiast",
    recommendations: ["4K Monitor", "Wireless Keyboard", "Noise-Cancelling Earbuds"]
  },
  {
    id: "cust-002",
    name: "Jane Smith",
    preferences: ["Fashion", "Beauty", "Fitness"],
    purchaseHistory: [
      { productId: "prod-003", productName: "Running Shoes", date: "2023-05-05T16:20:00Z" },
      { productId: "prod-008", productName: "Yoga Mat", date: "2023-04-12T11:30:00Z" },
      { productId: "prod-011", productName: "Fitness Tracker", date: "2023-03-01T15:45:00Z" }
    ],
    segment: "Active Lifestyle",
    recommendations: ["Workout Clothes", "Protein Supplements", "Running Jacket"]
  },
  {
    id: "cust-003",
    name: "Mike Johnson",
    preferences: ["Home", "Kitchen", "DIY"],
    purchaseHistory: [
      { productId: "prod-015", productName: "Coffee Maker", date: "2023-05-18T08:45:00Z" },
      { productId: "prod-022", productName: "Cookware Set", date: "2023-04-05T13:20:00Z" },
      { productId: "prod-031", productName: "Power Drill", date: "2023-03-22T10:15:00Z" }
    ],
    segment: "Home Improver",
    recommendations: ["Kitchen Knife Set", "Air Fryer", "Smart Home Hub"]
  }
];

// Sample product analyses
const sampleProductAnalyses = [
  {
    id: "prod-001",
    name: "Premium Headphones",
    category: "Electronics",
    popularity: 85,
    associatedProducts: [
      { id: "prod-002", name: "Wireless Mouse", strength: 65 },
      { id: "prod-004", name: "Smart Watch", strength: 45 },
      { id: "prod-007", name: "Bluetooth Speaker", strength: 75 }
    ],
    targetCustomers: ["Tech Enthusiast", "Remote Worker", "College Student"]
  },
  {
    id: "prod-003",
    name: "Running Shoes",
    category: "Fashion",
    popularity: 78,
    associatedProducts: [
      { id: "prod-008", name: "Yoga Mat", strength: 55 },
      { id: "prod-011", name: "Fitness Tracker", strength: 80 },
      { id: "prod-016", name: "Water Bottle", strength: 60 }
    ],
    targetCustomers: ["Active Lifestyle", "Sports Enthusiast", "Health Conscious"]
  },
  {
    id: "prod-015",
    name: "Coffee Maker",
    category: "Kitchen",
    popularity: 72,
    associatedProducts: [
      { id: "prod-022", name: "Cookware Set", strength: 40 },
      { id: "prod-029", name: "Espresso Cups", strength: 85 },
      { id: "prod-034", name: "Coffee Grinder", strength: 90 }
    ],
    targetCustomers: ["Home Improver", "Coffee Lover", "Young Professional"]
  }
];

// Sample agents
const sampleAgents = [
  {
    id: "agent-001",
    name: "Customer Analysis Agent",
    type: "customer",
    status: "active",
    accuracy: 87,
    confidence: 82,
    settings: {
      personalityWeight: 0.7,
      historyWeight: 0.8,
      demographicWeight: 0.5,
      useLongTermMemory: true,
      confidenceThreshold: 0.65
    }
  },
  {
    id: "agent-002",
    name: "Product Matching Agent",
    type: "product",
    status: "active",
    accuracy: 92,
    confidence: 88,
    settings: {
      similarityWeight: 0.8,
      popularityWeight: 0.6,
      seasonalityAdjustment: 0.4,
      priceRangeWeight: 0.7,
      inventoryInfluence: 0.5
    }
  },
  {
    id: "agent-003",
    name: "Recommendation Engine",
    type: "recommendation",
    status: "active",
    accuracy: 85,
    confidence: 79,
    settings: {
      noveltyFactor: 0.3,
      diversityFactor: 0.4,
      trendWeight: 0.6,
      crossCategoryEnabled: true,
      maxRecommendations: 5
    }
  }
];

// Initialize the MultiAgentSystem
let multiAgentSystem = null;

// Add a function to initialize the MultiAgentSystem
function initializeMultiAgentSystem() {
  console.log('Initializing MultiAgentSystem...');
  
  if (multiAgentSystem) {
    console.log('Reusing existing MultiAgentSystem instance');
    return multiAgentSystem;
  }
  
  const agentConfigs = mockDb.agents.map(agent => {
    console.log(`Configuring agent: ${agent.name} (${agent.type})`);
    
    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      enabled: agent.enabled,
      model: 'gpt-4-turbo', // Use the latest GPT-4 model
      parameters: agent.parameters
    };
  });
  
  try {
    multiAgentSystem = new MultiAgentSystem(agentConfigs);
    console.log('MultiAgentSystem initialized successfully');
    return multiAgentSystem;
  } catch (error) {
    console.error('Failed to initialize MultiAgentSystem:', error);
    throw error;
  }
}

// API Routes

// Database status
app.get('/api/recommendation/status', (req, res) => {
  res.json({ initialized: mockDb.initialized });
});

// Initialize recommendation system
app.post('/api/recommendation/initialize', (req, res) => {
  console.log(new Date().toISOString() + ' - POST /api/recommendation/initialize');
  
  if (mockDb.initialized) {
    res.json({ success: true, message: 'Recommendation system already initialized' });
    return;
  }
  
  // Clear any existing data
  mockDb.customers = [];
  mockDb.products = [];
  mockDb.recommendations = [];
  
  // Add sample customer data if none exists
  const sampleCustomers = [
    {
      id: 'C10001',
      name: 'John Smith',
      email: 'john.smith@example.com',
      preferences: ['electronics', 'gaming', 'technology'],
      tags: ['tech enthusiast', 'gamer'],
      purchaseHistory: [
        { productId: 'P1001', date: '2023-01-15' },
        { productId: 'P1002', date: '2023-02-28' }
      ]
    },
    {
      id: 'C10002',
      name: 'Emily Johnson',
      email: 'emily.johnson@example.com',
      preferences: ['fashion', 'accessories', 'beauty'],
      tags: ['fashion lover', 'trendsetter'],
      purchaseHistory: [
        { productId: 'P2001', date: '2023-01-20' },
        { productId: 'P2003', date: '2023-03-10' }
      ]
    },
    {
      id: 'C10003',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      preferences: ['home', 'kitchen', 'furniture'],
      tags: ['home decorator', 'cooking enthusiast'],
      purchaseHistory: [
        { productId: 'P3002', date: '2023-02-05' },
        { productId: 'P3005', date: '2023-03-15' }
      ]
    },
    {
      id: 'C10004',
      name: 'Sophia Rodriguez',
      email: 'sophia.rodriguez@example.com',
      preferences: ['books', 'music', 'entertainment'],
      tags: ['reader', 'music lover'],
      purchaseHistory: [
        { productId: 'P4001', date: '2023-01-25' },
        { productId: 'P4003', date: '2023-03-05' }
      ]
    },
    {
      id: 'C10005',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      preferences: ['sports', 'fitness', 'outdoor'],
      tags: ['athlete', 'outdoor enthusiast'],
      purchaseHistory: [
        { productId: 'P5002', date: '2023-02-10' },
        { productId: 'P5004', date: '2023-03-20' }
      ]
    }
  ];
  
  // Add sample product data if none exists
  const sampleProducts = [
    {
      id: 'P1001',
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 129.99,
      category: 'Electronics',
      tags: ['audio', 'wireless', 'headphones'],
      popularity: 85
    },
    {
      id: 'P1002',
      name: 'Ultra HD Smart TV 55"',
      description: '4K Ultra HD resolution with smart features',
      price: 699.99,
      category: 'Electronics',
      tags: ['tv', 'entertainment', 'smart devices'],
      popularity: 92
    },
    {
      id: 'P2001',
      name: 'Designer Leather Handbag',
      description: 'Premium leather handbag with elegant design',
      price: 249.99,
      category: 'Fashion',
      tags: ['bags', 'accessories', 'luxury'],
      popularity: 78
    },
    {
      id: 'P2002',
      name: 'Men\'s Wool Dress Coat',
      description: 'Classic wool coat perfect for formal occasions',
      price: 179.99,
      category: 'Fashion',
      tags: ['coats', 'men\'s clothing', 'winter'],
      popularity: 75
    },
    {
      id: 'P3001',
      name: 'Modern Coffee Table',
      description: 'Sleek modern design coffee table for living rooms',
      price: 199.99,
      category: 'Furniture',
      tags: ['living room', 'tables', 'modern'],
      popularity: 70
    },
    {
      id: 'P3002',
      name: 'Professional Kitchen Knife Set',
      description: 'High-carbon stainless steel knife set for chefs',
      price: 149.99,
      category: 'Kitchen',
      tags: ['cooking', 'knives', 'culinary'],
      popularity: 88
    },
    {
      id: 'P4001',
      name: 'Bestselling Thriller Novel',
      description: 'Latest thriller from a renowned author',
      price: 24.99,
      category: 'Books',
      tags: ['reading', 'thriller', 'bestseller'],
      popularity: 82
    },
    {
      id: 'P4002',
      name: 'Wireless Bluetooth Speaker',
      description: 'Portable speaker with powerful audio',
      price: 79.99,
      category: 'Electronics',
      tags: ['audio', 'speakers', 'portable'],
      popularity: 89
    },
    {
      id: 'P5001',
      name: 'Running Shoes',
      description: 'Lightweight cushioned running shoes',
      price: 119.99,
      category: 'Sports',
      tags: ['running', 'fitness', 'shoes'],
      popularity: 90
    },
    {
      id: 'P5002',
      name: 'Yoga Mat with Carry Strap',
      description: 'Non-slip yoga mat with alignment guides',
      price: 39.99,
      category: 'Fitness',
      tags: ['yoga', 'exercise', 'fitness'],
      popularity: 86
    }
  ];
  
  // Important: Directly assign the data to the mockDb 
  // and also make sure to access the mockDb through dbService
  mockDb.customers = sampleCustomers;
  mockDb.products = sampleProducts;
  
  // Access the same mockDb through dbService to ensure it has the reference
  const dbServiceMockDb = require('./server/recommendation-db').mockDb;
  dbServiceMockDb.customers = sampleCustomers;
  dbServiceMockDb.products = sampleProducts;
  
  // Mark as initialized
  mockDb.initialized = true;
  dbServiceMockDb.initialized = true;
  
  console.log('Database initialized with sample data:');
  console.log('- Customers:', mockDb.customers.length);
  console.log('- Products:', mockDb.products.length);
  console.log('- Customer IDs:', mockDb.customers.map(c => c.id).join(', '));
  
  res.json({ success: true, message: 'Recommendation system initialized successfully' });
});

// Reset recommendations only
app.post('/api/recommendation/reset-recommendations', (req, res) => {
  console.log('Reset recommendations endpoint called');
  
  // Keep products and customers but clear recommendations
  mockDb.recommendations = [];
  
  console.log('Recommendations reset, count now:', mockDb.recommendations.length);
  
  res.json({ 
    success: true, 
    message: 'Recommendations reset successfully',
    metrics: {
      totalRecommendations: 0,
      todayRecommendations: 0
    }
  });
});

// Get metrics
app.get('/api/recommendation/metrics', (req, res) => {
  console.log(new Date().toISOString() + ' - GET /api/recommendation/metrics');
  
  // Calculate dynamic metrics based on actual data
  const totalCustomers = mockDb.customers.length;
  const totalProducts = mockDb.products.length;
  const totalRecommendations = mockDb.recommendations.length;
  
  console.log('Metrics calculation:', {
    totalCustomers,
    totalProducts,
    totalRecommendations
  });
  
  // Calculate metrics based on real data
  const convertedRecommendations = mockDb.recommendations.filter(rec => rec.converted).length;
  const conversionRate = totalRecommendations > 0 
    ? ((convertedRecommendations / totalRecommendations) * 100).toFixed(1) * 1 
    : 0;
  
  // Average order value based on actual product data
  const avgPrice = mockDb.products.reduce((sum, product) => sum + (product.price || 0), 0) / 
                  (mockDb.products.length || 1);
  
  // Count recommendations made today
  const today = new Date().toISOString().split('T')[0];
  const todayRecommendations = mockDb.recommendations.filter(rec => 
    rec.timestamp && rec.timestamp.startsWith(today)
  ).length;
  
  // Create metrics object from real data
  const realMetrics = {
    conversionRate: conversionRate || 0,
    conversionRateChange: 1.5, 
    averageOrderValue: parseFloat(avgPrice.toFixed(2)) || 0,
    aovChange: 2.9,
    recommendationClickRate: totalRecommendations > 0 ? 25.0 : 0,
    clickRateChange: 0.4,
    totalRecommendations: totalRecommendations,
    todayRecommendations: todayRecommendations,
    agentPerformance: {
      customerAgent: {
        accuracy: totalRecommendations > 0 ? 85 : 0,
        recommendationCount: Math.floor(totalRecommendations / 3) || 0
      },
      productAgent: {
        accuracy: totalRecommendations > 0 ? 82 : 0,
        recommendationCount: Math.floor(totalRecommendations / 3) || 0
      },
      recommendationEngine: {
        accuracy: totalRecommendations > 0 ? 88 : 0,
        recommendationCount: Math.ceil(totalRecommendations / 3) || 0
      }
    }
  };
  
  console.log("Sending metrics with totalRecommendations:", realMetrics.totalRecommendations);
  res.json(realMetrics);
});

// Get recent recommendations
app.get('/api/recommendation/recent', (req, res) => {
  console.log(new Date().toISOString() + ' - GET /api/recommendation/recent');
  
  // Return the actual recommendations stored in the database
  res.json({ recommendations: mockDb.recommendations });
});

// Get products
app.get('/api/recommendation/products', (req, res) => {
  res.json(mockDb.products);
});

// Add products
app.post('/api/recommendation/products', (req, res) => {
  console.log(new Date().toISOString() + ' - POST /api/recommendation/products');
  const products = req.body;
  
  if (!Array.isArray(products)) {
    console.error('Invalid product data format:', typeof req.body);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid data format. Expected array of products.' 
    });
  }
  
  console.log(`Received ${products.length} products for import`);
  
  if (products.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No products to import. Array is empty.'
    });
  }
  
  // Consider all products valid, just make sure they're objects
  const validProducts = products.filter(product => {
    const isValid = product && typeof product === 'object';
    
    if (!isValid) {
      console.warn('Skipping invalid product:', product);
    }
    
    return isValid;
  });
  
  console.log(`Found ${validProducts.length} valid products out of ${products.length}`);
  
  if (validProducts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid products found in the import data. Products must be valid objects.'
    });
  }
  
  // Assign default properties to any missing required fields
  const processedProducts = validProducts.map((product, index) => {
    // Ensure required fields have default values
    return {
      id: product.id || `prod-auto-${Date.now()}-${index}`,
      name: product.name || `Unnamed Product ${index + 1}`,
      price: typeof product.price === 'number' ? product.price : 0,
      description: product.description || '',
      category: product.category || 'Uncategorized',
      inventory: typeof product.inventory === 'number' ? product.inventory : 0,
      popularity: typeof product.popularity === 'number' ? product.popularity : 0,
      tags: Array.isArray(product.tags) ? product.tags : [],
      imageUrl: product.imageUrl || '',
      ...product // Preserve any other properties
    };
  });
  
  // Add or update products (replace existing products with same id)
  const existingIds = new Set(mockDb.products.map(p => p.id));
  const newProducts = processedProducts.filter(p => !existingIds.has(p.id));
  const updatedProducts = mockDb.products.map(existing => {
    const update = processedProducts.find(p => p.id === existing.id);
    return update || existing;
  });
  
  // Update the database
  mockDb.products = [...updatedProducts, ...newProducts];
  
  console.log(`Successfully imported ${processedProducts.length} products (${newProducts.length} new, ${processedProducts.length - newProducts.length} updated)`);
  
  res.json({ 
    success: true, 
    importedCount: processedProducts.length,
    newCount: newProducts.length,
    updatedCount: processedProducts.length - newProducts.length
  });
});

// Get customers
app.get('/api/recommendation/customers', (req, res) => {
  res.json(mockDb.customers);
});

// Add customers
app.post('/api/recommendation/customers', (req, res) => {
  console.log(new Date().toISOString() + ' - POST /api/recommendation/customers');
  const customers = req.body;
  
  if (!Array.isArray(customers)) {
    console.error('Invalid customer data format:', typeof req.body);
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid data format. Expected array of customers.' 
    });
  }
  
  console.log(`Received ${customers.length} customers for import`);
  
  if (customers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No customers to import. Array is empty.'
    });
  }
  
  // Consider all customers valid as long as they're objects
  const validCustomers = customers.filter(customer => {
    const isValid = customer && typeof customer === 'object';
    
    if (!isValid) {
      console.warn('Skipping invalid customer:', customer);
    }
    
    return isValid;
  });
  
  console.log(`Found ${validCustomers.length} valid customers out of ${customers.length}`);
  
  if (validCustomers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid customers found in the import data. Customers must be valid objects.'
    });
  }
  
  // Assign default properties to any missing required fields
  const processedCustomers = validCustomers.map((customer, index) => {
    // Ensure required fields have default values
    return {
      id: customer.id || `cust-auto-${Date.now()}-${index}`,
      name: customer.name || `Customer ${index + 1}`,
      email: customer.email || `customer${index + 1}@example.com`,
      preferences: Array.isArray(customer.preferences) ? customer.preferences : [],
      tags: Array.isArray(customer.tags) ? customer.tags : [],
      registrationDate: customer.registrationDate || new Date().toISOString(),
      ...customer // Preserve any other properties
    };
  });
  
  // Add or update customers (replace existing customers with same id)
  const existingIds = new Set(mockDb.customers.map(c => c.id));
  const newCustomers = processedCustomers.filter(c => !existingIds.has(c.id));
  const updatedCustomers = mockDb.customers.map(existing => {
    const update = processedCustomers.find(c => c.id === existing.id);
    return update || existing;
  });
  
  // Update the database
  mockDb.customers = [...updatedCustomers, ...newCustomers];
  
  console.log(`Successfully imported ${processedCustomers.length} customers (${newCustomers.length} new, ${processedCustomers.length - newCustomers.length} updated)`);
  
  res.json({ 
    success: true, 
    importedCount: processedCustomers.length,
    newCount: newCustomers.length,
    updatedCount: processedCustomers.length - newCustomers.length
  });
});

// Get agent configurations
app.get('/api/recommendation/agents', (req, res) => {
  const formattedAgents = mockDb.agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.enabled ? 'active' : 'inactive',
    accuracy: Math.min(Math.random() * 15 + 80, 95),
    confidence: Math.min(Math.random() * 10 + 75, 90),
    settings: {
      ...agent.parameters
    }
  }));
  
  res.json(formattedAgents);
});

// Add endpoints for agent configuration
app.put('/api/recommendation/agents/:agentId/status', (req, res) => {
  console.log(new Date().toISOString() + ` - PUT /api/recommendation/agents/${req.params.agentId}/status`);
  const { status } = req.body;
  const agentId = req.params.agentId;
  
  // Update the agent status in the data
  const agentIndex = mockDb.agents.findIndex(agent => agent.id === agentId);
  if (agentIndex !== -1) {
    mockDb.agents[agentIndex].enabled = status === 'active';
    
    const formattedAgent = {
      id: mockDb.agents[agentIndex].id,
      name: mockDb.agents[agentIndex].name,
      type: mockDb.agents[agentIndex].type,
      status: mockDb.agents[agentIndex].enabled ? 'active' : 'inactive',
      accuracy: Math.min(Math.random() * 15 + 80, 95),
      confidence: Math.min(Math.random() * 10 + 75, 90),
      settings: {
        ...mockDb.agents[agentIndex].parameters
      }
    };
    
    res.json({ success: true, agent: formattedAgent });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.put('/api/recommendation/agents/:agentId/settings', (req, res) => {
  console.log(new Date().toISOString() + ` - PUT /api/recommendation/agents/${req.params.agentId}/settings`);
  const { settings } = req.body;
  const agentId = req.params.agentId;
  
  // Update the agent settings in the data
  const agentIndex = mockDb.agents.findIndex(agent => agent.id === agentId);
  if (agentIndex !== -1) {
    mockDb.agents[agentIndex].parameters = settings;
    
    const formattedAgent = {
      id: mockDb.agents[agentIndex].id,
      name: mockDb.agents[agentIndex].name,
      type: mockDb.agents[agentIndex].type,
      status: mockDb.agents[agentIndex].enabled ? 'active' : 'inactive',
      accuracy: Math.min(Math.random() * 15 + 80, 95),
      confidence: Math.min(Math.random() * 10 + 75, 90),
      settings: {
        ...mockDb.agents[agentIndex].parameters
      }
    };
    
    res.json({ success: true, agent: formattedAgent });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// Use LLM-powered API handlers
app.post('/api/recommendation/analyze/customers', (req, res) => {
  console.log(new Date().toISOString() + ' - POST /api/recommendation/analyze/customers');
  analyzeCustomers(req, res, mockDb);
});

app.post('/api/recommendation/analyze/products', (req, res) => {
  console.log(new Date().toISOString() + ' - POST /api/recommendation/analyze/products');
  analyzeProducts(req, res, mockDb);
});

app.post('/api/recommendation/generate', (req, res) => {
  console.log(new Date().toISOString() + ' - POST /api/recommendation/generate');
  generateRecommendations(req, res, mockDb);
});

// Add a catch-all handler for all other routes (return React app)
app.get('*', (req, res) => {
  if (isProduction || process.env.VERCEL) {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
});

// Create the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for serverless environment
module.exports = app; 