"""
Repository pattern for Task database operations.

Best Practices:
- Single Responsibility (only DB operations)
- Dependency Injection ready
- Async operations
- Proper error handling
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatus, TaskPriority
from app.core.exceptions import TaskNotFoundException, TaskAlreadyExistsException


class TaskRepository:
    """
    Repository for Task database operations.
    
    Usage:
        repo = TaskRepository(db_session)
        task = await repo.create(task_data)
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, task_data: TaskCreate) -> Task:
        """
        Create a new task.
        
        Raises:
            TaskAlreadyExistsException: If title already exists
        """
        # Check for duplicate title
        existing = await self.get_by_title(task_data.title)
        if existing:
            raise TaskAlreadyExistsException(task_data.title)
        
        # Create new task
        db_task = Task(**task_data.model_dump())
        
        self.db.add(db_task)
        await self.db.flush()  # Get the ID without committing
        await self.db.refresh(db_task)  # Load generated fields
        
        return db_task
    
    async def get_by_id(self, task_id: int) -> Optional[Task]:
        """Get task by ID."""
        result = await self.db.execute(
            select(Task).where(Task.id == task_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_title(self, title: str) -> Optional[Task]:
        """Get task by title (case-insensitive)."""
        result = await self.db.execute(
            select(Task).where(func.lower(Task.title) == title.lower())
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
    ) -> tuple[List[Task], int]:
        """
        Get all tasks with filtering and pagination.
        
        Returns:
            tuple: (list of tasks, total count)
        """
        # Build query with filters
        query = select(Task)
        
        filters = []
        if status:
            filters.append(Task.status == status)
        if priority:
            filters.append(Task.priority == priority)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Task.created_at.desc())
        result = await self.db.execute(query)
        tasks = result.scalars().all()
        
        return list(tasks), total
    
    async def update(self, task_id: int, task_data: TaskUpdate) -> Task:
        """
        Update a task.
        
        Raises:
            TaskNotFoundException: If task doesn't exist
            TaskAlreadyExistsException: If new title conflicts
        """
        # Get existing task
        task = await self.get_by_id(task_id)
        if not task:
            raise TaskNotFoundException(task_id)
        
        # Check for title conflict (if title is being updated)
        update_data = task_data.model_dump(exclude_unset=True)
        if "title" in update_data:
            existing = await self.get_by_title(update_data["title"])
            if existing and existing.id != task_id:
                raise TaskAlreadyExistsException(update_data["title"])
        
        # Update fields
        for field, value in update_data.items():
            setattr(task, field, value)
        
        await self.db.flush()
        await self.db.refresh(task)
        
        return task
    
    async def delete(self, task_id: int) -> bool:
        """
        Delete a task.
        
        Returns:
            bool: True if deleted, False if not found
        """
        task = await self.get_by_id(task_id)
        if not task:
            return False
        
        await self.db.delete(task)
        await self.db.flush()
        
        return True
    
    async def get_stats(self) -> dict:
        """Get task statistics."""
        # Total count
        total_result = await self.db.execute(select(func.count(Task.id)))
        total = total_result.scalar()
        
        # Count by status
        status_counts = {}
        for status_val in TaskStatus:
            result = await self.db.execute(
                select(func.count(Task.id)).where(Task.status == status_val)
            )
            status_counts[status_val.value] = result.scalar()
        
        # Count by priority
        priority_counts = {}
        for priority_val in TaskPriority:
            result = await self.db.execute(
                select(func.count(Task.id)).where(Task.priority == priority_val)
            )
            priority_counts[priority_val.value] = result.scalar()
        
        return {
            "total": total,
            "by_status": status_counts,
            "by_priority": priority_counts
        }