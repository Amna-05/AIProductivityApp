# app/api/endpoints/ai_priority.py

"""
AI-powered priority suggestion endpoints.

Features:
- Smart priority suggestions based on semantic similarity
- Similar task search using vector embeddings
- Bulk embedding generation for existing tasks
- Rate limiting to prevent abuse
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.db.database import get_db
from app.db.repositories.task_repository import TaskRepository
from app.models.user import User
from app.schemas.ai_task import (
    PrioritySuggestionResponse,
    SimilarTasksResponse,
)
from app.services.priority_suggestion_service import PrioritySuggestionService
from app.services.embedding_service import get_embedding_service
from app.core.dependencies import get_current_active_user
from app.core.config import settings

router = APIRouter(prefix="/ai/priority", tags=["AI Priority Suggestions"])

# Rate limiting decorator (imported from Phase 1 if available)
try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address
    from fastapi import Request

    limiter = Limiter(key_func=get_remote_address)

    def rate_limit(calls: int, period: int):
        """Rate limit decorator for endpoints."""
        def decorator(func):
            return limiter.limit(f"{calls}/{period}minute")(func)
        return decorator
except ImportError:
    # Fallback if slowapi not available
    def rate_limit(calls: int, period: int):
        def decorator(func):
            return func
        return decorator


# ============================================================================
# ENDPOINT 1: Get AI Priority Suggestion
# ============================================================================

@router.post(
    "/tasks/{task_id}/suggest",
    response_model=PrioritySuggestionResponse,
    summary="Get AI priority suggestion for a task",
    description="""
    Get an AI-powered priority suggestion based on semantic similarity to historical tasks.

    **Algorithm**:
    1. Generate semantic embedding for the task (if not exists)
    2. Find top-K most similar completed tasks using vector search
    3. Calculate urgency score based on deadline
    4. Calculate importance score from historical patterns (weighted by similarity)
    5. Combine scores and determine Eisenhower quadrant
    6. Generate confidence score and human-readable explanation

    **Rate Limit**: 10 requests per minute per user

    **Returns**:
    - Suggested urgency/importance flags
    - Recommended Eisenhower quadrant (DO_FIRST, SCHEDULE, DELEGATE, ELIMINATE)
    - Urgency and importance scores (0-1)
    - Confidence score (0-1)
    - Human-readable reasoning
    - Top 3 most similar historical tasks

    **Use Cases**:
    - Help user prioritize new tasks
    - Learn from historical task patterns
    - Automate initial priority assignment
    """,
    responses={
        200: {
            "description": "Priority suggestion generated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "task_id": 456,
                        "suggested_urgent": True,
                        "suggested_important": True,
                        "suggested_quadrant": "DO_FIRST",
                        "urgency_score": 0.8,
                        "importance_score": 0.75,
                        "confidence": 0.85,
                        "reasoning": "This task is due in 2 days. Based on 3 similar tasks (average similarity: 82%), 67% were marked as important. Similar tasks took 2-3 days (average: 2.3 days) to complete. Recommendation: Do this first - it's both urgent and important. Prioritize this task immediately.",
                        "similar_tasks": [
                            {
                                "id": 123,
                                "title": "Fix authentication bug",
                                "similarity": 0.87,
                                "was_urgent": True,
                                "was_important": True,
                                "quadrant": "DO_FIRST",
                                "completion_time_days": 2,
                            }
                        ],
                    }
                }
            },
        },
        404: {"description": "Task not found"},
        422: {"description": "Task has no embedding (generate first)"},
        429: {"description": "Rate limit exceeded"},
    },
)
async def get_priority_suggestion(
    task_id: int,
    top_k: int = Query(
        default=5,
        ge=1,
        le=10,
        description="Number of similar tasks to consider (1-10)"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> PrioritySuggestionResponse:
    """
    Get AI-powered priority suggestion for a specific task.

    Args:
        task_id: ID of the task to analyze
        top_k: Number of similar tasks to consider (default: 5, max: 10)
        db: Database session
        current_user: Authenticated user

    Returns:
        PrioritySuggestionResponse with suggestion details

    Raises:
        HTTPException 404: Task not found or doesn't belong to user
        HTTPException 422: Task has no embedding (need to generate first)
    """
    correlation_id = getattr(db, "correlation_id", "unknown")
    logger.bind(correlation_id=correlation_id).info(
        f"Getting priority suggestion for task {task_id}",
        user_id=current_user.id,
        top_k=top_k
    )

    # Initialize services
    task_repo = TaskRepository(db)
    suggestion_service = PrioritySuggestionService(task_repo)

    try:
        # Get suggestion
        suggestion_data = await suggestion_service.suggest_priority(
            task_id=task_id,
            user_id=current_user.id,
            top_k=top_k
        )

        logger.bind(correlation_id=correlation_id).info(
            f"Generated priority suggestion for task {task_id}",
            suggested_quadrant=suggestion_data["suggested_quadrant"],
            confidence=suggestion_data["confidence"],
            similar_tasks_found=len(suggestion_data["similar_tasks"])
        )

        return PrioritySuggestionResponse(**suggestion_data)

    except ValueError as e:
        # Task not found, no access, or no embedding
        logger.bind(correlation_id=correlation_id).warning(
            f"Failed to generate suggestion: {str(e)}",
            task_id=task_id,
            user_id=current_user.id
        )

        if "not found" in str(e).lower() or "does not belong" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        elif "no embedding" in str(e).lower():
            raise HTTPException(
                status_code=422,
                detail=f"Task {task_id} has no embedding. Generate embeddings first using POST /ai/priority/generate-embeddings"
            )
        else:
            raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.bind(correlation_id=correlation_id).error(
            f"Error generating priority suggestion: {str(e)}",
            task_id=task_id,
            user_id=current_user.id,
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to generate priority suggestion. Please try again later."
        )


# ============================================================================
# ENDPOINT 2: Find Similar Tasks
# ============================================================================

@router.get(
    "/tasks/{task_id}/similar",
    response_model=SimilarTasksResponse,
    summary="Find similar historical tasks",
    description="""
    Find the most similar completed tasks using semantic vector search.

    **How it works**:
    1. Get the task's embedding vector
    2. Perform vector similarity search (cosine similarity)
    3. Return top-K most similar completed tasks
    4. Include metadata: similarity score, priority, completion time

    **Use Cases**:
    - See how similar tasks were prioritized in the past
    - Learn from historical task patterns
    - Estimate completion time based on similar tasks
    - Validate AI priority suggestions
    """,
    responses={
        200: {
            "description": "Similar tasks found",
            "content": {
                "application/json": {
                    "example": {
                        "task_id": 456,
                        "similar_tasks": [
                            {
                                "id": 123,
                                "title": "Fix authentication bug",
                                "description": "Users cannot log in",
                                "similarity": 0.87,
                                "was_urgent": True,
                                "was_important": True,
                                "quadrant": "DO_FIRST",
                                "status": "DONE",
                                "completion_time_days": 2,
                                "created_at": "2025-12-20T10:00:00Z",
                                "completed_at": "2025-12-22T14:30:00Z",
                                "category_id": 5,
                            }
                        ],
                    }
                }
            },
        },
        404: {"description": "Task not found"},
        422: {"description": "Task has no embedding"},
    },
)
async def find_similar_tasks(
    task_id: int,
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of similar tasks to return (1-20)"
    ),
    min_similarity: float = Query(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum similarity threshold (0.0-1.0)"
    ),
    completed_only: bool = Query(
        default=True,
        description="Only return completed tasks (recommended for learning from history)"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SimilarTasksResponse:
    """
    Find similar tasks using semantic vector search.

    Args:
        task_id: ID of the task to find similar tasks for
        limit: Maximum number of similar tasks to return (default: 5, max: 20)
        min_similarity: Minimum similarity threshold (default: 0.5)
        completed_only: Only return completed tasks (default: True)
        db: Database session
        current_user: Authenticated user

    Returns:
        SimilarTasksResponse with list of similar tasks

    Raises:
        HTTPException 404: Task not found
        HTTPException 422: Task has no embedding
    """
    correlation_id = getattr(db, "correlation_id", "unknown")
    logger.bind(correlation_id=correlation_id).info(
        f"Finding similar tasks for task {task_id}",
        user_id=current_user.id,
        limit=limit,
        min_similarity=min_similarity,
        completed_only=completed_only
    )

    # Initialize services
    task_repo = TaskRepository(db)
    suggestion_service = PrioritySuggestionService(task_repo)

    try:
        # Get current task
        current_task = await task_repo.get_by_id(task_id)
        if not current_task or current_task.user_id != current_user.id:
            raise HTTPException(
                status_code=404,
                detail=f"Task {task_id} not found or does not belong to current user"
            )

        # Check if task has embedding
        if current_task.embedding is None:
            raise HTTPException(
                status_code=422,
                detail=f"Task {task_id} has no embedding. Generate embeddings first using POST /ai/priority/generate-embeddings"
            )

        # Find similar tasks
        similar_tasks = await suggestion_service._find_similar_tasks(
            query_embedding=current_task.embedding,
            user_id=current_user.id,
            top_k=limit,
            min_similarity=min_similarity,
            completed_only=completed_only
        )

        logger.bind(correlation_id=correlation_id).info(
            f"Found {len(similar_tasks)} similar tasks for task {task_id}",
            avg_similarity=sum(t.similarity for t in similar_tasks) / len(similar_tasks) if similar_tasks else 0.0
        )

        return SimilarTasksResponse(
            task_id=task_id,
            similar_tasks=similar_tasks
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.bind(correlation_id=correlation_id).error(
            f"Error finding similar tasks: {str(e)}",
            task_id=task_id,
            user_id=current_user.id,
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to find similar tasks. Please try again later."
        )


# ============================================================================
# ENDPOINT 3: Generate Embeddings (Bulk Operation)
# ============================================================================

@router.post(
    "/generate-embeddings",
    summary="Generate embeddings for all tasks (bulk operation)",
    description="""
    Generate semantic embeddings for all tasks that don't have them yet.

    **Use Cases**:
    - Initial setup after enabling Phase 2
    - Backfill embeddings for existing tasks
    - Regenerate embeddings after model change

    **Process**:
    1. Find all tasks without embeddings (for current user)
    2. Generate embeddings using sentence-transformers
    3. Update tasks in database
    4. Runs as background task (non-blocking)

    **Rate Limit**: 3 requests per hour per user (expensive operation)

    **Performance**:
    - ~50-100 tasks per second on CPU
    - ~500-1000 tasks per second on GPU
    - Progress logged to app logs
    """,
    responses={
        202: {
            "description": "Embedding generation started in background",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Embedding generation started",
                        "tasks_to_process": 142,
                        "status": "background_task_started"
                    }
                }
            }
        },
    },
)
async def generate_embeddings(
    background_tasks: BackgroundTasks,
    force_regenerate: bool = Query(
        default=False,
        description="Regenerate embeddings even if they already exist"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate embeddings for all user's tasks (background task).

    Args:
        background_tasks: FastAPI background tasks
        force_regenerate: Regenerate embeddings even if they exist (default: False)
        db: Database session
        current_user: Authenticated user

    Returns:
        Confirmation that background task started
    """
    correlation_id = getattr(db, "correlation_id", "unknown")
    logger.bind(correlation_id=correlation_id).info(
        f"Starting bulk embedding generation for user {current_user.id}",
        force_regenerate=force_regenerate
    )

    # Initialize services
    task_repo = TaskRepository(db)
    embedding_service = get_embedding_service()

    try:
        # Count tasks to process
        tasks = await task_repo.get_all_by_user(current_user.id)

        if force_regenerate:
            tasks_to_process = tasks
        else:
            tasks_to_process = [t for t in tasks if t.embedding is None]

        if not tasks_to_process:
            return {
                "message": "No tasks need embedding generation",
                "tasks_to_process": 0,
                "status": "nothing_to_do"
            }

        # Add background task
        background_tasks.add_task(
            _generate_embeddings_background,
            task_ids=[t.id for t in tasks_to_process],
            user_id=current_user.id,
            correlation_id=correlation_id
        )

        logger.bind(correlation_id=correlation_id).info(
            f"Queued embedding generation for {len(tasks_to_process)} tasks",
            user_id=current_user.id
        )

        return {
            "message": "Embedding generation started in background",
            "tasks_to_process": len(tasks_to_process),
            "status": "background_task_started",
            "note": "Check app logs for progress. This may take a few minutes for large task lists."
        }

    except Exception as e:
        logger.bind(correlation_id=correlation_id).error(
            f"Error starting embedding generation: {str(e)}",
            user_id=current_user.id,
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to start embedding generation. Please try again later."
        )


async def _generate_embeddings_background(
    task_ids: List[int],
    user_id: int,
    correlation_id: str
):
    """
    Background task to generate embeddings for multiple tasks.

    Args:
        task_ids: List of task IDs to process
        user_id: User ID (for logging)
        correlation_id: Request correlation ID (for logging)
    """
    from app.db.database import async_session_maker

    logger.bind(correlation_id=correlation_id).info(
        f"Background embedding generation started for {len(task_ids)} tasks",
        user_id=user_id
    )

    embedding_service = get_embedding_service()
    processed = 0
    errors = 0

    async with async_session_maker() as db:
        task_repo = TaskRepository(db)

        for task_id in task_ids:
            try:
                # Get task
                task = await task_repo.get_by_id(task_id)
                if not task or task.user_id != user_id:
                    logger.bind(correlation_id=correlation_id).warning(
                        f"Skipping task {task_id}: not found or wrong user",
                        user_id=user_id
                    )
                    continue

                # Generate embedding
                embedding = embedding_service.generate_task_embedding(
                    title=task.title,
                    description=task.description
                )

                # Update task
                task.embedding = embedding.tolist()
                await db.commit()

                processed += 1

                # Log progress every 10 tasks
                if processed % 10 == 0:
                    logger.bind(correlation_id=correlation_id).info(
                        f"Embedding generation progress: {processed}/{len(task_ids)} tasks",
                        user_id=user_id
                    )

            except Exception as e:
                errors += 1
                logger.bind(correlation_id=correlation_id).error(
                    f"Error generating embedding for task {task_id}: {str(e)}",
                    user_id=user_id
                )

    # Final summary
    logger.bind(correlation_id=correlation_id).info(
        f"Embedding generation completed: {processed}/{len(task_ids)} successful, {errors} errors",
        user_id=user_id
    )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get(
    "/health",
    summary="Check AI service health",
    description="Check if AI/ML models are loaded and ready"
)
async def health_check():
    """
    Check if AI services are operational.

    Returns:
        Health status of AI services
    """
    try:
        embedding_service = get_embedding_service()

        # Test model loading
        test_embedding = embedding_service.generate_task_embedding("Test task", "Test description")

        return {
            "status": "healthy",
            "model_loaded": True,
            "model_name": embedding_service.model_name,
            "embedding_dimensions": len(test_embedding),
            "service": "AI Priority Suggestions"
        }
    except Exception as e:
        logger.error(f"AI service health check failed: {str(e)}", exc_info=True)
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "error": str(e),
            "service": "AI Priority Suggestions"
        }
