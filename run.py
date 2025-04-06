#!/usr/bin/env python
"""
Lightspeed: AI-Driven Customer Support System
Run script for starting the application
"""

import os
from src.main import main

if __name__ == "__main__":
    # Create data directory if it doesn't exist
    os.makedirs("data", exist_ok=True)
    main() 