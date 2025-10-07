"""
Script to initialize the database.
Run this to create all tables.
"""

import asyncio
from app.db.database import init_db, engine, Base
from app.models import Task  # Import all models


async def reset_database():
    """Drop and recreate all tables."""
    print("🗑️  Dropping all tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    print("✅ Tables dropped!")
    print("🔨 Creating all tables...")
    
    await init_db()
    
    print("✅ Database initialized successfully!")
    print("\nCreated tables:")
    print("- tasks")
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(reset_database())