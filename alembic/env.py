"""
Alembic environment configuration.

This file tells Alembic:
1. Where to find our database URL
2. Where to find our models (for auto-detection)
3. How to connect to the database
"""

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import asyncio

# ============================================================
# IMPORT YOUR APP'S CONFIG AND MODELS
# ============================================================

# Import your settings to get DATABASE_URL
from app.core.config import settings

# Import Base (the SQLAlchemy registry)
from app.db.database import Base

# Import ALL models so Alembic can detect them
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.task import Task, task_tags  # task_tags is the association table
from app.models.category import Category
from app.models.tag import Tag

# ============================================================
# ALEMBIC CONFIG
# ============================================================

# this is the Alembic Config object
config = context.config

# Set the database URL from our app's settings
# This converts async URL to sync URL for Alembic
print(f"[ALEMBIC DEBUG] INPUT DATABASE_URL: {settings.DATABASE_URL[:60]}...")
print(f"[ALEMBIC DEBUG] SYNC_DATABASE_URL: {settings.SYNC_DATABASE_URL[:60] if settings.SYNC_DATABASE_URL else 'EMPTY'}...")

database_url = settings.DATABASE_URL

# Handle different URL formats
if database_url.startswith("postgresql+asyncpg://"):
    print("[ALEMBIC DEBUG] Converting from asyncpg to psycopg2...")
    # Alembic needs sync driver
    database_url = database_url.replace(
        "postgresql+asyncpg://",
        "postgresql+psycopg2://"
    )
elif database_url.startswith("postgresql://"):
    print("[ALEMBIC DEBUG] Converting from sync postgresql to psycopg2...")
    # If it's already sync postgresql, just add psycopg2
    database_url = database_url.replace(
        "postgresql://",
        "postgresql+psycopg2://"
    )
else:
    print(f"[ALEMBIC DEBUG] WARNING: Unknown URL format! {database_url[:50]}...")

print(f"[ALEMBIC DEBUG] FINAL DATABASE_URL for Alembic: {database_url[:60]}...")
config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

# ============================================================
# MIGRATION FUNCTIONS
# ============================================================

def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    This generates SQL scripts without connecting to the database.
    Useful for production deploys where you want to review SQL first.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    
    This connects to the database and runs migrations directly.
    This is what we'll use most of the time.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


# ============================================================
# RUN MIGRATIONS
# ============================================================

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()