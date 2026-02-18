@echo off
cd /d "%~dp0"

echo Starting Smart Macro Tool...
echo.

REM Check if node_modules exists, if not install
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist "src\frontend\node_modules" (
    echo Installing frontend dependencies...
    cd src\frontend
    call npm install
    cd ..\..
)

REM Start backend
start "Backend - Smart Macro Tool" cmd /k "cd /d "%~dp0src\backend" &&vicorn app.main python -m u:app --reload --port 8000"

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
