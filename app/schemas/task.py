"""
Pydantic schemas for Task resource.

Best Practice:
- Separate schemas for different operations (Create, Update, Response)
- Custom validators for business logic
- Clear field descriptions for API docs
- Type safety throughout
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class TaskPriority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    """Task status."""
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Base schema with common fields
class TaskBase(BaseModel):
    """
    Base task schema with common fields.
    
    Other schemas inherit from this to avoid repetition (DRY principle).
    """
    title: str = Field(
        ...,  # Required
        min_length=1,
        max_length=200,
        description="Task title",
        examples=["Complete FastAPI tutorial"]
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Detailed task description",
        examples=["Learn FastAPI by building a production-ready API"]
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description="Task priority level"
    )
    status: TaskStatus = Field(
        default=TaskStatus.TODO,
        description="Current task status"
    )
    
    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        """Validate title is not just whitespace."""
        if not v or not v.strip():
            raise ValueError("Title cannot be empty or just whitespace")
        return v.strip()
    
    @field_validator("description")
    @classmethod
    def description_validation(cls, v: Optional[str]) -> Optional[str]:
        """Validate and clean description."""
        if v is not None:
            v = v.strip()
            if not v:  # If empty after strip, return None
                return None
        return v


class TaskCreate(TaskBase):
    """
    Schema for creating a new task.
    
    Inherits all fields from TaskBase.
    Can add extra fields specific to creation if needed.
    """
    pass


class TaskUpdate(BaseModel):
    """
    Schema for updating a task.
    
    All fields are optional - only send what you want to update.
    This is a partial update (PATCH semantics).
    """
    title: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Task title"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Task description"
    )
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    
    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        """Validate title if provided."""
        if v is not None and (not v or not v.strip()):
            raise ValueError("Title cannot be empty or just whitespace")
        return v.strip() if v else None
    
    model_config = ConfigDict(
        # Allow partial updates
        extra="ignore"  # Ignore fields not in schema
    )


class TaskResponse(TaskBase):
    """
    Schema for task responses.
    
    Includes all fields plus computed/database fields.
    This is what the API returns.
    """
    id: int = Field(..., description="Unique task identifier")
    created_at: datetime = Field(..., description="Task creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(
        from_attributes=True,  # Allow ORM model conversion
        json_schema_extra={
            "example": {
                "id": 1,
                "title": "Complete FastAPI tutorial",
                "description": "Learn FastAPI by building a production-ready API",
                "priority": "high",
                "status": "in_progress",
                "created_at": "2025-10-01T10:30:00",
                "updated_at": "2025-10-01T15:45:00"
            }
        }
    )


class TaskListResponse(BaseModel):
    """
    Schema for paginated task list.
    
    Best Practice: Always paginate list endpoints.
    """
    total: int = Field(..., description="Total number of tasks")
    tasks: list[TaskResponse] = Field(..., description="List of tasks")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total": 2,
                "tasks": [
                    {
                        "id": 1,
                        "title": "Task 1",
                        "description": "Description 1",
                        "priority": "high",
                        "status": "todo",
                        "created_at": "2025-10-01T10:00:00",
                        "updated_at": "2025-10-01T10:00:00"
                    }
                ]
            }
        }
    )