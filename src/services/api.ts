import { 
  Ticket, 
  TicketSubmissionResponse, 
  JobStatusResult
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8001';

// Simple debug logger
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[API Debug] ${message}`);
    if (data) console.log(data);
  }
};

export const apiService = {
  /**
   * Checks if the API server is running
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/healthcheck`);
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      const data = await response.json();
      logDebug('Health check response:', data);
      return data;
    } catch (error) {
      logDebug('Health check error:', error);
      throw error;
    }
  },

  /**
   * Submits a ticket for processing
   */
  async submitTicket(ticket: Ticket): Promise<TicketSubmissionResponse> {
    try {
      logDebug('Submitting ticket:', ticket);
      
      const response = await fetch(`${API_BASE_URL}/process_tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets: [ticket]
        }),
      });

      if (!response.ok) {
        throw new Error(`Ticket submission failed with status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Ticket submission response:', data);
      return data;
    } catch (error) {
      logDebug('Ticket submission error:', error);
      throw error;
    }
  },

  /**
   * Checks the status of a processing job
   */
  async getJobStatus(jobId: string): Promise<JobStatusResult> {
    try {
      logDebug(`Getting job status for job ${jobId}`);
      
      const response = await fetch(`${API_BASE_URL}/job_status/${jobId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Job status check failed with status: ${response.status}`);
      }

      const data = await response.json();
      logDebug('Job status response:', data);
      return data;
    } catch (error) {
      logDebug('Job status error:', error);
      throw error;
    }
  }
}; 