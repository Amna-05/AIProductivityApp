"""
Unit tests for security utilities.

Tests password hashing, JWT token creation/validation.
"""

import pytest
from datetime import timedelta
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token
)


def test_password_hashing():
    """Test password hashing and verification."""
    password = "MySecurePassword123!"

    hashed = get_password_hash(password)

    assert hashed != password
    assert hashed.startswith("$2b$")  # Bcrypt format
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_password_hashing_different_hashes():
    """Test that same password generates different hashes (salt)."""
    password = "TestPassword123!"

    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)

    assert hash1 != hash2
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True


def test_create_access_token():
    """Test access token creation."""
    data = {"sub": "user@example.com", "user_id": 1}

    token = create_access_token(data, expires_delta=timedelta(minutes=15))

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_refresh_token():
    """Test refresh token creation."""
    token = create_refresh_token()

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_access_token():
    """Test token decoding."""
    data = {"sub": "user@example.com", "user_id": 1}
    token = create_access_token(data, expires_delta=timedelta(minutes=15))

    email = decode_access_token(token)

    assert email is not None
    assert email == "user@example.com"


def test_decode_invalid_token():
    """Test decoding invalid token."""
    invalid_token = "invalid.jwt.token"

    email = decode_access_token(invalid_token)

    assert email is None


def test_decode_expired_token():
    """Test decoding expired token."""
    data = {"sub": "user@example.com", "user_id": 1}
    # Create token that expires immediately
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))

    email = decode_access_token(token)

    # Should return None for expired token
    assert email is None


def test_token_contains_email():
    """Test that tokens contain email in sub claim."""
    data = {
        "sub": "test@example.com",
        "user_id": 42,
        "username": "testuser"
    }

    token = create_access_token(data)
    email = decode_access_token(token)

    assert email == "test@example.com"
