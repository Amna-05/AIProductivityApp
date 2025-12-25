# app/schemas/ai_task.py

"""
Pydantic schemas for AI-powered task features.

Includes:
- Voice/NLP task parsing (Phase 1)
- Priority suggestions (Phase 2)
- Similar task search (Phase 2)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VoiceTaskInput(BaseModel):
    """Input from voice transcription or manual text."""
    text: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Natural language task description"
    )
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "text": "Remind me to call dentist tomorrow at 3pm urgent"
                },
                {
                    "text": "Meeting with Sarah about Q4 planning next Tuesday morning"
                }
            ]
        }


class ParsedTaskResponse(BaseModel):
    """AI-parsed task data (before database creation)."""
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    is_urgent: bool
    is_important: bool
    suggested_category: Optional[str] = None
    suggested_tags: list[str] = []
    confidence: float = Field(..., ge=0.0, le=1.0)
    original_input: str


# ============================================================================
# PHASE 2: PRIORITY SUGGESTIONS SCHEMAS
# ============================================================================


class SimilarTaskInfo(BaseModel):
    """Information about a similar task (compact version)."""

    id: int
    title: str
    description: Optional[str] = None
    similarity: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score")
    was_urgent: bool
    was_important: bool
    quadrant: str
    completion_time_days: Optional[int] = Field(None, description="Days from creation to completion")
    created_at: str
    completed_at: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": 123,
                "title": "Fix authentication bug",
                "description": "Users cannot log in with valid credentials",
                "similarity": 0.87,
                "was_urgent": True,
                "was_important": True,
                "quadrant": "DO_FIRST",
                "completion_time_days": 2,
                "created_at": "2025-12-20T10:00:00Z",
                "completed_at": "2025-12-22T14:30:00Z",
            }
        }


class PrioritySuggestionResponse(BaseModel):
    """AI-generated priority suggestion with reasoning."""

    task_id: int
    suggested_urgent: bool = Field(..., description="Suggested urgency")
    suggested_important: bool = Field(..., description="Suggested importance")
    suggested_quadrant: str = Field(
        ..., description="Eisenhower quadrant: DO_FIRST, SCHEDULE, DELEGATE, or ELIMINATE"
    )
    urgency_score: float = Field(..., ge=0.0, le=1.0, description="Urgency score (0-1)")
    importance_score: float = Field(..., ge=0.0, le=1.0, description="Importance score (0-1)")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence in suggestion (0-1). Higher = more similar historical data",
    )
    reasoning: str = Field(..., description="Human-readable explanation of why")
    similar_tasks: List[SimilarTaskInfo] = Field(
        ..., description="Top 3 most similar historical tasks"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": 456,
                "suggested_urgent": True,
                "suggested_important": True,
                "suggested_quadrant": "DO_FIRST",
                "urgency_score": 0.8,
                "importance_score": 0.75,
                "confidence": 0.85,
                "reasoning": "This task is due in 2 days. Based on 3 similar tasks (average similarity: 82%), 67% were marked as important. Similar tasks took 2-3 days (average: 2.3 days) to complete. Recommendation: Do this first - it's both urgent and important. Prioritize this task immediately.",
                "similar_tasks": [
                    {
                        "id": 123,
                        "title": "Fix authentication bug",
                        "similarity": 0.87,
                        "was_urgent": True,
                        "was_important": True,
                        "quadrant": "DO_FIRST",
                        "completion_time_days": 2,
                    }
                ],
            }
        }


class SimilarTaskDetail(BaseModel):
    """Detailed information about a similar task (extended version)."""

    id: int
    title: str
    description: Optional[str] = None
    similarity: float = Field(..., ge=0.0, le=1.0)
    was_urgent: bool
    was_important: bool
    quadrant: str
    status: str
    completion_time_days: Optional[int] = None
    created_at: str
    completed_at: Optional[str] = None
    category_id: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": 123,
                "title": "Fix authentication bug",
                "description": "Users cannot log in",
                "similarity": 0.87,
                "was_urgent": True,
                "was_important": True,
                "quadrant": "DO_FIRST",
                "status": "DONE",
                "completion_time_days": 2,
                "created_at": "2025-12-20T10:00:00Z",
                "completed_at": "2025-12-22T14:30:00Z",
                "category_id": 5,
            }
        }


class SimilarTasksResponse(BaseModel):
    """Response containing similar tasks for a given task."""

    task_id: int
    similar_tasks: List[SimilarTaskDetail]

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": 456,
                "similar_tasks": [
                    {
                        "id": 123,
                        "title": "Fix authentication bug",
                        "similarity": 0.87,
                        "was_urgent": True,
                        "was_important": True,
                        "quadrant": "DO_FIRST",
                    }
                ],
            }
        }