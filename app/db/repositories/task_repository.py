"""
Task repository for database operations.
"""

from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.models.task import Task
from app.models.tag import Tag
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatus


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, task_data: TaskCreate, user_id: int) -> Task:
        """
        Create a new task with relationships loaded.
        Handles tags separately from other fields.
        """
        # Extract tag_ids from task_data
        tag_ids = task_data.tag_ids or []
        
        # Create task dict WITHOUT tag_ids (not a Task model field)
        task_dict = task_data.model_dump(exclude={'tag_ids'})
        task_dict['user_id'] = user_id
        
        # Create task instance
        db_task = Task(**task_dict)
        
        # Attach tags if provided
        if tag_ids:
            # Fetch tag objects
            result = await self.db.execute(
                select(Tag).where(
                    and_(
                        Tag.id.in_(tag_ids),
                        Tag.user_id == user_id  # Only user's own tags
                    )
                )
            )
            tags = result.scalars().all()
            db_task.tags = list(tags)
        
        self.db.add(db_task)
        await self.db.commit()
        
        # 🆕 FIX: Eager load relationships to avoid lazy loading errors
        await self.db.refresh(
            db_task,
            attribute_names=["category", "tags"]
        )
        
        return db_task
    
    async def get_by_id(self, task_id: int, user_id: int) -> Optional[Task]:
        """Get task by ID (with relationships loaded)."""
        result = await self.db.execute(
            select(Task)
            .options(
                selectinload(Task.category),
                selectinload(Task.tags)
            )
            .where(and_(Task.id == task_id, Task.user_id == user_id))
        )
        return result.scalars().first()
    
    async def get_all(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[TaskStatus] = None,
        is_urgent: Optional[bool] = None,
        is_important: Optional[bool] = None,
        category_id: Optional[int] = None,
    ) -> Tuple[List[Task], int]:
        """
        Get all tasks with filtering and pagination.
        """
        # Build query
        query = select(Task).where(Task.user_id == user_id)
        
        # Apply filters
        if status:
            query = query.where(Task.status == status)
        if is_urgent is not None:
            query = query.where(Task.is_urgent == is_urgent)
        if is_important is not None:
            query = query.where(Task.is_important == is_important)
        if category_id:
            query = query.where(Task.category_id == category_id)
        
        # Load relationships
        query = query.options(
            selectinload(Task.category),
            selectinload(Task.tags)
        )
        
        # Get total count
        count_query = select(func.count()).select_from(Task).where(Task.user_id == user_id)
        if status:
            count_query = count_query.where(Task.status == status)
        if is_urgent is not None:
            count_query = count_query.where(Task.is_urgent == is_urgent)
        if is_important is not None:
            count_query = count_query.where(Task.is_important == is_important)
        if category_id:
            count_query = count_query.where(Task.category_id == category_id)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute
        result = await self.db.execute(query)
        tasks = result.scalars().all()
        
        return list(tasks), total
    

    async def update(self, task_id: int, user_id: int, task_update: TaskUpdate) -> Task:
        """Update a task with relationships loaded."""
        # Get existing task (already has relationships loaded from get_by_id)
        db_task = await self.get_by_id(task_id, user_id)
        if not db_task:
            from app.core.exceptions import TaskNotFoundException
            raise TaskNotFoundException(task_id)
        
        # Extract tag_ids
        tag_ids = task_update.tag_ids
        
        # Update task fields (exclude tag_ids and None values)
        update_data = task_update.model_dump(exclude={'tag_ids'}, exclude_none=True)
        
        for field, value in update_data.items():
            setattr(db_task, field, value)
        
        # Update tags if provided
        if tag_ids is not None:  # Could be empty list []
            if tag_ids:  # If not empty
                result = await self.db.execute(
                    select(Tag).where(
                        and_(
                            Tag.id.in_(tag_ids),
                            Tag.user_id == user_id
                        )
                    )
                )
                tags = result.scalars().all()
                db_task.tags = list(tags)
            else:  # Empty list means remove all tags
                db_task.tags = []
        
        # Update completed_at if status changed to DONE
        if task_update.status == TaskStatus.DONE and not db_task.completed_at:
            from datetime import datetime, timezone
            db_task.completed_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        
        # 🆕 FIX: Force refresh ALL attributes including updated_at
        await self.db.refresh(db_task)
        
        # 🆕 FIX: Then reload relationships
        result = await self.db.execute(
            select(Task)
            .options(
                selectinload(Task.category),
                selectinload(Task.tags)
            )
            .where(Task.id == task_id)
        )
        
        return result.scalars().first()
        
    async def delete(self, task_id: int, user_id: int) -> bool:
            """Delete a task."""
            db_task = await self.get_by_id(task_id, user_id)
            if not db_task:
                return False
            
            await self.db.delete(db_task)
            await self.db.commit()
            return True   
    
    async def get_stats(self, user_id: int) -> dict:
        """
        Get task statistics using Priority Matrix.
        """
        # Total tasks
        total_result = await self.db.execute(
            select(func.count(Task.id)).where(Task.user_id == user_id)
        )
        total = total_result.scalar()
        
        # By status
        status_counts = {}
        for status in TaskStatus:
            result = await self.db.execute(
                select(func.count(Task.id)).where(
                    and_(Task.user_id == user_id, Task.status == status)
                )
            )
            status_counts[status.value] = result.scalar()
        
        # By quadrant (Priority Matrix)
        quadrant_counts = {
            "DO_FIRST": 0,      # Urgent + Important
            "SCHEDULE": 0,      # Not Urgent + Important
            "DELEGATE": 0,      # Urgent + Not Important
            "ELIMINATE": 0      # Not Urgent + Not Important
        }
        
        # Do First (Urgent + Important)
        result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.is_urgent == True,
                    Task.is_important == True
                )
            )
        )
        quadrant_counts["DO_FIRST"] = result.scalar()
        
        # Schedule (Not Urgent + Important)
        result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.is_urgent == False,
                    Task.is_important == True
                )
            )
        )
        quadrant_counts["SCHEDULE"] = result.scalar()
        
        # Delegate (Urgent + Not Important)
        result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.is_urgent == True,
                    Task.is_important == False
                )
            )
        )
        quadrant_counts["DELEGATE"] = result.scalar()
        
        # Eliminate (Not Urgent + Not Important)
        result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.user_id == user_id,
                    Task.is_urgent == False,
                    Task.is_important == False
                )
            )
        )
        quadrant_counts["ELIMINATE"] = result.scalar()
        
        # Completed tasks
        completed_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(Task.user_id == user_id, Task.status == TaskStatus.DONE)
            )
        )
        completed = completed_result.scalar()
        
        return {
            "total": total,
            "by_status": status_counts,
            "by_quadrant": quadrant_counts,
            "completed": completed,
            "completion_rate": round((completed / total * 100), 2) if total > 0 else 0
        }