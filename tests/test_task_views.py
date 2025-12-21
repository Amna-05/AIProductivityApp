# tests/test_task_views.py

"""
Test task view endpoints.

Philosophy: Test business logic, not implementation details.
Focus on what users care about (data correctness), not how we query it.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_priority_matrix_structure(client: AsyncClient, auth_headers: dict):
    """Priority matrix returns correct structure."""
    response = await client.get("/tasks/views/priority-matrix", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate structure
    assert "quadrants" in data
    assert len(data["quadrants"]) == 4
    assert "DO_FIRST" in data["quadrants"]
    assert "summary" in data
    assert "total_active" in data["summary"]


@pytest.mark.asyncio
async def test_priority_matrix_quadrant_classification(
    client: AsyncClient, 
    auth_headers: dict
):
    """Tasks are correctly classified into quadrants."""
    # Create task in Q1 (urgent + important)
    await client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "title": "Q1 Task",
            "is_urgent": True,
            "is_important": True
        }
    )
    
    response = await client.get("/tasks/views/priority-matrix", headers=auth_headers)
    data = response.json()
    
    assert data["quadrants"]["DO_FIRST"]["count"] >= 1
    assert any(
        task["title"] == "Q1 Task" 
        for task in data["quadrants"]["DO_FIRST"]["tasks"]
    )


@pytest.mark.asyncio
async def test_timeline_today_filter(client: AsyncClient, auth_headers: dict):
    """Timeline view correctly filters today's tasks."""
    today = datetime.now(timezone.utc)
    tomorrow = today + timedelta(days=1)
    
    # Create today's task
    await client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "title": "Today's task",
            "due_date": today.isoformat()
        }
    )
    
    # Create tomorrow's task
    await client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "title": "Tomorrow's task",
            "due_date": tomorrow.isoformat()
        }
    )
    
    response = await client.get(
        "/tasks/views/timeline?period=today",
        headers=auth_headers
    )
    
    data = response.json()
    assert data["total"] >= 1
    # Should NOT include tomorrow's task
    assert not any(task["title"] == "Tomorrow's task" for task in data["tasks"])


@pytest.mark.asyncio
async def test_overdue_excludes_completed(client: AsyncClient, auth_headers: dict):
    """Overdue view excludes completed tasks."""
    past_date = datetime.now(timezone.utc) - timedelta(days=2)
    
    # Create overdue but completed task
    response = await client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "title": "Done overdue",
            "due_date": past_date.isoformat(),
            "status": "done"
        }
    )
    task_id = response.json()["id"]
    
    overdue_response = await client.get(
        "/tasks/views/overdue",
        headers=auth_headers
    )
    
    data = overdue_response.json()
    # Should NOT include completed task
    assert not any(task["id"] == task_id for task in data["tasks"])


@pytest.mark.asyncio
async def test_overdue_ordering(client: AsyncClient, auth_headers: dict):
    """Overdue tasks are sorted by due date (oldest first)."""
    now = datetime.now(timezone.utc)
    
    # Create tasks with different overdue dates
    await client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "title": "2 days overdue",
            "due_date": (now - timedelta(days=2)).isoformat()
        }
    )
    await client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "title": "5 days overdue",
            "due_date": (now - timedelta(days=5)).isoformat()
        }
    )
    
    response = await client.get("/tasks/views/overdue", headers=auth_headers)
    tasks = response.json()["tasks"]
    
    if len(tasks) >= 2:
        # First task should be older (more overdue)
        first_due = datetime.fromisoformat(tasks[0]["due_date"].replace('Z', '+00:00'))
        second_due = datetime.fromisoformat(tasks[1]["due_date"].replace('Z', '+00:00'))
        assert first_due <= second_due