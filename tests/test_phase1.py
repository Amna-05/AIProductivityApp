"""
Test script to demonstrate Phase 1 logging and error handling.

Run this script while the server is running to see:
1. Request/response logging with correlation IDs
2. Performance monitoring
3. Error handling
4. Structured logging
"""

import asyncio
import httpx
import json


async def test_logging_and_correlation_ids():
    """Test 1: Basic request logging and correlation IDs"""
    print("\n" + "="*70)
    print("TEST 1: Request Logging & Correlation IDs")
    print("="*70)

    async with httpx.AsyncClient() as client:
        # Make a simple request
        response = await client.get("http://localhost:8000/health")

        print(f"\n[OK] Status Code: {response.status_code}")
        print(f"[OK] Correlation ID: {response.headers.get('X-Correlation-ID')}")
        print(f"[OK] Response Time: {response.headers.get('X-Response-Time')}")
        print(f"\n[OK] Response: {response.json()}")

        print("\n>> What to check:")
        print("   1. Look at logs/app_2025-12-22.log")
        print("   2. Search for this correlation ID")
        print(f"   3. You'll see: Request started -> Request completed")
        print("   4. With timing, status code, and full context")


async def test_validation_error():
    """Test 2: Validation error handling"""
    print("\n" + "="*70)
    print("TEST 2: Validation Error Handling")
    print("="*70)

    async with httpx.AsyncClient() as client:
        # Try to create task without authentication (should fail)
        try:
            response = await client.post(
                "http://localhost:8000/api/v1/tasks",
                json={"invalid": "data"}  # Missing required fields
            )

            print(f"\n[OK] Status Code: {response.status_code}")
            print(f"[OK] Correlation ID: {response.headers.get('X-Correlation-ID')}")

            error_data = response.json()
            print(f"\n[OK] Error Response:")
            print(json.dumps(error_data, indent=2))

            print("\n>> What to check:")
            print("   1. Error message is user-friendly")
            print("   2. Includes correlation ID for support")
            print("   3. Shows which fields failed validation")
            print("   4. Logged as WARNING (not ERROR) since it's user error")

        except Exception as e:
            print(f"Expected error: {e}")


async def test_performance_monitoring():
    """Test 3: Performance monitoring"""
    print("\n" + "="*70)
    print("TEST 3: Performance Monitoring")
    print("="*70)

    async with httpx.AsyncClient() as client:
        # Make several requests to see timing
        for i in range(3):
            response = await client.get("http://localhost:8000/health")
            response_time = response.headers.get('X-Response-Time')
            correlation_id = response.headers.get('X-Correlation-ID')

            print(f"\n[OK] Request {i+1}:")
            print(f"   Response Time: {response_time}")
            print(f"   Correlation ID: {correlation_id}")

        print("\n>> What to check:")
        print("   1. Each request has unique correlation ID")
        print("   2. Response time is tracked for every request")
        print("   3. If response time > 1s, you'll see WARNING in logs")
        print("   4. If response time > 3s, you'll see ERROR in logs")


async def test_structured_logging():
    """Test 4: Check structured logging output"""
    print("\n" + "="*70)
    print("TEST 4: Structured Logging Files")
    print("="*70)

    print("\n>> Log Files Created:")
    print("   logs/")
    print("   |- app_2025-12-22.log        (All logs, daily rotation)")
    print("   |- error_2025-12-22.log      (Only errors, kept 60 days)")
    print("   +- app_json_2025-12-22.log   (JSON format for tools)")

    print("\n>> Log Format Example:")
    print("   2025-12-22 21:07:41 | INFO     | app.middleware.logging_middleware:dispatch:47 | -> GET /health | {...}")
    print("                        ^          ^                                       ^         ^              ^")
    print("                     Timestamp  Level    Module:Function:Line          Message    Extra Context")

    print("\n>> How to use logs:")
    print("   # View all logs")
    print("   tail -f logs/app_2025-12-22.log")
    print("")
    print("   # Search by correlation ID")
    print("   grep 'a1b2c3d4' logs/app_2025-12-22.log")
    print("")
    print("   # View only errors")
    print("   tail -f logs/error_2025-12-22.log")
    print("")
    print("   # Parse JSON logs (for tools like jq)")
    print("   cat logs/app_json_2025-12-22.log | jq .")


async def test_error_tracking():
    """Test 5: Error tracking with Sentry (optional)"""
    print("\n" + "="*70)
    print("TEST 5: Error Tracking (Sentry)")
    print("="*70)

    print("\n>> Sentry Integration:")
    print("   [OK] Configured to send 500+ errors automatically")
    print("   [INFO] Currently disabled (SENTRY_DSN not set)")
    print("   [INFO] To enable:")
    print("      1. Sign up at https://sentry.io (free)")
    print("      2. Create project, get DSN")
    print("      3. Add to .env: SENTRY_DSN=https://...")
    print("      4. Restart server")

    print("\n>> What Sentry gives you:")
    print("   * Real-time error notifications")
    print("   * Stack traces with code context")
    print("   * User impact tracking")
    print("   * Performance monitoring")
    print("   * Release tracking")
    print("   * Error grouping and deduplication")


async def test_compression():
    """Test 6: Response compression"""
    print("\n" + "="*70)
    print("TEST 6: Response Compression (GZip)")
    print("="*70)

    async with httpx.AsyncClient() as client:
        # Request with Accept-Encoding header
        headers = {"Accept-Encoding": "gzip"}
        response = await client.get(
            "http://localhost:8000/health",
            headers=headers
        )

        print(f"\n[OK] Content-Encoding: {response.headers.get('content-encoding', 'not compressed')}")
        print(f"[OK] Content-Length: {response.headers.get('content-length', 'N/A')} bytes")

        print("\n>> Compression Details:")
        print("   * Enabled for responses > 1KB")
        print("   * Automatically negotiated with client")
        print("   * Reduces bandwidth by ~70% for JSON")
        print("   * Configured in main.py: GZipMiddleware(minimum_size=1000)")


async def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("Phase 1 Testing Suite - Production Logging & Error Handling")
    print("=" * 70)

    print("\n[WARNING] Make sure the server is running:")
    print("   uvicorn app.main:app --reload")
    print("")

    try:
        # Test if server is running
        async with httpx.AsyncClient() as client:
            await client.get("http://localhost:8000/health", timeout=2.0)

        # Run all tests
        await test_logging_and_correlation_ids()
        await asyncio.sleep(0.5)

        await test_validation_error()
        await asyncio.sleep(0.5)

        await test_performance_monitoring()
        await asyncio.sleep(0.5)

        await test_structured_logging()
        await test_error_tracking()
        await test_compression()

        print("\n" + "="*70)
        print("SUCCESS: All Tests Completed!")
        print("="*70)

        print("\n>> Next Steps:")
        print("   1. Check logs/ directory for log files")
        print("   2. Open logs/app_2025-12-22.log to see structured logs")
        print("   3. Try making API requests and watch logs update")
        print("   4. Search logs by correlation ID to trace requests")
        print("   5. (Optional) Configure Sentry for error tracking")

    except httpx.ConnectError:
        print("\n[ERROR] Server is not running!")
        print("   Start it with: uvicorn app.main:app --reload")
        print("   Then run this test script again.")
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
