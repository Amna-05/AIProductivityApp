"""
Unit tests for AnalyticsService.

Tests complex analytics calculations for overview, trends, and distributions.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from app.services.analytics_service import AnalyticsService
from app.schemas.task import TaskStatus
from app.models.task import Task


@pytest_asyncio.fixture
async def sample_tasks(test_db, test_user, test_category):
    """Create sample tasks for analytics testing."""
    now = datetime.now(timezone.utc)
    tasks = [
        # Completed tasks
        Task(
            title="Done 1",
            user_id=test_user.id,
            is_urgent=True,
            is_important=True,
            status=TaskStatus.DONE,
            created_at=now - timedelta(days=5),
            completed_at=now - timedelta(days=2)
        ),
        Task(
            title="Done 2",
            user_id=test_user.id,
            is_urgent=False,
            is_important=True,
            status=TaskStatus.DONE,
            created_at=now - timedelta(days=10),
            completed_at=now - timedelta(days=1)
        ),
        # Pending tasks
        Task(
            title="Todo 1",
            user_id=test_user.id,
            is_urgent=True,
            is_important=False,
            status=TaskStatus.TODO,
            due_date=now + timedelta(days=2)
        ),
        Task(
            title="Todo 2",
            user_id=test_user.id,
            is_urgent=False,
            is_important=False,
            status=TaskStatus.TODO
        ),
        # Overdue task
        Task(
            title="Overdue",
            user_id=test_user.id,
            is_urgent=True,
            is_important=True,
            status=TaskStatus.TODO,
            due_date=now - timedelta(days=1)
        ),
    ]

    for task in tasks:
        test_db.add(task)
    await test_db.commit()

    return tasks


@pytest.mark.asyncio
async def test_get_overview(test_db, test_user, sample_tasks):
    """Test overview analytics calculation."""
    service = AnalyticsService(test_db)

    overview = await service.get_overview(test_user.id)

    assert overview.total_tasks == 5
    assert overview.completed_tasks == 2
    assert overview.pending_tasks == 3
    assert overview.overdue_tasks == 1
    assert overview.completion_rate == 40.0  # 2/5 * 100
    assert overview.productivity_score > 0  # Should calculate some score


@pytest.mark.asyncio
async def test_get_priority_distribution(test_db, test_user, sample_tasks):
    """Test priority distribution by quadrant."""
    service = AnalyticsService(test_db)

    distribution = await service.get_priority_distribution(test_user.id)

    # DO_FIRST: urgent + important (2 tasks - Done 1 and Overdue)
    assert distribution.by_quadrant["DO_FIRST"].count == 2
    # DELEGATE: urgent + not important (1 task - Todo 1)
    assert distribution.by_quadrant["DELEGATE"].count == 1
    # SCHEDULE: not urgent + important (1 task - Done 2)
    assert distribution.by_quadrant["SCHEDULE"].count == 1
    # ELIMINATE: not urgent + not important (1 task - Todo 2)
    assert distribution.by_quadrant["ELIMINATE"].count == 1

    assert distribution.total_tasks == 5
    assert distribution.urgent_tasks == 3  # Done 1, Todo 1, Overdue
    assert distribution.important_tasks == 3  # Done 1, Done 2, Overdue


@pytest.mark.asyncio
async def test_get_completion_trends(test_db, test_user, sample_tasks):
    """Test completion trends over time."""
    service = AnalyticsService(test_db)

    trends = await service.get_completion_trends(test_user.id, period="week", days=7)

    assert trends.period == "week"
    assert len(trends.data) == 8  # 7 days + 1
    assert trends.total_completed == 2
    assert trends.total_created == 4  # Only tasks created in last 7 days (Done 2 was created 10 days ago)
    assert trends.net_change == 2  # created - completed
    assert trends.completion_velocity > 0  # Should have some velocity


@pytest.mark.asyncio
async def test_get_overview_empty_tasks(test_db, test_user):
    """Test overview analytics with no tasks."""
    service = AnalyticsService(test_db)

    overview = await service.get_overview(test_user.id)

    assert overview.total_tasks == 0
    assert overview.completed_tasks == 0
    assert overview.pending_tasks == 0
    assert overview.overdue_tasks == 0
    assert overview.completion_rate == 0.0
    assert overview.productivity_score == 0.0


@pytest.mark.asyncio
async def test_get_priority_distribution_all_same_quadrant(test_db, test_user):
    """Test priority distribution when all tasks are in same quadrant."""
    # Create 3 tasks all in DO_FIRST quadrant
    for i in range(3):
        task = Task(
            title=f"Urgent Important Task {i}",
            user_id=test_user.id,
            is_urgent=True,
            is_important=True,
            status=TaskStatus.TODO
        )
        test_db.add(task)
    await test_db.commit()

    service = AnalyticsService(test_db)
    distribution = await service.get_priority_distribution(test_user.id)

    assert distribution.by_quadrant["DO_FIRST"].count == 3
    assert distribution.by_quadrant["SCHEDULE"].count == 0
    assert distribution.by_quadrant["DELEGATE"].count == 0
    assert distribution.by_quadrant["ELIMINATE"].count == 0
    assert distribution.total_tasks == 3
