# tests/test_advanced_filtering.py

"""
Advanced filtering and edge case tests.
"""

import pytest
import httpx
import asyncio
from datetime import datetime, timedelta, timezone


async def test_filter_by_category():
    """Test filtering tasks by category."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup: Register and get auth
        await client.post("/auth/register", json={
            "email": "cattest@example.com",
            "username": "cattest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        refresh_token = client.cookies.get("refresh_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={refresh_token}"}
        
        # Get categories
        cat_response = await client.get("/categories", headers=headers)
        categories = cat_response.json()
        work_cat = next(c for c in categories if c["name"] == "Work")
        personal_cat = next(c for c in categories if c["name"] == "Personal")
        
        # Create tasks in different categories
        await client.post("/tasks", headers=headers, json={
            "title": "Work Task 1",
            "category_id": work_cat["id"]
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Work Task 2",
            "category_id": work_cat["id"]
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Personal Task",
            "category_id": personal_cat["id"]
        })
        
        # Test: Filter by Work category
        print("\n🧪 Test: Filter by Work Category")
        response = await client.get(f"/tasks?category_id={work_cat['id']}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert all(t["category"]["id"] == work_cat["id"] for t in data["tasks"])
        print(f"✅ Found {data['total']} work tasks")
        
        # Test: Filter by multiple categories
        print("\n🧪 Test: Filter by Multiple Categories")
        multi_response = await client.get(
            f"/tasks?category_ids={work_cat['id']},{personal_cat['id']}",
            headers=headers
        )
        assert multi_response.status_code == 200
        assert multi_response.json()["total"] == 3
        print("✅ Multiple category filter working")


async def test_filter_by_tags():
    """Test filtering tasks by tags."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "tagtest@example.com",
            "username": "tagtest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        # Get tags
        tags_response = await client.get("/tags", headers=headers)
        tags = tags_response.json()
        urgent_tag = next(t for t in tags if t["name"] == "urgent")
        important_tag = next(t for t in tags if t["name"] == "important")
        
        # Create tasks with different tags
        await client.post("/tasks", headers=headers, json={
            "title": "Urgent Task",
            "tag_ids": [urgent_tag["id"]]
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Important Task",
            "tag_ids": [important_tag["id"]]
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Urgent + Important",
            "tag_ids": [urgent_tag["id"], important_tag["id"]]
        })
        
        # Test: Filter by urgent tag
        print("\n🧪 Test: Filter by Urgent Tag")
        response = await client.get(f"/tasks?tag_ids={urgent_tag['id']}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 2  # At least 2 urgent tasks
        print(f"✅ Found {data['total']} urgent tasks")


async def test_filter_by_priority_matrix():
    """Test filtering by Eisenhower quadrants."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "matrixtest@example.com",
            "username": "matrixtest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        # Create tasks in each quadrant
        await client.post("/tasks", headers=headers, json={
            "title": "Q1: Do First",
            "is_urgent": True,
            "is_important": True
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Q2: Schedule",
            "is_urgent": False,
            "is_important": True
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Q3: Delegate",
            "is_urgent": True,
            "is_important": False
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Q4: Eliminate",
            "is_urgent": False,
            "is_important": False
        })
        
        # Test Q1 filter
        print("\n🧪 Test: Filter DO_FIRST Quadrant")
        q1_response = await client.get("/tasks?quadrant=DO_FIRST", headers=headers)
        assert q1_response.status_code == 200
        q1_data = q1_response.json()
        assert q1_data["total"] >= 1
        assert all(t["is_urgent"] and t["is_important"] for t in q1_data["tasks"])
        print(f"✅ Found {q1_data['total']} DO_FIRST tasks")
        
        # Test Q2 filter
        print("\n🧪 Test: Filter SCHEDULE Quadrant")
        q2_response = await client.get("/tasks?quadrant=SCHEDULE", headers=headers)
        assert q2_response.status_code == 200
        q2_data = q2_response.json()
        assert all(not t["is_urgent"] and t["is_important"] for t in q2_data["tasks"])
        print(f"✅ Found {q2_data['total']} SCHEDULE tasks")


async def test_filter_by_dates():
    """Test date-based filtering."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "datetest@example.com",
            "username": "datetest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        tomorrow = now + timedelta(days=1)
        next_week = now + timedelta(days=7)
        
        # Create tasks with different due dates
        await client.post("/tasks", headers=headers, json={
            "title": "Overdue Task",
            "due_date": yesterday.isoformat(),
            "status": "todo"
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Due Tomorrow",
            "due_date": tomorrow.isoformat()
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Due Next Week",
            "due_date": next_week.isoformat()
        })
        await client.post("/tasks", headers=headers, json={
            "title": "No Due Date",
            "due_date": None
        })
        
        # Test: Overdue filter
        print("\n🧪 Test: Filter Overdue Tasks")
        overdue_response = await client.get("/tasks?overdue_only=true", headers=headers)
        assert overdue_response.status_code == 200
        overdue_data = overdue_response.json()
        assert overdue_data["total"] >= 1
        print(f"✅ Found {overdue_data['total']} overdue tasks")
        
        # Test: Due before filter
        print("\n🧪 Test: Filter Tasks Due Before Date")
        before_response = await client.get(
            f"/tasks?due_before={next_week.isoformat()}",
            headers=headers
        )
        assert before_response.status_code == 200
        print("✅ Due before filter working")
        
        # Test: No due date filter
        print("\n🧪 Test: Filter Tasks With No Due Date")
        no_date_response = await client.get("/tasks?no_due_date=true", headers=headers)
        assert no_date_response.status_code == 200
        no_date_data = no_date_response.json()
        assert no_date_data["total"] >= 1
        assert all(t["due_date"] is None for t in no_date_data["tasks"])
        print(f"✅ Found {no_date_data['total']} tasks without due date")


async def test_search_functionality():
    """Test search in title and description."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "searchtest@example.com",
            "username": "searchtest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        # Create tasks with searchable content
        await client.post("/tasks", headers=headers, json={
            "title": "Meeting with client",
            "description": "Discuss project timeline"
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Review document",
            "description": "Client feedback on proposal"
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Team standup",
            "description": "Daily sync meeting"
        })
        
        # Test: Search in title
        print("\n🧪 Test: Search 'meeting' in Title/Description")
        search_response = await client.get("/tasks?search=meeting", headers=headers)
        assert search_response.status_code == 200
        search_data = search_response.json()
        assert search_data["total"] >= 2  # Should find "Meeting" and task with "meeting" in description
        print(f"✅ Found {search_data['total']} tasks matching 'meeting'")
        
        # Test: Search in description
        print("\n🧪 Test: Search 'client'")
        client_search = await client.get("/tasks?search=client", headers=headers)
        assert client_search.status_code == 200
        client_data = client_search.json()
        assert client_data["total"] >= 2
        print(f"✅ Found {client_data['total']} tasks matching 'client'")


async def test_combined_filters():
    """Test combining multiple filters."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "combotest@example.com",
            "username": "combotest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        # Get category
        cat_response = await client.get("/categories", headers=headers)
        work_cat = next(c for c in cat_response.json() if c["name"] == "Work")
        
        # Create various tasks
        await client.post("/tasks", headers=headers, json={
            "title": "Urgent Work Task",
            "category_id": work_cat["id"],
            "is_urgent": True,
            "is_important": True,
            "status": "todo"
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Normal Work Task",
            "category_id": work_cat["id"],
            "is_urgent": False,
            "is_important": False,
            "status": "done"
        })
        
        # Test: Combine category + urgency + status
        print("\n🧪 Test: Combined Filters (Category + Urgent + Status)")
        combo_response = await client.get(
            f"/tasks?category_id={work_cat['id']}&is_urgent=true&status=todo",
            headers=headers
        )
        assert combo_response.status_code == 200
        combo_data = combo_response.json()
        assert combo_data["total"] >= 1
        # Verify all filters applied
        for task in combo_data["tasks"]:
            assert task["category"]["id"] == work_cat["id"]
            assert task["is_urgent"] is True
            assert task["status"] == "todo"
        print(f"✅ Combined filters working: {combo_data['total']} tasks found")


async def test_sorting():
    """Test sorting functionality."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "sorttest@example.com",
            "username": "sorttest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        now = datetime.now(timezone.utc)
        
        # Create tasks with different dates
        await client.post("/tasks", headers=headers, json={
            "title": "Task A",
            "due_date": (now + timedelta(days=1)).isoformat()
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Task C",
            "due_date": (now + timedelta(days=3)).isoformat()
        })
        await client.post("/tasks", headers=headers, json={
            "title": "Task B",
            "due_date": (now + timedelta(days=2)).isoformat()
        })
        
        # Test: Sort by due_date ascending
        print("\n🧪 Test: Sort by Due Date (Ascending)")
        asc_response = await client.get(
            "/tasks?sort_by=due_date&sort_order=asc",
            headers=headers
        )
        assert asc_response.status_code == 200
        asc_data = asc_response.json()
        dates = [t["due_date"] for t in asc_data["tasks"] if t["due_date"]]
        assert dates == sorted(dates)  # Should be in ascending order
        print("✅ Ascending sort working")
        
        # Test: Sort by title
        print("\n🧪 Test: Sort by Title")
        title_response = await client.get(
            "/tasks?sort_by=title&sort_order=asc",
            headers=headers
        )
        assert title_response.status_code == 200
        title_data = title_response.json()
        titles = [t["title"] for t in title_data["tasks"]]
        assert titles == sorted(titles)
        print("✅ Title sort working")


async def test_pagination():
    """Test pagination functionality."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Setup
        await client.post("/auth/register", json={
            "email": "pagetest@example.com",
            "username": "pagetest",
            "password": "Test123!"
        })
        
        access_token = client.cookies.get("access_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={client.cookies.get('refresh_token')}"}
        
        # Create 15 tasks
        for i in range(15):
            await client.post("/tasks", headers=headers, json={
                "title": f"Task {i+1}"
            })
        
        # Test: Get first page (10 items)
        print("\n🧪 Test: Pagination - Page 1")
        page1_response = await client.get("/tasks?skip=0&limit=10", headers=headers)
        assert page1_response.status_code == 200
        page1_data = page1_response.json()
        assert len(page1_data["tasks"]) == 10
        assert page1_data["total"] == 15
        print(f"✅ Page 1: {len(page1_data['tasks'])} tasks (total: {page1_data['total']})")
        
        # Test: Get second page (5 items)
        print("\n🧪 Test: Pagination - Page 2")
        page2_response = await client.get("/tasks?skip=10&limit=10", headers=headers)
        assert page2_response.status_code == 200
        page2_data = page2_response.json()
        assert len(page2_data["tasks"]) == 5  # Remaining tasks
        print(f"✅ Page 2: {len(page2_data['tasks'])} tasks")


if __name__ == "__main__":
    print("=" * 60)
    print("ADVANCED FILTERING TESTS")
    print("=" * 60)
    
    asyncio.run(test_filter_by_category())
    asyncio.run(test_filter_by_tags())
    asyncio.run(test_filter_by_priority_matrix())
    asyncio.run(test_filter_by_dates())
    asyncio.run(test_search_functionality())
    asyncio.run(test_combined_filters())
    asyncio.run(test_sorting())
    asyncio.run(test_pagination())
    
    print("\n" + "=" * 60)
    print("🎉 ALL ADVANCED TESTS PASSED!")
    print("=" * 60)