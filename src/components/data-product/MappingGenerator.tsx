import React, { useState, useEffect } from 'react';
import { DataProduct, DataSource, AttributeMapping, TargetAttribute, SourceAttribute } from '../../types';
import { generateId } from '../../utils/helpers';
import * as apiService from '../../utils/api-service';

interface MappingGeneratorProps {
  targetDataProduct: DataProduct | null;
  selectedSources: DataSource[];
  onSave: (mappings: AttributeMapping[]) => void;
}

// Define interface for API mapping result
interface ApiAttributeMapping {
  target_attribute: string;
  source_system: string;
  source_attribute: string;
  mapping_type: string;
  transformation_logic?: string;
  targetAttributeId?: string;
  sourceAttributeId?: string;
  sourceSystemId?: string;
  sourceAttributeName?: string;
}

const MappingGenerator: React.FC<MappingGeneratorProps> = ({
  targetDataProduct,
  selectedSources,
  onSave,
}) => {
  const [mappings, setMappings] = useState<AttributeMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTargetAttribute, setActiveTargetAttribute] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMapping, setSelectedMapping] = useState<AttributeMapping | null>(null);

  useEffect(() => {
    // Initialize with any existing mappings from the data product
    if (targetDataProduct && targetDataProduct.mappings) {
      setMappings(targetDataProduct.mappings);
    } else {
      // Initialize with empty mappings for each target attribute
      if (targetDataProduct && targetDataProduct.targetAttributes) {
        const initialMappings = targetDataProduct.targetAttributes.map(attr => ({
          id: generateId(),
          sourceAttributeId: '',
          targetAttributeId: attr.id,
          mappingType: 'direct' as const,
        }));
        setMappings(initialMappings);
      }
    }
  }, [targetDataProduct]);

  useEffect(() => {
    // Update selected mapping when active target attribute changes
    if (activeTargetAttribute) {
      const mapping = getMappingForTargetAttribute(activeTargetAttribute);
      setSelectedMapping(mapping || null);
    } else {
      setSelectedMapping(null);
    }
  }, [activeTargetAttribute, mappings]);

  if (!targetDataProduct) {
    return (
      <div className="mapping-generator">
        <h3>Create Attribute Mappings</h3>
        <div className="error-message">
          Target data product information is missing. Please complete previous steps first.
        </div>
      </div>
    );
  }

  if (selectedSources.length === 0) {
    return (
      <div className="mapping-generator">
        <h3>Create Attribute Mappings</h3>
        <div className="error-message">
          No source systems selected. Please go back and select source systems.
        </div>
      </div>
    );
  }

  // Flatten all source attributes from all selected sources
  const allSourceAttributes = selectedSources.flatMap(source => 
    source.attributes.map(attr => ({
      ...attr,
      sourceSystem: source.name
    }))
  );

  // Helper to get target attribute by ID
  const getTargetAttributeById = (id: string): TargetAttribute | undefined => {
    return targetDataProduct.targetAttributes.find(attr => attr.id === id);
  };

  // Helper to get source attribute by ID
  const getSourceAttributeById = (id: string): (SourceAttribute & { sourceSystem: string }) | undefined => {
    return allSourceAttributes.find(attr => attr.id === id);
  };

  // Helper to get mapping for a target attribute
  const getMappingForTargetAttribute = (targetAttributeId: string): AttributeMapping | undefined => {
    return mappings.find(mapping => mapping.targetAttributeId === targetAttributeId);
  };

  // Filter source attributes based on search term
  const filteredSourceAttributes = allSourceAttributes.filter(attr => 
    attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attr.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attr.sourceSystem.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSourceAttributeSelect = (sourceAttributeId: string, targetAttributeId: string) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.targetAttributeId === targetAttributeId) {
        return {
          ...mapping,
          sourceAttributeId,
          mappingType: 'direct' as const,
        };
      }
      return mapping;
    });
    setMappings(updatedMappings);
  };

  const handleMappingTypeChange = (targetAttributeId: string, mappingType: 'direct' | 'transformation') => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.targetAttributeId === targetAttributeId) {
        return {
          ...mapping,
          mappingType,
        };
      }
      return mapping;
    });
    setMappings(updatedMappings);
  };

  const handleTransformationLogicChange = (targetAttributeId: string, transformationLogic: string) => {
    const updatedMappings = mappings.map(mapping => {
      if (mapping.targetAttributeId === targetAttributeId) {
        return {
          ...mapping,
          transformationLogic,
        };
      }
      return mapping;
    });
    setMappings(updatedMappings);
  };

  const handleAutoMapAttributes = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call the API to generate mappings
      const result = await apiService.createAttributeMappings(
        targetDataProduct,
        selectedSources
      );

      if (result && result.attribute_mappings) {
        // Transform API response to our format
        const apiMappings = result.attribute_mappings.map((mapping: ApiAttributeMapping) => {
          // Find the target attribute ID by name
          const targetAttr = targetDataProduct.targetAttributes.find(
            attr => attr.name.toLowerCase() === mapping.target_attribute.toLowerCase()
          );
          
          // Find the source attribute ID by name and source system
          const sourceAttr = allSourceAttributes.find(
            attr => 
              attr.name.toLowerCase() === mapping.source_attribute.toLowerCase() && 
              attr.sourceSystem.toLowerCase() === mapping.source_system.toLowerCase()
          );

          if (targetAttr && sourceAttr) {
            return {
              id: generateId(),
              targetAttributeId: targetAttr.id,
              sourceAttributeId: sourceAttr.id,
              mappingType: mapping.mapping_type === 'direct' ? 'direct' : 'transformation',
              transformationLogic: mapping.transformation_logic || '',
            } as AttributeMapping;
          }
          return null;
        }).filter((mapping: any): mapping is AttributeMapping => mapping !== null);

        // Merge with existing mappings, preferring the API ones
        const existingTargetIds = apiMappings.map((m: AttributeMapping) => m.targetAttributeId);
        const unmappedExisting = mappings.filter(m => !existingTargetIds.includes(m.targetAttributeId));
        
        setMappings([...apiMappings, ...unmappedExisting]);
      }
    } catch (err) {
      console.error('Error generating mappings:', err);
      setError('Failed to auto-generate mappings. Please try again or create manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all required target attributes have a source mapping
    const unmappedRequired = targetDataProduct.targetAttributes
      .filter(attr => attr.isKey)
      .filter(attr => {
        const mapping = getMappingForTargetAttribute(attr.id);
        return !mapping || !mapping.sourceAttributeId;
      });

    if (unmappedRequired.length > 0) {
      setError(`Please map all key attributes: ${unmappedRequired.map(attr => attr.name).join(', ')}`);
      return;
    }

    // Filter out any mappings without a source attribute (except transformations)
    const validMappings = mappings.filter(mapping => 
      mapping.sourceAttributeId || mapping.mappingType === 'transformation'
    );
    
    onSave(validMappings);
  };

  const toggleAttributeActive = (attributeId: string) => {
    setActiveTargetAttribute(activeTargetAttribute === attributeId ? null : attributeId);
    setSearchTerm(''); // Clear search when switching attributes
  };

  // Function to update the selected mapping
  const updateMapping = (mapping: ApiAttributeMapping) => {
    if (!selectedMapping) return;
    
    const updatedMappings = mappings.map(m => {
      if (m.targetAttributeId === selectedMapping.targetAttributeId) {
        return {
          ...m,
          sourceAttributeId: mapping.sourceAttributeId || '',
          mappingType: 'direct' as const
        };
      }
      return m;
    });
    
    setMappings(updatedMappings);
  };

  const renderSourceAttributes = (systemId: string, attributes: SourceAttribute[]) => {
    return attributes.map((attr) => (
      <div
        key={attr.id}
        className={`source-attribute-item ${
          selectedMapping?.sourceAttributeId === attr.id ? 'selected' : ''
        }`}
        onClick={() => {
          if (selectedMapping) {
            updateMapping({
              sourceSystemId: systemId,
              sourceAttributeId: attr.id,
              sourceAttributeName: attr.name
            } as ApiAttributeMapping);
          }
        }}
      >
        <div className="source-attr-details">
          <div>
            <span className="source-name">{attr.name}</span>
            <span className="attribute-type">{attr.dataType}</span>
            {attr.isKey && <span className="key-badge">Key</span>}
          </div>
          <span className="source-system">{attr.sourceSystem}</span>
        </div>
        <div className="source-attr-description">
          {attr.description}
        </div>
      </div>
    ));
  };

  return (
    <div className="mapping-generator">
      <h3>Create Attribute Mappings</h3>
      <p className="form-description">
        Map each target attribute to a source attribute or define transformation logic.
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="ai-action-button">
        <button 
          type="button" 
          className="btn secondary"
          onClick={handleAutoMapAttributes}
          disabled={isProcessing}
        >
          {isProcessing ? 'Generating...' : 'Auto-Map Attributes'}
        </button>
        <small className="helper-text">
          Let AI suggest mappings based on attribute names and descriptions
        </small>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mapping-container">
          <div className="target-attributes-list">
            <h4>Target Attributes</h4>
            {targetDataProduct.targetAttributes.map(attr => {
              const mapping = getMappingForTargetAttribute(attr.id);
              const mappingStatus = mapping?.sourceAttributeId 
                ? (mapping.mappingType === 'direct' ? 'mapped' : 'transformed') 
                : 'unmapped';
              
              const sourceAttribute = mapping?.sourceAttributeId 
                ? getSourceAttributeById(mapping.sourceAttributeId) 
                : undefined;
                
              return (
                <div 
                  key={attr.id} 
                  className={`target-attribute-item ${activeTargetAttribute === attr.id ? 'active' : ''} ${attr.isKey ? 'is-key' : ''}`}
                  onClick={() => toggleAttributeActive(attr.id)}
                >
                  <div className="attribute-details">
                    <span className="attribute-name">{attr.name}</span>
                    <span className="attribute-type">{attr.dataType}</span>
                    {attr.isKey && <span className="key-badge">Key</span>}
                  </div>
                  
                  <div className={`mapping-status ${mappingStatus}`}>
                    {mappingStatus === 'mapped' && (
                      <>
                        <span className="status-icon">✓</span>
                        <span>Mapped to {sourceAttribute?.name}</span>
                        <span className="source-system">({sourceAttribute?.sourceSystem})</span>
                      </>
                    )}
                    {mappingStatus === 'transformed' && (
                      <>
                        <span className="status-icon">✦</span>
                        <span>Transformation defined</span>
                      </>
                    )}
                    {mappingStatus === 'unmapped' && (
                      <>
                        <span className="status-icon">⨯</span>
                        <span>Not mapped</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mapping-details">
            {activeTargetAttribute ? (
              (() => {
                const targetAttr = getTargetAttributeById(activeTargetAttribute);
                const mapping = getMappingForTargetAttribute(activeTargetAttribute);
                const sourceAttr = mapping?.sourceAttributeId 
                  ? getSourceAttributeById(mapping.sourceAttributeId) 
                  : undefined;
                
                return (
                  <>
                    <div className="mapping-header">
                      <h4>
                        <span>Mapping for: </span>
                        <span className="target-name">{targetAttr?.name}</span>
                        <span className="attribute-type">{targetAttr?.dataType}</span>
                        {targetAttr?.isKey && <span className="key-badge">Key</span>}
                      </h4>
                      <p className="attribute-description">{targetAttr?.description}</p>
                    </div>
                    
                    <div className="mapping-type-selector">
                      <label>Mapping Type:</label>
                      <div className="mapping-type-options">
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name={`mapping-type-${activeTargetAttribute}`}
                            checked={mapping?.mappingType === 'direct'}
                            onChange={() => handleMappingTypeChange(activeTargetAttribute, 'direct')}
                          />
                          <span>Direct Mapping</span>
                        </label>
                        <label className="radio-option">
                          <input 
                            type="radio" 
                            name={`mapping-type-${activeTargetAttribute}`}
                            checked={mapping?.mappingType === 'transformation'}
                            onChange={() => handleMappingTypeChange(activeTargetAttribute, 'transformation')}
                          />
                          <span>Transformation</span>
                        </label>
                      </div>
                    </div>
                    
                    {mapping?.mappingType === 'direct' ? (
                      <div className="source-attribute-selector">
                        <label>Source Attribute:</label>
                        <div className="search-input">
                          <input 
                            type="text"
                            placeholder="Search source attributes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        
                        <div className="source-attributes-list">
                          {filteredSourceAttributes.length > 0 ? (
                            filteredSourceAttributes.map(attr => (
                              <div 
                                key={attr.id}
                                className={`source-attribute-item ${mapping.sourceAttributeId === attr.id ? 'selected' : ''}`}
                                onClick={() => handleSourceAttributeSelect(attr.id, activeTargetAttribute)}
                              >
                                <div className="source-attr-details">
                                  <div>
                                    <span className="source-name">{attr.name}</span>
                                    <span className="attribute-type">{attr.dataType}</span>
                                    {attr.isKey && <span className="key-badge">Key</span>}
                                  </div>
                                  <span className="source-system">{attr.sourceSystem}</span>
                                </div>
                                <div className="source-attr-description">
                                  {attr.description}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-results">No matching source attributes found</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="transformation-editor">
                        <label>Transformation Logic:</label>
                        <p className="transformation-description">
                          Define the transformation logic to generate this attribute's value.
                        </p>
                        
                        <textarea 
                          rows={5} 
                          value={mapping?.transformationLogic || ''}
                          onChange={(e) => handleTransformationLogicChange(activeTargetAttribute, e.target.value)}
                          placeholder="e.g. CONCAT(customer.first_name, ' ', customer.last_name)"
                        />
                        
                        <div className="transformation-help">
                          <p>Reference source attributes using <code>system.attribute</code> notation.</p>
                          <p>Example: <code>UPPER(customer.email)</code> or <code>CONCAT(customer.first_name, ' ', customer.last_name)</code></p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="no-attribute-selected">
                <p>Select a target attribute from the list to define its mapping</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mapping-summary">
          {mappings.filter(m => m.sourceAttributeId || (m.mappingType === 'transformation' && m.transformationLogic)).length} 
          of {targetDataProduct.targetAttributes.length} attributes mapped
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Save and Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MappingGenerator; 