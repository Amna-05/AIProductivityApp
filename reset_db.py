import asyncio
from app.db.database import engine, Base
from app.models.task import Task
from app.models.user import User
from app.models.refresh_token import RefreshToken

async def reset_database():
    async with engine.begin() as conn:
        # Drop all tables
        await conn.run_sync(Base.metadata.drop_all)
        print("✅ Dropped all tables")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Created all tables")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_database())