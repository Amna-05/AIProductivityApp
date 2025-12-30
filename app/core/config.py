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
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
    ]
        
    # Database (Railway auto-provides DATABASE_URL, we auto-derive SYNC version)
    DATABASE_URL: str
    SYNC_DATABASE_URL: str = ""  # Auto-derived if empty

    def __init__(self, **data):
        super().__init__(**data)
        # Railway provides postgresql:// but async SQLAlchemy needs postgresql+asyncpg://
        if self.DATABASE_URL.startswith("postgresql://"):
            object.__setattr__(
                self,
                "DATABASE_URL",
                self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
            )
        # Auto-derive SYNC_DATABASE_URL for Alembic if not set
        if not self.SYNC_DATABASE_URL:
            sync_url = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
            object.__setattr__(self, "SYNC_DATABASE_URL", sync_url)
    
    # Database Pool Settings 
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600  

    # External APIs and Keys
    GROQ_API_KEY: Optional[str] = ""  # Groq API Key

    # Email Service (Resend)
    RESEND_API_KEY: Optional[str] = "your-resend-api-key-here"  # Get from resend.com
    EMAIL_FROM: str = "ELEVATE <onboarding@resend.dev>"  # Sender email (update in production)
    FRONTEND_URL: str = "http://localhost:3001"  # Frontend URL for reset links

    # Authentication & Security
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days session

    # Cookie Settings (auto-configured based on ENVIRONMENT)
    COOKIE_DOMAIN: str | None = None
    COOKIE_SECURE: bool = False  # Auto-set True in production (see property below)
    COOKIE_SAMESITE: str = "none"  # "none" required for cross-site cookies with Secure

    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.ENVIRONMENT == "production"

    def get_cookie_secure(self) -> bool:
        """
        Get cookie secure setting.
        - Production: True (HTTPS required)
        - Development: False (localhost exception in browsers)

        Note: Chrome allows SameSite=None + Secure=False for localhost
        """
        return self.is_production

    def get_cookie_samesite(self) -> str:
        """
        Get cookie samesite setting.

        With Next.js rewrite proxy, requests are same-origin:
        - Dev: localhost:3000/api/* → localhost:8000/api/* (proxied)
        - Prod: vercel.app/api/* → railway.app/api/* (proxied)

        'lax' is safest and works for same-origin requests.
        """
        return "lax"

    # Logging & Monitoring (Phase 1)
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: Optional[str] = None

    # Rate Limiting (Phase 1)
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60

    # Performance (Phase 1)
    ENABLE_RESPONSE_COMPRESSION: bool = True
    CACHE_ENABLED: bool = False
    CACHE_TTL_SECONDS: int = 300  # 5 minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra env vars
    )


# Singleton pattern - instantiate once
settings = Settings()