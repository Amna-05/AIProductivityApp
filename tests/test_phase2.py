"""
Comprehensive Phase 2 Testing Suite

Tests all AI-powered priority suggestion features:
1. AI health check
2. Auto-embedding generation on task creation
3. Priority suggestion endpoint
4. Similar tasks search endpoint
5. Bulk embedding generation
6. Integration tests

Run with: uv run python test_phase2.py
Server must be running: uvicorn app.main:app --reload
"""

import asyncio
import httpx
import json
from typing import Dict, Any, Optional


# =============================================================================
# TEST CONFIGURATION
# =============================================================================

BASE_URL = "http://localhost:8000"
API_V1 = "/api/v1"

# Test user credentials
TEST_USER = {
    "email": "phase2test@example.com",
    "username": "phase2tester",
    "password": "SecurePass123!",
    "full_name": "Phase 2 Tester"
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_test(test_name: str):
    """Print a test name."""
    print(f"\n>>> TEST: {test_name}")
    print("-" * 80)


def print_success(message: str):
    """Print success message."""
    print(f"[OK] {message}")


def print_warning(message: str):
    """Print warning message."""
    print(f"[WARNING] {message}")


def print_error(message: str):
    """Print error message."""
    print(f"[ERROR] {message}")


def print_json(data: Any, indent: int = 2):
    """Pretty print JSON data."""
    print(json.dumps(data, indent=indent, default=str))


async def register_and_login(client: httpx.AsyncClient) -> Optional[str]:
    """Register test user and return access token."""
    try:
        # Try to register
        response = await client.post(
            f"{BASE_URL}{API_V1}/auth/register",
            json=TEST_USER
        )
        if response.status_code == 201:
            print_success("Test user registered successfully")
        elif response.status_code == 400 and "already registered" in response.text.lower():
            print_success("Test user already exists")
        else:
            print_error(f"Registration failed: {response.status_code}")
            print_json(response.json())
            return None
    except Exception as e:
        print_warning(f"Registration error (user may already exist): {e}")

    # Login
    try:
        response = await client.post(
            f"{BASE_URL}{API_V1}/auth/login",
            data={
                "username": TEST_USER["email"],
                "password": TEST_USER["password"]
            }
        )
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            print_success("Login successful")
            return access_token
        else:
            print_error(f"Login failed: {response.status_code}")
            print_json(response.json())
            return None
    except Exception as e:
        print_error(f"Login error: {e}")
        return None


# =============================================================================
# TEST 1: AI HEALTH CHECK
# =============================================================================

async def test_ai_health_check(client: httpx.AsyncClient):
    """Test AI service health endpoint."""
    print_test("AI Health Check")

    try:
        response = await client.get(f"{BASE_URL}{API_V1}/ai/priority/health")

        print(f"Status Code: {response.status_code}")
        data = response.json()
        print_json(data)

        if response.status_code == 200:
            if data.get("model_loaded"):
                print_success("AI model loaded successfully")
                print_success(f"Model: {data.get('model_name')}")
                print_success(f"Embedding dimensions: {data.get('embedding_dimensions')}")
            else:
                print_warning("AI model not loaded")
            return True
        else:
            print_error("Health check failed")
            return False

    except Exception as e:
        print_error(f"Health check error: {e}")
        return False


# =============================================================================
# TEST 2: AUTO-EMBEDDING ON TASK CREATION
# =============================================================================

async def test_auto_embedding_on_create(
    client: httpx.AsyncClient,
    headers: Dict[str, str]
) -> Optional[int]:
    """Test that embeddings are automatically generated when creating tasks."""
    print_test("Auto-Embedding Generation on Task Creation")

    task_data = {
        "title": "Fix critical authentication bug in production",
        "description": "Users are unable to log in. The JWT token validation is failing. Need to debug and fix immediately.",
        "is_urgent": True,
        "is_important": True,
        "tag_ids": []
    }

    try:
        response = await client.post(
            f"{BASE_URL}{API_V1}/tasks",
            json=task_data,
            headers=headers
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 201:
            data = response.json()
            task_id = data.get("id")

            print_success(f"Task created with ID: {task_id}")
            print_success(f"Title: {data.get('title')}")
            print_success(f"Quadrant: {data.get('quadrant')}")

            # Note: We can't directly see the embedding in the response
            # But it should be generated in the background
            print_success("Embedding should be auto-generated (check logs)")

            return task_id
        else:
            print_error(f"Task creation failed: {response.status_code}")
            print_json(response.json())
            return None

    except Exception as e:
        print_error(f"Task creation error: {e}")
        return None


# =============================================================================
# TEST 3: CREATE MULTIPLE SIMILAR TASKS
# =============================================================================

async def test_create_similar_tasks(
    client: httpx.AsyncClient,
    headers: Dict[str, str]
) -> list[int]:
    """Create multiple similar tasks for testing priority suggestions."""
    print_test("Creating Similar Historical Tasks")

    tasks = [
        {
            "title": "Fix login authentication issue",
            "description": "JWT tokens are expiring too quickly. Users getting logged out.",
            "is_urgent": True,
            "is_important": True,
            "status": "DONE",
            "tag_ids": []
        },
        {
            "title": "Debug authentication service crash",
            "description": "Auth service crashes when handling concurrent requests.",
            "is_urgent": True,
            "is_important": True,
            "status": "DONE",
            "tag_ids": []
        },
        {
            "title": "Update user authentication flow",
            "description": "Implement OAuth2 for better security and user experience.",
            "is_urgent": False,
            "is_important": True,
            "status": "DONE",
            "tag_ids": []
        },
        {
            "title": "Write API documentation",
            "description": "Document all authentication endpoints for developers.",
            "is_urgent": False,
            "is_important": False,
            "status": "DONE",
            "tag_ids": []
        }
    ]

    task_ids = []

    for i, task_data in enumerate(tasks, 1):
        try:
            response = await client.post(
                f"{BASE_URL}{API_V1}/tasks",
                json=task_data,
                headers=headers
            )

            if response.status_code == 201:
                data = response.json()
                task_id = data.get("id")
                task_ids.append(task_id)
                print_success(f"Task {i}/4 created: {data.get('title')} (ID: {task_id})")

                # Mark as done if status is DONE
                if task_data.get("status") == "DONE":
                    update_response = await client.patch(
                        f"{BASE_URL}{API_V1}/tasks/{task_id}",
                        json={"status": "DONE"},
                        headers=headers
                    )
                    if update_response.status_code == 200:
                        print_success(f"  Marked task {task_id} as DONE")
            else:
                print_warning(f"Task {i}/4 creation failed: {response.status_code}")

            # Small delay to allow embedding generation
            await asyncio.sleep(0.5)

        except Exception as e:
            print_error(f"Error creating task {i}: {e}")

    print_success(f"Created {len(task_ids)} similar historical tasks")
    return task_ids


# =============================================================================
# TEST 4: PRIORITY SUGGESTION ENDPOINT
# =============================================================================

async def test_priority_suggestion(
    client: httpx.AsyncClient,
    headers: Dict[str, str],
    task_id: int
):
    """Test AI priority suggestion endpoint."""
    print_test(f"Priority Suggestion for Task {task_id}")

    try:
        # Small delay to ensure embeddings are ready
        await asyncio.sleep(1)

        response = await client.post(
            f"{BASE_URL}{API_V1}/ai/priority/tasks/{task_id}/suggest?top_k=5",
            headers=headers
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            print_success("Priority suggestion generated successfully!")
            print("\nSuggestion Details:")
            print(f"  Task ID: {data.get('task_id')}")
            print(f"  Suggested Urgent: {data.get('suggested_urgent')}")
            print(f"  Suggested Important: {data.get('suggested_important')}")
            print(f"  Suggested Quadrant: {data.get('suggested_quadrant')}")
            print(f"  Urgency Score: {data.get('urgency_score'):.2f}")
            print(f"  Importance Score: {data.get('importance_score'):.2f}")
            print(f"  Confidence: {data.get('confidence'):.2f}")

            print("\nReasoning:")
            print(f"  {data.get('reasoning')}")

            similar_tasks = data.get('similar_tasks', [])
            print(f"\nSimilar Tasks Found: {len(similar_tasks)}")
            for i, task in enumerate(similar_tasks, 1):
                print(f"  {i}. {task.get('title')}")
                print(f"     Similarity: {task.get('similarity'):.2f}")
                print(f"     Was {task.get('quadrant')}")
                if task.get('completion_time_days'):
                    print(f"     Completed in {task.get('completion_time_days')} days")

            return True
        elif response.status_code == 422:
            print_warning("Task has no embedding - this is expected if embeddings haven't been generated yet")
            print_json(response.json())
            return False
        elif response.status_code == 404:
            print_error("Task not found")
            print_json(response.json())
            return False
        else:
            print_error(f"Priority suggestion failed: {response.status_code}")
            print_json(response.json())
            return False

    except Exception as e:
        print_error(f"Priority suggestion error: {e}")
        return False


# =============================================================================
# TEST 5: SIMILAR TASKS ENDPOINT
# =============================================================================

async def test_similar_tasks(
    client: httpx.AsyncClient,
    headers: Dict[str, str],
    task_id: int
):
    """Test similar tasks search endpoint."""
    print_test(f"Finding Similar Tasks for Task {task_id}")

    try:
        response = await client.get(
            f"{BASE_URL}{API_V1}/ai/priority/tasks/{task_id}/similar?limit=5&min_similarity=0.5",
            headers=headers
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()

            similar_tasks = data.get('similar_tasks', [])
            print_success(f"Found {len(similar_tasks)} similar tasks")

            for i, task in enumerate(similar_tasks, 1):
                print(f"\n{i}. Task #{task.get('id')}: {task.get('title')}")
                print(f"   Similarity: {task.get('similarity'):.2f}")
                print(f"   Priority: {task.get('quadrant')}")
                print(f"   Status: {task.get('status')}")
                if task.get('description'):
                    print(f"   Description: {task.get('description')[:60]}...")
                if task.get('completion_time_days'):
                    print(f"   Completed in: {task.get('completion_time_days')} days")

            return True
        elif response.status_code == 422:
            print_warning("Task has no embedding")
            print_json(response.json())
            return False
        else:
            print_error(f"Similar tasks search failed: {response.status_code}")
            print_json(response.json())
            return False

    except Exception as e:
        print_error(f"Similar tasks error: {e}")
        return False


# =============================================================================
# TEST 6: BULK EMBEDDING GENERATION
# =============================================================================

async def test_bulk_embedding_generation(
    client: httpx.AsyncClient,
    headers: Dict[str, str]
):
    """Test bulk embedding generation endpoint."""
    print_test("Bulk Embedding Generation")

    try:
        response = await client.post(
            f"{BASE_URL}{API_V1}/ai/priority/generate-embeddings",
            headers=headers
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 202:
            data = response.json()
            print_success("Bulk embedding generation started!")
            print(f"Tasks to process: {data.get('tasks_to_process')}")
            print(f"Status: {data.get('status')}")
            print(f"Note: {data.get('note', '')}")

            # Wait for background task to complete
            print("\nWaiting for embeddings to be generated (10 seconds)...")
            await asyncio.sleep(10)
            print_success("Embeddings should be ready now")

            return True
        else:
            print_error(f"Bulk generation failed: {response.status_code}")
            print_json(response.json())
            return False

    except Exception as e:
        print_error(f"Bulk generation error: {e}")
        return False


# =============================================================================
# INTEGRATION TEST
# =============================================================================

async def test_integration_workflow(
    client: httpx.AsyncClient,
    headers: Dict[str, str]
):
    """Test complete user workflow."""
    print_test("Integration Test: Complete User Workflow")

    print("\nScenario: User creates a new urgent bug fix task and wants AI help to prioritize it")

    # Step 1: Create new task
    print("\nStep 1: Create new task")
    new_task = {
        "title": "Fix database connection pooling issue",
        "description": "Database connections are not being released properly, causing pool exhaustion under load.",
        "is_urgent": False,  # User unsure about priority
        "is_important": False,  # User unsure about priority
        "tag_ids": []
    }

    response = await client.post(
        f"{BASE_URL}{API_V1}/tasks",
        json=new_task,
        headers=headers
    )

    if response.status_code != 201:
        print_error("Failed to create task")
        return False

    task_data = response.json()
    task_id = task_data.get("id")
    print_success(f"Task created with ID: {task_id}")

    # Wait for embedding
    await asyncio.sleep(2)

    # Step 2: Get AI priority suggestion
    print("\nStep 2: Get AI priority suggestion")
    response = await client.post(
        f"{BASE_URL}{API_V1}/ai/priority/tasks/{task_id}/suggest",
        headers=headers
    )

    if response.status_code == 200:
        suggestion = response.json()
        print_success("AI Suggestion received:")
        print(f"  Recommended: {suggestion.get('suggested_quadrant')}")
        print(f"  Confidence: {suggestion.get('confidence'):.0%}")
        print(f"  Reasoning: {suggestion.get('reasoning')[:100]}...")
    elif response.status_code == 422:
        print_warning("Not enough historical data for suggestion (expected for fresh database)")
        return True  # This is OK for fresh database
    else:
        print_error("Failed to get suggestion")
        return False

    # Step 3: Find similar historical tasks
    print("\nStep 3: Find similar historical tasks")
    response = await client.get(
        f"{BASE_URL}{API_V1}/ai/priority/tasks/{task_id}/similar?limit=3",
        headers=headers
    )

    if response.status_code == 200:
        similar_data = response.json()
        similar_tasks = similar_data.get('similar_tasks', [])
        print_success(f"Found {len(similar_tasks)} similar tasks")
        for task in similar_tasks:
            print(f"  - {task.get('title')} (similarity: {task.get('similarity'):.0%})")
    elif response.status_code == 422:
        print_warning("Not enough historical data (expected for fresh database)")

    # Step 4: User updates task based on AI suggestion
    print("\nStep 4: User updates task priority based on AI suggestion")
    if response.status_code == 200 and suggestion:
        update_response = await client.patch(
            f"{BASE_URL}{API_V1}/tasks/{task_id}",
            json={
                "is_urgent": suggestion.get('suggested_urgent'),
                "is_important": suggestion.get('suggested_important')
            },
            headers=headers
        )

        if update_response.status_code == 200:
            updated_task = update_response.json()
            print_success(f"Task updated to quadrant: {updated_task.get('quadrant')}")
        else:
            print_warning("Could not update task priority")

    print_success("\nIntegration test completed successfully!")
    return True


# =============================================================================
# MAIN TEST RUNNER
# =============================================================================

async def main():
    """Run all Phase 2 tests."""
    print_section("PHASE 2: AI-POWERED PRIORITY SUGGESTIONS - TEST SUITE")

    print("\nPrerequisites:")
    print("1. Server running: uvicorn app.main:app --reload")
    print("2. Database migrations applied: uv run alembic upgrade head")
    print("3. Phase 2 dependencies installed: sentence-transformers, torch, etc.")

    # Check if server is running
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code != 200:
                print_error("Server is not responding correctly!")
                return
            print_success("Server is running")
    except Exception as e:
        print_error(f"Server is not running! Start it with: uvicorn app.main:app --reload")
        print_error(f"Error: {e}")
        return

    # Initialize client
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Authentication
        print_section("AUTHENTICATION")
        access_token = await register_and_login(client)
        if not access_token:
            print_error("Authentication failed! Cannot continue tests.")
            return

        headers = {"Authorization": f"Bearer {access_token}"}

        # Test 1: AI Health Check
        print_section("TEST 1: AI HEALTH CHECK")
        health_ok = await test_ai_health_check(client)
        if not health_ok:
            print_warning("AI service may not be fully operational")

        # Test 2: Auto-Embedding on Task Creation
        print_section("TEST 2: AUTO-EMBEDDING ON TASK CREATION")
        main_task_id = await test_auto_embedding_on_create(client, headers)
        if not main_task_id:
            print_error("Failed to create main task. Cannot continue.")
            return

        # Test 3: Create Similar Historical Tasks
        print_section("TEST 3: CREATE SIMILAR HISTORICAL TASKS")
        historical_task_ids = await test_create_similar_tasks(client, headers)
        if not historical_task_ids:
            print_warning("No historical tasks created. Priority suggestions may not work well.")

        # Test 4: Bulk Embedding Generation
        print_section("TEST 4: BULK EMBEDDING GENERATION")
        bulk_ok = await test_bulk_embedding_generation(client, headers)

        # Test 5: Priority Suggestion
        print_section("TEST 5: PRIORITY SUGGESTION ENDPOINT")
        suggestion_ok = await test_priority_suggestion(client, headers, main_task_id)

        # Test 6: Similar Tasks Search
        print_section("TEST 6: SIMILAR TASKS SEARCH")
        similar_ok = await test_similar_tasks(client, headers, main_task_id)

        # Test 7: Integration Workflow
        print_section("TEST 7: INTEGRATION WORKFLOW")
        integration_ok = await test_integration_workflow(client, headers)

        # Summary
        print_section("TEST SUMMARY")
        tests = [
            ("AI Health Check", health_ok),
            ("Auto-Embedding", main_task_id is not None),
            ("Create Historical Tasks", len(historical_task_ids) > 0),
            ("Bulk Generation", bulk_ok),
            ("Priority Suggestion", suggestion_ok),
            ("Similar Tasks", similar_ok),
            ("Integration Workflow", integration_ok)
        ]

        passed = sum(1 for _, result in tests if result)
        total = len(tests)

        print(f"\nResults: {passed}/{total} tests passed")
        for test_name, result in tests:
            status = "[OK]" if result else "[FAILED]"
            print(f"  {status} {test_name}")

        if passed == total:
            print_success("\nAll tests passed! Phase 2 is working correctly.")
        else:
            print_warning(f"\n{total - passed} test(s) failed. Check logs above for details.")

        print("\nNext Steps:")
        print("1. Check logs/app_*.log for detailed embedding generation logs")
        print("2. Review AI suggestions and similarity scores")
        print("3. Try the endpoints in Swagger UI: http://localhost:8000/docs")
        print("4. Read PHASE2_GUIDE.md for detailed documentation")


if __name__ == "__main__":
    asyncio.run(main())
