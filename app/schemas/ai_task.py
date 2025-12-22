# app/schemas/ai_task.py (NEW FILE)

"""
Pydantic schemas for AI-powered task creation.
"""

from pydantic import BaseModel, Field
from typing import Optional


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