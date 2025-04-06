import React, { useState } from 'react';
import { DataProduct } from '../../types';

interface CertificationProps {
  targetDataProduct: DataProduct | null;
  onSave: (
    ingressProcess: string,
    egressProcess: string,
    dataStore: string,
    searchApproach: string
  ) => void;
}

const Certification: React.FC<CertificationProps> = ({
  targetDataProduct,
  onSave,
}) => {
  const [ingressProcess, setIngressProcess] = useState<string>('');
  const [egressProcess, setEgressProcess] = useState<string>('');
  const [dataStore, setDataStore] = useState<string>('');
  const [searchApproach, setSearchApproach] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!targetDataProduct) {
    return (
      <div className="certification-form">
        <h3>Certify Data Product</h3>
        <div className="error-message">
          Target data product information is missing. Please complete previous steps first.
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Validate the input
      if (!ingressProcess || !egressProcess || !dataStore || !searchApproach) {
        throw new Error('All fields are required');
      }

      // Call the onSave callback
      onSave(ingressProcess, egressProcess, dataStore, searchApproach);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to certify data product';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="certification-form">
      <h3>Certify Data Product</h3>
      <p className="form-description">
        Define the operational aspects of your data product to certify it for deployment.
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="ingressProcess">Ingress Process:</label>
          <select
            id="ingressProcess"
            value={ingressProcess}
            onChange={(e) => setIngressProcess(e.target.value)}
            required
          >
            <option value="">Select an ingress process</option>
            <option value="batch">Batch Processing</option>
            <option value="streaming">Real-time Streaming</option>
            <option value="hybrid">Hybrid Approach</option>
          </select>
          <small className="helper-text">How data will be ingested into the data product</small>
        </div>

        <div className="form-group">
          <label htmlFor="egressProcess">Egress Process:</label>
          <select
            id="egressProcess"
            value={egressProcess}
            onChange={(e) => setEgressProcess(e.target.value)}
            required
          >
            <option value="">Select an egress process</option>
            <option value="api">RESTful API</option>
            <option value="graphql">GraphQL</option>
            <option value="file">File Export</option>
            <option value="messaging">Messaging Queue</option>
          </select>
          <small className="helper-text">How consumers will access the data product</small>
        </div>

        <div className="form-group">
          <label htmlFor="dataStore">Data Store:</label>
          <select
            id="dataStore"
            value={dataStore}
            onChange={(e) => setDataStore(e.target.value)}
            required
          >
            <option value="">Select a data store</option>
            <option value="relational">Relational Database</option>
            <option value="document">Document Store</option>
            <option value="columnar">Columnar Database</option>
            <option value="graph">Graph Database</option>
            <option value="timeseries">Time Series Database</option>
          </select>
          <small className="helper-text">Where the processed data will be stored</small>
        </div>

        <div className="form-group">
          <label htmlFor="searchApproach">Search Approach:</label>
          <select
            id="searchApproach"
            value={searchApproach}
            onChange={(e) => setSearchApproach(e.target.value)}
            required
          >
            <option value="">Select a search approach</option>
            <option value="fulltext">Full-text Search</option>
            <option value="index">Indexed Search</option>
            <option value="graph">Graph Traversal</option>
            <option value="vector">Vector Search</option>
          </select>
          <small className="helper-text">How the data will be searched and queried</small>
        </div>

        <div className="data-product-summary">
          <h4>Data Product Summary</h4>
          <div className="summary-item">
            <span className="summary-label">Name:</span>
            <span className="summary-value">{targetDataProduct.name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Attributes:</span>
            <span className="summary-value">{targetDataProduct.targetAttributes.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Mappings:</span>
            <span className="summary-value">{targetDataProduct.mappings.length}</span>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Certify Data Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Certification; 