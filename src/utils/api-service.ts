import { Ticket, TicketSubmissionResponse, ProcessingResults, JobStatusResult, UseCase, DataSource, DataProduct } from '../types';

const API_URL = 'http://127.0.0.1:8001';

// Customer Support API Functions
export const submitTicket = async (conversation: string, metadata: { priority: string } = { priority: "medium" }): Promise<TicketSubmissionResponse> => {
  try {
    const response = await fetch(`${API_URL}/process_tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: `TICKET-${Date.now()}`,
        conversation,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error submitting ticket: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getJobStatus = async (jobId: string): Promise<JobStatusResult> => {
  try {
    const response = await fetch(`${API_URL}/job_status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error getting job status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Data Product Designer API Functions
export const analyzeUseCase = async (useCase: UseCase): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/use_case`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        use_case_description: useCase.description,
        stakeholders: useCase.targetUsers.join(', ')
      }),
    });

    if (!response.ok) {
      throw new Error(`Error analyzing use case: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const createTargetDesign = async (useCaseAnalysis: any): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/target_design`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(useCaseAnalysis),
    });

    if (!response.ok) {
      throw new Error(`Error creating target design: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const selectSourceSystems = async (sourceSystems: DataSource[]): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/source_selection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_systems: sourceSystems
      }),
    });

    if (!response.ok) {
      throw new Error(`Error selecting source systems: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const createAttributeMappings = async (
  dataModel: any,
  sourceSystems: DataSource[]
): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/mapping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_model: dataModel,
        source_systems: sourceSystems
      }),
    });

    if (!response.ok) {
      throw new Error(`Error creating attribute mappings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const designDataFlow = async (
  dataModel: any,
  sourceMappings: any
): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/data_flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_model: dataModel,
        source_mappings: sourceMappings
      }),
    });

    if (!response.ok) {
      throw new Error(`Error designing data flow: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const certifyDataProduct = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/certification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error certifying data product: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getCompleteDesign = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/complete_design`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error getting complete design: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const resetDataProductDesign = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/data_product/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error resetting data product design: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}; 