from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser

from src.agents.base_agent import BaseAgent
from config.config import AGENT_CONFIG


class RecommendationResult(BaseModel):
    """Model for parsing recommendation results."""
    recommended_solutions: List[str] = Field(description="List of recommended solutions to the issue")
    knowledge_articles: List[str] = Field(description="List of relevant knowledge base articles that may help")
    similar_cases: List[str] = Field(description="List of similar cases that were resolved successfully")
    estimated_resolution_time: str = Field(description="Estimated time to resolve this issue if the recommendations are followed")
    confidence_score: float = Field(description="Confidence score for the recommendations (0-1)")


class RecommenderAgent(BaseAgent):
    """Agent that suggests resolutions based on historical data and knowledge bases."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["recommender"]["name"],
            description=AGENT_CONFIG["recommender"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for recommendation tasks."""
        
        recommendation_template = """
        You are an AI assistant specialized in recommending solutions for customer support issues.
        Your task is to analyze the ticket content, summary, and any provided historical data
        to suggest potential solutions, identify relevant knowledge base articles,
        reference similar cases, estimate resolution time, and provide a confidence score.

        Ticket Content:
        {ticket_content}

        Ticket Summary:
        {ticket_summary}

        Routing Information:
        {routing_info}

        Historical Similar Cases:
        {historical_data}
        
        Please provide your recommendations in the following JSON format:
        ```json
        {{
            "recommended_solutions": ["Solution 1", "Solution 2", "..."],
            "knowledge_articles": ["Article 1", "Article 2", "..."],
            "similar_cases": ["Case 1", "Case 2", "..."],
            "estimated_resolution_time": "Time estimate (e.g., '2 hours', '1 day')",
            "confidence_score": 0.85 
        }}
        ```
        
        The confidence score should be between 0 and 1, where 1 indicates high confidence.
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="recommender_chain",
            prompt_template=recommendation_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a ticket to recommend solutions.
        
        Args:
            input_data: Dictionary containing the ticket information
                - ticket_content: The full ticket content
                - ticket_summary: The summary from the summarizer agent
                - routing_info: Information from the router agent
                - historical_data: Similar historical cases (optional)
                
        Returns:
            Dictionary with the recommendation results.
        """
        chain_input = {
            "ticket_content": input_data.get("ticket_content", ""),
            "ticket_summary": input_data.get("ticket_summary", ""),
            "routing_info": input_data.get("routing_info", ""),
            "historical_data": input_data.get("historical_data", "No historical data available."),
        }
        
        try:
            result = self.chains["recommender_chain"].run(chain_input)
            parsed_result = self.parse_output_to_dict(result, RecommendationResult)
            return parsed_result
        except Exception as e:
            return {
                "error": f"Failed to generate recommendations: {str(e)}",
                "recommended_solutions": ["Escalate to appropriate team for further analysis."],
                "knowledge_articles": [],
                "similar_cases": [],
                "estimated_resolution_time": "unknown",
                "confidence_score": 0.0
            } 