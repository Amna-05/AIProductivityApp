# tests/test_auth.py (ALTERNATIVE FIX)

import httpx
import asyncio

async def test_flow():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000/api/v1") as client:
        # Register
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "test12@example.com",
                "username": "test12",
                "password": "Test123!"
            }
        )
        
        print("Register Status:", register_response.status_code)
        
        # 🆕 MANUALLY EXTRACT COOKIES
        access_token = register_response.cookies.get("access_token")
        refresh_token = register_response.cookies.get("refresh_token")
        
        print(f"Access Token: {access_token[:50]}...")
        print(f"Refresh Token: {refresh_token[:50]}...")
        
        # 🆕 MANUALLY SET COOKIE HEADER
        task_response = await client.post(
            "/tasks",
            headers={
                "Cookie": f"access_token={access_token}; refresh_token={refresh_token}"
            },
            json={
                "title": "Test Task",
                "is_urgent": True,
                "is_important": True
            }
        )
        
        print("Task Status:", task_response.status_code)
        print("Task Response:", task_response.json())

asyncio.run(test_flow())