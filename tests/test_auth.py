# test_auth.py

import httpx
import asyncio

async def test_flow():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
        # Register
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "test5@example.com",
                "username": "test5",
                "password": "Test123!"
            }
        )
        
        print("Register Status:", register_response.status_code)
        print("Cookies:", client.cookies)
        
        # Create task (cookies automatically sent)
        task_response = await client.post(
            "/tasks",
            json={
                "title": "Test Task",
                "is_urgent": True,
                "is_important": True
            }
        )
        
        print("Task Status:", task_response.status_code)
        print("Task Response:", task_response.json())

asyncio.run(test_flow())