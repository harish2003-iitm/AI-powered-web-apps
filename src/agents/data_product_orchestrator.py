from typing import Dict, Any, List, Optional
import json

from src.agents.data_product_agents import (
    UseCaseAnalyzerAgent,
    DataModelDesignerAgent,
    SourceMappingAgent,
    DataFlowAgent,
    CertificationAgent
)
from config.config import LLM_CONFIG


class DataProductOrchestrator:
    """
    Orchestrates the flow of data between different data product design agents.
    This class coordinates the processing through the various specialized agents
    to create a comprehensive data product design.
    """

    def __init__(self):
        self.use_case_analyzer = UseCaseAnalyzerAgent()
        self.data_model_designer = DataModelDesignerAgent()
        self.source_mapping = SourceMappingAgent()
        self.data_flow = DataFlowAgent()
        self.certification = CertificationAgent()
        self.results = {}

    def process_step(self, step: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a specific step in the data product design workflow.
        
        Args:
            step: The step to process ('use_case', 'target_design', 'source_identification', 'mapping', 'certification')
            input_data: Dictionary containing the input data for this step
                
        Returns:
            Dictionary with the results of this step's processing.
        """
        if step == 'use_case':
            result = self.use_case_analyzer.process(input_data)
            self.results['use_case_analysis'] = result
            return result
            
        elif step == 'target_design':
            # Add use case analysis to the input if available
            if 'use_case_analysis' in self.results:
                input_data['use_case_analysis'] = self.results['use_case_analysis']
            result = self.data_model_designer.process(input_data)
            self.results['data_model'] = result
            return result
            
        elif step == 'source_identification':
            # Process the source identification step
            # This step is mainly about selecting source systems
            # The actual mapping happens in the next step
            return input_data
            
        elif step == 'mapping':
            # Add data model to the input if available
            if 'data_model' in self.results:
                input_data['data_model'] = self.results['data_model']
            result = self.source_mapping.process(input_data)
            self.results['source_mappings'] = result
            return result
            
        elif step == 'data_flow':
            # Add data model and source mappings to the input if available
            if 'data_model' in self.results:
                input_data['data_model'] = self.results['data_model']
            if 'source_mappings' in self.results:
                input_data['source_mappings'] = self.results['source_mappings']
            result = self.data_flow.process(input_data)
            self.results['data_flow'] = result
            return result
            
        elif step == 'certification':
            # Prepare full input with all previous results
            certification_input = {
                'use_case': self.results.get('use_case_analysis', {}),
                'data_model': self.results.get('data_model', {}),
                'source_mappings': self.results.get('source_mappings', {}),
                'data_flow': self.results.get('data_flow', {})
            }
            result = self.certification.process(certification_input)
            self.results['certification'] = result
            return result
            
        else:
            return {"error": f"Unknown step: {step}"}

    def get_final_design(self) -> Dict[str, Any]:
        """
        Get the complete data product design with all components.
        
        Returns:
            Dictionary with the complete data product design.
        """
        return {
            "use_case_analysis": self.results.get('use_case_analysis', {}),
            "data_model": self.results.get('data_model', {}),
            "source_mappings": self.results.get('source_mappings', {}),
            "data_flow": self.results.get('data_flow', {}),
            "certification": self.results.get('certification', {})
        }
        
    def reset(self) -> None:
        """Reset the orchestrator state."""
        self.results = {} 