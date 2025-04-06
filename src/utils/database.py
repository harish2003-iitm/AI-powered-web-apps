import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config.config import DB_CONFIG

# Ensure the data directory exists
os.makedirs(os.path.dirname(DB_CONFIG["sqlite_path"]), exist_ok=True)

# Create the database engine
db_url = f"sqlite:///{DB_CONFIG['sqlite_path']}"
engine = create_engine(db_url, connect_args=DB_CONFIG["connect_args"])
Session = sessionmaker(bind=engine)

# Define the base class for SQLAlchemy models
Base = declarative_base()


class Ticket(Base):
    """SQLAlchemy model for tickets."""
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True)
    ticket_id = Column(String(256), unique=True, nullable=False, index=True)
    conversation = Column(Text, nullable=False)
    historical_data = Column(Text, nullable=True)
    ticket_metadata = Column(Text, nullable=True)  # Store JSON as Text
    summary = Column(Text, nullable=True)  # Store JSON as Text
    routing = Column(Text, nullable=True)  # Store JSON as Text
    recommendations = Column(Text, nullable=True)  # Store JSON as Text
    estimation = Column(Text, nullable=True)  # Store JSON as Text
    final_insights = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JobStatus(Base):
    """SQLAlchemy model for job statuses."""
    __tablename__ = "job_status"

    id = Column(Integer, primary_key=True)
    job_id = Column(String(256), unique=True, nullable=False, index=True)
    status = Column(String(50), default="processing")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Create all tables
Base.metadata.create_all(engine)


def save_ticket(ticket_data: Dict[str, Any]) -> None:
    """
    Save a ticket to the database.
    
    Args:
        ticket_data: Dictionary containing ticket information
    """
    with Session() as session:
        # Convert dictionaries to JSON strings
        metadata = json.dumps(ticket_data.get("metadata", {})) if ticket_data.get("metadata") else None
        
        ticket = Ticket(
            ticket_id=ticket_data["ticket_id"],
            conversation=ticket_data["conversation"],
            historical_data=ticket_data.get("historical_data"),
            ticket_metadata=metadata,
        )
        session.add(ticket)
        session.commit()


def update_ticket_results(ticket_id: str, results: Dict[str, Any]) -> None:
    """
    Update a ticket with processing results.
    
    Args:
        ticket_id: The ID of the ticket to update
        results: Dictionary containing the processing results
    """
    with Session() as session:
        ticket = session.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if ticket:
            # Convert dictionaries to JSON strings
            ticket.summary = json.dumps(results.get("summary")) if results.get("summary") else None
            ticket.routing = json.dumps(results.get("routing")) if results.get("routing") else None
            ticket.recommendations = json.dumps(results.get("recommendations")) if results.get("recommendations") else None
            ticket.estimation = json.dumps(results.get("estimation")) if results.get("estimation") else None
            ticket.final_insights = results.get("final_insights")
            ticket.status = "completed"
            session.commit()


def get_ticket(ticket_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a ticket from the database.
    
    Args:
        ticket_id: The ID of the ticket to retrieve
        
    Returns:
        Dictionary containing the ticket information, or None if not found
    """
    with Session() as session:
        ticket = session.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
        if ticket:
            # Parse JSON strings back to dictionaries
            metadata = json.loads(ticket.ticket_metadata) if ticket.ticket_metadata else {}
            summary = json.loads(ticket.summary) if ticket.summary else None
            routing = json.loads(ticket.routing) if ticket.routing else None
            recommendations = json.loads(ticket.recommendations) if ticket.recommendations else None
            estimation = json.loads(ticket.estimation) if ticket.estimation else None
            
            return {
                "ticket_id": ticket.ticket_id,
                "conversation": ticket.conversation,
                "historical_data": ticket.historical_data,
                "metadata": metadata,
                "summary": summary,
                "routing": routing,
                "recommendations": recommendations,
                "estimation": estimation,
                "final_insights": ticket.final_insights,
                "status": ticket.status,
                "created_at": ticket.created_at.isoformat(),
                "updated_at": ticket.updated_at.isoformat(),
            }
        return None


def create_job(job_id: str) -> None:
    """
    Create a new job status entry.
    
    Args:
        job_id: The ID of the job to create
    """
    with Session() as session:
        job = JobStatus(job_id=job_id)
        session.add(job)
        session.commit()


def update_job_status(job_id: str, status: str) -> None:
    """
    Update a job's status.
    
    Args:
        job_id: The ID of the job to update
        status: The new status
    """
    with Session() as session:
        job = session.query(JobStatus).filter(JobStatus.job_id == job_id).first()
        if job:
            job.status = status
            session.commit()


def get_job_tickets(job_id: str) -> List[Dict[str, Any]]:
    """
    Get all tickets for a job.
    
    Args:
        job_id: The ID of the job
        
    Returns:
        List of dictionaries containing ticket information
    """
    with Session() as session:
        # Find all tickets with job_id in metadata
        tickets = session.query(Ticket).all()
        result = []
        for ticket in tickets:
            # Parse metadata JSON
            metadata = json.loads(ticket.ticket_metadata) if ticket.ticket_metadata else {}
            
            if metadata.get("job_id") == job_id:
                # Parse result JSONs
                summary = json.loads(ticket.summary) if ticket.summary else None
                routing = json.loads(ticket.routing) if ticket.routing else None
                recommendations = json.loads(ticket.recommendations) if ticket.recommendations else None
                estimation = json.loads(ticket.estimation) if ticket.estimation else None
                
                result.append({
                    "ticket_id": ticket.ticket_id,
                    "status": ticket.status,
                    "results": {
                        "summary": summary,
                        "routing": routing,
                        "recommendations": recommendations,
                        "estimation": estimation,
                        "final_insights": ticket.final_insights,
                    } if ticket.status == "completed" else None,
                })
        return result 