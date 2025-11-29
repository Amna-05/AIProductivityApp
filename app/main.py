from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import TaskAPIException
from app.api.endpoints import tasks, auth
from app.db.database import Base, engine

# Import ALL models so they register with Base
from app.models.task import Task
from app.models.user import User
from app.models.refresh_token import RefreshToken


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events - startup and shutdown.
    """
    # Startup
    print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"📚 Documentation: http://localhost:8000/docs")
    
    # Create all database tables
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
    description="A production-ready Task Management API with JWT Authentication",
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
    """Global handler for TaskAPIException."""
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
    auth.router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    tasks.router,
    prefix=settings.API_V1_PREFIX,
)
@app.get("/")
async def root():
    return {"message": "Welcome to the Task Manager API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }