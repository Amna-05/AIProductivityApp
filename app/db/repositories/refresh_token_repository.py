"""
Refresh Token repository for database operations.
"""

from typing import Optional
from datetime import datetime, timedelta, timezone  #  IMPORTANT: Include timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.refresh_token import RefreshToken
from app.core.security import create_refresh_token
from app.core.config import settings

 
class RefreshTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, user_id: int) -> RefreshToken:
        """Create a new refresh token for a user."""
        token_string = create_refresh_token()
        
        # Use timezone-aware datetime
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        db_token = RefreshToken(
            token=token_string,
            user_id=user_id,
            expires_at=expires_at,
            is_revoked=False
        )
        
        self.db.add(db_token)
        await self.db.commit()
        await self.db.refresh(db_token)
        return db_token
    
    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        """Get refresh token by token string."""
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token == token,
                    RefreshToken.is_revoked == False,
                    RefreshToken.expires_at > datetime.now(timezone.utc)
                )
            )
        )
        return result.scalars().first()
    
    async def revoke_token(self, token: str) -> bool:
        """Revoke a refresh token."""
        db_token = await self.get_by_token(token)
        if not db_token:
            return False
        
        db_token.is_revoked = True
        await self.db.commit()
        return True
    
    async def revoke_all_user_tokens(self, user_id: int) -> int:
        """Revoke all refresh tokens for a user."""
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.is_revoked == False
                )
            )
        )
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            token.is_revoked = True
            count += 1
        
        await self.db.commit()
        return count
    
    async def cleanup_expired_tokens(self) -> int:
        """Delete expired tokens from database."""
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.expires_at < datetime.now(timezone.utc)
            )
        )
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            await self.db.delete(token)
            count += 1
        
        await self.db.commit()
        return count