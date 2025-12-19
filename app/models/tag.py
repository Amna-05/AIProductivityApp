"""
Tag model for flexible task labeling.

Concept:
- Many-to-Many: Many tasks ↔ Many tags
- Examples: "urgent", "client-work", "review-needed", "waiting-on-others"
- More flexible than categories (one task can have multiple tags)
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.task import task_tags  # Import the association table


class Tag(Base):
    """
    Tag for flexible task labeling.
    
    Difference from Category:
    - Category: ONE per task (e.g., "Work")
    - Tag: MULTIPLE per task (e.g., "urgent", "client", "review")
    
    Examples:
    - "urgent"
    - "client-work"
    - "needs-review"
    - "waiting-on-others"
    - "quick-win"
    """
    
    __tablename__ = "tags"
    
  #primary key 
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
#fields
    name = Column(
        String(30),
        nullable=False,
        index=True
    )
    # Tag name, e.g., "urgent", "client-work"
    # Keep it short (30 chars max)
    
    color = Column(
        String(7),
        nullable=True,
        default="#3B82F6"  # Blue default
    )
    # For UI: display tag as colored badge
    
    # FOREIGN KEYS

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # Each tag belongs to ONE user
    # Users create their own tags

    # TIMESTAMPS

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    # RELATIONSHIPS
    user = relationship("User", back_populates="tags")
    
    tasks = relationship(
        "Task",
        secondary=task_tags,  # Use the association table
        back_populates="tags"
    )
    # Many-to-Many relationship
    # Usage: 
    #   tag.tasks → list of all tasks with this tag
    #   task.tags → list of all tags on this task
    
 #indexes
    __table_args__ = (
        # Unique constraint: user can't have duplicate tag names
        Index('ix_tag_user_name', 'user_id', 'name', unique=True),
    )
    
    def __repr__(self) -> str:
        return f"<Tag(id={self.id}, name='{self.name}', user_id={self.user_id})>"