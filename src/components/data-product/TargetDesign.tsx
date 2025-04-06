import React, { useState, useEffect } from 'react';
import { UseCase, DataProduct, TargetAttribute } from '../../types';
import { generateId } from '../../utils/helpers';
import * as apiService from '../../utils/api-service';

interface TargetDesignProps {
  useCase: UseCase | null;
  initialData: DataProduct | null;
  onSave: (dataProduct: DataProduct) => void;
}

const TargetDesign: React.FC<TargetDesignProps> = ({ useCase, initialData, onSave }) => {
  const [formData, setFormData] = useState<DataProduct>({
    id: initialData?.id || generateId(),
    name: initialData?.name || '',
    description: initialData?.description || '',
    targetAttributes: initialData?.targetAttributes || [
      {
        id: generateId(),
        name: '',
        dataType: 'string',
        description: '',
        isKey: false
      }
    ],
    mappings: initialData?.mappings || [],
    certificationStatus: initialData?.certificationStatus || 'pending'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    // If we have useCase data but no initial product data, generate a name based on the use case
    if (useCase && !initialData && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: `${useCase.title} Data Product`,
        description: `Data product for ${useCase.description.substring(0, 100)}...`
      }));
    }
  }, [useCase, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAttributeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    index: number
  ) => {
    const updatedAttributes = [...formData.targetAttributes];
    
    // Handle checkbox separately
    if (e.target.name === "isKey") {
      const target = e.target as HTMLInputElement;
      updatedAttributes[index] = {
        ...updatedAttributes[index],
        isKey: target.checked
      };
    } else {
      updatedAttributes[index] = {
        ...updatedAttributes[index],
        [e.target.name]: e.target.value
      };
    }
    
    setFormData({
      ...formData,
      targetAttributes: updatedAttributes,
    });
  };

  const addAttribute = () => {
    setFormData({
      ...formData,
      targetAttributes: [
        ...formData.targetAttributes,
        {
          id: generateId(),
          name: '',
          dataType: 'string',
          description: '',
          isKey: false
        }
      ],
    });
  };

  const removeAttribute = (index: number) => {
    if (formData.targetAttributes.length > 1) {
      const updatedAttributes = [...formData.targetAttributes];
      updatedAttributes.splice(index, 1);
      setFormData({
        ...formData,
        targetAttributes: updatedAttributes,
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Data product name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // Check if any attribute has empty name
    const hasEmptyAttributeName = formData.targetAttributes.some(attr => !attr.name.trim());
    if (hasEmptyAttributeName) {
      errors.attributes = 'All attribute names must be filled';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const generateModelFromUseCase = async () => {
    if (!useCase) {
      setAnalysisError('No use case data available. Please complete the previous step first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Send the use case analysis to the API for target design generation
      const useCaseData = {
        use_case_analysis: {
          use_case_title: useCase.title,
          business_requirements: useCase.businessRequirements,
          target_users: useCase.targetUsers,
          data_requirements: useCase.dataRequirements
        }
      };
      
      const result = await apiService.createTargetDesign(useCaseData);
      
      if (result && result.target_attributes) {
        // Transform the API response to match our data model
        const transformedAttributes: TargetAttribute[] = 
          (result.target_attributes || []).map((attr: any) => ({
            id: generateId(),
            name: attr.name || '',
            dataType: attr.data_type || 'string',
            description: attr.description || '',
            isKey: attr.is_key || false
          }));
          
        // Update form data with AI suggestions
        setFormData(prev => ({
          ...prev,
          name: result.data_product_name || prev.name,
          description: result.description || prev.description,
          targetAttributes: transformedAttributes.length > 0 
            ? transformedAttributes 
            : prev.targetAttributes
        }));
      }
    } catch (error) {
      console.error('Error generating data model:', error);
      setAnalysisError('Failed to generate data model. Please try again or create manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="target-design-form">
      <h3>Define Your Target Data Model</h3>
      <p className="form-description">
        Design the structure of your data product by defining its attributes.
      </p>

      {analysisError && <div className="error-message">{analysisError}</div>}

      <div className="ai-action-button">
        <button 
          type="button" 
          className="btn secondary"
          onClick={generateModelFromUseCase}
          disabled={isAnalyzing || !useCase}
        >
          {isAnalyzing ? 'Generating...' : 'Generate Model from Use Case'}
        </button>
        <small className="helper-text">
          Let AI suggest a data model based on your use case requirements
        </small>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Data Product Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Customer 360 Data Product"
            className={formErrors.name ? 'input-error' : ''}
          />
          {formErrors.name && <div className="error-message">{formErrors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Comprehensive view of customer data across all systems..."
            rows={3}
            className={formErrors.description ? 'input-error' : ''}
          />
          {formErrors.description && (
            <div className="error-message">{formErrors.description}</div>
          )}
        </div>

        <div className="form-group">
          <div className="section-header">
            <label>Target Attributes</label>
            {formErrors.attributes && (
              <div className="error-message">{formErrors.attributes}</div>
            )}
          </div>

          <div className="attributes-table">
            <div className="attributes-header">
              <div className="attribute-name">Name</div>
              <div className="attribute-type">Data Type</div>
              <div className="attribute-description">Description</div>
              <div className="attribute-key">Key</div>
              <div className="attribute-actions">Actions</div>
            </div>

            {formData.targetAttributes.map((attribute, index) => (
              <div key={attribute.id} className="attribute-row">
                <div className="attribute-name">
                  <input
                    type="text"
                    name="name"
                    value={attribute.name}
                    onChange={e => handleAttributeChange(e, index)}
                    placeholder="customer_id"
                  />
                </div>
                <div className="attribute-type">
                  <select
                    name="dataType"
                    value={attribute.dataType}
                    onChange={e => handleAttributeChange(e, index)}
                  >
                    <option value="string">String</option>
                    <option value="integer">Integer</option>
                    <option value="decimal">Decimal</option>
                    <option value="date">Date</option>
                    <option value="timestamp">Timestamp</option>
                    <option value="boolean">Boolean</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                  </select>
                </div>
                <div className="attribute-description">
                  <input
                    type="text"
                    name="description"
                    value={attribute.description}
                    onChange={e => handleAttributeChange(e, index)}
                    placeholder="Unique customer identifier"
                  />
                </div>
                <div className="attribute-key">
                  <input
                    type="checkbox"
                    name="isKey"
                    checked={attribute.isKey}
                    onChange={e => handleAttributeChange(e, index)}
                  />
                </div>
                <div className="attribute-actions">
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="btn remove-btn"
                    disabled={formData.targetAttributes.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addAttribute}
            className="btn secondary small-btn"
          >
            Add Attribute
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary">
            Save and Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default TargetDesign; 