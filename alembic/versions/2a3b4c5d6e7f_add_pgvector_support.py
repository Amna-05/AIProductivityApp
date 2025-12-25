"""Add pgvector support for semantic embeddings

Revision ID: 2a3b4c5d6e7f
Revises: 9f35117a7d03
Create Date: 2025-12-22 22:00:00.000000

This migration:
1. Enables the pgvector extension in PostgreSQL
2. Adds an embedding column to the tasks table (384 dimensions)
3. The column is nullable to support gradual rollout
4. Vector index will be created later after embeddings are populated
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2a3b4c5d6e7f'
down_revision: Union[str, None] = '9f35117a7d03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add pgvector extension and embedding column to tasks table.

    With graceful degradation: Falls back to BYTEA if pgvector not installed.

    Steps:
    1. Try to enable pgvector extension (requires system installation)
    2. Add embedding column using vector(384) if available, else BYTEA
    3. Column is nullable - embeddings generated on-demand

    Note: The vector index is NOT created here because:
    - IVFFlat index requires training data (existing embeddings)
    - We'll add it manually after generating embeddings for existing tasks
    """
    import sqlalchemy as sa
    from sqlalchemy.exc import ProgrammingError, NotSupportedError

    # Get connection for transaction management
    connection = op.get_bind()

    # Try to enable pgvector extension
    pgvector_available = False
    try:
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')
        pgvector_available = True
        print("[OK] pgvector extension enabled")
    except (ProgrammingError, NotSupportedError) as e:
        # Rollback the failed transaction
        connection.execute(sa.text("ROLLBACK"))
        connection.execute(sa.text("BEGIN"))
        print("[WARNING] pgvector extension not available (this is OK)")
        print("  Phase 2 features will work with reduced performance")
        print("  To enable full functionality:")
        print("    Windows: Download from https://github.com/pgvector/pgvector/releases")
        print("    Linux: apt-get install postgresql-14-pgvector")
        print("    Mac: brew install pgvector")

    # Add embedding column
    # Use vector(384) if pgvector available, else BYTEA as fallback
    if pgvector_available:
        try:
            op.execute("""
                ALTER TABLE tasks
                ADD COLUMN IF NOT EXISTS embedding vector(384)
            """)
            print("[OK] embedding column added (vector type, 384 dimensions)")
            print("")
            print("Next steps:")
            print("1. Generate embeddings: POST /api/v1/ai/priority/generate-embeddings")
            print("2. Create vector index:")
            print("   CREATE INDEX tasks_embedding_idx ON tasks")
            print("   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);")
        except ProgrammingError:
            # Vector type failed, fall back to BYTEA
            op.execute("""
                ALTER TABLE tasks
                ADD COLUMN IF NOT EXISTS embedding BYTEA
            """)
            print("[OK] embedding column added (BYTEA fallback)")
    else:
        # No pgvector, use BYTEA
        op.execute("""
            ALTER TABLE tasks
            ADD COLUMN IF NOT EXISTS embedding BYTEA
        """)
        print("[OK] embedding column added (BYTEA fallback)")
        print("")
        print("Phase 2 AI features will work but without vector search optimization.")


def downgrade() -> None:
    """
    Remove pgvector support.

    Caution: This will delete all embeddings!
    """
    # Drop the embedding column
    op.drop_column('tasks', 'embedding')

    # Drop the pgvector extension
    # Note: This will fail if other tables use vector type
    op.execute('DROP EXTENSION IF EXISTS vector CASCADE')

    print("[OK] Removed embedding column from tasks table")
    print("[OK] Dropped pgvector extension")
    print("")
    print("Warning: All embeddings have been deleted!")
