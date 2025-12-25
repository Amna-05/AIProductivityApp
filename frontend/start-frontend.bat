@echo off
echo ========================================
echo Starting Task Manager Frontend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if frontend is already running on port 3000...
netstat -ano | findstr ":3000" | findstr "LISTENING" >NUL
if %errorlevel%==0 (
    echo WARNING: Frontend is already running on port 3000!
    echo Please close it first or use Ctrl+C if you want to restart.
    pause
    exit /b 1
)

echo Starting frontend development server...
echo.
echo Frontend will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

npm run dev
