"""
Task API endpoints using PostgreSQL database.
All endpoints protected - require authentication.
"""

from fastapi import APIRouter, status, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    TaskStatus,
    TaskPriority
)
from app.db.database import get_db
from app.db.repositories.task_repository import TaskRepository
from app.core.dependencies import get_current_active_user  
from app.models.user import User  

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={
        401: {"description": "Not authenticated"},
        404: {"description": "Task not found"},
    }
)


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task"
)
async def create_task(
    task: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> TaskResponse:
    """Create a new task. Requires authentication."""
    repo = TaskRepository(db)
    db_task = await repo.create(task, current_user.id)  # ← Pass user_id
    return TaskResponse.model_validate(db_task)


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    is_urgent: Optional[bool] = Query(None),
    is_important: Optional[bool] = Query(None),
    category_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> TaskListResponse:
    """Get all tasks with filtering and pagination."""
    repo = TaskRepository(db)
    tasks, total = await repo.get_all(
        user_id=current_user.id,  # ← Pass user_id
        skip=skip,
        limit=limit,
        status=status_filter,
        is_urgent=is_urgent,
        is_important=is_important,
        category_id=category_id
    )
    return TaskListResponse(
        total=total,
        tasks=[TaskResponse.model_validate(task) for task in tasks]
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> TaskResponse:
    """Update a task."""
    repo = TaskRepository(db)
    db_task = await repo.update(task_id, current_user.id, task_update)  # ← Pass user_id
    return TaskResponse.model_validate(db_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """Delete a task."""
    repo = TaskRepository(db)
    deleted = await repo.delete(task_id, current_user.id)  # ← Pass user_id
    if not deleted:
        from app.core.exceptions import TaskNotFoundException
        raise TaskNotFoundException(task_id)


@router.get("/stats/summary")
async def get_task_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get task statistics."""
    repo = TaskRepository(db)
    return await repo.get_stats(current_user.id)  # ← Pass user_id


