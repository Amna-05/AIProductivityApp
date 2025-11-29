"""
FastAPI dependencies for authentication.
Cookie-only authentication (production-ready).
"""

from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.database import get_db
from app.db.repositories.user_repository import UserRepository
from app.core.security import decode_access_token
from app.models.user import User


async def get_current_user(
    access_token: Optional[str] = Cookie(None, alias="access_token"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from httpOnly cookie.
    No manual token input needed - browser sends cookie automatically.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please login first.",
        )
    
    email = decode_access_token(access_token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token. Please refresh or login again.",
        )
    
    repo = UserRepository(db)
    user = await repo.get_by_email(email)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure user is active."""
    return current_user