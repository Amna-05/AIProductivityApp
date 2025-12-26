"""
Unit tests for TaskRepository.

Tests task CRUD operations, filtering, and statistics.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from app.db.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate, TaskUpdate, TaskStatus


@pytest.mark.asyncio
async def test_create_task(test_db, test_user):
    """Test creating a task."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(
        title="Test Task",
        description="Test Description",
        is_urgent=True,
        is_important=False
    )

    task = await repo.create(task_data, test_user.id)

    assert task.id is not None
    assert task.title == "Test Task"
    assert task.description == "Test Description"
    assert task.user_id == test_user.id
    assert task.is_urgent is True
    assert task.is_important is False
    assert task.status == TaskStatus.TODO


@pytest.mark.asyncio
async def test_create_task_with_due_date(test_db, test_user):
    """Test creating task with due date."""
    repo = TaskRepository(test_db)
    due_date = datetime.now(timezone.utc) + timedelta(days=7)
    task_data = TaskCreate(
        title="Task with deadline",
        is_urgent=False,
        is_important=True,
        due_date=due_date
    )

    task = await repo.create(task_data, test_user.id)

    assert task.due_date is not None
    assert task.due_date.date() == due_date.date()


@pytest.mark.asyncio
async def test_get_task_by_id(test_db, test_user):
    """Test getting task by ID."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(title="Find Me", is_urgent=False, is_important=False)
    created_task = await repo.create(task_data, test_user.id)

    task = await repo.get_by_id(created_task.id, test_user.id)

    assert task is not None
    assert task.id == created_task.id
    assert task.title == "Find Me"


@pytest.mark.asyncio
async def test_get_task_by_id_wrong_user(test_db, test_user):
    """Test that users can't access other users' tasks."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(title="Private Task", is_urgent=False, is_important=False)
    task = await repo.create(task_data, test_user.id)

    # Try to access with wrong user_id
    result = await repo.get_by_id(task.id, user_id=999999)

    assert result is None


@pytest.mark.asyncio
async def test_update_task(test_db, test_user):
    """Test updating a task."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(title="Original Title", is_urgent=False, is_important=False)
    task = await repo.create(task_data, test_user.id)

    update_data = TaskUpdate(
        title="Updated Title",
        status=TaskStatus.IN_PROGRESS
    )
    updated_task = await repo.update(task.id, test_user.id, update_data)

    assert updated_task.title == "Updated Title"
    assert updated_task.status == TaskStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_update_task_mark_done(test_db, test_user):
    """Test marking task as done sets completed_at."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(title="Task to Complete", is_urgent=False, is_important=False)
    task = await repo.create(task_data, test_user.id)

    update_data = TaskUpdate(status=TaskStatus.DONE)
    updated_task = await repo.update(task.id, test_user.id, update_data)

    assert updated_task.status == TaskStatus.DONE
    assert updated_task.completed_at is not None


@pytest.mark.asyncio
async def test_delete_task(test_db, test_user):
    """Test deleting a task."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(title="Delete Me", is_urgent=False, is_important=False)
    task = await repo.create(task_data, test_user.id)

    result = await repo.delete(task.id, test_user.id)

    assert result is True

    # Verify deletion
    deleted_task = await repo.get_by_id(task.id, test_user.id)
    assert deleted_task is None


@pytest.mark.asyncio
async def test_delete_task_wrong_user(test_db, test_user):
    """Test that users can't delete other users' tasks."""
    repo = TaskRepository(test_db)
    task_data = TaskCreate(title="Protected Task", is_urgent=False, is_important=False)
    task = await repo.create(task_data, test_user.id)

    # Try to delete with wrong user_id
    result = await repo.delete(task.id, user_id=999999)

    assert result is False

    # Verify task still exists
    existing_task = await repo.get_by_id(task.id, test_user.id)
    assert existing_task is not None


@pytest.mark.asyncio
async def test_get_task_stats(test_db, test_user):
    """Test getting task statistics."""
    repo = TaskRepository(test_db)

    # Create tasks with different statuses and priorities
    await repo.create(
        TaskCreate(title="Task 1", is_urgent=True, is_important=True),
        test_user.id
    )
    await repo.create(
        TaskCreate(title="Task 2", is_urgent=False, is_important=True, status=TaskStatus.DONE),
        test_user.id
    )
    await repo.create(
        TaskCreate(title="Task 3", is_urgent=True, is_important=False),
        test_user.id
    )
    await repo.create(
        TaskCreate(title="Task 4", is_urgent=False, is_important=False, status=TaskStatus.IN_PROGRESS),
        test_user.id
    )

    stats = await repo.get_stats(test_user.id)

    assert stats["total"] == 4
    assert stats["by_status"]["todo"] == 2  # Status enum values are lowercase
    assert stats["by_status"]["done"] == 1
    assert stats["by_status"]["in_progress"] == 1
    assert stats["by_quadrant"]["DO_FIRST"] == 1  # urgent + important
    assert stats["by_quadrant"]["DELEGATE"] == 1  # urgent + not important
    assert stats["by_quadrant"]["SCHEDULE"] == 1  # not urgent + important
    assert stats["by_quadrant"]["ELIMINATE"] == 1  # not urgent + not important
