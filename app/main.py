from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger

from app.core.config import settings
from app.core.exceptions import TaskAPIException
from app.core.logging_config import setup_logging, setup_sentry
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.error_handler import (
    global_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    custom_api_exception_handler,
)
from app.api.endpoints import tasks, auth, categories, tags, task_views, ai_tasks, analytics, admin
from app.db.database import Base, engine

# Import ALL models so they register with Base
from app.models.task import Task
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.category import Category
from app.models.tag import Tag


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events - startup and shutdown.

    Handles:
    - Logging initialization
    - Sentry setup for error tracking
    - Database connection management
    """
    # Setup logging FIRST (before any other operations)
    setup_logging(
        debug=settings.DEBUG,
        log_level=settings.LOG_LEVEL
    )

    # Setup error tracking
    setup_sentry(
        sentry_dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        version=settings.VERSION
    )

    # Log startup (avoid emojis for Windows console compatibility)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Documentation: http://localhost:8000/docs")
    logger.info("Database migrations managed by Alembic")
    logger.info("Run 'alembic upgrade head' to apply migrations")

    yield

    # Shutdown
    logger.info("Shutting down gracefully...")
    await engine.dispose()
    logger.info("Database connections closed successfully")


# Create FastAPI instance
app = FastAPI(
    version=settings.VERSION,
    title=settings.PROJECT_NAME,
    description="""
# Productivity App API with AI-Powered Features

A production-ready task management system featuring:

## Core Features
- **Task Management**: Full CRUD operations with Eisenhower Priority Matrix
- **Authentication**: Secure JWT-based auth with httpOnly cookies
- **Categories & Tags**: Organize tasks with custom categories and tags

## AI-Powered Features
- **Natural Language Processing**: Create tasks from voice or text input
- **Smart Task Parsing**: AI-powered task creation with Groq
- **Voice Input**: Speech-to-text task creation

## Production Features
- **Structured Logging**: Request tracing with correlation IDs
- **Error Tracking**: Sentry integration for production monitoring
- **Rate Limiting**: Protect against abuse
- **Comprehensive Testing**: 80%+ test coverage

## Quick Start
1. Register: `POST /api/v1/auth/register`
2. Login: `POST /api/v1/auth/login`
3. Create task: `POST /api/v1/tasks` (auto-generates embedding)
4. Get AI priority suggestion: `POST /api/v1/ai/priority/tasks/{id}/suggest`
5. Find similar tasks: `GET /api/v1/ai/priority/tasks/{id}/similar`
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
    contact={
        "name": "API Support",
        "url": "https://github.com/ Amna-05/AI-Productivity-App/issues",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# =====================================================================
# MIDDLEWARE REGISTRATION (ORDER MATTERS!)
# =====================================================================

# 1. Logging Middleware (track all requests with correlation IDs)
app.add_middleware(LoggingMiddleware)

# 2. CORS Middleware (handle cross-origin requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. GZip Compression (compress responses > 1KB)
if settings.ENABLE_RESPONSE_COMPRESSION:
    app.add_middleware(GZipMiddleware, minimum_size=1000)

# =====================================================================
# EXCEPTION HANDLERS
# =====================================================================

# Handle unhandled exceptions
app.add_exception_handler(Exception, global_exception_handler)

# Handle Pydantic validation errors
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Handle database errors
app.add_exception_handler(SQLAlchemyError, database_exception_handler)

# Handle custom API exceptions
app.add_exception_handler(TaskAPIException, custom_api_exception_handler)

# Include routers
app.include_router(
    auth.router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(
    tasks.router,
    prefix=settings.API_V1_PREFIX,
)

app.include_router(categories.router, prefix=settings.API_V1_PREFIX)
app.include_router(tags.router, prefix=settings.API_V1_PREFIX)
app.include_router(task_views.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_tasks.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX) 

@app.get("/")
async def root():
    return {"message": "Welcome to the Productivity App API!"}

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }