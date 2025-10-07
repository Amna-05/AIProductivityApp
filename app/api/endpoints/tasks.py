"""
Task API endpoints using PostgreSQL database.
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

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={
        404: {"description": "Task not found"},
        409: {"description": "Task already exists"},
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
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Create a new task in the database."""
    repo = TaskRepository(db)
    db_task = await repo.create(task)
    return TaskResponse.model_validate(db_task)


@router.get(
    "",
    response_model=TaskListResponse,
    summary="Get all tasks"
)
async def get_tasks(
    status_filter: Optional[TaskStatus] = Query(None, alias="status"),
    priority: Optional[TaskPriority] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
) -> TaskListResponse:
    """Get all tasks with filtering and pagination."""
    repo = TaskRepository(db)
    tasks, total = await repo.get_all(
        skip=skip,
        limit=limit,
        status=status_filter,
        priority=priority
    )
    return TaskListResponse(
        total=total,
        tasks=[TaskResponse.model_validate(task) for task in tasks]
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a specific task"
)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Get task by ID."""
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id)
    if not task:
        from app.core.exceptions import TaskNotFoundException
        raise TaskNotFoundException(task_id)
    return TaskResponse.model_validate(task)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task"
)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    """Update a task."""
    repo = TaskRepository(db)
    db_task = await repo.update(task_id, task_update)
    return TaskResponse.model_validate(db_task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task"
)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete a task."""
    repo = TaskRepository(db)
    deleted = await repo.delete(task_id)
    if not deleted:
        from app.core.exceptions import TaskNotFoundException
        raise TaskNotFoundException(task_id)


@router.get(
    "/stats/summary",
    summary="Get task statistics"
)
async def get_task_stats(db: AsyncSession = Depends(get_db)):
    """Get task statistics."""
    repo = TaskRepository(db)
    return await repo.get_stats()