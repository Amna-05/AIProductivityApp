"""
Task model with Priority Matrix support.
- Many-to-One: Task → Category
- Many-to-Many: Task ↔ Tag
- Tracks Eisenhower Matrix and timestamps
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Enum as SQLEnum, Index, ForeignKey, Table
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base
from app.schemas.task import TaskStatus

# ASSOCIATION TABLE for Many-to-Many (Task ↔ Tag)
task_tags = Table(
    'task_tags',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id', ondelete='CASCADE')),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'))
)

class Task(Base):
    __tablename__ = "tasks"

    # PRIMARY KEY
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # BASIC FIELDS
    title = Column(String(200), nullable=False, index=True)
    description = Column(String(1000), nullable=True)

    # PRIORITY MATRIX
    is_urgent = Column(Boolean, nullable=False, default=False, index=True)
    is_important = Column(Boolean, nullable=False, default=False, index=True)
    
    # STATUS
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.TODO, index=True)

    # DATES
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # FOREIGN KEYS
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    # RELATIONSHIPS
    user = relationship("User", back_populates="tasks")
    category = relationship("Category", back_populates="tasks")
    tags = relationship("Tag", secondary=task_tags, back_populates="tasks")

    # INDEXES
    __table_args__ = (
        Index('ix_task_priority_matrix', 'is_urgent', 'is_important'),
        Index('ix_task_status_due', 'status', 'due_date'),
        Index('ix_task_category_status', 'category_id', 'status'),
    )

    # COMPUTED PROPERTIES
    @property
    def quadrant(self) -> str:
        """Determine Eisenhower Matrix quadrant based on urgency and importance."""
        if self.is_urgent and self.is_important:
            return "DO_FIRST"
        elif not self.is_urgent and self.is_important:
            return "SCHEDULE"
        elif self.is_urgent and not self.is_important:
            return "DELEGATE"
        else:
            return "ELIMINATE"

    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue."""
        if not self.due_date or self.status == TaskStatus.DONE:
            return False
        return datetime.now(self.due_date.tzinfo) > self.due_date

    @property
    def days_until_due(self) -> int | None:
        """Calculate days remaining until due date."""
        if not self.due_date:
            return None
        delta = self.due_date - datetime.now(self.due_date.tzinfo)
        return delta.days

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', quadrant={self.quadrant}, status={self.status})>"