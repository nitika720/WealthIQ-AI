@echo off
TITLE Setup WealthIQ AI Project
COLOR 0A

echo ===============================================================================
echo                WealthIQ AI Environment Setup & Dependency Installer
echo ===============================================================================
echo.

echo [1/3] Validating Node.js and NPM...
node -v
npm -v

echo.
echo [2/3] Installing Node.js Full-Stack Dependencies...
call npm install

echo.
echo [3/3] Setting up Python ML Service Virtual Environment (if Python is present)...
where python >nul 2>nul
if %errorlevel% equ 0 (
    if not exist "ai-service\venv" (
        echo Creating Python venv in ai-service\venv...
        python -m venv ai-service\venv
    )
    echo Installing Python ML dependencies...
    call ai-service\venv\Scripts\pip install -r ai-service\requirements.txt
) else (
    echo [SKIPPED] Python not found. Node.js native ML forecasting pipeline will be utilized.
)

echo.
echo [RUNNING TESTS] Executing backend test suite...
call npm run test

echo.
echo ===============================================================================
echo Setup complete! Run START_PROJECT.bat to launch WealthIQ AI.
echo ===============================================================================
pause
