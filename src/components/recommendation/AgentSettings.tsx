import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../utils/api';
import './AgentSettings.css';
import { Agent, CustomerProfile, ProductAnalysis } from '../../types/recommendation';

const AgentSettings: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [productAnalyses, setProductAnalyses] = useState<ProductAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomerAnalysis, setShowCustomerAnalysis] = useState<boolean>(false);
  const [showProductAnalysis, setShowProductAnalysis] = useState<boolean>(false);
  const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchApi('/api/recommendation/agents');
        setAgents(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedAgent(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgents();
  }, []);

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgent(e.target.value);
  };

  const handleStatusToggle = async (agentId: string, newStatus: 'active' | 'inactive') => {
    try {
      await fetchApi(`/api/recommendation/agents/${agentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state
      setAgents(agents.map(agent => 
        agent.id === agentId ? { ...agent, status: newStatus } : agent
      ));
      
      setSuccessMessage(`Agent status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating agent status:', err);
      setError('Failed to update agent status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSettingChange = (agentId: string, setting: string, value: any) => {
    setAgents(agents.map(agent => 
      agent.id === agentId 
        ? { ...agent, settings: { ...agent.settings, [setting]: value } } 
        : agent
    ));
  };

  const saveSettings = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    try {
      await fetchApi(`/api/recommendation/agents/${agentId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ settings: agent.settings })
      });
      
      setSuccessMessage("Agent settings saved successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving agent settings:', err);
      setError('Failed to save agent settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  const runCustomerAnalysis = async () => {
    setAnalysisInProgress(true);
    setShowCustomerAnalysis(true);
    setShowProductAnalysis(false);
    setError(null);
    
    try {
      const data = await fetchApi('/api/recommendation/analyze/customers', {
        method: 'POST',
        body: JSON.stringify({ agentId: selectedAgent })
      });
      
      setCustomerProfiles(data);
    } catch (err) {
      console.error('Error analyzing customers:', err);
      setError('Failed to analyze customers');
    } finally {
      setAnalysisInProgress(false);
    }
  };

  const runProductAnalysis = async () => {
    setAnalysisInProgress(true);
    setShowProductAnalysis(true);
    setShowCustomerAnalysis(false);
    setError(null);
    
    try {
      const data = await fetchApi('/api/recommendation/analyze/products', {
        method: 'POST',
        body: JSON.stringify({ agentId: selectedAgent })
      });
      
      setProductAnalyses(data);
    } catch (err) {
      console.error('Error analyzing products:', err);
      setError('Failed to analyze products');
    } finally {
      setAnalysisInProgress(false);
    }
  };

  const generatePersonalizedRecommendations = async () => {
    setAnalysisInProgress(true);
    setError(null);
    
    try {
      const result = await fetchApi('/api/recommendation/generate', {
        method: 'POST',
        body: JSON.stringify({ agentId: selectedAgent })
      });
      
      setSuccessMessage(`Successfully generated ${result.count} personalized recommendations`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError('Failed to generate recommendations');
    } finally {
      setAnalysisInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="agent-settings-container">
        <div className="loading-indicator">Loading agent settings...</div>
      </div>
    );
  }

  if (error && agents.length === 0) {
    return (
      <div className="agent-settings-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const selectedAgentData = agents.find(agent => agent.id === selectedAgent);

  return (
    <div className="agent-settings-container">
      <h3>Agent Settings & Analysis</h3>
      <p className="section-description">
        Configure how recommendation agents analyze customer data and generate personalized product suggestions.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="agent-selector">
        <label htmlFor="agent-select">Select Agent:</label>
        <select 
          id="agent-select" 
          value={selectedAgent} 
          onChange={handleAgentChange}
        >
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.name} ({agent.type})</option>
          ))}
        </select>
      </div>
      
      {selectedAgentData && (
        <div className="agent-config">
          <div className="agent-header">
            <div className="agent-info">
              <h4>{selectedAgentData.name}</h4>
              <div className="agent-meta">
                <span>Type: {selectedAgentData.type}</span>
                <span>Accuracy: {selectedAgentData.accuracy.toFixed(2)}</span>
                <span>Confidence: {selectedAgentData.confidence.toFixed(2)}</span>
              </div>
            </div>
            <div className="status-toggle">
              <span>Status: {selectedAgentData.status}</span>
              <button 
                onClick={() => handleStatusToggle(
                  selectedAgentData.id, 
                  selectedAgentData.status === 'active' ? 'inactive' : 'active'
                )}
                className={`toggle-button ${selectedAgentData.status}`}
              >
                {selectedAgentData.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
          
          <div className="settings-section">
            <h5>Agent Settings</h5>
            <div className="settings-grid">
              {Object.entries(selectedAgentData.settings).map(([key, value]) => (
                <div key={key} className="setting-item">
                  <label htmlFor={`setting-${key}`}>{key}:</label>
                  {typeof value === 'boolean' ? (
                    <input
                      id={`setting-${key}`}
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => handleSettingChange(selectedAgentData.id, key, e.target.checked)}
                    />
                  ) : typeof value === 'number' ? (
                    <input
                      id={`setting-${key}`}
                      type="number"
                      value={value as number}
                      min={0}
                      max={1}
                      step={0.1}
                      onChange={(e) => handleSettingChange(selectedAgentData.id, key, parseFloat(e.target.value))}
                    />
                  ) : (
                    <input
                      id={`setting-${key}`}
                      type="text"
                      value={value as string}
                      onChange={(e) => handleSettingChange(selectedAgentData.id, key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <button 
              onClick={() => saveSettings(selectedAgentData.id)}
              className="save-settings-button"
            >
              Save Settings
            </button>
          </div>
          
          <div className="analysis-section">
            <h5>Run Analysis</h5>
            <div className="analysis-buttons">
              <button 
                onClick={runCustomerAnalysis}
                disabled={analysisInProgress}
                className="analysis-button"
              >
                Customer Analysis
              </button>
              <button 
                onClick={runProductAnalysis}
                disabled={analysisInProgress}
                className="analysis-button"
              >
                Product Analysis
              </button>
              <button 
                onClick={generatePersonalizedRecommendations}
                disabled={analysisInProgress}
                className="analysis-button primary"
              >
                Generate Personalized Recommendations
              </button>
            </div>
            
            {analysisInProgress && (
              <div className="loading-indicator">
                Analysis in progress...
              </div>
            )}
            
            {showCustomerAnalysis && !analysisInProgress && customerProfiles.length > 0 && (
              <div className="analysis-results">
                <h5>Customer Analysis Results</h5>
                <div className="profiles-grid">
                  {customerProfiles.map(profile => (
                    <div key={profile.id} className="profile-card">
                      <h6>{profile.name}</h6>
                      <p className="segment-info">Segment: {profile.segment}</p>
                      
                      {profile.preferences.length > 0 && (
                        <div className="preferences">
                          <strong>Preferences:</strong>
                          <ul>
                            {profile.preferences.map((pref, i) => (
                              <li key={i}>{pref}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="recommendations">
                        <strong>Recommended:</strong>
                        <ul className="recommendation-options">
                          {profile.recommendations.map((rec, i, arr) => {
                            if (rec === "OR") {
                              return (
                                <li key={i} className="option-divider">
                                  <span>OR</span>
                                </li>
                              );
                            } else {
                              const isFirstOption = i < arr.indexOf("OR") || arr.indexOf("OR") === -1;
                              return (
                                <li key={i} className={`recommendation-item ${isFirstOption ? 'option-1' : 'option-2'}`}>
                                  {rec}
                                </li>
                              );
                            }
                          })}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {showProductAnalysis && !analysisInProgress && productAnalyses.length > 0 && (
              <div className="analysis-results">
                <h5>Product Analysis Results</h5>
                <div className="product-grid">
                  {productAnalyses.map(product => (
                    <div key={product.id} className="product-card">
                      <h6>{product.name}</h6>
                      <p>Category: {product.category}</p>
                      <p>Popularity: {product.popularity.toFixed(2)}</p>
                      <div className="associated-products">
                        <strong>Associated Products:</strong>
                        <ul>
                          {product.associatedProducts.map((ap, i) => (
                            <li key={i}>{ap.name} (Strength: {ap.strength.toFixed(2)})</li>
                          ))}
                        </ul>
                      </div>
                      <div className="target-customers">
                        <strong>Target Customers:</strong>
                        <ul>
                          {product.targetCustomers.map((tc, i) => (
                            <li key={i}>{tc}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentSettings; 