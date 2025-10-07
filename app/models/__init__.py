"""
Import all models here for easy access.

Important: This makes Alembic discover all models!
"""

from app.models.task import Task

__all__ = ["Task"]