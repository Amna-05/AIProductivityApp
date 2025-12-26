"""
Authentication endpoints with refresh token support.
Cookie-based authentication (production-ready).
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.db.database import get_db
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.refresh_token_repository import RefreshTokenRepository
from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag
from app.services.email_service import email_service

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user and automatically log them in.
    
    After registration, user immediately gets:
    - access_token (15 min) 
    - refresh_token (7 days)
    
    User can immediately access all protected routes without logging in separately.
    """
    user_repo = UserRepository(db)
    token_repo = RefreshTokenRepository(db)
    
    # Check if email exists
    existing_user = await user_repo.get_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_username = await user_repo.get_by_username(user.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    db_user = await user_repo.create(user)
    
    # 🆕 CREATE DEFAULT CATEGORIES
    default_categories = [
        {"name": "Personal", "color": "#3B82F6", "icon": "👤"},
        {"name": "Work", "color": "#10B981", "icon": "💼"},
        {"name": "Health", "color": "#EF4444", "icon": "💪"},
        {"name": "Finance", "color": "#F59E0B", "icon": "💰"},
    ]
    
    for cat_data in default_categories:
        db_category = Category(**cat_data, user_id=db_user.id)
        db.add(db_category)
    
    # 🆕 CREATE SYSTEM TAGS
    system_tags = [
        {"name": "urgent", "color": "#EF4444"},      # Red
        {"name": "important", "color": "#F59E0B"},   # Orange
        {"name": "normal", "color": "#6B7280"},      # Gray
    ]
    
    for tag_data in system_tags:
        db_tag = Tag(**tag_data, user_id=db_user.id)
        db.add(db_tag)
    
    await db.commit()
    await db.refresh(db_user)
    
    # Auto-login: Create tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=access_token_expires
    )
    
    refresh_token = await token_repo.create(db_user.id)
    
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        domain=settings.COOKIE_DOMAIN
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token.token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        domain=settings.COOKIE_DOMAIN
    )
    
    return {
        "message": "Registration successful. You are now logged in!",
        "user": UserResponse.model_validate(db_user)
    }


@router.post("/login")
async def login(
    user_credentials: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.
    
    Sets httpOnly cookies:
    - access_token (15 min)
    - refresh_token (7 days)
    
    After login, user can access all protected routes automatically.
    """
    user_repo = UserRepository(db)
    token_repo = RefreshTokenRepository(db)
    
    # Authenticate user
    user = await user_repo.authenticate(user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create access token (15 min)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Create refresh token (7 days)
    refresh_token = await token_repo.create(user.id)
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        domain=settings.COOKIE_DOMAIN
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token.token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        domain=settings.COOKIE_DOMAIN
    )
    
    return {
        "message": "Login successful. You can now access protected routes.",
        "user": UserResponse.model_validate(user)
    }


@router.post("/refresh")
async def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    
    Called automatically by frontend when access token expires (after 15 min).
    User stays logged in without re-entering credentials.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found. Please login again."
        )
    
    token_repo = RefreshTokenRepository(db)
    user_repo = UserRepository(db)
    
    # Validate refresh token
    db_token = await token_repo.get_by_token(refresh_token)
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please login again."
        )
    
    # Get user
    user = await user_repo.get_by_email(db_token.user.email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    # Set new access token cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE,
        domain=settings.COOKIE_DOMAIN
    )
    
    return {
        "message": "Access token refreshed successfully"
    }


@router.post("/logout")
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout current session.
    Clears cookies and revokes refresh token.
    """
    # Revoke refresh token if exists
    if refresh_token:
        token_repo = RefreshTokenRepository(db)
        await token_repo.revoke_token(refresh_token)
    
    # Clear cookies
    response.delete_cookie(key="access_token", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", domain=settings.COOKIE_DOMAIN)
    
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current logged-in user info.
    Requires authentication.
    """
    return UserResponse.model_validate(current_user)


# ============================================================
# PASSWORD RESET ENDPOINTS (Minimal Implementation)
# ============================================================

class ForgotPasswordRequest(BaseModel):
    """Request password reset."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password with token."""
    token: str = Field(..., min_length=40)
    new_password: str = Field(..., min_length=8, max_length=100)


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset.

    Minimal implementation:
    - Reuses refresh_tokens table (no new table needed)
    - Logs reset link to console (portfolio-friendly)
    - Always returns success (prevents user enumeration)

    Production upgrade: Replace print() with SendGrid/AWS SES email.
    """
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(request.email)

    if user and user.is_active:
        # Reuse refresh token mechanism
        token_repo = RefreshTokenRepository(db)
        reset_token = await token_repo.create(user.id)

        # Send password reset email
        # Falls back to console logging if RESEND_API_KEY not configured
        await email_service.send_password_reset_email(
            to_email=user.email,
            reset_token=reset_token.token,
            username=user.username
        )

    # Always return success (prevent user enumeration)
    return {
        "message": "If an account exists with this email, you will receive a password reset link via email."
    }


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using token.

    Security:
    - Validates token exists
    - Enforces password length (8+ chars)
    - Revokes token after use (one-time use)
    - Invalidates all sessions (user must re-login)
    """
    token_repo = RefreshTokenRepository(db)
    user_repo = UserRepository(db)

    # Validate token
    db_token = await token_repo.get_by_token(request.token)
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Get user
    user = await user_repo.get_by_id(db_token.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or inactive"
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    await db.commit()

    # Revoke token (one-time use)
    await token_repo.revoke_token(request.token)

    # Revoke all other sessions (force re-login)
    await token_repo.revoke_all_user_tokens(user.id)

    return {
        "message": "Password reset successful. Please login with your new password."
    }