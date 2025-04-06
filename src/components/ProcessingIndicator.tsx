import React from 'react';
import { ProcessingIndicatorProps } from '../types';

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ 
  visible, 
  jobId, 
  status 
}) => {
  if (!visible && !jobId) return null;
  
  return (
    <div className="processing-indicator">
      {visible && !jobId && (
        <div className="processing-spinner">
          <div className="spinner"></div>
          <p>Submitting ticket...</p>
        </div>
      )}
      
      {jobId && (
        <div className="job-status">
          <p>
            <strong>Job ID:</strong> {jobId}
            {status && <span className="status-badge">{status}</span>}
          </p>
          {status === 'in_progress' && (
            <div className="processing-spinner">
              <div className="spinner"></div>
              <p>Processing ticket...</p>
            </div>
          )}
          {status === 'completed' && (
            <p className="status-message success">Analysis complete!</p>
          )}
          {status === 'failed' && (
            <p className="status-message error">Processing failed. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessingIndicator; 