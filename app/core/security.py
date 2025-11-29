"""
Security utilities for password hashing and JWT tokens.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    password = password[:72]  # bcrypt limit
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token (short-lived).
    
    Args:
        data: Dictionary with data to encode (usually {"sub": email, "type": "access"})
        expires_delta: Optional custom expiration time
    
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "type": "access"  # Token type
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token() -> str:
    """
    Create a secure random refresh token.
    
    Returns:
        Random URL-safe token string
    """
    return secrets.token_urlsafe(32)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode JWT access token and return email.
    
    Args:
        token: JWT token string
    
    Returns:
        Email from token or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Check token type
        token_type: str = payload.get("type")
        if token_type != "access":
            return None
        
        email: str = payload.get("sub")
        if email is None:
            return None
            
        return email
    except JWTError:
        return None