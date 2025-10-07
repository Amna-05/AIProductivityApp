from fastapi import FastAPI, HTTPException ,Request, status
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import TaskAPIException
from app.api.endpoints import tasks

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



# Pydantic Model - This validates incoming data!
class Task(BaseModel):
    """
    Data model for a Task
    
    Why Pydantic?
    - Automatic validation (FastAPI checks the data)
    - Type safety (catches bugs early)
    - Auto-generates API docs
    """
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    completed: bool = False


# In-memory storage (we'll replace this with a database later)
tasks_db: List[Task] = []
next_id = 1
# Our first endpoint (route)
# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root endpoint with basic info."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    
    Used by:
    - Load balancers
    - Monitoring systems
    - Container orchestrators (Kubernetes)
    """
    return {
        "status": "healthy",
        "version": settings.VERSION
    }


# CREATE - Add new task
@app.post("/tasks", response_model=Task)
def create_task(task: Task):
    """
    Create a new task
    
    FastAPI automatically:
    1. Validates the request body matches Task model
    2. Converts JSON to Python object
    3. Returns error if validation fails
    """
    global next_id
    
    task.id = next_id
    next_id += 1
    tasks_db.append(task)
    
    return task


# READ - Get all tasks
@app.get("/tasks", response_model=List[Task])
def get_tasks():
    """
    Retrieve all tasks
    
    response_model=List[Task] tells FastAPI:
    - Response will be a list of Task objects
    - Validates output matches schema
    - Shows correct type in documentation
    """
    return tasks_db


# READ - Get single task by ID
@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int):
    """
    Get specific task by ID
    
    {task_id} is a path parameter
    FastAPI automatically converts string to int
    """
    for task in tasks_db:
        if task.id == task_id:
            return task
    
    # HTTP 404 - Not Found
    raise HTTPException(status_code=404, detail="Task not found")


# UPDATE - Modify a task
@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, updated_task: Task):
    """
    Update an existing task
    
    Receives:
    - task_id from URL path
    - updated_task from request body
    """
    for index, task in enumerate(tasks_db):
        if task.id == task_id:
            updated_task.id = task_id
            tasks_db[index] = updated_task
            return updated_task
    
    raise HTTPException(status_code=404, detail="Task not found")


# DELETE - Remove a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    """
    Delete a task by ID
    
    Returns success message instead of deleted object
    """
    for index, task in enumerate(tasks_db):
        if task.id == task_id:
            tasks_db.pop(index)
            return {"message": "Task deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Task not found")



"""
FastAPI application entry point.

Best Practices:
- Centralized configuration
- Custom exception handlers
- CORS middleware
- API versioning
- Lifespan events
"""


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