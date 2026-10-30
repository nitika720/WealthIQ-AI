@echo off
TITLE WealthIQ AI - Autonomous Personal Finance & Predictive Budgeting Engine
COLOR 0B

echo ===============================================================================
echo          WealthIQ AI : Autonomous Personal Finance & Predictive Engine
echo ===============================================================================
echo.

:: 1. Check Node.js runtime
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js v18 or v20+ from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Check Python runtime (Optional for microservice mode)
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Python not detected in PATH.
    echo Integrated TypeScript ML forecasting engine will handle predictive time-series.
) else (
    echo [OK] Python runtime detected.
)

:: 3. Check for .env file
if not exist .env (
    if exist .env.example (
        echo [INFO] Creating .env from .env.example...
        copy .env.example .env >nul
    )
)

:: 4. Verify node_modules
if not exist node_modules (
    echo [INFO] Installing required dependencies...
    call npm install
)

:: 5. Launch Full-Stack Application
echo.
echo [STARTING] Launching WealthIQ AI on http://localhost:3000 ...
echo [INFO] Server API endpoints active at http://localhost:3000/api/v1
echo [INFO] Press Ctrl+C in this terminal window to stop the service.
echo.

start http://localhost:3000
npm run dev
