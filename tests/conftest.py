"""
Pytest configuration and fixtures for tests.

This file provides shared fixtures used across all tests.
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.db.database import Base
from app.core.config import settings

# Import all models so they register with Base.metadata
from app.models.user import User
from app.models.task import Task
from app.models.category import Category
from app.models.tag import Tag
from app.models.refresh_token import RefreshToken

# PostgreSQL test database - more realistic than SQLite
# SQLite has compatibility issues with PostgreSQL-specific features (RETURNING clause, func.now())
TEST_DATABASE_URL = settings.DATABASE_URL.replace(
    "task_manager_db", "task_manager_test_db"
)


@pytest_asyncio.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Create fresh test database for each test.

    Uses PostgreSQL test database for full compatibility with production.
    Database schema is created and torn down for each test to ensure isolation.
    """
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool
    )

    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Provide session to test
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

    # Clean up: drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
def mock_groq_client(mocker):
    """
    Mock Groq API client to avoid real API calls during tests.

    Returns a mock that simulates successful AI task parsing.
    """
    mock = mocker.patch('app.services.ai_task_parser.Groq')
    mock_instance = mock.return_value
    mock_instance.chat.completions.create.return_value = mocker.Mock(
        choices=[
            mocker.Mock(
                message=mocker.Mock(
                    content='{"title":"Test Task","description":null,"due_date":null,"is_urgent":false,"is_important":true,"suggested_category":null,"suggested_tags":[],"confidence":0.9}'
                )
            )
        ]
    )
    return mock_instance


@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession) -> User:
    """
    Create test user for authentication/authorization tests.

    Password: Test123!
    Email: test@example.com
    """
    from app.core.security import get_password_hash
    from datetime import datetime, timezone

    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("Test123!"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_category(test_db: AsyncSession, test_user: User) -> Category:
    """Create test category for category-related tests."""
    category = Category(
        name="Work",
        color="#3B82F6",
        user_id=test_user.id
    )
    test_db.add(category)
    await test_db.commit()
    await test_db.refresh(category)
    return category


@pytest_asyncio.fixture
async def test_tag(test_db: AsyncSession, test_user: User) -> Tag:
    """Create test tag for tag-related tests."""
    tag = Tag(
        name="urgent",
        color="#EF4444",
        user_id=test_user.id
    )
    test_db.add(tag)
    await test_db.commit()
    await test_db.refresh(tag)
    return tag
