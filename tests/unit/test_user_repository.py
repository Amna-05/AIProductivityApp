"""
Unit tests for UserRepository.

Tests user creation, retrieval, and authentication logic.
"""

import pytest
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.core.security import verify_password


@pytest.mark.asyncio
async def test_create_user(test_db):
    """Test creating a new user."""
    repo = UserRepository(test_db)
    user_data = UserCreate(
        email="new@example.com",
        username="newuser",
        password="Test123!"
    )

    user = await repo.create(user_data)

    assert user.id is not None
    assert user.email == "new@example.com"
    assert user.username == "newuser"
    assert verify_password("Test123!", user.hashed_password)
    assert user.is_active is True


@pytest.mark.asyncio
async def test_get_user_by_email(test_db, test_user):
    """Test retrieving user by email."""
    repo = UserRepository(test_db)

    user = await repo.get_by_email("test@example.com")

    assert user is not None
    assert user.email == "test@example.com"
    assert user.username == "testuser"


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(test_db):
    """Test retrieving non-existent user."""
    repo = UserRepository(test_db)

    user = await repo.get_by_email("nonexistent@example.com")

    assert user is None


@pytest.mark.asyncio
async def test_get_user_by_username(test_db, test_user):
    """Test retrieving user by username."""
    repo = UserRepository(test_db)

    user = await repo.get_by_username("testuser")

    assert user is not None
    assert user.email == "test@example.com"
    assert user.username == "testuser"


@pytest.mark.asyncio
async def test_authenticate_success(test_db, test_user):
    """Test successful authentication."""
    repo = UserRepository(test_db)

    user = await repo.authenticate("test@example.com", "Test123!")

    assert user is not None
    assert user.id == test_user.id


@pytest.mark.asyncio
async def test_authenticate_wrong_password(test_db, test_user):
    """Test authentication with wrong password."""
    repo = UserRepository(test_db)

    user = await repo.authenticate("test@example.com", "WrongPass!")

    assert user is None


@pytest.mark.asyncio
async def test_authenticate_wrong_email(test_db):
    """Test authentication with wrong email."""
    repo = UserRepository(test_db)

    user = await repo.authenticate("wrong@example.com", "Test123!")

    assert user is None
