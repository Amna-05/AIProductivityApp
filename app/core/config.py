"""
Application configuration using Pydantic Settings.

Best Practice: 
- Type-safe configuration
- Environment-based settings
- Validation at startup
- Single source of truth
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List , Optional


class Settings(BaseSettings):
    """
    Application settings.
    
    These automatically load from environment variables.
    Prefix with app name to avoid conflicts in production.
    """
    
    # API Settings
    PROJECT_NAME: str = "Productivity App API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # Security
    ALLOWED_HOSTS: List[str] = ["*"]  
    
    # CORS - For frontend apps
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # React default
        "http://localhost:8080",  # Vue default
    ]
        
    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str  # For Alembic migrations
    
    # Database Pool Settings 
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600  

    # External APIs and Keys
    GROQ_API_KEY:Optional[str] =""  # Groq API Key

    SECRET_KEY: str =  "" 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 

    # Cookie Settings
    COOKIE_DOMAIN: str | None = None
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: str = "lax"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra env vars
    )


# Singleton pattern - instantiate once
settings = Settings()