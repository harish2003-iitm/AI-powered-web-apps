import React, { useState, useEffect } from 'react';
import { UseCase } from '../../types';
import { generateId } from '../../utils/helpers';

interface UseCaseFormProps {
  onSave: (useCase: UseCase) => void;
  initialData: UseCase | null;
}

const UseCaseForm: React.FC<UseCaseFormProps> = ({ onSave, initialData }) => {
  const [formData, setFormData] = useState<UseCase>({
    id: initialData?.id || generateId(),
    title: initialData?.title || '',
    description: initialData?.description || '',
    targetUsers: initialData?.targetUsers || [''],
    businessRequirements: initialData?.businessRequirements || [''],
    dataRequirements: initialData?.dataRequirements || [''],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: 'targetUsers' | 'businessRequirements' | 'dataRequirements'
  ) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = e.target.value;
    setFormData({
      ...formData,
      [field]: updatedArray,
    });
  };

  const addArrayItem = (field: 'targetUsers' | 'businessRequirements' | 'dataRequirements') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const removeArrayItem = (
    index: number,
    field: 'targetUsers' | 'businessRequirements' | 'dataRequirements'
  ) => {
    if (formData[field].length > 1) {
      const updatedArray = [...formData[field]];
      updatedArray.splice(index, 1);
      setFormData({
        ...formData,
        [field]: updatedArray,
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    const hasEmptyTargetUser = formData.targetUsers.some((user) => !user.trim());
    if (hasEmptyTargetUser) {
      errors.targetUsers = 'All target users must be filled';
    }

    const hasEmptyBusinessRequirement = formData.businessRequirements.some(
      (req) => !req.trim()
    );
    if (hasEmptyBusinessRequirement) {
      errors.businessRequirements = 'All business requirements must be filled';
    }

    const hasEmptyDataRequirement = formData.dataRequirements.some((req) => !req.trim());
    if (hasEmptyDataRequirement) {
      errors.dataRequirements = 'All data requirements must be filled';
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

  const analyzeUseCase = async () => {
    try {
      // Example of how we would integrate with the API service
      // This would be replaced with actual API call
      /*
      const response = await fetch('/api/data_product/analyze_use_case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description,
          stakeholders: formData.targetUsers.join(', ')
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update form with AI suggestions
        setFormData({
          ...formData,
          businessRequirements: data.business_requirements || formData.businessRequirements,
          dataRequirements: data.data_requirements || formData.dataRequirements,
        });
      }
      */
      
      // For now, just a placeholder for future integration
      console.log('Analysis would be performed here with the LLM backend');
    } catch (error) {
      console.error('Error analyzing use case:', error);
    }
  };

  return (
    <div className="use-case-form">
      <h3>Define Your Use Case</h3>
      <p className="form-description">
        Describe the business problem you're trying to solve with this data product.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Customer 360 View"
            className={formErrors.title ? 'input-error' : ''}
          />
          {formErrors.title && <div className="error-message">{formErrors.title}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Business Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="We need a comprehensive view of our retail banking customers across all systems..."
            rows={5}
            className={formErrors.description ? 'input-error' : ''}
          />
          {formErrors.description && (
            <div className="error-message">{formErrors.description}</div>
          )}
          <button
            type="button"
            onClick={analyzeUseCase}
            className="btn secondary analyze-btn"
          >
            Analyze with AI
          </button>
        </div>

        <div className="form-group">
          <label>Target Users</label>
          {formErrors.targetUsers && (
            <div className="error-message">{formErrors.targetUsers}</div>
          )}
          {formData.targetUsers.map((user, index) => (
            <div key={`user-${index}`} className="array-input-row">
              <input
                type="text"
                value={user}
                onChange={(e) => handleArrayChange(e, index, 'targetUsers')}
                placeholder="Relationship Managers"
              />
              <button
                type="button"
                onClick={() => removeArrayItem(index, 'targetUsers')}
                className="btn remove-btn"
                disabled={formData.targetUsers.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('targetUsers')}
            className="btn secondary small-btn"
          >
            Add User
          </button>
        </div>

        <div className="form-group">
          <label>Business Requirements</label>
          {formErrors.businessRequirements && (
            <div className="error-message">{formErrors.businessRequirements}</div>
          )}
          {formData.businessRequirements.map((req, index) => (
            <div key={`business-req-${index}`} className="array-input-row">
              <input
                type="text"
                value={req}
                onChange={(e) => handleArrayChange(e, index, 'businessRequirements')}
                placeholder="View all customer accounts in one place"
              />
              <button
                type="button"
                onClick={() => removeArrayItem(index, 'businessRequirements')}
                className="btn remove-btn"
                disabled={formData.businessRequirements.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('businessRequirements')}
            className="btn secondary small-btn"
          >
            Add Requirement
          </button>
        </div>

        <div className="form-group">
          <label>Data Requirements</label>
          {formErrors.dataRequirements && (
            <div className="error-message">{formErrors.dataRequirements}</div>
          )}
          {formData.dataRequirements.map((req, index) => (
            <div key={`data-req-${index}`} className="array-input-row">
              <input
                type="text"
                value={req}
                onChange={(e) => handleArrayChange(e, index, 'dataRequirements')}
                placeholder="Customer demographic information"
              />
              <button
                type="button"
                onClick={() => removeArrayItem(index, 'dataRequirements')}
                className="btn remove-btn"
                disabled={formData.dataRequirements.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('dataRequirements')}
            className="btn secondary small-btn"
          >
            Add Data Requirement
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

export default UseCaseForm; 