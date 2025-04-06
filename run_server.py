import os
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lightspeed")

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# Delete existing database if it exists (for testing)
if os.path.exists("data/lightspeed.db"):
    try:
        os.remove("data/lightspeed.db")
        logger.info("Removed existing database file")
    except Exception as e:
        logger.error(f"Failed to remove database file: {e}")

# Start the server
logger.info("Starting Lightspeed API server")
uvicorn.run(
    "src.api.api:app",
    host="127.0.0.1",
    port=8001,
    log_level="info",
) 