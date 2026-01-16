"""
Run script for the backend server
"""
import uvicorn
from app.init_db import init_db

if __name__ == "__main__":
    # Initialize database
    print("Initializing database...")
    init_db()

    print("\n" + "="*50)
    print("Starting FastAPI server...")
    print("="*50 + "\n")

    # Run server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
