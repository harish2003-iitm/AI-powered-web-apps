import React from 'react';
import RecommendationSystem from './components/RecommendationSystem';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="app-header">
        <h1>E-Commerce Recommendation System</h1>
      </div>
      
      <div className="app-content">
        <RecommendationSystem />
      </div>
    </div>
  );
};

export default App; 