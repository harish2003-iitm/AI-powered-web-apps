import { Router } from 'express';
import * as dbService from './recommendation-db';
import { createMultiAgentSystem } from './multiagent';
import { Customer, Product } from '../types/recommendation';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Initialize database
router.post('/recommendation/initialize', async (req, res) => {
  try {
    await dbService.initializeDatabase();
    res.json({ success: true, message: 'Recommendation system initialized successfully' });
  } catch (error) {
    console.error('Failed to initialize recommendation system:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize system' });
  }
});

// Get database status
router.get('/recommendation/status', async (req, res) => {
  try {
    const status = await dbService.getDatabaseStatus();
    res.json(status);
  } catch (error) {
    console.error('Failed to get database status:', error);
    res.status(500).json({ initialized: false });
  }
});

// Get customers
router.get('/recommendation/customers', async (req, res) => {
  try {
    const customers = await dbService.getCustomers();
    res.json({ customers });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

// Add customers
router.post('/recommendation/customers', async (req, res) => {
  try {
    const customers: Customer[] = req.body;
    
    if (!Array.isArray(customers)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of customers.' });
    }
    
    const importedCount = await dbService.addCustomers(customers);
    res.json({ success: true, importedCount });
  } catch (error) {
    console.error('Failed to add customers:', error);
    res.status(500).json({ success: false, message: 'Failed to import customers' });
  }
});

// Get products
router.get('/recommendation/products', async (req, res) => {
  try {
    const products = await dbService.getProducts();
    res.json({ products });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Add products
router.post('/recommendation/products', async (req, res) => {
  try {
    const products: Product[] = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of products.' });
    }
    
    const importedCount = await dbService.addProducts(products);
    res.json({ success: true, importedCount });
  } catch (error) {
    console.error('Failed to add products:', error);
    res.status(500).json({ success: false, message: 'Failed to import products' });
  }
});

// Get recent recommendations
router.get('/recommendation/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const recommendations = await dbService.getRecentRecommendations(limit);
    res.json({ recommendations });
  } catch (error) {
    console.error('Failed to fetch recent recommendations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
});

// Generate recommendations for a customer
router.post('/recommendation/generate', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' });
    }
    
    const multiAgentSystem = await createMultiAgentSystem();
    const recommendation = await multiAgentSystem.generateRecommendations(customerId);
    
    res.json({ success: true, recommendation });
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ success: false, message });
  }
});

// Mark recommendation as converted
router.post('/recommendation/convert', async (req, res) => {
  try {
    const { recommendationId } = req.body;
    
    if (!recommendationId) {
      return res.status(400).json({ success: false, message: 'Recommendation ID is required' });
    }
    
    const multiAgentSystem = await createMultiAgentSystem();
    await multiAgentSystem.markRecommendationAsConverted(recommendationId);
    
    res.json({ success: true, message: 'Recommendation marked as converted' });
  } catch (error) {
    console.error('Failed to mark recommendation as converted:', error);
    res.status(500).json({ success: false, message: 'Failed to update recommendation' });
  }
});

// Get recommendation metrics
router.get('/recommendation/metrics', async (req, res) => {
  try {
    const metrics = await dbService.getRecommendationMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Failed to fetch recommendation metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
});

// Get agent configurations
router.get('/recommendation/agents', async (req, res) => {
  try {
    const agents = await dbService.getAgentConfigs();
    res.json({ agents });
  } catch (error) {
    console.error('Failed to fetch agent configurations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agent configurations' });
  }
});

// Update agent configurations
router.put('/recommendation/agents', async (req, res) => {
  try {
    const { agents } = req.body;
    
    if (!Array.isArray(agents)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of agent configurations.' });
    }
    
    await dbService.updateAgentConfigs(agents);
    res.json({ success: true, message: 'Agent configurations updated successfully' });
  } catch (error) {
    console.error('Failed to update agent configurations:', error);
    res.status(500).json({ success: false, message: 'Failed to update agent configurations' });
  }
});

// Reset agent configurations to defaults
router.post('/recommendation/agents/reset', async (req, res) => {
  try {
    // First, reset the database to reinitialize default agent configs
    await dbService.resetDatabase();
    
    // Then fetch the reset agent configs
    const agents = await dbService.getAgentConfigs();
    res.json({ success: true, message: 'Agent configurations reset to defaults', agents });
  } catch (error) {
    console.error('Failed to reset agent configurations:', error);
    res.status(500).json({ success: false, message: 'Failed to reset agent configurations' });
  }
});

export default router; 