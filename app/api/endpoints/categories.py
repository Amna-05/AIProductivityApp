# app/api/categories.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.schemas.categories import CategoryCreate, CategoryUpdate, CategoryResponse
from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.category import Category
from app.models.task import Task

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
    responses={401: {"description": "Not authenticated"}}
)


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all categories for current user with task counts."""
    result = await db.execute(
        select(Category)
        .where(Category.user_id == current_user.id)
        .order_by(Category.name)
    )
    categories = result.scalars().all()

    # Add task_count to each category
    response_list = []
    for cat in categories:
        # Count tasks for this category
        count_result = await db.execute(
            select(func.count(Task.id)).where(Task.category_id == cat.id)
        )
        task_count = count_result.scalar() or 0

        # Create response with task_count
        cat_dict = {
            "id": cat.id,
            "name": cat.name,
            "color": cat.color,
            "icon": cat.icon,
            "user_id": cat.user_id,
            "created_at": cat.created_at,
            "task_count": task_count
        }
        response_list.append(CategoryResponse(**cat_dict))

    return response_list


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new category."""
    # Check if name already exists for this user
    existing = await db.execute(
        select(Category).where(
            Category.user_id == current_user.id,
            Category.name == category.name
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category.name}' already exists"
        )
    
    db_category = Category(**category.model_dump(), user_id=current_user.id)
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return CategoryResponse.model_validate(db_category)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a category."""
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == current_user.id
        )
    )
    db_category = result.scalars().first()

    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check name uniqueness only if name is being changed
    update_data = category_update.model_dump(exclude_none=True)
    if "name" in update_data and update_data["name"] != db_category.name:
        existing = await db.execute(
            select(Category).where(
                Category.user_id == current_user.id,
                Category.name == update_data["name"]
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{update_data['name']}' already exists"
            )

    # Update fields
    for field, value in update_data.items():
        setattr(db_category, field, value)

    await db.commit()
    await db.refresh(db_category)
    return CategoryResponse.model_validate(db_category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a category.
    Tasks using this category will have category_id set to NULL.
    """
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.user_id == current_user.id
        )
    )
    db_category = result.scalars().first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await db.delete(db_category)
    await db.commit()