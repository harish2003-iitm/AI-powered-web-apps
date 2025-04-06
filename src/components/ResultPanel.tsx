import React, { useState, useEffect } from 'react';
import { ResultPanelProps, TabProps, SummaryResult, RoutingResult, EstimationResult } from '../types';
import { formatJsonForDisplay } from '../utils/helpers';

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <div 
    className={`tab ${isActive ? 'active' : ''}`} 
    onClick={onClick}
  >
    {label}
  </div>
);

// Default values with proper types
const defaultSummary: SummaryResult = {
  summary: '',
  key_points: [],
  action_items: [],
  sentiment: '',
  urgency: ''
};

const defaultRouting: RoutingResult = {
  team: '',
  department: '',
  priority: '',
  skills_required: [],
  justification: '',
  escalation_needed: false
};

const defaultEstimation: EstimationResult = {
  estimated_time: '',
  confidence_interval: '',
  bottlenecks: [],
  optimization_suggestions: [],
  resources_needed: []
};

const ResultPanel: React.FC<ResultPanelProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [processedRecommendations, setProcessedRecommendations] = useState<string[]>([]);
  
  useEffect(() => {
    // Process recommendations from potentially different structures
    if (!results) return;
    
    console.log("Processing results in ResultPanel:", results);
    
    // Attempt to extract recommendations from different possible structures
    if (Array.isArray(results.recommendations)) {
      // Direct array of strings
      setProcessedRecommendations(results.recommendations);
    } else if (results.recommendations && Array.isArray(results.recommendations.recommended_solutions)) {
      // Nested in recommended_solutions
      setProcessedRecommendations(results.recommendations.recommended_solutions);
    } else if (results.recommendations && typeof results.recommendations === 'object') {
      // Try to extract any string arrays from recommendations object
      const possibleArrays = Object.values(results.recommendations).filter(
        val => Array.isArray(val) && val.length > 0 && typeof val[0] === 'string'
      );
      
      if (possibleArrays.length > 0) {
        // Use the first array found
        setProcessedRecommendations(possibleArrays[0] as string[]);
      } else {
        setProcessedRecommendations([]);
      }
    } else {
      setProcessedRecommendations([]);
    }
  }, [results]);
  
  if (!results) return null;
  
  // Extract results data, handling potentially missing properties with typed defaults
  const { 
    summary = defaultSummary,
    routing = defaultRouting,
    estimations = defaultEstimation,
    raw_json = null,
    query_info = null 
  } = results;
  
  // Get estimated time from potentially different structures
  const getEstimatedTime = () => {
    if (estimations && estimations.estimated_time) {
      return estimations.estimated_time;
    } 
    
    if (results.estimation && results.estimation.estimated_time) {
      return results.estimation.estimated_time;
    }
    
    if (typeof results.estimated_time === 'string') {
      return results.estimated_time;
    }
    
    return 'Not available';
  };
  
  const renderContent = () => {
    switch(activeTab) {
      case 'summary':
        return (
          <div className="result-content">
            <h3>{summary.title || 'Summary'}</h3>
            {summary.key_points && summary.key_points.length > 0 ? (
              <>
                <h4>Key Points</h4>
                <ul>
                  {summary.key_points.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No key points extracted from this conversation.</p>
            )}
            {summary.action_items && summary.action_items.length > 0 ? (
              <>
                <h4>Action Items</h4>
                <ul>
                  {summary.action_items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No action items identified for this issue.</p>
            )}
            {summary.sentiment && (
              <p><strong>Sentiment:</strong> {summary.sentiment}</p>
            )}
          </div>
        );
      case 'routing':
        return (
          <div className="result-content">
            <h3>Routing Information</h3>
            {routing ? (
              <>
                <p><strong>Department:</strong> {routing.department || 'Not specified'}</p>
                <p><strong>Priority:</strong> {routing.priority || 'Not specified'}</p>
                <p><strong>Team:</strong> {routing.team || 'Not specified'}</p>
                {routing.justification && <p><strong>Justification:</strong> {routing.justification}</p>}
                {routing.notes && <p><strong>Notes:</strong> {routing.notes}</p>}
                {routing.escalation_needed !== undefined && (
                  <p><strong>Escalation Needed:</strong> {routing.escalation_needed ? 'Yes' : 'No'}</p>
                )}
              </>
            ) : (
              <p>No routing information available for this issue.</p>
            )}
          </div>
        );
      case 'recommendations':
        return (
          <div className="result-content">
            <h3>Recommendations</h3>
            {processedRecommendations.length > 0 ? (
              <ul>
                {processedRecommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            ) : (
              <p>No specific recommendations available for this issue.</p>
            )}
          </div>
        );
      case 'estimations':
        return (
          <div className="result-content">
            <h3>Estimations</h3>
            <p><strong>Complexity:</strong> {estimations.complexity || 'Not specified'}</p>
            <p><strong>Estimated Time:</strong> {getEstimatedTime()}</p>
            {estimations.confidence_interval && (
              <p><strong>Confidence:</strong> {estimations.confidence_interval}</p>
            )}
            {estimations.notes && <p><strong>Notes:</strong> {estimations.notes}</p>}
            {estimations.bottlenecks && estimations.bottlenecks.length > 0 && (
              <>
                <h4>Potential Bottlenecks</h4>
                <ul>
                  {estimations.bottlenecks.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      case 'query':
        return (
          <div className="result-content">
            <h3>Query Details</h3>
            {query_info ? (
              <>
                <p><strong>Ticket ID:</strong> {query_info.ticket_id || 'Not available'}</p>
                <p><strong>Submitted:</strong> {query_info.submitted_at || 'Not available'}</p>
                {query_info.conversation && (
                  <>
                    <h4>Conversation</h4>
                    <div className="query-conversation">
                      <pre>{query_info.conversation}</pre>
                    </div>
                  </>
                )}
                <p className="help-text">
                  If the results don't match your query, there might be an issue with how the system is interpreting your conversation.
                </p>
              </>
            ) : (
              <p>No query information available.</p>
            )}
          </div>
        );
      case 'raw':
        return (
          <div className="result-content">
            <h3>Raw API Response</h3>
            <pre className="raw-json">{raw_json ? formatJsonForDisplay(raw_json) : 'No raw data available'}</pre>
          </div>
        );
      default:
        return <div>Select a tab to view results</div>;
    }
  };

  return (
    <div className="result-panel">
      <div className="tabs">
        <Tab 
          label="Summary" 
          isActive={activeTab === 'summary'} 
          onClick={() => setActiveTab('summary')} 
        />
        <Tab 
          label="Routing" 
          isActive={activeTab === 'routing'} 
          onClick={() => setActiveTab('routing')} 
        />
        <Tab 
          label="Recommendations" 
          isActive={activeTab === 'recommendations'} 
          onClick={() => setActiveTab('recommendations')} 
        />
        <Tab 
          label="Estimations" 
          isActive={activeTab === 'estimations'} 
          onClick={() => setActiveTab('estimations')} 
        />
        <Tab 
          label="Query Details" 
          isActive={activeTab === 'query'} 
          onClick={() => setActiveTab('query')} 
        />
        <Tab 
          label="Raw Data" 
          isActive={activeTab === 'raw'} 
          onClick={() => setActiveTab('raw')} 
        />
      </div>
      <div className="tab-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResultPanel; 