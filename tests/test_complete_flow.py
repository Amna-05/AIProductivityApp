# tests/test_complete_flow.py

"""
Complete end-to-end test suite.
Tests all major endpoints and workflows.
"""

import pytest
import httpx
import asyncio
from datetime import datetime, timedelta, timezone


async def test_complete_auth_and_task_flow():
    """Test complete user journey: register → create task → view tasks → delete."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # 1. REGISTER
        print("\n🧪 Test 1: Register User")
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "fulltest133@example.com",
                "username": "fulltest133",
                "password": "Test123!"
            }
        )
        
        assert register_response.status_code == 201, f"Register failed: {register_response.json()}"
        assert "access_token" in client.cookies
        print("✅ Registration successful")
        
        # Extract tokens for manual header if needed
        access_token = client.cookies.get("access_token")
        refresh_token = client.cookies.get("refresh_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={refresh_token}"}
        
        # 2. GET USER INFO
        print("\n🧪 Test 2: Get Current User")
        me_response = await client.get("/auth/me", headers=headers)
        assert me_response.status_code == 200
        user_data = me_response.json()
        #assert user_data["email"] == "fulltest12@example.com" 
        print(f"✅ Get user info successful {user_data['username'] ,user_data}")
        
        # 3. CREATE CATEGORIES
        print("\n🧪 Test 3: Get Default Categories")
        cat_response = await client.get("/categories", headers=headers)
        assert cat_response.status_code == 200
        categories = cat_response.json()
        assert len(categories) >= 4  # Should have default categories
        print(f"✅ Found {len(categories)} categories {[c['name'] for c in categories]}")
        
        # 4. CREATE TASK
        print("\n🧪 Test 4: Create Task")
        task_response = await client.post(
            "/tasks",
            headers=headers,
            json={
                "title": "Test Task - Urgent",
                "description": "Testing task creation",
                "is_urgent": True,
                "is_important": True,
                "category_id": categories[0]["id"] if categories else None
            }
        )
        
        assert task_response.status_code == 201, f"Task creation failed: {task_response.json()}"
        task_data = task_response.json()
        task_id = task_data["id"]
        assert task_data["title"] == "Test Task - Urgent"
        assert task_data["quadrant"] == "DO_FIRST"
        print(f"✅ Task created with ID {task_id} and quadrant {task_data['quadrant']} and task_data {task_data}")
        
        # 5. GET ALL TASKS
        print("\n🧪 Test 5: Get All Tasks")
        tasks_response = await client.get("/tasks", headers=headers)
        assert tasks_response.status_code == 200
        tasks = tasks_response.json()
        assert tasks["total"] >= 1
        print(f"✅ Found {tasks['total']} tasks")
        
        # 6. GET SINGLE TASK
        print("\n🧪 Test 6: Get Single Task")
        single_task = await client.get(f"/tasks/{task_id}", headers=headers)
        assert single_task.status_code == 200
        assert single_task.json()["id"] == task_id
        print("✅ Single task retrieval successful")
        
        # 7. UPDATE TASK
        print("\n🧪 Test 7: Update Task")
        update_response = await client.patch(
            f"/tasks/{task_id}",
            headers=headers,
            json={"title": "Updated Task Title"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["title"] == "Updated Task Title"
        print("✅ Task updated successfully")
        
        # 8. PRIORITY MATRIX VIEW
        print("\n🧪 Test 8: Priority Matrix")
        matrix_response = await client.get("/tasks/views/priority-matrix", headers=headers)
        assert matrix_response.status_code == 200
        matrix = matrix_response.json()
        assert "quadrants" in matrix
        assert matrix["quadrants"]["DO_FIRST"]["count"] >= 1
        print("✅ Priority matrix working")
        
        # 9. FILTER BY URGENCY
        print("\n🧪 Test 9: Filter Urgent Tasks")
        urgent_response = await client.get("/tasks?is_urgent=true", headers=headers)
        assert urgent_response.status_code == 200
        assert urgent_response.json()["total"] >= 1
        print("✅ Filtering working")
        
        # 10. DELETE TASK
        print("\n🧪 Test 10: Delete Task")
        delete_response = await client.delete(f"/tasks/{task_id}", headers=headers)
        assert delete_response.status_code == 204
        print("✅ Task deleted successfully")
        
        # 11. VERIFY DELETION
        print("\n🧪 Test 11: Verify Deletion")
        verify_response = await client.get(f"/tasks/{task_id}", headers=headers)
        assert verify_response.status_code == 404
        print("✅ Task properly deleted")
        
        print("\n🎉 ALL TESTS PASSED!")


async def test_ai_task_parsing():
    """Test AI task parsing endpoint."""
    
    async with httpx.AsyncClient(
        base_url="http://127.0.0.1:8000/api/v1",
        follow_redirects=True
    ) as client:
        
        # Register
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "aitest@example.com",
                "username": "aitest",
                "password": "Test123!"
            }
        )
        
        access_token = client.cookies.get("access_token")
        refresh_token = client.cookies.get("refresh_token")
        headers = {"Cookie": f"access_token={access_token}; refresh_token={refresh_token}"}
        
        # Test AI parsing
        print("\n🧪 Test AI: Parse Natural Language")
        parse_response = await client.post(
            "/ai/tasks/parse",
            headers=headers,
            json={
                "text": "Call dentist tomorrow at 3pm urgent"
            }
        )
        
        if parse_response.status_code == 200:
            parsed = parse_response.json()
            print(f"✅ AI Parsed: {parsed['title']}")
            print(f"   Due date: {parsed.get('due_date')}")
            print(f"   Urgent: {parsed['is_urgent']}")
            print(f"   Confidence: {parsed['confidence']}")
        else:
            print(f"⚠️ AI endpoint returned: {parse_response.status_code}")
            print(f"   Response: {parse_response.json()}")


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING COMPLETE TEST SUITE")
    print("=" * 60)
    
    asyncio.run(test_complete_auth_and_task_flow())
    asyncio.run(test_ai_task_parsing())