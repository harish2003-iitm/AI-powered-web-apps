import sys
import os
import pytest
from pathlib import Path

# Add the project root to sys.path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))

from src.agents.orchestrator import Orchestrator


@pytest.fixture
def orchestrator():
    """Create an orchestrator for testing."""
    return Orchestrator()


def test_process_ticket(orchestrator):
    """Test processing a ticket through the orchestrator."""
    
    # Sample ticket data
    ticket_data = {
        "ticket_id": "test-001",
        "conversation": """
        Customer: Hi, I've been trying to access the admin dashboard for our company account, but I keep getting an error message saying 'Access Denied'.
        
        Agent: I'm sorry to hear you're having trouble accessing the admin dashboard. Could you please provide me with your account details so I can look into this issue?
        
        Customer: Sure, our company account is ABC Corp, and I'm the admin user john.doe@abccorp.com. I was able to log in yesterday, but today it's not working.
        
        Agent: Thank you for providing that information. Let me check what's happening with your account. Can you tell me what time you started experiencing this issue?
        
        Customer: It started around 9 AM this morning. I've tried clearing my cache and using a different browser, but I still can't access the dashboard.
        
        Agent: I appreciate your patience. I can see that there was a system update last night which might be affecting admin access. Our technical team is aware of the issue and working on a fix. Can I ask how urgent your need for dashboard access is today?
        
        Customer: It's quite urgent. I need to generate reports for a meeting this afternoon.
        """,
        "metadata": {
            "customer_id": "customer-123",
            "subscription_tier": "enterprise",
            "account_age_days": 365
        }
    }
    
    # Process the ticket
    result = orchestrator.process_ticket(ticket_data)
    
    # Assertions - basic structure check
    assert "summary" in result
    assert "routing" in result
    assert "recommendations" in result
    assert "estimation" in result
    assert "final_insights" in result
    assert result["ticket_id"] == "test-001"
    
    # Print summary of results (for demonstration)
    print("\nSummary:", result["summary"].get("summary", "No summary available"))
    print("\nRouting Team:", result["routing"].get("team", "No team assigned"))
    print("\nRecommended Solutions:", result["recommendations"].get("recommended_solutions", []))
    print("\nEstimated Resolution Time:", result["estimation"].get("estimated_time", "Unknown"))
    
    print("\nFinal Insights:", result["final_insights"])


if __name__ == "__main__":
    # Run the test directly
    orchestrator = Orchestrator()
    test_process_ticket(orchestrator) 