# app/schemas/task.py

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class TaskStatus(str, Enum):
    """Task status options."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


# ============================================================
# NESTED SCHEMAS (for relationships)
# ============================================================

class CategoryInTask(BaseModel):
    """Category info when included in task response."""
    id: int
    name: str
    color: Optional[str] = None
    icon: Optional[str] = None
    
    class Config:
        from_attributes = True


class TagInTask(BaseModel):
    """Tag info when included in task response."""
    id: int
    name: str
    color: Optional[str] = None
    
    class Config:
        from_attributes = True


# ============================================================
# TASK SCHEMAS
# ============================================================

class TaskBase(BaseModel):
    """Base task fields shared across schemas."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    
    # Priority Matrix fields
    is_urgent: bool = False
    is_important: bool = False
    
    status: TaskStatus = TaskStatus.TODO
    due_date: Optional[datetime] = None
    
    # Relationships
    category_id: Optional[int] = None  # Can be None


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    tag_ids: Optional[List[int]] = []  # List of tag IDs to attach
    
    # 🆕 ADD VALIDATOR TO CONVERT 0 TO None
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        """Convert 0 or negative numbers to None."""
        if v is not None and v <= 0:
            return None
        return v
    
    @field_validator('tag_ids')
    @classmethod
    def validate_tag_ids(cls, v):
        """Remove 0 or negative IDs from tag list."""
        if v is None:
            return []
        return [tag_id for tag_id in v if tag_id > 0]


class TaskUpdate(BaseModel):
    """Schema for updating a task (all fields optional)."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    
    is_urgent: Optional[bool] = None
    is_important: Optional[bool] = None
    
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    
    # 🆕 ADD SAME VALIDATORS
    @field_validator('category_id')
    @classmethod
    def validate_category_id(cls, v):
        """Convert 0 or negative numbers to None."""
        if v is not None and v <= 0:
            return None
        return v
    
    @field_validator('tag_ids')
    @classmethod
    def validate_tag_ids(cls, v):
        """Remove 0 or negative IDs from tag list."""
        if v is None:
            return None
        if not v:  # Empty list
            return []
        return [tag_id for tag_id in v if tag_id > 0]


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: int
    user_id: int
    
    # Computed fields
    quadrant: str  # "DO_FIRST", "SCHEDULE", etc.
    is_overdue: bool
    days_until_due: Optional[int]
    
    # Relationships
    category: Optional[CategoryInTask] = None
    tags: List[TagInTask] = []
    
    # Timestamps
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for paginated task list."""
    total: int
    tasks: List[TaskResponse]