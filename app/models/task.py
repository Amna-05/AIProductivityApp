"""
SQLAlchemy database models for Task.

Best Practices:
- Separate from Pydantic schemas
- Database-specific fields (id, timestamps)
- Indexes for performance
- Constraints for data integrity
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Index
from sqlalchemy.sql import func
from datetime import datetime

from app.db.database import Base
from app.schemas.task import TaskPriority, TaskStatus


class Task(Base):
    """
    Task database model.
    
    Represents the 'tasks' table in PostgreSQL.
    """
    
    __tablename__ = "tasks"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Task Fields
    title = Column(String(200), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    
    # Enums stored as strings in database
    priority = Column(
        SQLEnum(TaskPriority),
        nullable=False,
        default=TaskPriority.MEDIUM,
        index=True  # Index for filtering
    )
    
    status = Column(
        SQLEnum(TaskStatus ),
        nullable=False,
        default=TaskStatus.TODO,
        index=True  # Index for filtering
    )
    
    # Timestamps (auto-managed)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),  # Database sets this
    )
    
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),  # Auto-update on changes
    )
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('ix_task_status_priority', 'status', 'priority'),
        Index('ix_task_created_at', 'created_at'),
    )
    
    def __repr__(self) -> str:
        """String representation for debugging."""
        return f"<Task(id={self.id}, title='{self.title}', status={self.status})>"