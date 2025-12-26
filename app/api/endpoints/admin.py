"""
Admin-only endpoints.
Minimal implementation using existing is_superuser column.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from pydantic import BaseModel

from app.db.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.models.task import Task

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)]  # All routes require admin
)


# ============================================================
# RESPONSE SCHEMAS
# ============================================================

class SystemStatsResponse(BaseModel):
    """System-wide statistics."""
    total_users: int
    active_users: int
    admin_users: int
    total_tasks: int
    completed_tasks: int


class UserListItem(BaseModel):
    """User list item with basic info."""
    id: int
    email: str
    username: str
    is_active: bool
    is_superuser: bool
    task_count: int

    class Config:
        from_attributes = True


# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Get system-wide statistics (admin only).

    Returns counts for:
    - Total users
    - Active users
    - Admin users
    - Total tasks
    - Completed tasks
    """
    # Total users
    total_users = await db.scalar(select(func.count(User.id)))

    # Active users
    active_users = await db.scalar(
        select(func.count(User.id)).where(User.is_active == True)
    )

    # Admin users
    admin_users = await db.scalar(
        select(func.count(User.id)).where(User.is_superuser == True)
    )

    # Total tasks
    total_tasks = await db.scalar(select(func.count(Task.id)))

    # Completed tasks
    completed_tasks = await db.scalar(
        select(func.count(Task.id)).where(Task.status == "done")
    )

    return SystemStatsResponse(
        total_users=total_users or 0,
        active_users=active_users or 0,
        admin_users=admin_users or 0,
        total_tasks=total_tasks or 0,
        completed_tasks=completed_tasks or 0
    )


@router.get("/users", response_model=List[UserListItem])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    List all users with task counts (admin only).

    Returns all users with:
    - User details (email, username, status)
    - Task count per user
    """
    # Get all users with task counts
    query = select(
        User,
        func.count(Task.id).label("task_count")
    ).outerjoin(Task).group_by(User.id).order_by(User.created_at.desc())

    result = await db.execute(query)
    users_with_counts = result.all()

    return [
        UserListItem(
            id=user.id,
            email=user.email,
            username=user.username,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            task_count=task_count or 0
        )
        for user, task_count in users_with_counts
    ]


@router.patch("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Toggle user admin status (admin only).

    Prevents:
    - Self-demotion (admin can't demote themselves)
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent self-demotion
    if user.id == current_admin.id and user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself"
        )

    # Toggle admin status
    user.is_superuser = not user.is_superuser
    await db.commit()

    action = "promoted to" if user.is_superuser else "demoted from"
    return {
        "message": f"User {action} admin",
        "is_superuser": user.is_superuser
    }


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """
    Toggle user active status (admin only).

    Prevents:
    - Self-deactivation (admin can't deactivate themselves)
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent self-deactivation
    if user.id == current_admin.id and user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )

    # Toggle active status
    user.is_active = not user.is_active
    await db.commit()

    status_text = "activated" if user.is_active else "deactivated"
    return {
        "message": f"User {status_text}",
        "is_active": user.is_active
    }
