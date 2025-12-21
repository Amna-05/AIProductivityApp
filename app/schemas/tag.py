# app/schemas/tag.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)
    color: Optional[str] = Field("#3B82F6", max_length=7, pattern=r'^#[0-9A-Fa-f]{6}$')


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=30)
    color: Optional[str] = Field(None, max_length=7)


class TagResponse(TagBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True