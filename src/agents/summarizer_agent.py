from typing import Dict, Any, List
from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser

from src.agents.base_agent import BaseAgent
from config.config import AGENT_CONFIG


class SummaryResult(BaseModel):
    """Model for parsing summarizer results."""
    summary: str = Field(description="A concise summary of the customer conversation")
    key_points: List[str] = Field(description="List of key points from the conversation")
    action_items: List[str] = Field(description="List of action items that need to be addressed")
    sentiment: str = Field(description="The overall sentiment of the customer (positive, neutral, negative)")
    urgency: str = Field(description="The level of urgency (low, medium, high)")


class SummarizerAgent(BaseAgent):
    """Agent that summarizes customer conversations and extracts key information."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["summarizer"]["name"],
            description=AGENT_CONFIG["summarizer"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for summarization tasks."""
        
        summary_template = """
        You are an AI assistant specialized in analyzing customer support conversations.
        Your task is to carefully read the conversation and provide a concise summary,
        identify key points, extract actionable items, determine customer sentiment,
        and assess the level of urgency.

        Conversation:
        {conversation}

        Please provide your analysis in the following JSON format:
        ```json
        {{
            "summary": "A concise summary of the customer conversation",
            "key_points": ["Key point 1", "Key point 2", "..."],
            "action_items": ["Action item 1", "Action item 2", "..."],
            "sentiment": "positive/neutral/negative",
            "urgency": "low/medium/high"
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="summarizer_chain",
            prompt_template=summary_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a customer conversation to generate a summary and extract insights.
        
        Args:
            input_data: Dictionary containing the conversation and related metadata
                - conversation: The full customer conversation text
                
        Returns:
            Dictionary with the summary results.
        """
        chain_input = {
            "conversation": input_data.get("conversation", ""),
        }
        
        try:
            result = self.chains["summarizer_chain"].run(chain_input)
            parsed_result = self.parse_output_to_dict(result, SummaryResult)
            return parsed_result
        except Exception as e:
            return {
                "error": f"Failed to process conversation: {str(e)}",
                "summary": "Error generating summary",
                "key_points": [],
                "action_items": [],
                "sentiment": "unknown",
                "urgency": "unknown"
            } 