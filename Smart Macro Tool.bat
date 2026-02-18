@echo off
cd /d "%~dp0"

echo ============================================
echo   Smart Macro Tool - Desktop App Launcher
echo ============================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please install from: https://python.org
    pause
    exit /b 1
)

echo [OK] Node.js and Python found

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
)

if not exist "src\frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd src\frontend
    call npm install --legacy-peer-deps
    cd ..\..
)

REM Check if backend dependencies are installed
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing backend dependencies...
    pip install fastapi uvicorn
)

echo.
echo [INFO] Starting servers...
echo.

REM Start backend server in background
start "Backend Server" cmd /k "cd /d "%~dp0src\backend" && python -m uvicorn app.main:app --reload --port 8000"

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start frontend with Electron
echo [INFO] Starting Desktop App...
cd src\frontend
npm run dev

echo.
echo [ERROR] App closed. Check logs above.
pause
