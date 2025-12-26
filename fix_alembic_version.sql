-- Fix Alembic Version Table
-- This script fixes the migration history after deleting the pgvector migration

-- Step 1: Check current version
SELECT * FROM alembic_version;

-- Step 2: The database thinks it's at '2a3b4c5d6e7f' (deleted file)
-- We need to set it back to '9f35117a7d03' (initial schema)

-- Update to base migration (before pgvector was added)
UPDATE alembic_version SET version_num = '9f35117a7d03';

-- Step 3: Verify the change
SELECT * FROM alembic_version;

-- Now you can run: alembic upgrade head
-- This will apply the new migration: a1b2c3d4e5f6_remove_embedding_column
