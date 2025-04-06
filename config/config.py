import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# LLM Configuration
LLM_CONFIG = {
    "provider": "openai",
    "model": "gpt-4-turbo",
    "api_key": os.getenv("OPENAI_API_KEY"),
    "temperature": 0.7,
    "max_tokens": 2048,
}

# Agent Configuration
AGENT_CONFIG = {
    "summarizer": {
        "name": "Summarizer Agent",
        "description": "Analyzes customer conversations to generate concise summaries and extract actionable insights.",
    },
    "router": {
        "name": "Router Agent",
        "description": "Intelligently routes tasks to appropriate teams based on content analysis and historical patterns.",
    },
    "recommender": {
        "name": "Recommender Agent",
        "description": "Suggests resolutions by analyzing historical data and knowledge bases.",
    },
    "estimator": {
        "name": "Estimator Agent",
        "description": "Predicts resolution times and optimizes workflows to minimize delays.",
    },
    # Data Product Design Agents
    "use_case_analyzer": {
        "name": "Use Case Analyzer Agent",
        "description": "Analyzes business requirements and extracts key data product specifications.",
    },
    "data_model_designer": {
        "name": "Data Model Designer Agent",
        "description": "Designs optimal data structures based on business requirements and use cases.",
    },
    "source_mapping": {
        "name": "Source Mapping Agent",
        "description": "Identifies and maps source systems and attributes to target data models.",
    },
    "data_flow": {
        "name": "Data Flow Agent",
        "description": "Designs ingress and egress processes for the data product.",
    },
    "certification": {
        "name": "Certification Agent",
        "description": "Validates data products against quality standards and requirements.",
    },
}

# Database Configuration
DB_CONFIG = {
    "sqlite_path": os.getenv("SQLITE_PATH", "data/lightspeed.db"),
    "connect_args": {"check_same_thread": False},
}

# API Configuration
API_CONFIG = {
    "host": os.getenv("API_HOST", "0.0.0.0"),
    "port": int(os.getenv("API_PORT", 8000)),
    "debug": os.getenv("DEBUG", "False").lower() == "true",
}

# RabbitMQ Configuration
RABBITMQ_CONFIG = {
    "host": os.getenv("RABBITMQ_HOST", "localhost"),
    "port": int(os.getenv("RABBITMQ_PORT", 5672)),
    "username": os.getenv("RABBITMQ_USERNAME", "guest"),
    "password": os.getenv("RABBITMQ_PASSWORD", "guest"),
}

# System Parameters
SYSTEM_CONFIG = {
    "log_level": os.getenv("LOG_LEVEL", "INFO"),
    "default_timeout": int(os.getenv("DEFAULT_TIMEOUT", 30)),
} 