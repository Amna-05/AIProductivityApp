# app/api/tags.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.schemas.tag import TagCreate, TagUpdate, TagResponse
from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.tag import Tag

router = APIRouter(
    prefix="/tags",
    tags=["tags"],
    responses={401: {"description": "Not authenticated"}}
)


@router.get("", response_model=list[TagResponse])
async def list_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all tags for current user."""
    result = await db.execute(
        select(Tag)
        .where(Tag.user_id == current_user.id)
        .order_by(Tag.name)
    )
    tags = result.scalars().all()
    return [TagResponse.model_validate(tag) for tag in tags]


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new tag."""
    # Normalize name (lowercase)
    normalized_name = tag.name.strip().lower()
    
    # Check if tag already exists
    existing = await db.execute(
        select(Tag).where(
            Tag.user_id == current_user.id,
            Tag.name == normalized_name
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag '{normalized_name}' already exists"
        )
    
    db_tag = Tag(
        name=normalized_name,
        color=tag.color,
        user_id=current_user.id
    )
    db.add(db_tag)
    await db.commit()
    await db.refresh(db_tag)
    return TagResponse.model_validate(db_tag)


@router.patch("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a tag (only custom tags, not system tags)."""
    result = await db.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.user_id == current_user.id
        )
    )
    db_tag = result.scalars().first()
    
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Prevent editing system tags (urgent, important, normal)
    system_tags = ["urgent", "important", "normal"]
    if db_tag.name in system_tags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit system tags"
        )
    
    # Update fields
    update_data = tag_update.model_dump(exclude_none=True)
    if "name" in update_data:
        update_data["name"] = update_data["name"].strip().lower()
    
    for field, value in update_data.items():
        setattr(db_tag, field, value)
    
    await db.commit()
    await db.refresh(db_tag)
    return TagResponse.model_validate(db_tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a tag (only custom tags, not system tags)."""
    result = await db.execute(
        select(Tag).where(
            Tag.id == tag_id,
            Tag.user_id == current_user.id
        )
    )
    db_tag = result.scalars().first()
    
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Prevent deleting system tags
    system_tags = ["urgent", "important", "normal"]
    if db_tag.name in system_tags:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system tags"
        )
    
    await db.delete(db_tag)
    await db.commit()