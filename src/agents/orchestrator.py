from typing import Dict, Any
from langchain.chains.sequential import SequentialChain
from langchain.prompts import PromptTemplate
from langchain_ollama import OllamaLLM

from src.agents.summarizer_agent import SummarizerAgent
from src.agents.router_agent import RouterAgent
from src.agents.recommender_agent import RecommenderAgent
from src.agents.estimator_agent import EstimatorAgent
from src.agents.base_agent import BaseAgent
from config.config import LLM_CONFIG


class Orchestrator:
    """
    Orchestrates the flow of data between different agents in the system.
    This class coordinates the processing of customer support tickets through
    the various specialized agents.
    """

    def __init__(self):
        self.summarizer = SummarizerAgent()
        self.router = RouterAgent()
        self.recommender = RecommenderAgent()
        self.estimator = EstimatorAgent()
        self.llm = OllamaLLM(
            model=LLM_CONFIG["model"],
            base_url=LLM_CONFIG["base_url"],
            temperature=LLM_CONFIG["temperature"],
        )
        
        # For final recommendations and insights
        final_template = """
        You are an AI assistant providing a final analysis of a customer support ticket.
        Synthesize the information from all specialized agents to create an actionable final report.
        
        Original Ticket:
        {ticket_content}
        
        Summary:
        {summary_result}
        
        Routing:
        {routing_result}
        
        Recommendations:
        {recommendation_result}
        
        Time Estimation:
        {estimation_result}
        
        Based on the above information, provide a comprehensive final report with:
        1. Overall assessment of the issue
        2. Recommended next steps
        3. Key highlights that require attention
        4. Any critical insights that might have been missed
        """
        
        # Create a temporary base agent to use its create_chain method
        temp_agent = type('TempAgent', (BaseAgent,), {'process': lambda self, x: x})('Temp', 'Temporary agent')
        self.final_chain = temp_agent.create_chain('final_chain', final_template)

    def process_ticket(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a customer support ticket through all agents.
        
        Args:
            ticket_data: Dictionary containing the ticket information
                - ticket_id: Unique identifier for the ticket
                - conversation: The full conversation or ticket content
                - metadata: Any additional relevant information
                
        Returns:
            Dictionary with the complete processing results from all agents.
        """
        results = {}
        
        # Step 1: Summarize the conversation
        summary_input = {
            "conversation": ticket_data.get("conversation", "")
        }
        summary_result = self.summarizer.process(summary_input)
        results["summary"] = summary_result
        
        # Step 2: Route the ticket
        routing_input = {
            "ticket_content": ticket_data.get("conversation", ""),
            "ticket_summary": summary_result.get("summary", "")
        }
        routing_result = self.router.process(routing_input)
        results["routing"] = routing_result
        
        # Step 3: Recommend solutions
        recommendation_input = {
            "ticket_content": ticket_data.get("conversation", ""),
            "ticket_summary": summary_result.get("summary", ""),
            "routing_info": routing_result,
            "historical_data": ticket_data.get("historical_data", "")
        }
        recommendation_result = self.recommender.process(recommendation_input)
        results["recommendations"] = recommendation_result
        
        # Step 4: Estimate resolution time
        estimation_input = {
            "ticket_content": ticket_data.get("conversation", ""),
            "ticket_summary": summary_result.get("summary", ""),
            "routing_info": routing_result,
            "recommendations": recommendation_result
        }
        estimation_result = self.estimator.process(estimation_input)
        results["estimation"] = estimation_result
        
        # Step 5: Generate final insights
        final_input = {
            "ticket_content": ticket_data.get("conversation", ""),
            "summary_result": summary_result,
            "routing_result": routing_result,
            "recommendation_result": recommendation_result,
            "estimation_result": estimation_result
        }
        final_result = self.final_chain.runnable.invoke(final_input)
        results["final_insights"] = final_result
        
        # Add the original ticket data
        results["ticket_id"] = ticket_data.get("ticket_id", "unknown")
        results["metadata"] = ticket_data.get("metadata", {})
        
        return results 