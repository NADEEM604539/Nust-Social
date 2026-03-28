"""
NUST Social/NUST Life Hub - Main Application Entry Point
Purpose: Initialize FastAPI application, register routes, configure middleware, and run server
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import APP_TITLE, APP_VERSION, APP_DESCRIPTION
from database import db
from routes import api_router

# Lifespan context manager for startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting up...")
    db.connect()
    yield
    # Shutdown
    print("🛑 Shutting down...")
    db.disconnect()

# Initialize FastAPI app with lifespan
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware - Allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "NUST Social API is running",
        "status": "healthy"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "NUST Social Backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload= True)



# uvicorn main:app --host 0.0.0.0 --port 8000 --reload