"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import get_settings
from .auth import router as auth_router
from .data import router as data_router
from .refacturation import router as refacturation_router
from .optimisation import router as optimisation_router
from .simulateur import router as simulateur_router

settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="API for Energy Optimization and Billing Analysis",
    version="1.0.0",
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(data_router.router)
app.include_router(refacturation_router.router)
app.include_router(optimisation_router.router)
app.include_router(simulateur_router.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Energy Optimization API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
