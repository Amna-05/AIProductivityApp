"""
Application configuration using Pydantic Settings.

Best Practice: 
- Type-safe configuration
- Environment-based settings
- Validation at startup
- Single source of truth
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """
    Application settings.
    
    These automatically load from environment variables.
    Prefix with app name to avoid conflicts in production.
    """
    
    # API Settings
    PROJECT_NAME: str = "Task Manager API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # Security
    ALLOWED_HOSTS: List[str] = ["*"]  # In production: ["yourdomain.com"]
    
    # CORS - For frontend apps
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React default
        "http://localhost:8080",  # Vue default
    ]
        
    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str  # For Alembic migrations
    
    # Database Pool Settings (Production-ready!)
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600  # Recycle connections after 1 hour
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra env vars
    )


# Singleton pattern - instantiate once
settings = Settings()