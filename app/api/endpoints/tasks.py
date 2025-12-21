"""
Task API endpoints using PostgreSQL database.
All endpoints protected - require authentication.
"""

from fastapi import APIRouter, status, Query, Depends 
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import select, or_, and_, desc, asc, func  # 🆕 FIXED IMPORT
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timedelta, timezone

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    TaskStatus,
)
from app.db.database import get_db
from app.db.repositories.task_repository import TaskRepository
from app.core.dependencies import get_current_active_user  
from app.models.user import User  
from app.models.task import Task, task_tags

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
    db_task = await repo.create(task, current_user.id)
    return TaskResponse.model_validate(db_task)


@router.get("", response_model=TaskListResponse, summary="List tasks with advanced filtering")
async def get_tasks(
    # === BASIC FILTERS ===
    status_filter: Optional[TaskStatus] = Query(None, alias="status", description="Filter by task status"),
    category_id: Optional[int] = Query(None, description="Filter by single category"),
    
    # === PRIORITY MATRIX FILTERS ===
    is_urgent: Optional[bool] = Query(None, description="Filter urgent tasks"),
    is_important: Optional[bool] = Query(None, description="Filter important tasks"),
    quadrant: Optional[str] = Query(
        None, 
        description="Filter by Eisenhower quadrant",
        pattern="^(DO_FIRST|SCHEDULE|DELEGATE|ELIMINATE)$"
    ),
    
    # === MULTIPLE FILTERS ===
    category_ids: Optional[str] = Query(None, description="Filter by multiple categories (comma-separated IDs: '1,2,3')"),
    tag_ids: Optional[str] = Query(None, description="Filter by tags (comma-separated IDs: '1,2,3')"),
    
    # === DATE FILTERS ===
    due_before: Optional[datetime] = Query(None, description="Tasks due before this date"),
    due_after: Optional[datetime] = Query(None, description="Tasks due after this date"),
    created_after: Optional[datetime] = Query(None, description="Tasks created after this date"),
    overdue_only: Optional[bool] = Query(None, description="Show only overdue tasks"),
    no_due_date: Optional[bool] = Query(None, description="Show tasks without due date"),
    
    # === COMPLETION FILTERS ===
    completed: Optional[bool] = Query(None, description="Filter completed/uncompleted tasks"),
    completed_after: Optional[datetime] = Query(None, description="Completed after this date"),
    
    # === SEARCH ===
    search: Optional[str] = Query(None, min_length=1, max_length=100, description="Search in title and description"),
    
    # === SORTING ===
    sort_by: Optional[str] = Query(
        "created_at", 
        pattern="^(created_at|updated_at|due_date|title|priority)$",
        description="Sort field"
    ),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    
    # === PAGINATION ===
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> TaskListResponse:
    """
    🔍 Advanced task filtering with multiple criteria.
    
    Examples:
    - Overdue urgent tasks: ?overdue_only=true&is_urgent=true
    - Tasks in multiple categories: ?category_ids=1,2,3
    - Search tasks: ?search=meeting
    - This week's tasks: ?due_after=2024-01-15&due_before=2024-01-21
    """
    
    # Base query
    query = select(Task).where(Task.user_id == current_user.id)
    
    # === APPLY FILTERS ===
    
    # Status filter
    if status_filter:
        query = query.where(Task.status == status_filter)
    
    # Single category
    if category_id:
        query = query.where(Task.category_id == category_id)
    
    # Multiple categories
    if category_ids:
        cat_id_list = [int(id.strip()) for id in category_ids.split(',') if id.strip()]
        if cat_id_list:
            query = query.where(Task.category_id.in_(cat_id_list))
    
    # Priority matrix
    if is_urgent is not None:
        query = query.where(Task.is_urgent == is_urgent)
    if is_important is not None:
        query = query.where(Task.is_important == is_important)
    
    # Quadrant filter
    if quadrant:
        if quadrant == "DO_FIRST":
            query = query.where(and_(Task.is_urgent == True, Task.is_important == True))
        elif quadrant == "SCHEDULE":
            query = query.where(and_(Task.is_urgent == False, Task.is_important == True))
        elif quadrant == "DELEGATE":
            query = query.where(and_(Task.is_urgent == True, Task.is_important == False))
        elif quadrant == "ELIMINATE":
            query = query.where(and_(Task.is_urgent == False, Task.is_important == False))
    
    # Date filters
    if due_before:
        query = query.where(Task.due_date <= due_before)
    if due_after:
        query = query.where(Task.due_date >= due_after)
    if created_after:
        query = query.where(Task.created_at >= created_after)
    if no_due_date:
        query = query.where(Task.due_date.is_(None))
    
    # Overdue filter
    if overdue_only:
        now = datetime.now(timezone.utc)
        query = query.where(
            and_(
                Task.due_date.isnot(None),
                Task.due_date < now,
                Task.status != TaskStatus.DONE
            )
        )
    
    # Completion filters
    if completed is not None:
        if completed:
            query = query.where(Task.status == TaskStatus.DONE)
        else:
            query = query.where(Task.status != TaskStatus.DONE)
    
    if completed_after:
        query = query.where(Task.completed_at >= completed_after)
    
    # Search in title and description
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Task.title.ilike(search_term),
                Task.description.ilike(search_term)
            )
        )
    
    # Tag filtering (Many-to-Many)
    if tag_ids:
        tag_id_list = [int(id.strip()) for id in tag_ids.split(',') if id.strip()]
        if tag_id_list:
            query = query.join(task_tags).where(task_tags.c.tag_id.in_(tag_id_list))
    
    # === SORTING ===
    if sort_by == "priority":
        query = query.order_by(
            desc(Task.is_urgent),
            desc(Task.is_important),
            desc(Task.created_at)
        )
    else:
        sort_column = getattr(Task, sort_by)
        if sort_order == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
    
    # 🆕 EAGER LOAD RELATIONSHIPS
    query = query.options(
        selectinload(Task.category),
        selectinload(Task.tags)
    )
    
    # === COUNT TOTAL (simplified) ===
    count_query = select(func.count(Task.id)).where(Task.user_id == current_user.id)
    
    if status_filter:
        count_query = count_query.where(Task.status == status_filter)
    if category_id:
        count_query = count_query.where(Task.category_id == category_id)
    if is_urgent is not None:
        count_query = count_query.where(Task.is_urgent == is_urgent)
    if is_important is not None:
        count_query = count_query.where(Task.is_important == is_important)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # === PAGINATION ===
    query = query.offset(skip).limit(limit)
    
    # Execute
    result = await db.execute(query)
    tasks = result.unique().scalars().all()  # .unique() needed for joins
    
    return TaskListResponse(
        total=total,
        tasks=[TaskResponse.model_validate(task) for task in tasks]
    )


@router.get("/{task_id}", response_model=TaskResponse, summary="Get single task")
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> TaskResponse:
    """Get task by ID."""
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, current_user.id)
    if not task:
        from app.core.exceptions import TaskNotFoundException
        raise TaskNotFoundException(task_id)
    return TaskResponse.model_validate(task)


@router.patch("/{task_id}", response_model=TaskResponse, summary="Update task")
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> TaskResponse:
    """Update a task."""
    repo = TaskRepository(db)
    db_task = await repo.update(task_id, current_user.id, task_update)
    return TaskResponse.model_validate(db_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete task")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """Delete a task."""
    repo = TaskRepository(db)
    deleted = await repo.delete(task_id, current_user.id)
    if not deleted:
        from app.core.exceptions import TaskNotFoundException
        raise TaskNotFoundException(task_id)


@router.get("/stats/summary", summary="Task statistics")
async def get_task_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get task statistics with Priority Matrix breakdown."""
    repo = TaskRepository(db)
    return await repo.get_stats(current_user.id)