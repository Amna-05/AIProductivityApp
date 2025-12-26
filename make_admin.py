"""
Script to make a user an admin by email.
Usage: uv run python make_admin.py
"""
import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal

# Import all models to ensure relationships are properly initialized
from app.models.user import User
from app.models.task import Task
from app.models.category import Category
from app.models.tag import Tag
from app.models.refresh_token import RefreshToken


async def make_admin(email: str):
    """Make a user admin by setting is_superuser to True."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == email)
        )
        user = result.scalars().first()

        if user:
            user.is_superuser = True
            await session.commit()
            print(f"SUCCESS: {email} is now an admin!")
            print(f"   User ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   is_superuser: {user.is_superuser}")
        else:
            print(f"ERROR: User with email '{email}' not found")
            print("   Make sure the user is registered first.")


if __name__ == "__main__":
    # Change this email to the user you want to make admin
    email_to_promote = "iamamna146@gmail.com"

    print(f"Making {email_to_promote} an admin...")
    asyncio.run(make_admin(email_to_promote))
