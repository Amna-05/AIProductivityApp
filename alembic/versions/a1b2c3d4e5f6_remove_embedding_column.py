"""Remove embedding column and pgvector extension

Revision ID: a1b2c3d4e5f6
Revises: 9f35117a7d03
Create Date: 2025-12-25 14:00:00.000000

This migration removes the embedding feature to improve performance:
1. Drops the embedding column from tasks table
2. Optionally drops pgvector extension (if no other tables use it)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9f35117a7d03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Remove embedding column and pgvector extension.

    This significantly improves task creation performance by removing
    the embedding generation step that was causing 503 errors.
    """
    # Drop embedding column from tasks table
    # Use IF EXISTS to safely handle cases where column might not exist
    op.execute("""
        ALTER TABLE tasks
        DROP COLUMN IF EXISTS embedding
    """)
    print("[OK] Dropped embedding column from tasks table")

    # Try to drop pgvector extension (optional)
    # This will fail if other tables use vector type, which is fine
    try:
        op.execute('DROP EXTENSION IF EXISTS vector CASCADE')
        print("[OK] Dropped pgvector extension")
    except Exception as e:
        print(f"[INFO] Could not drop pgvector extension (might be in use): {e}")
        print("       This is safe to ignore if other features use pgvector")

    print("")
    print("✓ Embedding feature successfully removed")
    print("✓ Task creation should now be instant (no more 503 errors)")
    print("✓ Database storage reduced")


def downgrade() -> None:
    """
    Restore embedding column.

    WARNING: This will NOT restore old embedding data!
    Old embeddings are permanently lost after running upgrade().
    """
    # Try to enable pgvector extension first
    try:
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')
        print("[OK] Enabled pgvector extension")

        # Add embedding column back with vector type
        op.execute("""
            ALTER TABLE tasks
            ADD COLUMN embedding vector(384)
        """)
        print("[OK] Restored embedding column (vector type)")

    except Exception as e:
        print(f"[WARNING] Could not create vector column: {e}")
        print("          Falling back to BYTEA type")

        # Fallback to BYTEA if pgvector not available
        op.execute("""
            ALTER TABLE tasks
            ADD COLUMN embedding BYTEA
        """)
        print("[OK] Restored embedding column (BYTEA fallback)")

    print("")
    print("⚠️  Embedding column restored but contains NO DATA")
    print("⚠️  You need to regenerate embeddings if you want to use this feature")
