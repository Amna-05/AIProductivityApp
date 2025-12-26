"""Create test database for pytest."""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def create_test_db():
    """Create test database if it doesn't exist."""
    # Connect to default postgres database
    engine = create_async_engine(
        "postgresql+asyncpg://postgres:password@localhost:5432/postgres",
        isolation_level="AUTOCOMMIT"
    )

    async with engine.connect() as conn:
        # Check if database exists
        result = await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname='task_manager_test_db'")
        )
        exists = result.scalar()

        if not exists:
            # Create database
            await conn.execute(text("CREATE DATABASE task_manager_test_db"))
            print("Test database 'task_manager_test_db' created successfully!")
        else:
            print("Test database 'task_manager_test_db' already exists.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_test_db())
