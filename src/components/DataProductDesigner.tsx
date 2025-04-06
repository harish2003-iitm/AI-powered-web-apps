import React, { useState, useEffect } from 'react';
import { DataProductDesignState, UseCase, DataSource, DataProduct } from '../types';
// These components will be implemented next
import UseCaseForm from './data-product/UseCaseForm';
import TargetDesign from './data-product/TargetDesign';
import SourceIdentification from './data-product/SourceIdentification';
import MappingGenerator from './data-product/MappingGenerator';
import Certification from './data-product/Certification';
import { generateId } from '../utils/helpers';
import * as apiService from '../utils/api-service';

// Sample data sources for demonstration
const sampleDataSources: DataSource[] = [
  {
    id: 'src-001',
    name: 'Core Banking System',
    type: 'Relational Database',
    description: 'Main banking system containing account and transaction data',
    attributes: [
      {
        id: 'attr-001',
        name: 'customer_id',
        dataType: 'string',
        description: 'Unique identifier for the customer',
        isKey: true,
        sourceSystem: 'Core Banking System',
      },
      {
        id: 'attr-002',
        name: 'customer_name',
        dataType: 'string',
        description: 'Full name of the customer',
        isKey: false,
        sourceSystem: 'Core Banking System',
      },
      {
        id: 'attr-003',
        name: 'date_of_birth',
        dataType: 'date',
        description: 'Customer date of birth',
        isKey: false,
        sourceSystem: 'Core Banking System',
      },
      {
        id: 'attr-004',
        name: 'account_number',
        dataType: 'string',
        description: 'Account number',
        isKey: true,
        sourceSystem: 'Core Banking System',
      },
      {
        id: 'attr-005',
        name: 'account_type',
        dataType: 'string',
        description: 'Type of account (savings, checking, etc.)',
        isKey: false,
        sourceSystem: 'Core Banking System',
      },
      {
        id: 'attr-006',
        name: 'balance',
        dataType: 'decimal',
        description: 'Current account balance',
        isKey: false,
        sourceSystem: 'Core Banking System',
      },
    ],
  },
  {
    id: 'src-002',
    name: 'CRM System',
    type: 'API',
    description: 'Customer relationship management system',
    attributes: [
      {
        id: 'attr-007',
        name: 'crm_customer_id',
        dataType: 'string',
        description: 'CRM customer identifier',
        isKey: true,
        sourceSystem: 'CRM System',
      },
      {
        id: 'attr-008',
        name: 'email',
        dataType: 'string',
        description: 'Customer email address',
        isKey: false,
        sourceSystem: 'CRM System',
      },
      {
        id: 'attr-009',
        name: 'phone',
        dataType: 'string',
        description: 'Customer phone number',
        isKey: false,
        sourceSystem: 'CRM System',
      },
      {
        id: 'attr-010',
        name: 'address',
        dataType: 'string',
        description: 'Customer physical address',
        isKey: false,
        sourceSystem: 'CRM System',
      },
      {
        id: 'attr-011',
        name: 'segment',
        dataType: 'string',
        description: 'Customer segment (retail, premium, etc.)',
        isKey: false,
        sourceSystem: 'CRM System',
      },
      {
        id: 'attr-012',
        name: 'relationship_manager',
        dataType: 'string',
        description: 'Assigned relationship manager',
        isKey: false,
        sourceSystem: 'CRM System',
      },
    ],
  },
  {
    id: 'src-003',
    name: 'Transaction System',
    type: 'Message Queue',
    description: 'System containing transaction details',
    attributes: [
      {
        id: 'attr-013',
        name: 'transaction_id',
        dataType: 'string',
        description: 'Unique transaction identifier',
        isKey: true,
        sourceSystem: 'Transaction System',
      },
      {
        id: 'attr-014',
        name: 'account_id',
        dataType: 'string',
        description: 'Account identifier',
        isKey: false,
        sourceSystem: 'Transaction System',
      },
      {
        id: 'attr-015',
        name: 'transaction_date',
        dataType: 'timestamp',
        description: 'Date and time of transaction',
        isKey: false,
        sourceSystem: 'Transaction System',
      },
      {
        id: 'attr-016',
        name: 'amount',
        dataType: 'decimal',
        description: 'Transaction amount',
        isKey: false,
        sourceSystem: 'Transaction System',
      },
      {
        id: 'attr-017',
        name: 'transaction_type',
        dataType: 'string',
        description: 'Type of transaction',
        isKey: false,
        sourceSystem: 'Transaction System',
      },
      {
        id: 'attr-018',
        name: 'description',
        dataType: 'string',
        description: 'Transaction description',
        isKey: false,
        sourceSystem: 'Transaction System',
      },
    ],
  },
];

const initialState: DataProductDesignState = {
  step: 'use-case',
  useCase: null,
  availableSources: sampleDataSources,
  selectedSources: [],
  targetDataProduct: null,
};

const DataProductDesigner: React.FC = () => {
  const [state, setState] = useState<DataProductDesignState>(initialState);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateState = (updates: Partial<DataProductDesignState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const moveToNextStep = () => {
    const steps: DataProductDesignState['step'][] = [
      'use-case',
      'target-design',
      'source-identification',
      'mapping',
      'certification',
    ];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex < steps.length - 1) {
      updateState({ step: steps[currentIndex + 1] });
    }
  };

  const moveToPreviousStep = () => {
    const steps: DataProductDesignState['step'][] = [
      'use-case',
      'target-design',
      'source-identification',
      'mapping',
      'certification',
    ];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex > 0) {
      updateState({ step: steps[currentIndex - 1] });
    }
  };

  const saveUseCase = async (useCase: UseCase) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Analyze the use case with the AI backend
      const analysisResult = await apiService.analyzeUseCase(useCase);
      console.log('Use case analysis:', analysisResult);
      
      // Save both the useCase form data and the analysis
      updateState({ 
        useCase,
        // Additional data from analysis that we might want to use later
      });
      
      moveToNextStep();
    } catch (err) {
      console.error('Error analyzing use case:', err);
      setError('Failed to analyze use case. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveTargetDesign = (targetDataProduct: DataProduct) => {
    updateState({ targetDataProduct });
    moveToNextStep();
  };

  const saveSelectedSources = (selectedSources: DataSource[]) => {
    updateState({ selectedSources });
    moveToNextStep();
  };

  const saveMappings = (mappings: DataProduct['mappings']) => {
    if (state.targetDataProduct) {
      const updatedProduct = {
        ...state.targetDataProduct,
        mappings,
      };
      updateState({ targetDataProduct: updatedProduct });
      moveToNextStep();
    }
  };

  const certifyDataProduct = (
    ingressProcess: string,
    egressProcess: string,
    dataStore: string,
    searchApproach: string
  ) => {
    if (state.targetDataProduct) {
      const certifiedProduct = {
        ...state.targetDataProduct,
        ingressProcess,
        egressProcess,
        dataStore,
        searchApproach,
        certificationStatus: 'approved' as const,
      };
      updateState({ targetDataProduct: certifiedProduct });
    }
  };

  const resetDesigner = () => {
    setState(initialState);
  };

  // Integrated rendering with actual components where available
  const renderStep = () => {
    if (isProcessing) {
      return (
        <div className="processing-container">
          <div className="spinner"></div>
          <p>Processing your request...</p>
        </div>
      );
    }

    switch (state.step) {
      case 'use-case':
        return <UseCaseForm onSave={saveUseCase} initialData={state.useCase} />;
        
      case 'target-design':
        return <TargetDesign useCase={state.useCase} initialData={state.targetDataProduct} onSave={saveTargetDesign} />;
        
      case 'source-identification':
        return <SourceIdentification 
          availableSources={state.availableSources} 
          initialSelection={state.selectedSources} 
          onSave={saveSelectedSources} 
        />;
        
      case 'mapping':
        return <MappingGenerator targetDataProduct={state.targetDataProduct} selectedSources={state.selectedSources} onSave={saveMappings} />;
        
      case 'certification':
        return <Certification targetDataProduct={state.targetDataProduct} onSave={certifyDataProduct} />;
        
      default:
        // Placeholder for any future steps not yet implemented
        return (
          <div className="placeholder-content">
            <h3>Step: {state.step}</h3>
            <p>This functionality is currently being implemented.</p>
            {error && <div className="error-message">{error}</div>}
            <div className="placeholder-actions">
              <button 
                className="btn primary"
                onClick={moveToNextStep}
              >
                Next Step
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="data-product-designer">
      <div className="designer-header">
        <h2>Customer 360 Data Product Designer</h2>
        <div className="step-indicator">
          <div className={`step ${state.step === 'use-case' ? 'active' : ''}`}>
            1. Use Case
          </div>
          <div className={`step ${state.step === 'target-design' ? 'active' : ''}`}>
            2. Target Design
          </div>
          <div className={`step ${state.step === 'source-identification' ? 'active' : ''}`}>
            3. Source Identification
          </div>
          <div className={`step ${state.step === 'mapping' ? 'active' : ''}`}>
            4. Mapping
          </div>
          <div className={`step ${state.step === 'certification' ? 'active' : ''}`}>
            5. Certification
          </div>
        </div>
      </div>

      <div className="designer-content">{renderStep()}</div>

      <div className="designer-footer">
        <button
          className="btn secondary"
          onClick={moveToPreviousStep}
          disabled={state.step === 'use-case' || isProcessing}
        >
          Previous
        </button>
        {state.step === 'certification' ? (
          <button className="btn primary" onClick={resetDesigner} disabled={isProcessing}>
            Start New Design
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default DataProductDesigner; 