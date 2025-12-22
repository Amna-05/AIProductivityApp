# app/api/endpoints/ai_tasks.py

"""
AI-powered task creation endpoints.
Handles voice-to-task and natural language parsing.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag
from app.services.ai_task_parser import AITaskParser  # 🔗 Use service
from app.db.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskResponse
from app.schemas.ai_task import VoiceTaskInput, ParsedTaskResponse  # 🔗 Use AI schemas

router = APIRouter(
    prefix="/ai/tasks",
    tags=["ai-tasks"],
    responses={401: {"description": "Not authenticated"}}
)


@router.post(
    "/parse",
    response_model=ParsedTaskResponse,
    summary="🤖 Parse natural language with AI"
)
async def parse_voice_input(
    input_data: VoiceTaskInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Parse natural language (from voice or text) without creating task.
    
    **Use Case:** Preview what AI understood before confirming.
    """
    
    # Fetch user's categories and tags
    categories = await db.execute(
        select(Category).where(Category.user_id == current_user.id)
    )
    category_names = [c.name for c in categories.scalars().all()]
    
    tags = await db.execute(
        select(Tag).where(Tag.user_id == current_user.id)
    )
    tag_names = [t.name for t in tags.scalars().all()]
    
    # 🔗 Call service (business logic)
    parser = AITaskParser()
    parsed = await parser.parse(
        user_input=input_data.text,
        available_categories=category_names,
        available_tags=tag_names
    )
    
    return ParsedTaskResponse(
        **parsed,
        original_input=input_data.text
    )


@router.post(
    "/create-from-voice",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="🎤 Create task from voice/text"
)
async def create_task_from_voice(
    input_data: VoiceTaskInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Parse natural language AND create task in one step.
    
    **Flow:**
    1. User speaks → Text transcription
    2. AI extracts task details
    3. Task auto-created with correct fields
    """
    
    # Fetch user's categories and tags
    categories_result = await db.execute(
        select(Category).where(Category.user_id == current_user.id)
    )
    categories = categories_result.scalars().all()
    
    tags_result = await db.execute(
        select(Tag).where(Tag.user_id == current_user.id)
    )
    tags = tags_result.scalars().all()
    
    # 🔗 Parse with AI service
    parser = AITaskParser()
    parsed = await parser.parse(
        user_input=input_data.text,
        available_categories=[c.name for c in categories],
        available_tags=[t.name for t in tags]
    )
    
    # Map category name → category_id
    category_id = None
    if parsed["suggested_category"]:
        match = next(
            (c for c in categories if c.name.lower() == parsed["suggested_category"].lower()),
            None
        )
        if match:
            category_id = match.id
    
    # Map tag names → tag_ids
    tag_ids = []
    for tag_name in parsed["suggested_tags"]:
        match = next(
            (t for t in tags if t.name.lower() == tag_name.lower()),
            None
        )
        if match:
            tag_ids.append(match.id)
    
    # Create task
    task_data = TaskCreate(
        title=parsed["title"],
        description=parsed["description"],
        due_date=parsed["due_date"],
        is_urgent=parsed["is_urgent"],
        is_important=parsed["is_important"],
        category_id=category_id,
        tag_ids=tag_ids
    )
    
    repo = TaskRepository(db)
    db_task = await repo.create(task_data, current_user.id)
    
    return TaskResponse.model_validate(db_task)