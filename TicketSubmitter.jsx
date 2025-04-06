import React, { useState, useEffect } from 'react';

const TicketSubmitter = () => {
  const [ticketId, setTicketId] = useState('TICKET-001');
  const [conversation, setConversation] = useState('');
  const [priority, setPriority] = useState('medium');
  const [jobId, setJobId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8001/process_tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets: [
            {
              ticket_id: ticketId,
              conversation: conversation,
              metadata: {
                priority: priority
              }
            }
          ]
        }),
      });
      
      const data = await response.json();
      setJobId(data.job_id);
      
      // Start polling for results
      const interval = setInterval(() => {
        checkJobStatus(data.job_id);
      }, 3000);
      
      setRefreshInterval(interval);
    } catch (err) {
      setError('Failed to submit ticket: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const checkJobStatus = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/job_status/${id}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      setResults(data);
      
      // If all tickets are processed, stop polling
      const allCompleted = data.results.every(ticket => 
        ticket.status === 'completed' || ticket.status === 'failed'
      );
      
      if (allCompleted && refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    } catch (err) {
      setError('Failed to check job status: ' + err.message);
    }
  };
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);
  
  return (
    <div className="ticket-submitter">
      <h1>Ticket Submission System</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Ticket ID:
            <input 
              type="text" 
              value={ticketId} 
              onChange={(e) => setTicketId(e.target.value)} 
              required 
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>
            Conversation:
            <textarea 
              value={conversation} 
              onChange={(e) => setConversation(e.target.value)} 
              required 
              rows={10}
              placeholder="Enter the customer conversation here..."
            />
          </label>
        </div>
        
        <div className="form-group">
          <label>
            Priority:
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
      
      {error && <div className="error">{error}</div>}
      
      {jobId && (
        <div className="results-section">
          <h2>Job ID: {jobId}</h2>
          
          {results && (
            <div className="job-results">
              <h3>Results:</h3>
              <pre>{JSON.stringify(results, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .ticket-submitter {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        input, textarea, select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        button:hover {
          background-color: #45a049;
        }
        
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error {
          color: red;
          margin-top: 10px;
        }
        
        .results-section {
          margin-top: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        pre {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default TicketSubmitter; 