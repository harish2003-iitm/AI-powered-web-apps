from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from fastapi.middleware.cors import CORSMiddleware

from src.agents.orchestrator import Orchestrator
from src.agents.data_product_orchestrator import DataProductOrchestrator
from src.utils.database import (
    save_ticket, update_ticket_results, get_ticket,
    create_job, update_job_status, get_job_tickets
)


# Initialize the app
app = FastAPI(
    title="Lightspeed API",
    description="API for the Lightspeed AI-Driven Customer Support System",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the orchestrators
orchestrator = Orchestrator()
data_product_orchestrator = DataProductOrchestrator()


# Input models
class TicketData(BaseModel):
    ticket_id: str
    conversation: str
    historical_data: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = {}

class JobStatus(BaseModel):
    job_id: str
    status: str
    results: Optional[Dict[str, Any]] = None

class UseCase(BaseModel):
    use_case_description: str
    stakeholders: str

class SourceSystems(BaseModel):
    source_systems: List[Dict[str, Any]]

class DataProductMapping(BaseModel):
    data_model: Dict[str, Any]
    source_systems: List[Dict[str, Any]]

class DataFlowInput(BaseModel):
    data_model: Dict[str, Any]
    source_mappings: Dict[str, Any]


# Customer Support API Endpoints
@app.post("/process_tickets")
async def process_tickets(ticket: TicketData, background_tasks: BackgroundTasks):
    """
    Process a customer support ticket asynchronously.
    Returns a job ID that can be used to check the status of the processing.
    """
    # Save the ticket to the database
    ticket_id = save_ticket(ticket.dict())
    
    # Create a job for processing
    job_id = create_job(ticket_id)
    
    # Process the ticket in the background
    background_tasks.add_task(process_ticket_task, job_id, ticket.dict())
    
    return {"job_id": job_id, "status": "processing"}

async def process_ticket_task(job_id: str, ticket_data: Dict[str, Any]):
    """Background task to process a ticket."""
    try:
        # Process the ticket
        results = orchestrator.process_ticket(ticket_data)
        
        # Update the ticket with results
        update_ticket_results(ticket_data["ticket_id"], results)
        
        # Update the job status
        update_job_status(job_id, "completed", results)
    except Exception as e:
        # Update the job status with the error
        update_job_status(job_id, "failed", {"error": str(e)})

@app.get("/job_status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status of a job by its ID.
    """
    # Get the job status from the database
    job = get_job_tickets(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@app.get("/ticket/{ticket_id}")
async def get_ticket_by_id(ticket_id: str):
    """
    Get a ticket by its ID.
    """
    # Get the ticket from the database
    ticket = get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket

@app.get("/healthcheck")
async def healthcheck():
    """
    Health check endpoint to verify the API is running.
    """
    return {"status": "ok"}


# Data Product Design API Endpoints
@app.post("/data_product/use_case")
async def process_use_case(use_case: UseCase):
    """
    Process a data product use case description.
    Returns the analyzed use case with extracted requirements.
    """
    result = data_product_orchestrator.process_step('use_case', use_case.dict())
    return result

@app.post("/data_product/target_design")
async def create_target_design(input_data: Dict[str, Any]):
    """
    Create a target data model design based on the use case analysis.
    Returns the designed data model.
    """
    result = data_product_orchestrator.process_step('target_design', input_data)
    return result

@app.post("/data_product/source_selection")
async def select_source_systems(source_systems: SourceSystems):
    """
    Process the selection of source systems for the data product.
    Returns the confirmed source systems.
    """
    result = data_product_orchestrator.process_step('source_identification', source_systems.dict())
    return result

@app.post("/data_product/mapping")
async def create_attribute_mappings(mapping_input: DataProductMapping):
    """
    Create mappings between source attributes and target data model.
    Returns the attribute mappings.
    """
    result = data_product_orchestrator.process_step('mapping', mapping_input.dict())
    return result

@app.post("/data_product/data_flow")
async def design_data_flow(flow_input: DataFlowInput):
    """
    Design data ingress and egress processes for the data product.
    Returns the data flow design.
    """
    result = data_product_orchestrator.process_step('data_flow', flow_input.dict())
    return result

@app.post("/data_product/certification")
async def certify_data_product():
    """
    Certify the complete data product design against quality standards.
    Returns the certification assessment.
    """
    result = data_product_orchestrator.process_step('certification', {})
    return result

@app.get("/data_product/complete_design")
async def get_complete_design():
    """
    Get the complete data product design with all components.
    """
    return data_product_orchestrator.get_final_design()

@app.post("/data_product/reset")
async def reset_data_product_design():
    """
    Reset the data product design state.
    """
    data_product_orchestrator.reset()
    return {"status": "reset_complete"} 