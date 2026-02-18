@echo off
chcp 65001 >nul
title Smart Macro Tool

echo.
echo  ┌─────────────────────────────────────────┐
echo  │     🚀 Starting Smart Macro Tool       │
echo  └─────────────────────────────────────────┘
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Please install from https://python.org
    pause
    exit /b 1
)

echo ✅ Node.js: OK
echo ✅ Python: OK
echo.

REM Check if frontend dependencies are installed
if not exist "src\frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd src\frontend
    call npm install
    cd ..\..
)

REM Check if backend dependencies are installed
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing backend dependencies...
    cd src\backend
    pip install -r requirements.txt
    cd ..\..
)

echo.
echo ⚡ Starting servers...
echo.
echo 🌐 Frontend: http://localhost:5173
echo ⚙️  Backend:  http://localhost:8000
echo.
echo Press Ctrl+C to stop
echo.

REM Start both servers
start "Frontend - Smart Macro Tool" cmd /k "cd /d %~dp0src\frontend && npm run dev"
timeout /t 2 /nobreak >nul
start "Backend - Smart Macro Tool" cmd /k "cd /d %~dp0src\backend && python -m uvicorn app.main:app --reload --port 8000"

echo ✅ Servers started! Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo 🎉 Ready! Smart Macro Tool is running.
echo.
pause
