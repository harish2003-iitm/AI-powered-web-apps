import uvicorn
import logging
from src.api.api import app
from config.config import API_CONFIG, SYSTEM_CONFIG


# Configure logging
logging.basicConfig(
    level=getattr(logging, SYSTEM_CONFIG["log_level"]),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lightspeed")


def main():
    """Run the Lightspeed API server."""
    logger.info("Starting Lightspeed API server")
    
    uvicorn.run(
        "src.api.api:app",
        host=API_CONFIG["host"],
        port=API_CONFIG["port"],
        reload=API_CONFIG["debug"]
    )


if __name__ == "__main__":
    main() 