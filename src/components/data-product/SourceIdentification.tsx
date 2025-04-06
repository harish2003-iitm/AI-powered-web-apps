import React, { useState } from 'react';
import { DataSource } from '../../types';
import * as apiService from '../../utils/api-service';

interface SourceIdentificationProps {
  availableSources: DataSource[];
  initialSelection: DataSource[];
  onSave: (selectedSources: DataSource[]) => void;
}

const SourceIdentification: React.FC<SourceIdentificationProps> = ({
  availableSources,
  initialSelection,
  onSave,
}) => {
  const [selectedSources, setSelectedSources] = useState<DataSource[]>(initialSelection);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSourceSelection = (source: DataSource) => {
    const isSelected = selectedSources.some(s => s.id === source.id);
    
    if (isSelected) {
      setSelectedSources(selectedSources.filter(s => s.id !== source.id));
    } else {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredSources = availableSources.filter(source => 
    source.name.toLowerCase().includes(searchTerm) || 
    source.description.toLowerCase().includes(searchTerm) ||
    source.type.toLowerCase().includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSources.length === 0) {
      setError('Please select at least one source system.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Optionally call the backend API to validate or process the source selections
      await apiService.selectSourceSystems(selectedSources);
      
      // Save the selected sources
      onSave(selectedSources);
    } catch (err) {
      console.error('Error processing source systems:', err);
      setError('Failed to process source systems. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to count attributes
  const countAttributes = (source: DataSource): number => {
    return source.attributes.length;
  };

  // Helper function to check if a source is selected
  const isSourceSelected = (source: DataSource): boolean => {
    return selectedSources.some(s => s.id === source.id);
  };
  
  // Function to render source attributes preview
  const renderAttributePreview = (source: DataSource) => {
    return (
      <div className="source-attributes-preview">
        <h4>Attributes</h4>
        <div className="attribute-list">
          {source.attributes.slice(0, 5).map(attr => (
            <div key={attr.id} className="attribute-item">
              <span className="attribute-name">{attr.name}</span>
              <span className="attribute-type">{attr.dataType}</span>
              {attr.isKey && <span className="key-indicator">Key</span>}
            </div>
          ))}
          {source.attributes.length > 5 && (
            <div className="attribute-more">
              +{source.attributes.length - 5} more attributes
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="source-identification">
      <h3>Identify Source Systems</h3>
      <p className="form-description">
        Select the source systems that will provide data for your data product.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search sources..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="source-list">
          {filteredSources.length === 0 ? (
            <div className="no-sources">No matching sources found</div>
          ) : (
            filteredSources.map(source => (
              <div 
                key={source.id} 
                className={`source-card ${isSourceSelected(source) ? 'selected' : ''}`}
                onClick={() => toggleSourceSelection(source)}
              >
                <div className="source-header">
                  <div className="source-selection">
                    <input 
                      type="checkbox" 
                      checked={isSourceSelected(source)}
                      onChange={() => {}} // Handled by the card click
                      onClick={e => e.stopPropagation()} // Prevent double toggle
                    />
                  </div>
                  <div className="source-info">
                    <h4 className="source-name">{source.name}</h4>
                    <span className="source-type">{source.type}</span>
                  </div>
                </div>
                
                <p className="source-description">{source.description}</p>
                
                <div className="source-meta">
                  <span>{countAttributes(source)} attributes</span>
                </div>
                
                {isSourceSelected(source) && renderAttributePreview(source)}
              </div>
            ))
          )}
        </div>
        
        <div className="selection-summary">
          <span>{selectedSources.length} source{selectedSources.length !== 1 ? 's' : ''} selected</span>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={isProcessing || selectedSources.length === 0}>
            {isProcessing ? 'Processing...' : 'Save and Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SourceIdentification; 