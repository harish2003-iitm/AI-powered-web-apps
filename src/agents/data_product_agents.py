from typing import Dict, Any, List
import json

from src.agents.base_agent import BaseAgent
from config.config import AGENT_CONFIG


class UseCaseAnalyzerAgent(BaseAgent):
    """Agent that analyzes business requirements and extracts key data product specifications."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["use_case_analyzer"]["name"],
            description=AGENT_CONFIG["use_case_analyzer"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for use case analysis."""
        
        usecase_template = """
        You are an AI assistant specialized in analyzing business requirements for data products.
        Your task is to extract key information from the provided business use case description
        and identify essential data product specifications.

        Business Use Case:
        {use_case_description}

        Business Stakeholders:
        {stakeholders}

        Please provide your analysis in the following JSON format:
        ```json
        {{
            "use_case_title": "A concise title for the use case",
            "business_requirements": ["Requirement 1", "Requirement 2", "..."],
            "target_users": ["User type 1", "User type 2", "..."],
            "data_requirements": ["Data requirement 1", "Data requirement 2", "..."],
            "success_criteria": ["Success criterion 1", "Success criterion 2", "..."],
            "priority": "high/medium/low",
            "complexity": "high/medium/low"
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="use_case_analyzer_chain",
            prompt_template=usecase_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process business requirements to extract key data product specifications.
        
        Args:
            input_data: Dictionary containing the use case information
                - use_case_description: The business use case description
                - stakeholders: Information about business stakeholders
                
        Returns:
            Dictionary with the use case analysis results.
        """
        chain_input = {
            "use_case_description": input_data.get("use_case_description", ""),
            "stakeholders": input_data.get("stakeholders", "")
        }
        
        try:
            result = self.chains["use_case_analyzer_chain"].run(chain_input)
            # We're using a more flexible parsing approach here
            return self.extract_json_from_text(result)
        except Exception as e:
            return {
                "error": f"Failed to analyze use case: {str(e)}",
                "use_case_title": "Error in use case analysis",
                "business_requirements": [],
                "target_users": [],
                "data_requirements": [],
                "success_criteria": [],
                "priority": "medium",
                "complexity": "medium"
            }


class DataModelDesignerAgent(BaseAgent):
    """Agent that designs optimal data structures based on business requirements and use cases."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["data_model_designer"]["name"],
            description=AGENT_CONFIG["data_model_designer"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for data model design."""
        
        data_model_template = """
        You are an AI assistant specialized in designing data models for enterprise data products.
        Your task is to create an optimal data structure based on the analyzed use case and data requirements.

        Use Case Analysis:
        {use_case_analysis}

        Please design a data model and provide your output in the following JSON format:
        ```json
        {{
            "data_product_name": "Name of the data product",
            "description": "Description of the data product",
            "target_attributes": [
                {{
                    "name": "attribute_name",
                    "description": "Description of this attribute",
                    "data_type": "string/int/float/date/boolean/etc",
                    "is_key": true/false,
                    "example_values": ["example1", "example2"]
                }},
                // more attributes...
            ],
            "relationships": [
                {{
                    "from_attribute": "attribute_name",
                    "to_entity": "entity_name",
                    "to_attribute": "attribute_name",
                    "relationship_type": "one-to-one/one-to-many/many-to-many"
                }},
                // more relationships...
            ],
            "data_quality_rules": [
                "rule 1",
                "rule 2"
                // more rules...
            ]
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="data_model_designer_chain",
            prompt_template=data_model_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process use case analysis to design an optimal data model.
        
        Args:
            input_data: Dictionary containing the use case analysis
                - use_case_analysis: The analysis from the use case analyzer agent
                
        Returns:
            Dictionary with the data model design.
        """
        chain_input = {
            "use_case_analysis": json.dumps(input_data.get("use_case_analysis", {}))
        }
        
        try:
            result = self.chains["data_model_designer_chain"].run(chain_input)
            return self.extract_json_from_text(result)
        except Exception as e:
            return {
                "error": f"Failed to design data model: {str(e)}",
                "data_product_name": "Error in data model design",
                "description": "An error occurred during data model design",
                "target_attributes": [],
                "relationships": [],
                "data_quality_rules": []
            }


class SourceMappingAgent(BaseAgent):
    """Agent that identifies and maps source systems and attributes to target data models."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["source_mapping"]["name"],
            description=AGENT_CONFIG["source_mapping"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for source mapping."""
        
        source_mapping_template = """
        You are an AI assistant specialized in mapping source systems and attributes to target data models.
        Your task is to identify the best sources for each target attribute and define transformation logic where needed.

        Target Data Model:
        {data_model}

        Available Source Systems:
        {source_systems}

        Please provide your mapping output in the following JSON format:
        ```json
        {{
            "attribute_mappings": [
                {{
                    "target_attribute": "target_attribute_name",
                    "source_system": "source_system_name",
                    "source_attribute": "source_attribute_name",
                    "mapping_type": "direct/transformation",
                    "transformation_logic": "SQL or transformation expression if needed",
                    "confidence": 0.95
                }},
                // more mappings...
            ],
            "unmapped_attributes": [
                "attribute1", "attribute2", "..."
            ],
            "recommended_sources": [
                {{
                    "target_attribute": "unmapped_attribute_name",
                    "potential_sources": [
                        "potential_source1", "potential_source2", "..."
                    ]
                }},
                // more recommendations...
            ]
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="source_mapping_chain",
            prompt_template=source_mapping_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process data model and available sources to create attribute mappings.
        
        Args:
            input_data: Dictionary containing the data model and source systems
                - data_model: The target data model design
                - source_systems: Available source systems and their attributes
                
        Returns:
            Dictionary with the source mappings.
        """
        chain_input = {
            "data_model": json.dumps(input_data.get("data_model", {})),
            "source_systems": json.dumps(input_data.get("source_systems", []))
        }
        
        try:
            result = self.chains["source_mapping_chain"].run(chain_input)
            return self.extract_json_from_text(result)
        except Exception as e:
            return {
                "error": f"Failed to create source mappings: {str(e)}",
                "attribute_mappings": [],
                "unmapped_attributes": [],
                "recommended_sources": []
            }


class DataFlowAgent(BaseAgent):
    """Agent that designs ingress and egress processes for the data product."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["data_flow"]["name"],
            description=AGENT_CONFIG["data_flow"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for data flow design."""
        
        data_flow_template = """
        You are an AI assistant specialized in designing data flow processes for data products.
        Your task is to create optimal ingress (data loading) and egress (data access) processes 
        based on the data model and source mappings.

        Data Model:
        {data_model}

        Source Mappings:
        {source_mappings}

        Please provide your data flow design in the following JSON format:
        ```json
        {{
            "ingress_process": {{
                "approach": "batch/streaming/hybrid",
                "frequency": "daily/hourly/real-time/etc",
                "pipeline_steps": [
                    "step 1",
                    "step 2",
                    "..."
                ],
                "technologies": ["tech1", "tech2", "..."],
                "error_handling": "Description of error handling approach"
            }},
            "data_store": {{
                "type": "data lake/data warehouse/database/etc",
                "structure": "Description of the storage structure",
                "partitioning": "Description of partitioning strategy",
                "access_controls": "Description of access control requirements"
            }},
            "egress_process": {{
                "access_patterns": ["pattern1", "pattern2", "..."],
                "api_design": "Description of API design if applicable",
                "cacheable": true/false,
                "performance_considerations": "Description of performance considerations"
            }},
            "search_approach": "Description of search and discovery strategy",
            "monitoring": ["metric1", "metric2", "..."]
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="data_flow_chain",
            prompt_template=data_flow_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process data model and source mappings to design data flows.
        
        Args:
            input_data: Dictionary containing the data model and source mappings
                - data_model: The target data model design
                - source_mappings: The source to target attribute mappings
                
        Returns:
            Dictionary with the data flow design.
        """
        chain_input = {
            "data_model": json.dumps(input_data.get("data_model", {})),
            "source_mappings": json.dumps(input_data.get("source_mappings", {}))
        }
        
        try:
            result = self.chains["data_flow_chain"].run(chain_input)
            return self.extract_json_from_text(result)
        except Exception as e:
            return {
                "error": f"Failed to design data flow: {str(e)}",
                "ingress_process": {
                    "approach": "batch",
                    "frequency": "daily",
                    "pipeline_steps": ["Extract", "Transform", "Load"],
                    "technologies": [],
                    "error_handling": "Basic retry mechanism"
                },
                "data_store": {
                    "type": "data warehouse",
                    "structure": "Star schema",
                    "partitioning": "None",
                    "access_controls": "Role-based access control"
                },
                "egress_process": {
                    "access_patterns": ["API access"],
                    "api_design": "REST API",
                    "cacheable": True,
                    "performance_considerations": "None"
                },
                "search_approach": "Basic keyword search",
                "monitoring": ["Availability", "Latency", "Error rate"]
            }


class CertificationAgent(BaseAgent):
    """Agent that validates data products against quality standards and requirements."""

    def __init__(self):
        super().__init__(
            name=AGENT_CONFIG["certification"]["name"],
            description=AGENT_CONFIG["certification"]["description"]
        )
        self._setup_chains()

    def _setup_chains(self):
        """Set up the chains needed for data product certification."""
        
        certification_template = """
        You are an AI assistant specialized in certifying data products against quality standards and requirements.
        Your task is to review the complete data product design and provide certification assessment.

        Original Use Case:
        {use_case}

        Data Model:
        {data_model}

        Source Mappings:
        {source_mappings}

        Data Flow Design:
        {data_flow}

        Certification Standards to Check:
        - Completeness: Does the data product fulfill all business requirements?
        - Data Quality: Are appropriate data quality rules defined?
        - Security & Privacy: Are access controls and privacy considerations addressed?
        - Performance: Will the design meet performance requirements?
        - Maintainability: Is the design maintainable and documented?
        - Technology Fit: Are the proposed technologies appropriate?

        Please provide your certification assessment in the following JSON format:
        ```json
        {{
            "certification_status": "certified/conditional/rejected",
            "scoring": {{
                "completeness": 0-100,
                "data_quality": 0-100,
                "security_privacy": 0-100,
                "performance": 0-100,
                "maintainability": 0-100,
                "technology_fit": 0-100,
                "overall": 0-100
            }},
            "strengths": [
                "strength 1",
                "strength 2",
                "..."
            ],
            "weaknesses": [
                "weakness 1",
                "weakness 2",
                "..."
            ],
            "recommendations": [
                "recommendation 1",
                "recommendation 2",
                "..."
            ],
            "certification_notes": "Additional certification notes"
        }}
        ```
        
        Return only the JSON object with no other text before or after.
        """
        
        self.create_chain(
            chain_name="certification_chain",
            prompt_template=certification_template
        )

    def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process complete data product design for certification.
        
        Args:
            input_data: Dictionary containing the complete data product design
                - use_case: The original use case analysis
                - data_model: The target data model design
                - source_mappings: The source to target attribute mappings
                - data_flow: The data flow design
                
        Returns:
            Dictionary with the certification results.
        """
        chain_input = {
            "use_case": json.dumps(input_data.get("use_case", {})),
            "data_model": json.dumps(input_data.get("data_model", {})),
            "source_mappings": json.dumps(input_data.get("source_mappings", {})),
            "data_flow": json.dumps(input_data.get("data_flow", {}))
        }
        
        try:
            result = self.chains["certification_chain"].run(chain_input)
            return self.extract_json_from_text(result)
        except Exception as e:
            return {
                "error": f"Failed to certify data product: {str(e)}",
                "certification_status": "rejected",
                "scoring": {
                    "completeness": 0,
                    "data_quality": 0,
                    "security_privacy": 0,
                    "performance": 0,
                    "maintainability": 0,
                    "technology_fit": 0,
                    "overall": 0
                },
                "strengths": [],
                "weaknesses": ["Certification process failed"],
                "recommendations": ["Review and fix the data product design"],
                "certification_notes": f"Error during certification: {str(e)}"
            } 