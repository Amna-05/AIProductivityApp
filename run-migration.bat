@echo off
echo ========================================
echo Running Database Migration
echo ========================================
echo.

cd /d "%~dp0"

echo Applying migration: remove_embedding_column
echo This will drop the embedding column from tasks table
echo.

alembic upgrade head

echo.
echo ========================================
echo Migration Complete!
echo ========================================
pause
