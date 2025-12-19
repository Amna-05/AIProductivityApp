"""
Category model for organizing tasks.
One-to-Many: One category → Many tasks
Each user has their own categories
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Category(Base):
    __tablename__ = "categories"

    # PRIMARY KEY
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # FIELDS
    name = Column(String(50), nullable=False, index=True)
    color = Column(String(7), nullable=True, default="#6B7280")
    icon = Column(String(50), nullable=True, default="📋")

    # FOREIGN KEY
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # TIMESTAMPS
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # RELATIONSHIPS
    user = relationship("User", back_populates="categories")
    tasks = relationship(
        "Task",
        back_populates="category",
        cascade="all, delete-orphan"
    )

    # INDEXES
    __table_args__ = (
        Index('ix_category_user_name', 'user_id', 'name', unique=True),
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}', user_id={self.user_id})>"
