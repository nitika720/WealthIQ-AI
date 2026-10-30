@echo off
TITLE Stop WealthIQ AI Services
COLOR 0C

echo ===============================================================================
echo                      Stopping WealthIQ AI Services
echo ===============================================================================
echo.

echo Terminating running Node.js and Vite processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo [DONE] WealthIQ processes terminated cleanly.
pause
