import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { Customer, Product, Recommendation, AgentConfig } from '../types/recommendation';

let db: Database | null = null;

export async function initializeDatabase(): Promise<void> {
  if (db) {
    return; // Database already initialized
  }

  // Open the database
  db = await open({
    filename: './recommendation.db',
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      location TEXT,
      registration_date TEXT NOT NULL,
      last_login_date TEXT,
      preferences TEXT,
      tags TEXT
    );

    CREATE TABLE IF NOT EXISTS customer_behavior (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );

    CREATE TABLE IF NOT EXISTS viewed_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      behavior_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      view_duration INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (behavior_id) REFERENCES customer_behavior (id)
    );

    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      behavior_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      result_count INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (behavior_id) REFERENCES customer_behavior (id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      behavior_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      added_at TEXT NOT NULL,
      removed_at TEXT,
      FOREIGN KEY (behavior_id) REFERENCES customer_behavior (id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      behavior_id INTEGER NOT NULL,
      order_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (behavior_id) REFERENCES customer_behavior (id)
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases (id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      image_url TEXT NOT NULL,
      attributes TEXT NOT NULL,
      tags TEXT NOT NULL,
      popularity REAL NOT NULL,
      stock INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      recommended_products TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      confidence REAL NOT NULL,
      timestamp TEXT NOT NULL,
      converted BOOLEAN NOT NULL DEFAULT 0,
      conversion_timestamp TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    );

    CREATE TABLE IF NOT EXISTS agent_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      parameters TEXT NOT NULL,
      model TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT 1
    );
  `);

  // Initialize with default agent configurations if empty
  const agentCount = await db.get('SELECT COUNT(*) as count FROM agent_configs');
  if (agentCount.count === 0) {
    await db.run(`
      INSERT INTO agent_configs (id, name, type, description, parameters, model, enabled) 
      VALUES 
        ('agent-customer', 'Customer Agent', 'customer', 'Analyzes customer behavior and preferences', 
         '{"personalityWeight":0.7,"historyWeight":0.8,"contextAwareness":true,"explorationRate":0.2}', 
         'llama3-8b', 1),
        ('agent-product', 'Product Agent', 'product', 'Evaluates product relationships and characteristics', 
         '{"similarityWeight":0.8,"popularityWeight":0.6,"categoryWeight":0.7,"seasonalityAware":true}', 
         'llama3-8b', 1),
        ('agent-recommendation', 'Recommendation Engine', 'recommendation-engine', 'Combines insights from other agents to generate recommendations', 
         '{"customerAgentWeight":0.7,"productAgentWeight":0.7,"noveltyFactor":0.3,"diversityFactor":0.4,"confidenceThreshold":0.6}', 
         'llama3-70b', 1)
    `);
  }
}

// Customer operations
export async function getCustomers(): Promise<Customer[]> {
  if (!db) await initializeDatabase();
  
  const customers = await db!.all(`SELECT * FROM customers`);
  return customers.map((customer: any) => ({
    ...customer,
    id: customer.id,
    name: customer.name,
    email: customer.email,
    age: customer.age,
    gender: customer.gender,
    location: customer.location,
    registrationDate: customer.registration_date,
    lastLoginDate: customer.last_login_date,
    preferences: customer.preferences ? JSON.parse(customer.preferences) : [],
    tags: customer.tags ? JSON.parse(customer.tags) : []
  }));
}

export async function addCustomers(customers: Customer[]): Promise<number> {
  if (!db) await initializeDatabase();
  
  let importedCount = 0;
  
  // Begin transaction for better performance
  await db!.exec('BEGIN TRANSACTION');
  
  try {
    const stmt = await db!.prepare(`
      INSERT OR REPLACE INTO customers 
      (id, name, email, age, gender, location, registration_date, last_login_date, preferences, tags) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const customer of customers) {
      await stmt.run(
        customer.id,
        customer.name,
        customer.email,
        customer.age || null,
        customer.gender || null,
        customer.location || null,
        customer.registrationDate,
        customer.lastLoginDate || null,
        customer.preferences ? JSON.stringify(customer.preferences) : null,
        customer.tags ? JSON.stringify(customer.tags) : null
      );
      importedCount++;
    }
    
    await stmt.finalize();
    await db!.exec('COMMIT');
    
    return importedCount;
  } catch (error) {
    await db!.exec('ROLLBACK');
    throw error;
  }
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  if (!db) await initializeDatabase();
  
  const products = await db!.all(`SELECT * FROM products`);
  return products.map((product: any) => ({
    ...product,
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    subcategory: product.subcategory,
    imageUrl: product.image_url,
    attributes: JSON.parse(product.attributes),
    tags: JSON.parse(product.tags),
    popularity: product.popularity,
    stock: product.stock,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  }));
}

export async function addProducts(products: Product[]): Promise<number> {
  if (!db) await initializeDatabase();
  
  let importedCount = 0;
  
  // Begin transaction for better performance
  await db!.exec('BEGIN TRANSACTION');
  
  try {
    const stmt = await db!.prepare(`
      INSERT OR REPLACE INTO products 
      (id, name, description, price, category, subcategory, image_url, 
       attributes, tags, popularity, stock, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const product of products) {
      await stmt.run(
        product.id,
        product.name,
        product.description,
        product.price,
        product.category,
        product.subcategory || null,
        product.imageUrl,
        JSON.stringify(product.attributes),
        JSON.stringify(product.tags),
        product.popularity,
        product.stock,
        product.createdAt,
        product.updatedAt
      );
      importedCount++;
    }
    
    await stmt.finalize();
    await db!.exec('COMMIT');
    
    return importedCount;
  } catch (error) {
    await db!.exec('ROLLBACK');
    throw error;
  }
}

// Recommendation operations
export async function getRecentRecommendations(limit: number = 10): Promise<any[]> {
  if (!db) await initializeDatabase();
  
  const recs = await db!.all(`
    SELECT r.id, r.customer_id, c.name as customer_name, r.recommended_products, 
           r.agent_type, r.timestamp, r.converted
    FROM recommendations r
    JOIN customers c ON r.customer_id = c.id
    ORDER BY r.timestamp DESC
    LIMIT ?
  `, limit);
  
  return Promise.all(recs.map(async (rec: any) => {
    const productIds = JSON.parse(rec.recommended_products);
    
    // Get product details for each recommended product
    const products = [];
    for (const productId of productIds) {
      const product = await db!.get('SELECT id, name FROM products WHERE id = ?', productId);
      if (product) {
        products.push(product);
      }
    }
    
    return {
      id: rec.id,
      customerName: rec.customer_name,
      recommendedProducts: products,
      agentType: rec.agent_type,
      timestamp: rec.timestamp,
      converted: !!rec.converted
    };
  }));
}

export async function addRecommendation(recommendation: Recommendation): Promise<void> {
  if (!db) await initializeDatabase();
  
  await db!.run(`
    INSERT INTO recommendations 
    (id, customer_id, recommended_products, agent_type, reasoning, 
     confidence, timestamp, converted, conversion_timestamp) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    recommendation.id,
    recommendation.customerId,
    JSON.stringify(recommendation.recommendedProducts),
    recommendation.agentType,
    recommendation.reasoning,
    recommendation.confidence,
    recommendation.timestamp,
    recommendation.converted ? 1 : 0,
    recommendation.conversionTimestamp || null
  );
}

// Agent configuration operations
export async function getAgentConfigs(): Promise<AgentConfig[]> {
  if (!db) await initializeDatabase();
  
  const configs = await db!.all(`SELECT * FROM agent_configs`);
  return configs.map((config: any) => ({
    id: config.id,
    name: config.name,
    type: config.type as 'customer' | 'product' | 'recommendation-engine',
    description: config.description,
    parameters: JSON.parse(config.parameters),
    model: config.model,
    enabled: !!config.enabled
  }));
}

export async function updateAgentConfigs(configs: AgentConfig[]): Promise<void> {
  if (!db) await initializeDatabase();
  
  // Begin transaction
  await db!.exec('BEGIN TRANSACTION');
  
  try {
    const stmt = await db!.prepare(`
      UPDATE agent_configs 
      SET parameters = ?, model = ?, enabled = ?
      WHERE id = ?
    `);
    
    for (const config of configs) {
      await stmt.run(
        JSON.stringify(config.parameters),
        config.model,
        config.enabled ? 1 : 0,
        config.id
      );
    }
    
    await stmt.finalize();
    await db!.exec('COMMIT');
  } catch (error) {
    await db!.exec('ROLLBACK');
    throw error;
  }
}

// Metrics operations
export async function getRecommendationMetrics(): Promise<any> {
  if (!db) await initializeDatabase();
  
  // Get total recommendations count
  const totalRecs = await db!.get('SELECT COUNT(*) as count FROM recommendations');
  
  // Get today's recommendations count
  const today = new Date().toISOString().split('T')[0];
  const todayRecs = await db!.get(
    'SELECT COUNT(*) as count FROM recommendations WHERE timestamp LIKE ?', 
    `${today}%`
  );
  
  // Get conversion rate
  const conversionStats = await db!.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted
    FROM recommendations
  `);
  
  const conversionRate = conversionStats.total > 0 
    ? (conversionStats.converted / conversionStats.total) * 100 
    : 0;
  
  // Get average order value from purchases made after recommendations
  const aovData = await db!.get(`
    SELECT AVG(p.total_amount) as avg_order_value
    FROM purchases p
    JOIN customer_behavior cb ON p.behavior_id = cb.id
    JOIN recommendations r ON r.customer_id = cb.customer_id
    WHERE p.timestamp > r.timestamp
    AND r.converted = 1
  `);
  
  // Get agent performance stats
  interface AgentPerformance {
    customer: { recommendationCount: number; accuracy: number };
    product: { recommendationCount: number; accuracy: number };
    recommendationengine: { recommendationCount: number; accuracy: number };
  }
  
  const agentPerformance: Record<string, { recommendationCount: number; accuracy: number }> = {};
  const agentTypes = ['customer', 'product', 'recommendation-engine'];
  
  for (const type of agentTypes) {
    const stats = await db!.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted
      FROM recommendations
      WHERE agent_type = ?
    `, type);
    
    const key = type.replace('-', '') as keyof AgentPerformance;
    agentPerformance[key] = {
      recommendationCount: stats.total,
      accuracy: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
    };
  }
  
  // Return complete metrics object
  return {
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    conversionRateChange: 2.5, // In a real system, calculate this by comparing to previous period
    averageOrderValue: aovData.avg_order_value || 0,
    aovChange: 3.8, // In a real system, calculate this by comparing to previous period
    recommendationClickRate: 32.4, // In a real system, track this through frontend interactions
    clickRateChange: 1.2, // In a real system, calculate this by comparing to previous period
    totalRecommendations: totalRecs.count,
    todayRecommendations: todayRecs.count,
    agentPerformance: {
      customerAgent: agentPerformance.customer,
      productAgent: agentPerformance.product,
      recommendationEngine: agentPerformance.recommendationengine
    }
  };
}

// Check database status
export async function getDatabaseStatus(): Promise<{ initialized: boolean }> {
  try {
    if (!db) {
      // Try to initialize
      await initializeDatabase();
    }
    
    // Check if essential tables exist
    const tables = await db!.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('customers', 'products', 'recommendations')
    `);
    
    return { initialized: tables.length === 3 };
  } catch (error) {
    console.error('Error checking database status:', error);
    return { initialized: false };
  }
}

// Reset the database (for testing)
export async function resetDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
  
  // Reinitialize
  await initializeDatabase();
}

// Get a single customer by ID
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  if (!db) await initializeDatabase();
  
  const customer = await db!.get(`SELECT * FROM customers WHERE id = ?`, customerId);
  
  if (!customer) return null;
  
  return {
    ...customer,
    id: customer.id,
    name: customer.name,
    email: customer.email,
    age: customer.age,
    gender: customer.gender,
    location: customer.location,
    registrationDate: customer.registration_date,
    lastLoginDate: customer.last_login_date,
    preferences: customer.preferences ? JSON.parse(customer.preferences) : [],
    tags: customer.tags ? JSON.parse(customer.tags) : []
  };
}

// Alias for getProducts to match function name in MultiAgentSystem
export async function getAllProducts(): Promise<Product[]> {
  return getProducts();
} 