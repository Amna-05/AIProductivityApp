@echo off
echo ========================================
echo Starting Task Manager Backend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if backend is already running on port 8000...
netstat -ano | findstr ":8000" | findstr "LISTENING" >NUL
if %errorlevel%==0 (
    echo WARNING: Backend is already running on port 8000!
    echo Please close it first or use Ctrl+C if you want to restart.
    pause
    exit /b 1
)

echo Starting backend server...
echo.
echo Backend will be available at: http://localhost:8000
echo API Documentation will be at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
