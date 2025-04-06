from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, get_origin, get_args
import json
import re

from langchain_ollama import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain.pydantic_v1 import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser
from langchain.schema.output_parser import StrOutputParser

from config.config import LLM_CONFIG


class BaseAgent(ABC):
    """Base class for all agents in the system."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.llm = self._initialize_llm()
        self.chains = {}

    def _initialize_llm(self) -> OllamaLLM:
        """Initialize the Ollama LLM with the llama3 model."""
        return OllamaLLM(
            model=LLM_CONFIG["model"],
            base_url=LLM_CONFIG["base_url"],
            temperature=LLM_CONFIG["temperature"],
        )

    def create_chain(self, chain_name: str, prompt_template: str):
        """Create a LangChain chain with the specified prompt template."""
        prompt = PromptTemplate.from_template(prompt_template)
        
        # Use the newer LCEL approach but wrap it in a chain-like interface
        # for backward compatibility
        class ChainWrapper:
            def __init__(self, prompt, llm):
                self.prompt = prompt
                self.llm = llm
                self.runnable = prompt | llm | StrOutputParser()
                
            def run(self, inputs):
                return self.runnable.invoke(inputs)
        
        chain = ChainWrapper(prompt, self.llm)
        self.chains[chain_name] = chain
        return chain
        
    def extract_json_from_text(self, text: str) -> dict:
        """
        Extract JSON from text even if it's not perfectly formatted.
        
        Args:
            text: The text containing JSON-like structure
            
        Returns:
            Extracted dictionary or empty dict if extraction fails
        """
        # First, try to find JSON between triple backticks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find JSON between curly braces
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                json_str = json_match.group(0)
            else:
                return {}
        
        # Clean up the JSON string
        json_str = json_str.strip()
        
        # Try to parse the JSON
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            # If parsing fails, try to fix common issues
            # Replace single quotes with double quotes
            json_str = json_str.replace("'", '"')
            # Handle trailing commas
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                return {}
                
    def parse_output_to_dict(self, output_text: str, schema_class: Any) -> Dict[str, Any]:
        """
        Parse LLM output text into a dictionary based on the schema class.
        This is a more flexible approach than strict Pydantic parsing.
        
        Args:
            output_text: The raw text output from the LLM
            schema_class: The Pydantic model class defining the expected schema
            
        Returns:
            Dictionary with the parsed values or default values if parsing fails
        """
        # Extract JSON if possible
        extracted_data = self.extract_json_from_text(output_text)
        
        # Create a basic default result dictionary based on the schema
        result = {}
        
        # Get the model's fields and their types
        for field_name, field_info in schema_class.__annotations__.items():
            # First check if extracted data has this field
            if field_name in extracted_data:
                result[field_name] = extracted_data[field_name]
                continue
                
            # Otherwise set default values based on type
            # Check if it's a list type
            origin = get_origin(field_info)
            if origin is list:
                result[field_name] = []
            # Basic types
            elif field_info == str:
                result[field_name] = ""
            elif field_info == int:
                result[field_name] = 0
            elif field_info == float:
                result[field_name] = 0.0
            elif field_info == bool:
                result[field_name] = False
            else:
                result[field_name] = None
                
        return result

    @abstractmethod
    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process the input data and return the results."""
        pass

    def __str__(self) -> str:
        return f"{self.name}: {self.description}" 