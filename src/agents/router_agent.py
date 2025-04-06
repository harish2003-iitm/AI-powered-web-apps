from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser

from src.agents.base_agent import BaseAgent
from config.config import AGENT_CONFIG


class RoutingResult(BaseModel):
    """Model for parsing routing results."""
    team: str = Field(description="The team that should handle this ticket (technical, billing, product, security, etc.)")
    priority: str = Field(description="The priority level of the ticket (low, medium, high, critical)")
    skills_required: List[str] = Field(description="List of skills or knowledge areas required to resolve this issue")
    justification: str = Field(description="Explanation of why this routing decision was made")
    escalation_needed: bool = Field(description="Whether this ticket needs to be escalated to a manager or specialist")


class RouterAgent(BaseAgent):
    """Agent that routes tasks to appropriate teams based on content analysis."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["router"]["name"],
            description=AGENT_CONFIG["router"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for routing tasks."""
        
        routing_template = """
        You are an AI assistant specialized in routing customer support tickets to the appropriate teams.
        Your task is to analyze the ticket content and summary to determine the best team to handle it,
        assess its priority, identify required skills, provide justification for your decision,
        and determine if escalation is needed.

        Available teams:
        - Technical Support: Handles technical issues, bugs, and system errors
        - Billing: Handles payment issues, refunds, and subscription concerns
        - Product: Handles product features, usage questions, and enhancement requests
        - Security: Handles account security, data privacy, and compliance issues
        - Customer Success: Handles account management, onboarding, and relationship issues

        Ticket Content:
        {ticket_content}

        Ticket Summary:
        {ticket_summary}
        
        Please provide your analysis in the following JSON format:
        ```json
        {{
            "team": "Name of the appropriate team",
            "priority": "low/medium/high/critical",
            "skills_required": ["Skill 1", "Skill 2", "..."],
            "justification": "Explanation of why this routing decision was made",
            "escalation_needed": true/false
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="router_chain",
            prompt_template=routing_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a ticket to determine the appropriate routing.
        
        Args:
            input_data: Dictionary containing the ticket content and summary
                - ticket_content: The full ticket content
                - ticket_summary: The summary of the ticket from the summarizer agent
                
        Returns:
            Dictionary with the routing results.
        """
        chain_input = {
            "ticket_content": input_data.get("ticket_content", ""),
            "ticket_summary": input_data.get("ticket_summary", ""),
        }
        
        try:
            result = self.chains["router_chain"].run(chain_input)
            parsed_result = self.parse_output_to_dict(result, RoutingResult)
            return parsed_result
        except Exception as e:
            return {
                "error": f"Failed to route ticket: {str(e)}",
                "team": "unassigned",
                "priority": "medium",
                "skills_required": [],
                "justification": "Error in routing process",
                "escalation_needed": False
            } 