@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo.
echo ========================================
echo     Smart Macro Tool - Starting...
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please install from: https://python.org
    pause
    exit /b 1
)
echo [OK] Python found
echo.

REM Install frontend deps if needed
if not exist "src\frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%PROJECT_DIR%src\frontend"
    call npm install
    cd /d "%PROJECT_DIR%"
    echo [OK] Frontend ready
)

REM Install backend deps if needed
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing backend dependencies...
    cd /d "%PROJECT_DIR%src\backend"
    pip install -r requirements.txt
    cd /d "%PROJECT_DIR%"
    echo [OK] Backend ready
)

echo.
echo [INFO] Starting servers...
echo.
echo     Frontend: http://localhost:5173
echo     Backend:  http://localhost:8000
echo.
echo ========================================
echo.

REM Start frontend in new window
start "Smart Macro Tool - Frontend" cmd /k "cd /d "%PROJECT_DIR%src\frontend" && npm run dev"

REM Wait a bit
timeout /t 3 /nobreak >nul 2>&1

REM Start backend in new window
start "Smart Macro Tool - Backend" cmd /k "cd /d "%PROJECT_DIR%src\backend" && python -m uvicorn app.main:app --reload --port 8000"

REM Wait for servers
timeout /t 4 /nobreak >nul 2>&1

echo [DONE] Servers should be running!
echo.

REM Open browser
start http://localhost:5173

echo Press any key to exit...
pause >nul
