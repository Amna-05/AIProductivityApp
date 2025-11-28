from fastapi import FastAPI, HTTPException ,Request, status
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import TaskAPIException
from app.api.endpoints import tasks
from app.db.database import Base, engine 
from app.models.task import Task 

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events - startup and shutdown.
    
    Best Practice: Use for:
    - Database connection pooling
    - Cache initialization
    - Background tasks
    """
    # Startup
    print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"📚 Documentation: http://localhost:8000/docs")
    yield
    # Shutdown
    print("👋 Shutting down gracefully...")
    print("📊 Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down gracefully...")
    await engine.dispose()



# Create FastAPI instance
app = FastAPI(
     title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="A production-ready Task Management API built with FastAPI",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)



# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handler
@app.exception_handler(TaskAPIException)
async def task_exception_handler(request: Request, exc: TaskAPIException):
    """
    Global handler for TaskAPIException.
    
    Returns consistent error format:
    {
        "error": "Error type",
        "detail": "Error message",
        "path": "Request path"
    }
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "detail": exc.detail,
            "path": str(request.url)
        }
    )

# Include routers
app.include_router(
    tasks.router,
    prefix=settings.API_V1_PREFIX,
)
