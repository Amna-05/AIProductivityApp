"""
Refresh Token model for JWT authentication.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class RefreshToken(Base):
    """
    Refresh token storage for user sessions.
    """
    
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    is_revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)  
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())  
    
    # Relationship
    user = relationship("User", backref="refresh_tokens")
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.is_revoked})>"