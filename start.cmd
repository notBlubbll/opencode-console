@echo off
cd /d "%~dp0"
echo =====================================
echo OpenCode Console Mock Server Launcher
echo =====================================
echo.

echo [1] Killing any process on port 3030...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3030 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1 && echo      Killed PID %%a
)
timeout /t 1 /nobreak >nul

echo [2] Cleaning asset cache...
if exist ".asset-cache" rmdir /s /q ".asset-cache" >nul 2>&1

echo [3] Installing dependencies...
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo      npm install failed
    pause
    exit /b 1
)

echo [4] Starting server...
echo.
echo    URL: http://localhost:3030
echo.
echo    ====== REQUEST LOG ======
echo.
node server.js
pause
