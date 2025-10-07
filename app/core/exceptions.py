"""
Custom exception handlers for consistent error responses.

Best Practice:
- Centralized error handling
- Consistent error format
- Proper HTTP status codes
- Detailed error messages for debugging
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class TaskAPIException(HTTPException):
    """Base exception for all task-related errors."""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class TaskNotFoundException(TaskAPIException):
    """Raised when a task is not found."""
    
    def __init__(self, task_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id {task_id} not found"
        )


class TaskAlreadyExistsException(TaskAPIException):
    """Raised when trying to create a duplicate task."""
    
    def __init__(self, task_title: str):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Task with title '{task_title}' already exists"
        )


class InvalidTaskDataException(TaskAPIException):
    """Raised when task data is invalid."""
    
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )


class TaskValidationException(TaskAPIException):
    """Raised when task validation fails."""
    
    def __init__(self, field: str, message: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error on field '{field}': {message}"
        )