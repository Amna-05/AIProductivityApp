"""
Task view endpoints for dashboard UX.
Convenience endpoints for commonly-used task filters.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
from enum import Enum

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskResponse, TaskListResponse, TaskStatus

router = APIRouter(
    prefix="/tasks/views",
    tags=["task-views"],
    responses={401: {"description": "Not authenticated"}}
)


class TimelinePeriod(str, Enum):
    """Timeline view periods."""
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"


@router.get("/priority-matrix", summary="Eisenhower Priority Matrix")
async def get_priority_matrix(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    🎯 Eisenhower Priority Matrix view.
    
    Groups active tasks into 4 quadrants based on urgency and importance.
    """
    base_query = select(Task).where(
        and_(
            Task.user_id == current_user.id,
            Task.status != TaskStatus.DONE
        )
    ).options(
        selectinload(Task.category),
        selectinload(Task.tags)
    )
    
    # Quadrant 1: DO FIRST (Urgent + Important)
    q1_result = await db.execute(
        base_query.where(and_(Task.is_urgent == True, Task.is_important == True))
    )
    q1_tasks = q1_result.scalars().all()
    
    # Quadrant 2: SCHEDULE (Not Urgent + Important)
    q2_result = await db.execute(
        base_query.where(and_(Task.is_urgent == False, Task.is_important == True))
    )
    q2_tasks = q2_result.scalars().all()
    
    # Quadrant 3: DELEGATE (Urgent + Not Important)
    q3_result = await db.execute(
        base_query.where(and_(Task.is_urgent == True, Task.is_important == False))
    )
    q3_tasks = q3_result.scalars().all()
    
    # Quadrant 4: ELIMINATE (Not Urgent + Not Important)
    q4_result = await db.execute(
        base_query.where(and_(Task.is_urgent == False, Task.is_important == False))
    )
    q4_tasks = q4_result.scalars().all()
    
    return {
        "quadrants": {
            "DO_FIRST": {
                "label": "Do First",
                "description": "Urgent & Important - Handle immediately",
                "count": len(q1_tasks),
                "tasks": [TaskResponse.model_validate(t) for t in q1_tasks]
            },
            "SCHEDULE": {
                "label": "Schedule",
                "description": "Not Urgent & Important - Plan for these",
                "count": len(q2_tasks),
                "tasks": [TaskResponse.model_validate(t) for t in q2_tasks]
            },
            "DELEGATE": {
                "label": "Delegate",
                "description": "Urgent & Not Important - Delegate if possible",
                "count": len(q3_tasks),
                "tasks": [TaskResponse.model_validate(t) for t in q3_tasks]
            },
            "ELIMINATE": {
                "label": "Eliminate",
                "description": "Neither Urgent nor Important - Reconsider necessity",
                "count": len(q4_tasks),
                "tasks": [TaskResponse.model_validate(t) for t in q4_tasks]
            }
        },
        "summary": {
            "total_active": len(q1_tasks) + len(q2_tasks) + len(q3_tasks) + len(q4_tasks),
            "needs_immediate_attention": len(q1_tasks)
        }
    }


@router.get("/timeline", response_model=TaskListResponse, summary="Timeline View")
async def get_timeline_view(
    period: TimelinePeriod = Query(
        TimelinePeriod.TODAY,
        description="Time period: today, week, or month"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    📅 Timeline view with flexible periods.
    Single endpoint replaces separate today/week/month endpoints.
    """
    now = datetime.now(timezone.utc)
    
    if period == TimelinePeriod.TODAY:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    elif period == TimelinePeriod.WEEK:
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=7)
    else:  # MONTH
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end = start.replace(year=now.year + 1, month=1)
        else:
            end = start.replace(month=now.month + 1)
    
    query = select(Task).where(
        and_(
            Task.user_id == current_user.id,
            Task.due_date >= start,
            Task.due_date < end,
            Task.status != TaskStatus.DONE
        )
    ).options(
        selectinload(Task.category),
        selectinload(Task.tags)
    ).order_by(Task.due_date)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return TaskListResponse(
        total=len(tasks),
        tasks=[TaskResponse.model_validate(task) for task in tasks]
    )


@router.get("/overdue", response_model=TaskListResponse, summary="Overdue Tasks")
async def get_overdue_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    ⚠️ Overdue tasks requiring immediate attention.
    Returns incomplete tasks past their due date, sorted by urgency.
    """
    now = datetime.now(timezone.utc)
    
    query = select(Task).where(
        and_(
            Task.user_id == current_user.id,
            Task.due_date < now,
            Task.due_date.isnot(None),
            Task.status != TaskStatus.DONE
        )
    ).options(
        selectinload(Task.category),
        selectinload(Task.tags)
    ).order_by(Task.due_date)  # Oldest first
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return TaskListResponse(
        total=len(tasks),
        tasks=[TaskResponse.model_validate(task) for task in tasks]
    )