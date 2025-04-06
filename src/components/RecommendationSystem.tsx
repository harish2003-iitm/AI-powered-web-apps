import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from './ui/Tabs';
import CustomerDataUpload from './recommendation/CustomerDataUpload';
import ProductCatalog from './recommendation/ProductCatalog';
import RecommendationDashboard from './recommendation/RecommendationDashboard';
import AgentSettings from './recommendation/AgentSettings';
import { fetchApi } from '../utils/api';
import './RecommendationSystem.css';

const RecommendationSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if database is initialized on component mount
  useEffect(() => {
    const checkDbStatus = async () => {
      setIsLoading(true);
      try {
        const data = await fetchApi('/api/recommendation/status');
        setIsInitialized(data.initialized);
      } catch (err) {
        setError('Failed to connect to recommendation service');
        console.error('Error checking database status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkDbStatus();
  }, []);

  const handleInitializeSystem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchApi('/api/recommendation/initialize', {
        method: 'POST',
        body: JSON.stringify({})
      });
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error initializing system:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="recommendation-system loading">
        <div className="spinner"></div>
        <p>Loading recommendation system...</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="recommendation-system not-initialized">
        <h2>E-Commerce Recommendation System</h2>
        <p>The recommendation system database needs to be initialized before use.</p>
        {error && <div className="error-message">{error}</div>}
        <button 
          className="btn primary" 
          onClick={handleInitializeSystem}
          disabled={isLoading}
        >
          Initialize Recommendation System
        </button>
      </div>
    );
  }

  return (
    <div className="recommendation-system">
      <h2>E-Commerce Recommendation System</h2>
      <p className="system-description">
        Multi-agent AI system for hyper-personalized product recommendations
      </p>
      
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tab id="dashboard" label="Dashboard">
          <RecommendationDashboard />
        </Tab>
        <Tab id="customers" label="Customer Data">
          <CustomerDataUpload />
        </Tab>
        <Tab id="products" label="Product Catalog">
          <ProductCatalog />
        </Tab>
        <Tab id="agents" label="Agent Settings">
          <AgentSettings />
        </Tab>
      </Tabs>
    </div>
  );
};

export default RecommendationSystem; 