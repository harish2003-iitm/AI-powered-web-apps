import sys
import os
import json
from pathlib import Path

# Add the project root to sys.path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))

from src.agents.base_agent import BaseAgent
from src.agents.summarizer_agent import SummaryResult, SummarizerAgent


def test_extract_json():
    """Test the JSON extraction functionality."""
    
    # Create a mock agent for testing
    class MockAgent(BaseAgent):
        def __init__(self):
            super().__init__("Mock Agent", "For testing")
        
        def process(self, input_data):
            return {}
    
    agent = MockAgent()
    
    # Test 1: Well-formatted JSON with backticks
    test1 = '''
    Here's the JSON you requested:
    ```json
    {
        "key1": "value1",
        "key2": [1, 2, 3],
        "key3": true
    }
    ```
    '''
    result1 = agent.extract_json_from_text(test1)
    print("Test 1 Result:", result1)
    assert result1["key1"] == "value1"
    
    # Test 2: JSON with single quotes
    test2 = '''
    {
        'key1': 'value1',
        'key2': [1, 2, 3],
        'key3': true
    }
    '''
    result2 = agent.extract_json_from_text(test2)
    print("Test 2 Result:", result2)
    assert result2["key1"] == "value1"
    
    # Test 3: JSON with trailing commas
    test3 = '''
    {
        "key1": "value1",
        "key2": [1, 2, 3,],
        "key3": true,
    }
    '''
    result3 = agent.extract_json_from_text(test3)
    print("Test 3 Result:", result3)
    assert result3["key1"] == "value1"
    
    print("All JSON extraction tests passed!")


def test_parse_output_to_dict():
    """Test parsing LLM output to a dictionary using the schema class."""
    
    # Create a mock agent for testing
    class MockAgent(BaseAgent):
        def __init__(self):
            super().__init__("Mock Agent", "For testing")
        
        def process(self, input_data):
            return {}
    
    agent = MockAgent()
    
    # Test with the SummaryResult schema
    test_output = '''
    Here's my analysis:
    ```json
    {
        "summary": "Customer is having issues accessing the admin dashboard",
        "key_points": ["Access denied error", "Was working yesterday", "System update happened"],
        "sentiment": "negative"
    }
    ```
    '''
    
    result = agent.parse_output_to_dict(test_output, SummaryResult)
    print("Parsed Result:", result)
    
    # Check that we have all the required fields
    assert "summary" in result
    assert "key_points" in result
    assert "action_items" in result  # This should be added with default value
    assert "sentiment" in result
    assert "urgency" in result  # This should be added with default value
    
    # Check that the values were parsed correctly
    assert result["summary"] == "Customer is having issues accessing the admin dashboard"
    assert "Access denied error" in result["key_points"]
    assert result["sentiment"] == "negative"
    assert isinstance(result["action_items"], list)
    
    print("Output parsing test passed!")


def test_summarizer_agent():
    """Test the summarizer agent with our improved parsing."""
    
    # Create the summarizer agent
    agent = SummarizerAgent()
    
    # Sample conversation
    conversation = """
    Customer: Hi, I've been trying to access the admin dashboard for our company account, but I keep getting an error message saying 'Access Denied'.
    
    Agent: I'm sorry to hear you're having trouble accessing the admin dashboard. Could you please provide me with your account details so I can look into this issue?
    
    Customer: Sure, our company account is ABC Corp, and I'm the admin user john.doe@abccorp.com. I was able to log in yesterday, but today it's not working.
    
    Agent: Thank you for providing that information. Let me check what's happening with your account. Can you tell me what time you started experiencing this issue?
    
    Customer: It started around 9 AM this morning. I've tried clearing my cache and using a different browser, but I still can't access the dashboard.
    
    Agent: I appreciate your patience. I can see that there was a system update last night which might be affecting admin access. Our technical team is aware of the issue and working on a fix. Can I ask how urgent your need for dashboard access is today?
    
    Customer: It's quite urgent. I need to generate reports for a meeting this afternoon.
    """
    
    # Process the conversation
    result = agent.process({"conversation": conversation})
    
    # Check if we got a valid result
    print("Summarizer Result:", json.dumps(result, indent=2))
    
    # Test that essential fields are present
    assert "summary" in result
    assert "key_points" in result
    assert "action_items" in result
    assert "sentiment" in result
    assert "urgency" in result
    
    # Check if the fields have reasonable values
    assert len(result["summary"]) > 10  # Ensure summary is not empty
    assert isinstance(result["key_points"], list)
    assert isinstance(result["action_items"], list)
    assert result["sentiment"] in ["positive", "neutral", "negative", "unknown", ""]
    assert result["urgency"] in ["low", "medium", "high", "unknown", ""]
    
    print("Summarizer agent test completed successfully!")


if __name__ == "__main__":
    # Run the tests
    print("Testing JSON extraction...")
    test_extract_json()
    
    print("\nTesting output parsing...")
    test_parse_output_to_dict()
    
    print("\nTesting summarizer agent...")
    test_summarizer_agent() 