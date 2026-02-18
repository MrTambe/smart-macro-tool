@echo off
cd /d "%~dp0"

echo Starting Smart Macro Tool...
echo.

REM Check if node_modules exists, if not install
if not exist "node_modules" (
    echo Installing root dependencies...
    call npm install
)

if not exist "src\frontend\node_modules" (
    echo Installing frontend dependencies...
    cd src\frontend
    call npm install --legacy-peer-deps
    cd ..\..
)

REM Install uvicorn if needed
python -c "import uvicorn" 2>nul
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install uvicorn fastapi
)

REM Start backend
start "Backend - Smart Macro Tool" cmd /k "cd /d "%~dp0src\backend" && python -m uvicorn app.main:app --reload --port 8000"

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start frontend
start "Frontend - Smart Macro Tool" cmd /k "cd /d "%~dp0src\frontend" && npm run dev"

REM Open browser
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo App should be opening in your browser!
echo If not, go to: http://localhost:5173
echo.
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
