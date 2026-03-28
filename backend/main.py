"""
NUST Social/NUST Life Hub - Main Application Entry Point
Purpose: Initialize FastAPI application, register routes, configure middleware, and run server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import APP_TITLE, APP_VERSION, APP_DESCRIPTION
from database import db
from routes import api_router

# Initialize FastAPI app
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
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

# Startup event - Connect to database
@app.on_event("startup")
async def startup():
    print("🚀 Starting up...")
    db.connect()

# Shutdown event - Disconnect from database
@app.on_event("shutdown")
async def shutdown():
    print("🛑 Shutting down...")
    db.disconnect()

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