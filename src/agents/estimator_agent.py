from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser

from src.agents.base_agent import BaseAgent
from config.config import AGENT_CONFIG


class EstimationResult(BaseModel):
    """Model for parsing estimation results."""
    estimated_time: str = Field(description="Estimated time to resolution in hours or days")
    confidence_interval: str = Field(description="Confidence interval for the time estimate")
    bottlenecks: List[str] = Field(description="Potential bottlenecks that could delay resolution")
    optimization_suggestions: List[str] = Field(description="Suggestions to optimize the resolution process")
    resources_needed: List[str] = Field(description="Resources needed for efficient resolution")


class EstimatorAgent(BaseAgent):
    """Agent that predicts resolution times and optimizes workflows."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["estimator"]["name"],
            description=AGENT_CONFIG["estimator"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for estimation tasks."""
        
        estimation_template = """
        You are an AI assistant specialized in estimating resolution times for customer support issues.
        Your task is to analyze the ticket content, summary, routing information, and recommendations
        to predict resolution time, identify potential bottlenecks, suggest optimizations,
        and determine necessary resources.

        Ticket Content:
        {ticket_content}

        Ticket Summary:
        {ticket_summary}

        Routing Information:
        {routing_info}

        Recommendations:
        {recommendations}
        
        Please provide your estimation in the following JSON format:
        ```json
        {{
            "estimated_time": "Time estimate (e.g., '2 hours', '1-2 days')",
            "confidence_interval": "Range or confidence level (e.g., '±2 hours', '80% confident')",
            "bottlenecks": ["Bottleneck 1", "Bottleneck 2", "..."],
            "optimization_suggestions": ["Suggestion 1", "Suggestion 2", "..."],
            "resources_needed": ["Resource 1", "Resource 2", "..."]
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="estimator_chain",
            prompt_template=estimation_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a ticket to estimate resolution time and optimize workflow.
        
        Args:
            input_data: Dictionary containing the ticket information
                - ticket_content: The full ticket content
                - ticket_summary: The summary from the summarizer agent
                - routing_info: Information from the router agent
                - recommendations: Recommendations from the recommender agent
                
        Returns:
            Dictionary with the estimation results.
        """
        chain_input = {
            "ticket_content": input_data.get("ticket_content", ""),
            "ticket_summary": input_data.get("ticket_summary", ""),
            "routing_info": input_data.get("routing_info", ""),
            "recommendations": input_data.get("recommendations", ""),
        }
        
        try:
            result = self.chains["estimator_chain"].run(chain_input)
            parsed_result = self.parse_output_to_dict(result, EstimationResult)
            return parsed_result
        except Exception as e:
            return {
                "error": f"Failed to estimate resolution time: {str(e)}",
                "estimated_time": "unknown",
                "confidence_interval": "unknown",
                "bottlenecks": [],
                "optimization_suggestions": [],
                "resources_needed": []
            } 