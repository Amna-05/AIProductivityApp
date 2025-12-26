# Authentication & Authorization Implementation Plan
## Production-Ready Forgot Password + Role-Based Access Control

**Author**: Senior Full-Stack Engineer
**Date**: December 26, 2025
**Project**: Task Manager Application
**Goal**: Extend existing auth with password reset and RBAC without creating duplicate systems

---

## Phase 1: Authentication Review & Analysis

### ✅ Existing Implementation (Strong Foundation)

**Current Auth Flow**:
- **Cookie-based JWT authentication** (production-ready)
- **HttpOnly cookies** for CSRF protection
- **Access tokens** (15 min) + **Refresh tokens** (7 days)
- **Bcrypt password hashing** with salting
- **Token revocation** via database-stored refresh tokens

**Endpoints**:
```
POST   /api/v1/auth/register     # Auto-login after registration
POST   /api/v1/auth/login        # Credential authentication
POST   /api/v1/auth/refresh      # Silent token refresh
POST   /api/v1/auth/logout       # Token revocation
GET    /api/v1/auth/me           # Current user info
```

**Security Strengths**:
- ✅ HttpOnly cookies (no XSS token theft)
- ✅ Refresh token rotation
- ✅ Database token revocation
- ✅ Password strength validation (min 8 chars)
- ✅ Proper CORS configuration
- ✅ Active user checks

**Files Involved**:
- `app/api/endpoints/auth.py` (279 lines) - Auth routes
- `app/core/security.py` (99 lines) - JWT + bcrypt utilities
- `app/core/dependencies.py` (59 lines) - Auth middleware
- `app/models/user.py` (40 lines) - User model
- `app/schemas/user.py` (39 lines) - Pydantic schemas
- `app/db/repositories/user_repository.py` - User CRUD

### ⚠️ Identified Gaps (What Needs Extension)

1. **No Forgot/Reset Password Flow**
   - Users can't recover locked accounts
   - No password reset token mechanism

2. **No Role-Based Authorization**
   - `is_superuser` exists but unused
   - No role enforcement on routes
   - No admin-specific endpoints
   - JWT doesn't include role claims

3. **No Email Service Integration**
   - Password reset requires email sending
   - Currently no SMTP configuration

4. **Missing Admin Features**
   - No user management endpoints
   - No system statistics for admins
   - No audit logging

### 🏗️ Architecture Decision: Extend, Don't Replace

**DO**:
- ✅ Add `role` column to existing `users` table
- ✅ Include role in JWT payload (`create_access_token`)
- ✅ Create role-checking dependencies alongside `get_current_user`
- ✅ Add password reset endpoints to existing `auth.py`
- ✅ Create `password_reset_tokens` table (similar to refresh tokens)

**DON'T**:
- ❌ Create separate admin user table
- ❌ Create second authentication system
- ❌ Duplicate login/registration flows
- ❌ Check roles only in frontend

---

## Phase 2: Forgot Password (Backend)

### 2.1 Database Schema Extension

**New Table: `password_reset_tokens`**

```sql
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,  -- Hashed token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,     -- One-time use tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);
```

**Why This Design**:
- **Hashed tokens**: Store `sha256(token)`, send raw token via email
- **One-time use**: `used_at` ensures token can't be replayed
- **Expiration**: 1-hour lifetime (configurable)
- **Cascade delete**: Tokens deleted when user deleted
- **Separate table**: Clean separation from refresh tokens

**Alembic Migration**:
```python
# alembic/versions/XXXX_add_password_reset_tokens.py
def upgrade():
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )
    op.create_index('idx_prt_token', 'password_reset_tokens', ['token'])
    op.create_index('idx_prt_user_id', 'password_reset_tokens', ['user_id'])
    op.create_index('idx_prt_expires_at', 'password_reset_tokens', ['expires_at'])
```

### 2.2 SQLAlchemy Model

**File: `app/models/password_reset_token.py`** (NEW)

```python
"""Password reset token model."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class PasswordResetToken(Base):
    """Password reset token for account recovery."""

    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)  # Hashed
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="password_reset_tokens")

    def is_valid(self) -> bool:
        """Check if token is valid (not expired, not used)."""
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        return (
            self.used_at is None and
            self.expires_at > now
        )

    def __repr__(self) -> str:
        return f"<PasswordResetToken(user_id={self.user_id}, expires_at={self.expires_at})>"
```

### 2.3 Repository Pattern

**File: `app/db/repositories/password_reset_repository.py`** (NEW)

```python
"""Repository for password reset tokens."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timedelta, timezone
import secrets
import hashlib

from app.models.password_reset_token import PasswordResetToken

class PasswordResetRepository:
    """Manage password reset tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _hash_token(self, raw_token: str) -> str:
        """Hash token for database storage (SHA-256)."""
        return hashlib.sha256(raw_token.encode()).hexdigest()

    async def create(self, user_id: int, expiry_hours: int = 1) -> str:
        """
        Create password reset token for user.

        Returns raw token (unhashed) to send via email.
        Stores hashed version in database.
        """
        # Generate cryptographically secure token (43 chars)
        raw_token = secrets.token_urlsafe(32)
        hashed_token = self._hash_token(raw_token)

        # Delete any existing unused tokens for this user
        await self.delete_user_tokens(user_id)

        # Create new token
        expires_at = datetime.now(timezone.utc) + timedelta(hours=expiry_hours)
        db_token = PasswordResetToken(
            user_id=user_id,
            token=hashed_token,
            expires_at=expires_at
        )

        self.db.add(db_token)
        await self.db.commit()
        await self.db.refresh(db_token)

        return raw_token  # Return unhashed token for email

    async def get_by_token(self, raw_token: str) -> PasswordResetToken | None:
        """Get token by raw token string."""
        hashed_token = self._hash_token(raw_token)
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token == hashed_token
            )
        )
        return result.scalar_one_or_none()

    async def mark_as_used(self, token_id: int):
        """Mark token as used (one-time use)."""
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.id == token_id
            )
        )
        token = result.scalar_one_or_none()
        if token:
            token.used_at = datetime.now(timezone.utc)
            await self.db.commit()

    async def delete_user_tokens(self, user_id: int):
        """Delete all reset tokens for a user."""
        await self.db.execute(
            delete(PasswordResetToken).where(
                PasswordResetToken.user_id == user_id
            )
        )
        await self.db.commit()

    async def cleanup_expired(self):
        """Delete expired tokens (background job)."""
        now = datetime.now(timezone.utc)
        await self.db.execute(
            delete(PasswordResetToken).where(
                PasswordResetToken.expires_at < now
            )
        )
        await self.db.commit()
```

### 2.4 Email Service (Mock for Portfolio)

**File: `app/services/email_service.py`** (NEW)

```python
"""Email service for password reset (mock for portfolio)."""
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    """Send emails for password reset."""

    @staticmethod
    async def send_password_reset_email(
        email: str,
        username: str,
        reset_token: str
    ) -> bool:
        """
        Send password reset email with token link.

        For portfolio: Logs email content instead of actually sending.
        In production: Use SendGrid, AWS SES, or SMTP.
        """
        # Build reset URL
        frontend_url = settings.FRONTEND_URL or "http://localhost:3000"
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        email_body = f"""
Hello {username},

You requested a password reset for your Task Manager account.

Click the link below to reset your password:
{reset_url}

This link expires in 1 hour.

If you didn't request this, ignore this email.

Best regards,
Task Manager Team
        """

        # For portfolio: Log instead of sending
        logger.info("=" * 60)
        logger.info("PASSWORD RESET EMAIL (MOCK)")
        logger.info(f"To: {email}")
        logger.info(f"Subject: Reset Your Password")
        logger.info("-" * 60)
        logger.info(email_body)
        logger.info("=" * 60)

        # In production, replace with actual email sending:
        # await send_via_smtp(email, subject, email_body)
        # or
        # await sendgrid_client.send(...)

        return True
```

### 2.5 Security Utilities Extension

**File: `app/core/security.py`** (MODIFY)

Add password validation function:

```python
# Add to app/core/security.py

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements.

    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if len(password) > 100:
        return False, "Password must be less than 100 characters"

    # Check for at least one number
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"

    # Check for at least one letter
    if not any(c.isalpha() for c in password):
        return False, "Password must contain at least one letter"

    # Check for at least one special character
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character (!@#$%^&*)"

    return True, ""
```

### 2.6 Pydantic Schemas

**File: `app/schemas/user.py`** (MODIFY - Add to existing file)

```python
# Add to app/schemas/user.py

class ForgotPasswordRequest(BaseModel):
    """Request password reset."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password with token."""
    token: str = Field(..., min_length=40)
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v):
        """Validate password meets security requirements."""
        from app.core.security import validate_password_strength
        is_valid, error = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error)
        return v


class PasswordResetResponse(BaseModel):
    """Response for password reset requests."""
    message: str
    success: bool = True
```

### 2.7 Auth Endpoints Extension

**File: `app/api/endpoints/auth.py`** (MODIFY - Add to existing file)

```python
# Add these imports at top
from app.db.repositories.password_reset_repository import PasswordResetRepository
from app.services.email_service import EmailService
from app.schemas.user import ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse
from app.core.security import validate_password_strength, get_password_hash

# Add these endpoints to existing auth.py router

@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset email.

    Security: Always returns success (no user enumeration).
    Generates one-time reset token valid for 1 hour.
    """
    user_repo = UserRepository(db)
    reset_repo = PasswordResetRepository(db)

    # Check if user exists (but don't reveal this to client)
    user = await user_repo.get_by_email(request.email)

    if user and user.is_active:
        # Generate reset token (stores hashed, returns raw)
        reset_token = await reset_repo.create(user.id, expiry_hours=1)

        # Send reset email (mocked for portfolio)
        await EmailService.send_password_reset_email(
            email=user.email,
            username=user.username,
            reset_token=reset_token
        )

    # Always return success (prevent user enumeration)
    return PasswordResetResponse(
        message="If an account exists with this email, you will receive a password reset link."
    )


@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using token from email.

    Security:
    - Validates token (expiration, one-time use)
    - Enforces strong password rules
    - Invalidates token after use
    - Revokes all refresh tokens (force re-login)
    """
    reset_repo = PasswordResetRepository(db)
    user_repo = UserRepository(db)
    token_repo = RefreshTokenRepository(db)

    # Get token from database
    db_token = await reset_repo.get_by_token(request.token)

    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Check if token is valid (not expired, not used)
    if not db_token.is_valid():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired or already been used"
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

    # Mark token as used (one-time use)
    await reset_repo.mark_as_used(db_token.id)

    # Revoke all existing refresh tokens (force re-login on all devices)
    await token_repo.revoke_all_user_tokens(user.id)

    return PasswordResetResponse(
        message="Password reset successful. Please login with your new password."
    )
```

### 2.8 Configuration Updates

**File: `app/core/config.py`** (MODIFY - Add settings)

```python
# Add to Settings class

class Settings(BaseSettings):
    # ... existing settings ...

    # Email configuration (for password reset)
    FRONTEND_URL: str = "http://localhost:3000"  # For reset link
    PASSWORD_RESET_EXPIRE_HOURS: int = 1

    # Email service (for production)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@taskmanager.com"
```

---

## Phase 3: Forgot Password (Frontend)

### 3.1 API Client Extension

**File: `frontend/lib/api/auth.ts`** (MODIFY - Add functions)

```typescript
// Add to existing auth.ts

export const authApi = {
  // ... existing methods (login, register, logout, etc.) ...

  /**
   * Request password reset email
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  },
};
```

### 3.2 Forgot Password Page

**File: `frontend/app/(auth)/forgot-password/page.tsx`** (NEW)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      toast.success(response.message);
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Check Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              If an account exists with <strong>{email}</strong>, you will receive a password reset link.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              The link expires in 1 hour. Check your spam folder if you don't see it.
            </p>
            <Link href="/login" className="mt-6 inline-block text-blue-600 hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Forgot Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3.3 Reset Password Page

**File: `frontend/app/(auth)/reset-password/page.tsx`** (NEW)

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password strength validation
  const [validation, setValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecial: false,
    passwordsMatch: false,
  });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      router.push("/login");
    }
  }, [token, router]);

  useEffect(() => {
    setValidation({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword),
      passwordsMatch: newPassword === confirmPassword && newPassword.length > 0,
    });
  }, [newPassword, confirmPassword]);

  const isValid = Object.values(validation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast.error("Please meet all password requirements");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword(token!, newPassword);
      toast.success(response.message);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Reset Password</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>

          {/* Password Requirements */}
          <div className="text-sm space-y-1">
            <p className="font-medium text-gray-700">Password must contain:</p>
            <ul className="space-y-1">
              <li className={validation.minLength ? "text-green-600" : "text-gray-500"}>
                ✓ At least 8 characters
              </li>
              <li className={validation.hasNumber ? "text-green-600" : "text-gray-500"}>
                ✓ At least one number
              </li>
              <li className={validation.hasLetter ? "text-green-600" : "text-gray-500"}>
                ✓ At least one letter
              </li>
              <li className={validation.hasSpecial ? "text-green-600" : "text-gray-500"}>
                ✓ At least one special character (!@#$%^&*)
              </li>
              <li className={validation.passwordsMatch ? "text-green-600" : "text-gray-500"}>
                ✓ Passwords match
              </li>
            </ul>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isValid}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3.4 Update Login Page

**File: `frontend/app/(auth)/login/page.tsx`** (MODIFY - Add forgot password link)

```typescript
// Add this link below the password input field

<div className="flex items-center justify-between">
  <div className="text-sm">
    <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
      Forgot your password?
    </Link>
  </div>
</div>
```

---

## Phase 4: Role-Based Authorization (Backend)

### 4.1 Database Schema Extension

**Migration: Add `role` column to `users` table**

```python
# alembic/versions/XXXX_add_user_roles.py

def upgrade():
    # Add role column with enum type
    op.add_column(
        'users',
        sa.Column('role', sa.String(20), nullable=False, server_default='user')
    )

    # Create index for role filtering
    op.create_index('idx_users_role', 'users', ['role'])


def downgrade():
    op.drop_index('idx_users_role', table_name='users')
    op.drop_column('users', 'role')
```

### 4.2 Update User Model

**File: `app/models/user.py`** (MODIFY)

```python
# Add import
from enum import Enum as PyEnum

# Add enum before User class
class UserRole(str, PyEnum):
    """User role enumeration."""
    USER = "user"
    ADMIN = "admin"

# Update User class
class User(Base):
    # ... existing columns ...

    role = Column(String(20), nullable=False, default=UserRole.USER, index=True)

    # ... rest of class ...

    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role == UserRole.ADMIN
```

### 4.3 Update JWT Token Creation

**File: `app/core/security.py`** (MODIFY)

```python
# Update create_access_token to include role

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token with role claim.

    Token payload includes:
    - sub: email
    - role: user role (user/admin)
    - exp: expiration
    - type: access
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
        "type": "access"
    })

    # Role should be passed in data dict
    # Example: create_access_token({"sub": email, "role": user.role})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt
```

### 4.4 Update Auth Endpoints to Include Role

**File: `app/api/endpoints/auth.py`** (MODIFY)

```python
# Update register endpoint (line ~94)
access_token = create_access_token(
    data={"sub": db_user.email, "role": db_user.role},  # Add role
    expires_delta=access_token_expires
)

# Update login endpoint (line ~156)
access_token = create_access_token(
    data={"sub": user.email, "role": user.role},  # Add role
    expires_delta=access_token_expires
)

# Update refresh endpoint (line ~230)
access_token = create_access_token(
    data={"sub": user.email, "role": user.role},  # Add role
    expires_delta=access_token_expires
)
```

### 4.5 Role-Based Dependencies

**File: `app/core/dependencies.py`** (MODIFY - Add admin dependency)

```python
# Add import
from app.models.user import UserRole

# Add new dependency after get_current_active_user

async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Ensure current user is an admin.

    Use this dependency on admin-only routes.
    Example: @router.get("/admin/users", dependencies=[Depends(get_current_admin_user)])
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
```

### 4.6 Admin Endpoints

**File: `app/api/endpoints/admin.py`** (NEW)

```python
"""
Admin-only endpoints.
Requires admin role for access.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.db.database import get_db
from app.core.dependencies import get_current_admin_user
from app.models.user import User, UserRole
from app.models.task import Task
from app.schemas.user import UserResponse
from pydantic import BaseModel

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin_user)]  # All routes require admin
)


class SystemStatsResponse(BaseModel):
    """System-wide statistics."""
    total_users: int
    active_users: int
    total_tasks: int
    completed_tasks: int
    admin_users: int


class UserWithStats(BaseModel):
    """User with task statistics."""
    id: int
    email: str
    username: str
    role: str
    is_active: bool
    total_tasks: int
    completed_tasks: int
    created_at: str

    class Config:
        from_attributes = True


@router.get("/users", response_model=List[UserWithStats])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    List all users with task statistics.
    Admin only.
    """
    # Get all users with task counts
    query = select(
        User,
        func.count(Task.id).label("total_tasks"),
        func.sum(func.cast(Task.status == "done", Integer)).label("completed_tasks")
    ).outerjoin(Task).group_by(User.id).order_by(User.created_at.desc())

    result = await db.execute(query)
    users = result.all()

    return [
        UserWithStats(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            total_tasks=total_tasks or 0,
            completed_tasks=completed_tasks or 0,
            created_at=user.created_at.isoformat()
        )
        for user, total_tasks, completed_tasks in users
    ]


@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get system-wide statistics.
    Admin only.
    """
    # Total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()

    # Active users
    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = active_users_result.scalar()

    # Admin users
    admin_users_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.ADMIN)
    )
    admin_users = admin_users_result.scalar()

    # Total tasks
    total_tasks_result = await db.execute(select(func.count(Task.id)))
    total_tasks = total_tasks_result.scalar()

    # Completed tasks
    completed_tasks_result = await db.execute(
        select(func.count(Task.id)).where(Task.status == "done")
    )
    completed_tasks = completed_tasks_result.scalar()

    return SystemStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        admin_users=admin_users
    )


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update user role (promote/demote admin).
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent self-demotion
    if user.id == current_admin.id and role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself"
        )

    user.role = role
    await db.commit()

    return {"message": f"User role updated to {role}"}


@router.patch("/users/{user_id}/active")
async def toggle_user_active(
    user_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Activate/deactivate user account.
    Admin only.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent self-deactivation
    if user.id == current_admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate yourself"
        )

    user.is_active = is_active
    await db.commit()

    status_text = "activated" if is_active else "deactivated"
    return {"message": f"User account {status_text}"}
```

### 4.7 Register Admin Router

**File: `app/main.py`** (MODIFY)

```python
# Add import
from app.api.endpoints import admin

# Register admin router
app.include_router(admin.router, prefix="/api/v1")
```

---

## Phase 5: Role-Based Authorization (Frontend)

### 5.1 Update Auth Store with Role

**File: `frontend/lib/store/authStore.ts`** (MODIFY)

```typescript
// Update User interface
interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  role: "user" | "admin";  // Add role
  created_at: string;
}

// Update store interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;  // Add computed property
  // ... rest
}

// Update store implementation
export const useAuthStore = create<AuthState>((set, get) => ({
  // ... existing state ...

  isAdmin: false,

  // Update setUser to set isAdmin
  setUser: (user: User | null) =>
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
    }),

  // ... rest of methods ...
}));
```

### 5.2 Admin API Client

**File: `frontend/lib/api/admin.ts`** (NEW)

```typescript
import apiClient from "./client";

export interface SystemStats {
  total_users: number;
  active_users: number;
  total_tasks: number;
  completed_tasks: number;
  admin_users: number;
}

export interface UserWithStats {
  id: number;
  email: string;
  username: string;
  role: "user" | "admin";
  is_active: boolean;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
}

export const adminApi = {
  /**
   * Get system statistics (admin only)
   */
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await apiClient.get("/admin/stats");
    return response.data;
  },

  /**
   * List all users with stats (admin only)
   */
  getAllUsers: async (): Promise<UserWithStats[]> => {
    const response = await apiClient.get("/admin/users");
    return response.data;
  },

  /**
   * Update user role (admin only)
   */
  updateUserRole: async (userId: number, role: "user" | "admin"): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/role`, { role });
  },

  /**
   * Toggle user active status (admin only)
   */
  toggleUserActive: async (userId: number, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/active`, { is_active: isActive });
  },
};
```

### 5.3 Protected Route Wrapper

**File: `frontend/components/auth/ProtectedRoute.tsx`** (NEW)

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push("/dashboard");  // Redirect non-admins
    }
  }, [isAuthenticated, isAdmin, requireAdmin, router]);

  if (!isAuthenticated) {
    return null;  // Or loading spinner
  }

  if (requireAdmin && !isAdmin) {
    return null;  // Or 403 page
  }

  return <>{children}</>;
}
```

### 5.4 Admin Dashboard Page

**File: `frontend/app/(dashboard)/admin/page.tsx`** (NEW)

```typescript
"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { adminApi, SystemStats, UserWithStats } from "@/lib/api/admin";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle, Shield } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        adminApi.getSystemStats(),
        adminApi.getAllUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update role");
    }
  };

  const handleToggleActive = async (userId: number, currentActive: boolean) => {
    try {
      await adminApi.toggleUserActive(userId, !currentActive);
      toast.success(`User ${!currentActive ? "activated" : "deactivated"}`);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading admin panel...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats?.total_users}</p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users</p>
                <p className="text-2xl font-bold">{stats?.active_users}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold">{stats?.total_tasks}</p>
              </div>
              <CheckCircle className="text-purple-500" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Admins</p>
                <p className="text-2xl font-bold">{stats?.admin_users}</p>
              </div>
              <Shield className="text-red-500" size={32} />
            </div>
          </Card>
        </div>

        {/* User Management Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Username</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Tasks</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.username}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-2">
                      {user.completed_tasks}/{user.total_tasks}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-2 space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAdmin(user.id, user.role)}
                      >
                        {user.role === "admin" ? "Demote" : "Make Admin"}
                      </Button>
                      <Button
                        size="sm"
                        variant={user.is_active ? "destructive" : "default"}
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
```

### 5.5 Update Sidebar with Admin Link

**File: `frontend/components/layout/Sidebar.tsx`** (MODIFY)

```typescript
import { useAuthStore } from "@/lib/store/authStore";
import { Shield } from "lucide-react";

export function Sidebar() {
  const { isAdmin } = useAuthStore();

  return (
    <aside className="...">
      {/* ... existing nav items ... */}

      {/* Admin Panel Link - Only show if admin */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100"
        >
          <Shield size={20} />
          <span>Admin Panel</span>
        </Link>
      )}
    </aside>
  );
}
```

---

## Phase 6: Security Best Practices

### 6.1 Security Checklist

**Password Reset**:
- ✅ Tokens hashed before storage (SHA-256)
- ✅ One-time use enforcement (`used_at` column)
- ✅ Short expiration (1 hour)
- ✅ No user enumeration (always returns success)
- ✅ Strong password validation (8+ chars, number, letter, special)
- ✅ Force re-login after reset (revoke all refresh tokens)
- ✅ Rate limiting on forgot-password endpoint (TODO: add in production)

**Role-Based Authorization**:
- ✅ Role stored in database (`users.role`)
- ✅ Role included in JWT payload
- ✅ Server-side role validation (middleware)
- ✅ Admin dependency prevents role bypass
- ✅ Frontend role checks are UX-only (not trusted for security)
- ✅ Prevent self-demotion (admin can't demote themselves)
- ✅ Prevent self-deactivation

**General**:
- ✅ HttpOnly cookies (no XSS token theft)
- ✅ CORS whitelist
- ✅ Bcrypt password hashing
- ✅ JWT expiration (15 min access, 7 day refresh)
- ✅ Database token revocation
- ✅ Active user checks
- ✅ SQL injection prevention (ORM parameterization)

### 6.2 Production Considerations

**Before Production Deployment**:

1. **Email Service**:
   - Replace mock email service with real SMTP/SendGrid/SES
   - Add email templates with branding
   - Configure SPF/DKIM records

2. **Rate Limiting**:
   - Add Redis-backed rate limiting
   - `/auth/forgot-password`: 3 requests/hour per IP
   - `/auth/reset-password`: 5 requests/hour per IP
   - `/auth/login`: 10 requests/15 min per IP

3. **Logging & Monitoring**:
   - Log all password reset attempts
   - Alert on suspicious patterns (mass resets)
   - Track failed login attempts

4. **Environment Variables**:
   ```bash
   # Production .env
   FRONTEND_URL=https://yourdomain.com
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASSWORD=<sendgrid-api-key>
   FROM_EMAIL=noreply@yourdomain.com
   ```

5. **Database**:
   - Add background job to cleanup expired tokens
   - Index optimization for role queries
   - Backup strategy

---

## Phase 7: Testing Strategy

### 7.1 Backend Unit Tests

**File: `tests/unit/test_password_reset.py`** (NEW)

```python
import pytest
from datetime import timedelta, datetime, timezone

@pytest.mark.asyncio
async def test_create_password_reset_token(test_db, test_user):
    """Test creating password reset token."""
    from app.db.repositories.password_reset_repository import PasswordResetRepository

    repo = PasswordResetRepository(test_db)
    token = await repo.create(test_user.id, expiry_hours=1)

    assert token is not None
    assert len(token) > 40  # Secure token length

    # Verify token can be retrieved
    db_token = await repo.get_by_token(token)
    assert db_token is not None
    assert db_token.user_id == test_user.id
    assert db_token.is_valid()

@pytest.mark.asyncio
async def test_password_reset_token_expiration(test_db, test_user):
    """Test expired tokens are invalid."""
    from app.db.repositories.password_reset_repository import PasswordResetRepository

    repo = PasswordResetRepository(test_db)
    token = await repo.create(test_user.id, expiry_hours=-1)  # Already expired

    db_token = await repo.get_by_token(token)
    assert not db_token.is_valid()

@pytest.mark.asyncio
async def test_password_reset_one_time_use(test_db, test_user):
    """Test tokens can only be used once."""
    from app.db.repositories.password_reset_repository import PasswordResetRepository

    repo = PasswordResetRepository(test_db)
    token = await repo.create(test_user.id)

    db_token = await repo.get_by_token(token)
    assert db_token.is_valid()

    # Mark as used
    await repo.mark_as_used(db_token.id)

    # Refresh from database
    db_token = await repo.get_by_token(token)
    assert not db_token.is_valid()  # No longer valid
```

### 7.2 Backend Integration Tests

**File: `tests/integration/test_password_reset_flow.py`** (NEW)

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_forgot_password_flow(async_client: AsyncClient, test_user):
    """Test full forgot password flow."""
    # Request password reset
    response = await async_client.post(
        "/api/v1/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert response.status_code == 200
    assert "success" in response.json()

@pytest.mark.asyncio
async def test_reset_password_with_valid_token(async_client: AsyncClient, test_db, test_user):
    """Test resetting password with valid token."""
    from app.db.repositories.password_reset_repository import PasswordResetRepository

    # Create reset token
    repo = PasswordResetRepository(test_db)
    token = await repo.create(test_user.id)

    # Reset password
    response = await async_client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": token,
            "new_password": "NewSecure123!"
        }
    )
    assert response.status_code == 200

    # Verify can login with new password
    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "NewSecure123!"
        }
    )
    assert login_response.status_code == 200
```

### 7.3 Frontend Component Tests

**File: `frontend/__tests__/forgot-password.test.tsx`** (NEW)

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";

describe("Forgot Password Page", () => {
  it("renders email input", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("shows success message after submission", async () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });
});
```

---

## Phase 8: Portfolio Justification

### Why This Demonstrates Senior-Level Knowledge

**1. Security-First Design**:
- Password reset tokens are hashed (not plaintext)
- One-time use enforcement
- No user enumeration vulnerability
- Proper token expiration
- Force re-login after password change

**2. Clean Architecture**:
- Repository pattern for data access
- Service layer for business logic
- No duplicated authentication systems
- Role-based auth extends existing system cleanly

**3. Production Readiness**:
- Database migrations included
- Email service abstraction (easy to swap providers)
- Comprehensive error handling
- Rate limiting considerations documented

**4. Frontend UX Excellence**:
- Real-time password validation
- Show/hide password toggle
- Loading states on all buttons
- Clear error messages
- Responsive design

**5. Testing Coverage**:
- Unit tests for token management
- Integration tests for full flow
- Frontend component tests
- Security-focused test cases

**6. Documentation**:
- Inline code comments
- API documentation
- Security considerations documented
- Clear migration path

### Competitive Advantage

This implementation shows:
- ✅ Understanding of **authentication vs authorization**
- ✅ Knowledge of **OAuth-like token systems**
- ✅ Experience with **role-based access control (RBAC)**
- ✅ Awareness of **OWASP security best practices**
- ✅ Ability to **extend existing systems** without breaking them
- ✅ **Full-stack expertise** (backend + frontend + database)

---

## Summary: Files to Create/Modify

### Backend (New Files)
1. `app/models/password_reset_token.py` - Password reset model
2. `app/db/repositories/password_reset_repository.py` - Token repository
3. `app/services/email_service.py` - Email sending (mocked)
4. `app/api/endpoints/admin.py` - Admin-only endpoints
5. `alembic/versions/XXXX_add_password_reset_tokens.py` - Migration
6. `alembic/versions/XXXX_add_user_roles.py` - Migration

### Backend (Modified Files)
1. `app/models/user.py` - Add `role` column
2. `app/core/security.py` - Add password validation, update JWT
3. `app/core/dependencies.py` - Add `get_current_admin_user`
4. `app/api/endpoints/auth.py` - Add forgot/reset endpoints
5. `app/schemas/user.py` - Add password reset schemas
6. `app/core/config.py` - Add email settings
7. `app/main.py` - Register admin router

### Frontend (New Files)
1. `frontend/app/(auth)/forgot-password/page.tsx` - Forgot password UI
2. `frontend/app/(auth)/reset-password/page.tsx` - Reset password UI
3. `frontend/app/(dashboard)/admin/page.tsx` - Admin dashboard
4. `frontend/lib/api/admin.ts` - Admin API client
5. `frontend/components/auth/ProtectedRoute.tsx` - Route guard

### Frontend (Modified Files)
1. `frontend/lib/api/auth.ts` - Add forgot/reset methods
2. `frontend/lib/store/authStore.ts` - Add role support
3. `frontend/app/(auth)/login/page.tsx` - Add forgot password link
4. `frontend/components/layout/Sidebar.tsx` - Add admin link

### Tests (New Files)
1. `tests/unit/test_password_reset.py` - Token tests
2. `tests/integration/test_password_reset_flow.py` - E2E tests
3. `tests/unit/test_admin_endpoints.py` - Admin route tests
4. `frontend/__tests__/forgot-password.test.tsx` - Frontend tests

---

## Execution Order

1. **Database** → Migrations for password reset tokens and roles
2. **Backend Models** → PasswordResetToken, update User
3. **Backend Repositories** → Password reset repository
4. **Backend Services** → Email service (mock)
5. **Backend Security** → Update JWT to include role
6. **Backend Auth Endpoints** → Forgot/reset password
7. **Backend Admin Endpoints** → Admin-only routes
8. **Backend Tests** → Unit + integration tests
9. **Frontend API** → Add forgot/reset/admin clients
10. **Frontend Auth Store** → Add role support
11. **Frontend Pages** → Forgot/reset password UIs
12. **Frontend Admin** → Admin dashboard
13. **Frontend Tests** → Component tests

**Total Estimated Time**: 6-8 hours for experienced developer

---

**Ready to implement? Start with Phase 2 (Backend Database Schema) and work sequentially.**
