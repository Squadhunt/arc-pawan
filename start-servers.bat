@echo off
title ARC Gaming Platform - Auto-Restart Server Manager

echo.
echo ========================================
echo   ARC Gaming Platform Server Manager
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PowerShell is not available on this system.
    echo Please install PowerShell or use the manual startup method.
    pause
    exit /b 1
)

REM Run the PowerShell script
echo Starting servers with auto-restart capabilities...
echo.
powershell -ExecutionPolicy Bypass -File "start-servers.ps1" %*

REM If PowerShell script exits, pause to show any error messages
if %errorlevel% neq 0 (
    echo.
    echo An error occurred while starting the servers.
    echo Check the console output above for details.
    pause
)

echo.
echo Server manager has stopped.
pause
