@echo off
title ARC Gaming Platform - Port Cleanup

echo.
echo ========================================
echo   ARC Gaming Platform Port Cleanup
echo ========================================
echo.

echo Checking and cleaning ports 5000 and 3000...
echo.

REM Kill processes on port 5000 (Backend)
echo Checking port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 5000
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Kill processes on port 3000 (Frontend)
echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="0" (
        echo Killing process %%a on port 3000
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo Port cleanup completed!
echo.
echo You can now start the servers with:
echo   start-servers.bat
echo.
pause
